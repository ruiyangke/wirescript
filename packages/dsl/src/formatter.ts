/**
 * WireScript Formatter
 *
 * Pretty-prints .wire files with consistent formatting:
 * - 2-space indentation
 * - One element per line (for non-inline elements)
 * - Preserves comments
 * - Auto-balances parentheses using schema rules
 */

import { ELEMENT_TYPE_LIST, getSchema } from './schema/index.js';
import {
  OVERLAY_TYPES_SET,
  STRUCTURAL_CONTAINERS_SET,
  TOP_LEVEL_FORMS_SET,
  type Token,
} from './schema/types.js';
import { tokenize } from './tokenizer.js';

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

// =============================================================================
// Schema-Based Helpers
// =============================================================================

/**
 * Check if element can have children.
 * Uses schema registry for built-in elements, defaults to container for unknown.
 */
function canHaveChildren(elementName: string): boolean {
  // Special structural constructs are always containers
  if (STRUCTURAL_CONTAINERS_SET.has(elementName)) return true;

  // Check schema registry
  const schema = getSchema(elementName);
  if (schema) return schema.children === true;

  // Unknown elements (user components) default to container
  return true;
}

/**
 * Get the required parent for an element (for force-close logic).
 * Returns undefined if element can appear anywhere.
 */
function getRequiredParent(elementName: string): 'wire' | 'screen' | undefined {
  if (TOP_LEVEL_FORMS_SET.has(elementName)) return 'wire';
  if (OVERLAY_TYPES_SET.has(elementName)) return 'screen';
  return undefined;
}

/**
 * Container elements that should have children on separate lines.
 * Derived from schema registry + structural containers.
 */
const CONTAINER_ELEMENTS = new Set([
  ...STRUCTURAL_CONTAINERS_SET,
  ...ELEMENT_TYPE_LIST.filter((type) => {
    const schema = getSchema(type);
    return schema?.children === true;
  }),
]);

// =============================================================================
// Auto-Balance
// =============================================================================

/**
 * Create an RPAREN token for auto-balancing.
 */
function makeRParen(): Token {
  return {
    type: 'RPAREN',
    value: ')',
    line: 0,
    column: 0,
    endLine: 0,
    endColumn: 0,
  };
}

/**
 * Balance parentheses by inserting missing closing parens.
 * Uses WireScript's structural rules from schema:
 * - Leaf elements can't have children (schema.children !== true)
 * - TOP_LEVEL_FORMS must be direct children of wire
 * - OVERLAY_TYPES must be direct children of screen
 */
function balanceTokens(tokens: Token[]): Token[] {
  const output: Token[] = [];
  const stack: string[] = []; // Element names
  const pushedAtDepth: number[] = []; // Depth at which each element was pushed
  let depth = 0;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.type === 'LPAREN') {
      const next = tokens[i + 1];
      if (next?.type === 'SYMBOL') {
        const elementName = next.value;

        // Force close to required parent level (from schema constants)
        const requiredParent = getRequiredParent(elementName);
        if (requiredParent) {
          while (stack.length > 0 && stack[stack.length - 1] !== requiredParent) {
            output.push(makeRParen());
            stack.pop();
            pushedAtDepth.pop();
          }
        }

        // Close leaf parent (leaf can't have children - from schema)
        const currentParent = stack[stack.length - 1];
        if (currentParent && !canHaveChildren(currentParent)) {
          output.push(makeRParen());
          stack.pop();
          pushedAtDepth.pop();
        }

        stack.push(elementName);
        pushedAtDepth.push(depth);
      }
      depth++;
      output.push(token);
    } else if (token.type === 'RPAREN') {
      depth--;
      // Only pop element if we pushed at this depth (not for param lists like `()`)
      if (pushedAtDepth.length > 0 && pushedAtDepth[pushedAtDepth.length - 1] === depth) {
        stack.pop();
        pushedAtDepth.pop();
      }
      output.push(token);
    } else if (token.type === 'EOF') {
      // Close all remaining open elements
      while (stack.length > 0) {
        output.push(makeRParen());
        stack.pop();
        pushedAtDepth.pop();
      }
      output.push(token);
    } else {
      output.push(token);
    }
  }

  return output;
}

// =============================================================================
// Comments
// =============================================================================

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
  const balanced = balanceTokens(tokens);
  const comments = extractComments(source);

  return formatTokens(balanced, comments, opts);
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
  let isEscaped = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (isEscaped) {
      isEscaped = false;
      continue;
    }

    if (char === '\\' && inString) {
      isEscaped = true;
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
function formatTokens(tokens: Token[], comments: Comment[], opts: Required<FormatOptions>): string {
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
    return (
      formHasChildrenStack.length > 0 && !formHasChildrenStack[formHasChildrenStack.length - 1]
    );
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
        emit(` :${token.value}`);
        break;
      }

      case 'STRING': {
        emit(` "${escapeString(token.value)}"`);
        break;
      }

      case 'NUMBER': {
        emit(` ${token.value}`);
        break;
      }

      case 'HASH_REF': {
        emit(` #${token.value}`);
        break;
      }

      case 'PARAM_REF': {
        emit(` $${token.value}`);
        break;
      }
    }

    // Only update lastTokenLine for real tokens (not auto-balanced ones with line=0)
    if (token.line > 0) {
      lastTokenLine = token.line;
    }
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
