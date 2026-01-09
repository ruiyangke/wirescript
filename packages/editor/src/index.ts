// Main exports for @wirescript/editor

// Re-export useful CodeMirror types for consumers
export type { Extension } from '@codemirror/state';
export type { EditorView } from '@codemirror/view';
export { wireScriptCompletion } from './language/complete.js';
export { wireScriptHighlighting } from './language/highlight.js';
// Language support
export { wireScript, wireScriptLanguage } from './language/index.js';

// Themes
export {
  wireScriptDarkTheme,
  wireScriptLightTheme,
  wireScriptTheme,
} from './themes/wirescript-theme.js';
export type { WireScriptEditorProps } from './WireScriptEditor.js';
// React component
export { WireScriptEditor } from './WireScriptEditor.js';
