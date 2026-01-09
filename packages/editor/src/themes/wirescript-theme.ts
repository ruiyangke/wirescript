import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import type { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { tags as t } from '@lezer/highlight';

/**
 * Light theme colors matching the app's design
 */
const lightColors = {
  background: '#ffffff',
  foreground: '#1a1a1a',
  selection: '#d7d4f0',
  cursor: '#528bff',
  lineHighlight: '#f5f5f5',
  gutterBackground: '#fafafa',
  gutterForeground: '#999999',

  // Syntax colors
  keyword: '#7c3aed', // Purple for keywords
  type: '#0891b2', // Cyan for element types
  string: '#059669', // Green for strings
  number: '#d97706', // Orange for numbers
  property: '#2563eb', // Blue for properties
  attribute: '#be185d', // Pink for flags
  variable: '#1a1a1a', // Dark for variables
  variableSpecial: '#7c3aed', // Purple for $params
  comment: '#6b7280', // Gray for comments
  paren: '#6b7280', // Gray for parentheses
};

/**
 * Dark theme colors
 */
const darkColors = {
  background: '#1e1e1e',
  foreground: '#d4d4d4',
  selection: '#264f78',
  cursor: '#528bff',
  lineHighlight: '#2d2d2d',
  gutterBackground: '#1e1e1e',
  gutterForeground: '#858585',

  // Syntax colors
  keyword: '#c586c0', // Purple for keywords
  type: '#4ec9b0', // Cyan for element types
  string: '#ce9178', // Orange for strings
  number: '#b5cea8', // Light green for numbers
  property: '#9cdcfe', // Light blue for properties
  attribute: '#d7ba7d', // Yellow for flags
  variable: '#d4d4d4', // Light for variables
  variableSpecial: '#c586c0', // Purple for $params
  comment: '#6a9955', // Green for comments
  paren: '#808080', // Gray for parentheses
};

/**
 * Create a highlight style from colors
 */
function createHighlightStyle(colors: typeof lightColors): HighlightStyle {
  return HighlightStyle.define([
    { tag: t.keyword, color: colors.keyword, fontWeight: 'bold' },
    { tag: t.typeName, color: colors.type },
    { tag: t.string, color: colors.string },
    { tag: t.number, color: colors.number },
    { tag: t.propertyName, color: colors.property },
    { tag: t.attributeName, color: colors.attribute },
    { tag: t.variableName, color: colors.variable },
    { tag: t.special(t.variableName), color: colors.variableSpecial, fontStyle: 'italic' },
    { tag: t.lineComment, color: colors.comment, fontStyle: 'italic' },
    { tag: t.paren, color: colors.paren },
  ]);
}

/**
 * Create editor theme from colors
 */
function createEditorTheme(colors: typeof lightColors, isDark: boolean): Extension {
  // Scrollbar colors
  const scrollThumbColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)';
  const scrollThumbHover = isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)';
  const scrollThumbActive = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)';

  return EditorView.theme(
    {
      '&': {
        color: colors.foreground,
        backgroundColor: colors.background,
        fontSize: '14px',
        fontFamily:
          '"JetBrains Mono", "Fira Code", "SF Mono", Menlo, Monaco, "Courier New", monospace',
        height: '100%',
      },
      '.cm-scroller': {
        overflow: 'auto',
        // Modern scrollbar - WebKit browsers (Chrome, Safari, Edge)
        '&::-webkit-scrollbar': {
          width: '10px',
          height: '10px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          background: scrollThumbColor,
          borderRadius: '5px',
          border: '2px solid transparent',
          backgroundClip: 'padding-box',
          transition: 'background 0.2s ease',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: scrollThumbHover,
          borderRadius: '5px',
          border: '2px solid transparent',
          backgroundClip: 'padding-box',
        },
        '&::-webkit-scrollbar-thumb:active': {
          background: scrollThumbActive,
          borderRadius: '5px',
          border: '2px solid transparent',
          backgroundClip: 'padding-box',
        },
        '&::-webkit-scrollbar-corner': {
          background: 'transparent',
        },
        // Firefox
        scrollbarWidth: 'thin',
        scrollbarColor: `${scrollThumbColor} transparent`,
      },
      '.cm-content': {
        caretColor: colors.cursor,
        padding: '8px 0',
      },
      '.cm-cursor, .cm-dropCursor': {
        borderLeftColor: colors.cursor,
        borderLeftWidth: '2px',
      },
      '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
        backgroundColor: colors.selection,
      },
      '.cm-activeLine': {
        backgroundColor: colors.lineHighlight,
      },
      '.cm-gutters': {
        backgroundColor: colors.gutterBackground,
        color: colors.gutterForeground,
        border: 'none',
        paddingRight: '8px',
      },
      '.cm-activeLineGutter': {
        backgroundColor: colors.lineHighlight,
      },
      '.cm-lineNumbers .cm-gutterElement': {
        padding: '0 8px 0 16px',
        minWidth: '32px',
      },
      '.cm-matchingBracket': {
        backgroundColor: isDark ? '#3a3d41' : '#e0e0e0',
        outline: `1px solid ${isDark ? '#888' : '#999'}`,
      },
      '.cm-tooltip': {
        backgroundColor: colors.background,
        border: `1px solid ${isDark ? '#454545' : '#ddd'}`,
        borderRadius: '4px',
      },
      '.cm-tooltip-autocomplete': {
        '& > ul > li[aria-selected]': {
          backgroundColor: colors.selection,
        },
      },
      '.cm-completionIcon': {
        paddingRight: '8px',
      },
      '.cm-completionLabel': {
        fontFamily: 'inherit',
      },
      '.cm-completionDetail': {
        marginLeft: '8px',
        fontStyle: 'italic',
        color: colors.comment,
      },
      '.cm-foldPlaceholder': {
        backgroundColor: isDark ? '#3a3d41' : '#eee',
        border: 'none',
        padding: '0 4px',
        borderRadius: '2px',
      },
    },
    { dark: isDark }
  );
}

/**
 * Light theme for WireScript editor
 */
export const wireScriptLightTheme: Extension = [
  createEditorTheme(lightColors, false),
  syntaxHighlighting(createHighlightStyle(lightColors)),
];

/**
 * Dark theme for WireScript editor
 */
export const wireScriptDarkTheme: Extension = [
  createEditorTheme(darkColors, true),
  syntaxHighlighting(createHighlightStyle(darkColors)),
];

/**
 * Get theme based on preference
 */
export function wireScriptTheme(dark: boolean = false): Extension {
  return dark ? wireScriptDarkTheme : wireScriptLightTheme;
}
