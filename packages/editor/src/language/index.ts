import {
  foldInside,
  foldNodeProp,
  indentNodeProp,
  LanguageSupport,
  LRLanguage,
} from '@codemirror/language';
import { wireScriptCompletion } from './complete.js';
import { wireScriptHighlighting } from './highlight.js';
import { parser } from './parser.js';

/**
 * WireScript language definition for CodeMirror 6
 */
export const wireScriptLanguage = LRLanguage.define({
  name: 'wirescript',
  parser: parser.configure({
    props: [
      wireScriptHighlighting,
      // Indentation
      indentNodeProp.add({
        List: (context) => {
          const baseIndent = context.baseIndent;
          return baseIndent + context.unit;
        },
      }),
      // Code folding
      foldNodeProp.add({
        List: foldInside,
      }),
    ],
  }),
  languageData: {
    commentTokens: { line: ';' },
    closeBrackets: { brackets: ['(', '"'] },
  },
});

/**
 * WireScript language support with autocompletion
 */
export function wireScript(): LanguageSupport {
  return new LanguageSupport(wireScriptLanguage, [
    wireScriptLanguage.data.of({
      autocomplete: wireScriptCompletion,
    }),
  ]);
}

export { wireScriptCompletion } from './complete.js';
export { wireScriptHighlighting } from './highlight.js';
