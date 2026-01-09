import type { Completion, CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { ACTION_KEYWORDS, ELEMENT_TYPES, OVERLAY_TYPES, VALID_FLAGS } from '@wirescript/dsl';

/**
 * Element type completions
 */
const elementCompletions: Completion[] = ELEMENT_TYPES.map((type) => ({
  label: type,
  type: 'type',
  detail: 'element',
  boost: 1,
}));

/**
 * Form keyword completions
 */
const formCompletions: Completion[] = [
  { label: 'wire', type: 'keyword', detail: 'document root' },
  { label: 'meta', type: 'keyword', detail: 'metadata' },
  { label: 'define', type: 'keyword', detail: 'component definition' },
  { label: 'screen', type: 'keyword', detail: 'screen definition' },
  { label: 'repeat', type: 'keyword', detail: 'repeat loop' },
];

/**
 * Overlay type completions
 */
const overlayCompletions: Completion[] = OVERLAY_TYPES.map((type) => ({
  label: type,
  type: 'type',
  detail: 'overlay',
}));

/**
 * Flag completions (without the : prefix, we add it)
 */
const flagCompletions: Completion[] = VALID_FLAGS.map((flag) => ({
  label: `:${flag}`,
  type: 'property',
  detail: 'flag',
}));

/**
 * Common property completions (Common Lisp style :key value)
 */
const propCompletions: Completion[] = [
  // Layout
  { label: ':gap', type: 'property', detail: 'spacing between children' },
  { label: ':padding', type: 'property', detail: 'inner spacing' },
  { label: ':width', type: 'property', detail: 'element width' },
  { label: ':height', type: 'property', detail: 'element height' },
  // Navigation
  { label: ':to', type: 'property', detail: 'navigation target' },
  // Overlay
  { label: ':id', type: 'property', detail: 'overlay identifier' },
  // Repeat
  { label: ':count', type: 'property', detail: 'repeat count' },
  { label: ':as', type: 'property', detail: 'loop variable name' },
  // Input
  { label: ':type', type: 'property', detail: 'input type' },
  { label: ':placeholder', type: 'property', detail: 'placeholder text' },
  // Image
  { label: ':src', type: 'property', detail: 'image source' },
  { label: ':alt', type: 'property', detail: 'alt text' },
  // Chart
  { label: ':data', type: 'property', detail: 'chart data' },
  // Progress
  { label: ':value', type: 'property', detail: 'progress value' },
  { label: ':max', type: 'property', detail: 'maximum value' },
];

/**
 * Action keyword completions for to= prop
 */
const actionCompletions: Completion[] = ACTION_KEYWORDS.map((action) => ({
  label: `:${action}`,
  type: 'keyword',
  detail: 'action',
}));

/**
 * Get context-aware completions
 */
function _getCompletionsForContext(context: CompletionContext, pos: number): Completion[] | null {
  const textBefore = context.state.sliceDoc(0, pos);
  const lineStart = textBefore.lastIndexOf('\n') + 1;
  const lineBefore = textBefore.slice(lineStart, pos);

  // After opening paren - suggest elements, forms, overlays
  if (/\(\s*$/.test(lineBefore)) {
    return [...formCompletions, ...elementCompletions, ...overlayCompletions];
  }

  // After colon - suggest flags
  if (/:$/.test(lineBefore)) {
    return VALID_FLAGS.map((flag) => ({
      label: flag,
      type: 'property',
      detail: 'flag',
    }));
  }

  // After :to - suggest action keywords, screens, overlays
  if (/:to\s*$/.test(lineBefore)) {
    return actionCompletions;
  }

  // Inside a form - suggest elements, flags, props
  return [...elementCompletions, ...flagCompletions, ...propCompletions];
}

/**
 * Extract component names from the document for completion
 */
function getComponentNames(context: CompletionContext): Completion[] {
  const doc = context.state.doc.toString();
  const components: Completion[] = [];

  // Match (define ComponentName ...)
  const definePattern = /\(\s*define\s+([a-zA-Z_][a-zA-Z0-9_-]*)/g;

  for (const match of doc.matchAll(definePattern)) {
    components.push({
      label: match[1],
      type: 'class',
      detail: 'component',
    });
  }

  return components;
}

/**
 * Extract screen IDs from the document for completion
 */
function getScreenIds(context: CompletionContext): Completion[] {
  const doc = context.state.doc.toString();
  const screens: Completion[] = [];

  // Match (screen screenId ...)
  const screenPattern = /\(\s*screen\s+([a-zA-Z_][a-zA-Z0-9_-]*)/g;

  for (const match of doc.matchAll(screenPattern)) {
    screens.push({
      label: match[1],
      type: 'constant',
      detail: 'screen',
    });
  }

  return screens;
}

/**
 * Extract overlay IDs from the document for completion
 */
function getOverlayIds(context: CompletionContext): Completion[] {
  const doc = context.state.doc.toString();
  const overlays: Completion[] = [];

  // Match :id "overlayId" or :id overlayId (Common Lisp style)
  const idPattern = /:id\s+["']?([a-zA-Z_][a-zA-Z0-9_-]*)["']?/g;

  for (const match of doc.matchAll(idPattern)) {
    overlays.push({
      label: `#${match[1]}`,
      type: 'constant',
      detail: 'overlay',
    });
  }

  return overlays;
}

/**
 * WireScript autocomplete function
 */
export function wireScriptCompletion(context: CompletionContext): CompletionResult | null {
  // Get the word being typed
  const word = context.matchBefore(/[\w\-:$#]*/);
  if (!word) return null;

  // Don't complete in the middle of a word unless explicitly triggered
  if (word.from === word.to && !context.explicit) {
    return null;
  }

  const pos = context.pos;
  const textBefore = context.state.sliceDoc(Math.max(0, pos - 50), pos);

  // Build completions based on context
  let completions: Completion[] = [];

  // After :to - suggest screens, overlays, actions
  if (/:to\s+$/.test(textBefore) || /:to\s+#?$/.test(textBefore)) {
    completions = [...actionCompletions, ...getScreenIds(context), ...getOverlayIds(context)];
  }
  // After : - suggest flags
  else if (word.text.startsWith(':')) {
    completions = flagCompletions;
  }
  // After $ - suggest params (would need context from define)
  else if (word.text.startsWith('$')) {
    // Could extract params from enclosing define, for now just skip
    return null;
  }
  // After # - suggest overlay IDs
  else if (word.text.startsWith('#')) {
    completions = getOverlayIds(context);
  }
  // After ( - suggest keywords and elements
  else if (/\(\s*$/.test(textBefore.slice(0, -word.text.length))) {
    completions = [
      ...formCompletions,
      ...elementCompletions,
      ...overlayCompletions,
      ...getComponentNames(context),
    ];
  }
  // General context - suggest everything
  else {
    completions = [
      ...elementCompletions,
      ...flagCompletions,
      ...propCompletions,
      ...getComponentNames(context),
    ];
  }

  return {
    from: word.from,
    options: completions,
    validFor: /^[\w\-:$#]*$/,
  };
}
