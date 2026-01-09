import { styleTags, tags as t } from '@lezer/highlight';

/**
 * Syntax highlighting tags for WireScript
 *
 * Uses Common Lisp style :keyword for both flags and property keys.
 */
export const wireScriptHighlighting = styleTags({
  // Form keywords (wire, meta, define, screen, repeat)
  FormKeyword: t.keyword,

  // Element type keywords
  ElementKeyword: t.typeName,

  // Overlay keywords
  OverlayKeyword: t.typeName,

  // Symbols (component names, identifiers, property values)
  Symbol: t.variableName,

  // Strings
  String: t.string,

  // Numbers
  Number: t.number,

  // Keywords (:symbol) - used for both flags (:primary) and property keys (:gap)
  Keyword: t.attributeName,

  // Parameter references ($name)
  ParamRef: t.special(t.variableName),

  // Parentheses
  '( )': t.paren,

  // Comments
  Comment: t.lineComment,
});
