/**
 * WireScript Formatter
 *
 * Pretty-prints .wire files with consistent formatting:
 * - 2-space indentation
 * - One element per line (for non-inline elements)
 * - Preserves comments
 */

import { tokenize } from './tokenizer.js';
import type { Token } from './schema/types.js';

export interface FormatOptions {
  /** Indentation string (default: 2 spaces) */
  indent?: string;
  /** Maximum line length before wrapping (default: 100) */
  maxLineLength?: number;
}

const DEFAULT_OPTIONS: Required<FormatOptions> = {
  indent: '  ',
  maxLineLength: 100,
};

/**
 * Container elements that should have children on separate lines
 */
const CONTAINER_ELEMENTS = new Set([
  'wire',
  'screen',
  'box',
  'card',
  'section',
  'header',
  'footer',
  'nav',
  'form',
  'list',
  'scroll',
  'group',
  'tabs',
  'tab',
  'modal',
  'drawer',
  'popover',
  'define',
  'layout',
  'repeat',
  'meta',
]);

interface Comment {
  line: number;
  column: number;
  text: string;
  isStandalone: boolean; // true if comment is on its own line
}

/**
 * Format WireScript source code
 */
export function format(source: string, options: FormatOptions = {}): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const tokens = tokenize(source);
  const comments = extractComments(source);

  return formatTokens(tokens, comments, opts);
}

/**
 * Extract comments from source (tokenizer skips them)
 */
function extractComments(source: string): Comment[] {
  const comments: Comment[] = [];
  const lines = source.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const commentIndex = findCommentStart(line);
    if (commentIndex !== -1) {
      const beforeComment = line.slice(0, commentIndex).trim();
      comments.push({
        line: i + 1,
        column: commentIndex + 1,
        text: line.slice(commentIndex),
        isStandalone: beforeComment.length === 0,
      });
    }
  }

  return comments;
}

/**
 * Find comment start in a line, respecting strings
 */
function findCommentStart(line: string): number {
  let inString = false;
  let escape = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (char === '\\' && inString) {
      escape = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (char === ';' && !inString) {
      return i;
    }
  }

  return -1;
}

/**
 * Format tokens into pretty-printed output
 */
function formatTokens(
  tokens: Token[],
  comments: Comment[],
  opts: Required<FormatOptions>
): string {
  const output: string[] = [];
  let depth = 0;
  let lastTokenLine = 0;
  let lastOutputLine = 0;
  const formStack: string[] = []; // Track form names for context
  const formHasChildrenStack: boolean[] = []; // Track if current form has child elements

  // Helper to emit text on current line
  const emit = (text: string) => {
    output.push(text);
  };

  // Helper to start a new line with proper indentation
  const newline = (extraDepth = 0) => {
    output.push('\n');
    if (depth + extraDepth > 0) {
      output.push(opts.indent.repeat(depth + extraDepth));
    }
    lastOutputLine++;
  };

  // Check if this is the first child element in a container
  const isFirstChildInContainer = (): boolean => {
    return formHasChildrenStack.length > 0 && !formHasChildrenStack[formHasChildrenStack.length - 1];
  };

  // Mark that current container has children
  const markHasChildren = () => {
    if (formHasChildrenStack.length > 0) {
      formHasChildrenStack[formHasChildrenStack.length - 1] = true;
    }
  };

  // Check if current form is a container
  const inContainer = (): boolean => {
    const currentForm = formStack[formStack.length - 1];
    return CONTAINER_ELEMENTS.has(currentForm);
  };

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const nextToken = tokens[i + 1];
    const prevToken = tokens[i - 1];

    // Skip EOF
    if (token.type === 'EOF') break;

    // Insert standalone comments from source before this token
    const standaloneComments = comments.filter(
      (c) => c.line > lastTokenLine && c.line < token.line && c.isStandalone
    );
    for (const comment of standaloneComments) {
      // Preserve blank lines before comments
      if (comment.line > lastTokenLine + 1 && lastOutputLine > 0) {
        newline();
      }
      newline();
      emit(comment.text);
      lastTokenLine = comment.line;
    }

    // Process token
    switch (token.type) {
      case 'LPAREN': {
        // Check what form this is
        const formName = nextToken?.type === 'SYMBOL' ? nextToken.value : '';

        // Handle newline before this opening paren
        if (inContainer()) {
          if (isFirstChildInContainer()) {
            // First child in container - add newline
            newline();
          } else {
            // Subsequent children - add newline
            newline();
          }
          markHasChildren();
        } else if (depth === 0 && lastOutputLine > 0) {
          // Top-level form (not first) - blank line separation
          newline();
          newline();
        }

        emit('(');
        formStack.push(formName);
        formHasChildrenStack.push(false);
        depth++;
        break;
      }

      case 'RPAREN': {
        depth = Math.max(0, depth - 1);
        formStack.pop();
        formHasChildrenStack.pop();
        emit(')');
        break;
      }

      case 'SYMBOL': {
        const isFormName = prevToken?.type === 'LPAREN';
        if (!isFormName) {
          emit(' ');
        }
        emit(token.value);
        break;
      }

      case 'KEYWORD': {
        emit(' :' + token.value);
        break;
      }

      case 'STRING': {
        emit(' "' + escapeString(token.value) + '"');
        break;
      }

      case 'NUMBER': {
        emit(' ' + token.value);
        break;
      }

      case 'HASH_REF': {
        emit(' #' + token.value);
        break;
      }

      case 'PARAM_REF': {
        emit(' $' + token.value);
        break;
      }
    }

    lastTokenLine = token.line;
  }

  // Final newline
  let result = output.join('');
  if (!result.endsWith('\n')) {
    result += '\n';
  }

  return result;
}

/**
 * Escape special characters in a string
 */
function escapeString(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}
