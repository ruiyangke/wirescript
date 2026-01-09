/**
 * TCK: Lexical Structure
 *
 * Specification for WireScript tokenization.
 * Defines valid tokens, escape sequences, and token position tracking.
 */

import { describe, expect, it } from 'vitest';
import { TokenizerError, tokenize } from '../../tokenizer.js';

describe('TCK: Lexical Structure', () => {
  // ===========================================================================
  // 1.1 Token Types
  // ===========================================================================

  describe('1.1 Token Types', () => {
    describe('1.1.1 Parentheses', () => {
      it('LPAREN: ( opens an expression', () => {
        const tokens = tokenize('(');
        expect(tokens[0].type).toBe('LPAREN');
        expect(tokens[0].value).toBe('(');
      });

      it('RPAREN: ) closes an expression', () => {
        const tokens = tokenize(')');
        expect(tokens[0].type).toBe('RPAREN');
        expect(tokens[0].value).toBe(')');
      });
    });

    describe('1.1.2 Symbols', () => {
      it('symbols start with a letter or underscore', () => {
        expect(tokenize('box')[0]).toMatchObject({ type: 'SYMBOL', value: 'box' });
        expect(tokenize('_private')[0]).toMatchObject({ type: 'SYMBOL', value: '_private' });
        expect(tokenize('Box')[0]).toMatchObject({ type: 'SYMBOL', value: 'Box' });
      });

      it('symbols may contain letters, digits, hyphens, underscores', () => {
        expect(tokenize('my-component')[0].value).toBe('my-component');
        expect(tokenize('box2d')[0].value).toBe('box2d');
        expect(tokenize('__dunder__')[0].value).toBe('__dunder__');
      });

      it('symbols are case-sensitive', () => {
        expect(tokenize('Box')[0].value).toBe('Box');
        expect(tokenize('box')[0].value).toBe('box');
      });
    });

    describe('1.1.3 Keywords', () => {
      it('keywords start with colon (:name)', () => {
        const tokens = tokenize(':primary');
        expect(tokens[0]).toMatchObject({ type: 'KEYWORD', value: 'primary' });
      });

      it('keywords follow symbol naming rules', () => {
        expect(tokenize(':my-prop')[0].value).toBe('my-prop');
        expect(tokenize(':gap')[0].value).toBe('gap');
      });

      it('empty keyword is an error', () => {
        expect(() => tokenize(': ')).toThrow('Expected keyword after :');
      });
    });

    describe('1.1.4 Strings', () => {
      it('strings are delimited by double quotes', () => {
        const tokens = tokenize('"Hello World"');
        expect(tokens[0]).toMatchObject({ type: 'STRING', value: 'Hello World' });
      });

      it('empty strings are valid', () => {
        expect(tokenize('""')[0].value).toBe('');
      });

      it('strings may contain unicode', () => {
        expect(tokenize('"北京 café"')[0].value).toBe('北京 café');
      });

      it('strings may span multiple lines', () => {
        const tokens = tokenize('"Line1\nLine2"');
        expect(tokens[0].value).toBe('Line1\nLine2');
      });

      it('unterminated string is an error', () => {
        expect(() => tokenize('"hello')).toThrow('Unterminated string');
      });
    });

    describe('1.1.5 Numbers', () => {
      it('integers: positive whole numbers', () => {
        expect(tokenize('42')[0]).toMatchObject({ type: 'NUMBER', value: '42' });
      });

      it('integers: negative numbers', () => {
        expect(tokenize('-10')[0]).toMatchObject({ type: 'NUMBER', value: '-10' });
      });

      it('decimals: numbers with fractional part', () => {
        expect(tokenize('3.14')[0]).toMatchObject({ type: 'NUMBER', value: '3.14' });
        expect(tokenize('-0.5')[0]).toMatchObject({ type: 'NUMBER', value: '-0.5' });
      });

      it('zero in various forms', () => {
        expect(tokenize('0')[0].value).toBe('0');
        expect(tokenize('0.0')[0].value).toBe('0.0');
      });

      it('trailing dot is not part of number', () => {
        expect(() => tokenize('5.')).toThrow('Unexpected character: .');
      });

      it('leading dot is not a number', () => {
        expect(() => tokenize('.5')).toThrow('Unexpected character: .');
      });
    });

    describe('1.1.6 Parameter References', () => {
      it('param refs start with $ ($name)', () => {
        const tokens = tokenize('$title');
        expect(tokens[0]).toMatchObject({ type: 'PARAM_REF', value: 'title' });
      });

      it('param refs follow symbol naming rules', () => {
        expect(tokenize('$my-param')[0].value).toBe('my-param');
      });

      it('empty param ref is an error', () => {
        expect(() => tokenize('$ ')).toThrow('Expected parameter name after $');
      });
    });

    describe('1.1.7 Hash References', () => {
      it('hash refs start with # (#id)', () => {
        const tokens = tokenize('#modal');
        expect(tokens[0]).toMatchObject({ type: 'HASH_REF', value: 'modal' });
      });

      it('hash refs may contain digits', () => {
        expect(tokenize('#dialog123')[0].value).toBe('dialog123');
      });

      it('empty hash ref is an error', () => {
        expect(() => tokenize('# ')).toThrow('Expected identifier after #');
      });
    });
  });

  // ===========================================================================
  // 1.2 Escape Sequences
  // ===========================================================================

  describe('1.2 Escape Sequences', () => {
    describe('1.2.1 Basic Escapes', () => {
      it('\\n produces newline', () => {
        expect(tokenize('"a\\nb"')[0].value).toBe('a\nb');
      });

      it('\\t produces tab', () => {
        expect(tokenize('"a\\tb"')[0].value).toBe('a\tb');
      });

      it('\\r produces carriage return', () => {
        expect(tokenize('"a\\rb"')[0].value).toBe('a\rb');
      });

      it('\\\\ produces backslash', () => {
        expect(tokenize('"a\\\\b"')[0].value).toBe('a\\b');
      });

      it('\\" produces double quote', () => {
        expect(tokenize('"a\\"b"')[0].value).toBe('a"b');
      });
    });

    describe('1.2.2 Hex Escapes', () => {
      it('\\xNN produces character by hex code', () => {
        expect(tokenize('"\\x41"')[0].value).toBe('A');
        expect(tokenize('"\\x41\\x42\\x43"')[0].value).toBe('ABC');
      });

      it('\\x00 produces null character', () => {
        expect(tokenize('"\\x00"')[0].value).toBe('\x00');
      });

      it('invalid hex digit is an error', () => {
        expect(() => tokenize('"\\xGG"')).toThrow('Invalid hex digit');
      });

      it('incomplete hex escape is an error', () => {
        expect(() => tokenize('"\\x4"')).toThrow('Invalid hex digit');
      });
    });

    describe('1.2.3 Unicode Escapes', () => {
      it('\\uNNNN produces unicode character', () => {
        expect(tokenize('"\\u0041"')[0].value).toBe('A');
        expect(tokenize('"\\u4e2d\\u6587"')[0].value).toBe('中文');
      });

      it('\\u{N...} produces unicode by code point', () => {
        expect(tokenize('"\\u{41}"')[0].value).toBe('A');
        expect(tokenize('"\\u{1F600}"')[0].value).toBe('😀');
      });

      it('invalid unicode is an error', () => {
        expect(() => tokenize('"\\uGGGG"')).toThrow('Invalid hex digit');
        expect(() => tokenize('"\\u{}"')).toThrow('Unicode escape must have 1-6 hex digits');
        expect(() => tokenize('"\\u{FFFFFF}"')).toThrow('out of range');
      });
    });

    describe('1.2.4 Unknown Escapes', () => {
      it('unknown escapes pass through the character', () => {
        expect(tokenize('"\\z"')[0].value).toBe('z');
        expect(tokenize('"\\a"')[0].value).toBe('a');
      });
    });
  });

  // ===========================================================================
  // 1.3 Comments
  // ===========================================================================

  describe('1.3 Comments', () => {
    it('comments start with ; and extend to end of line', () => {
      const tokens = tokenize('; this is a comment\nbox');
      expect(tokens[0]).toMatchObject({ type: 'SYMBOL', value: 'box' });
    });

    it('comments at end of file', () => {
      const tokens = tokenize('box ; trailing comment');
      expect(tokens).toHaveLength(2); // SYMBOL + EOF
    });

    it('multiple comments', () => {
      const tokens = tokenize('; comment 1\n; comment 2\nbox');
      expect(tokens[0]).toMatchObject({ type: 'SYMBOL', value: 'box' });
    });

    it('comment-only input produces just EOF', () => {
      const tokens = tokenize('; only a comment');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('EOF');
    });
  });

  // ===========================================================================
  // 1.4 Whitespace
  // ===========================================================================

  describe('1.4 Whitespace', () => {
    it('spaces separate tokens', () => {
      const tokens = tokenize('box text');
      expect(tokens[0].value).toBe('box');
      expect(tokens[1].value).toBe('text');
    });

    it('tabs separate tokens', () => {
      const tokens = tokenize('box\ttext');
      expect(tokens[0].value).toBe('box');
      expect(tokens[1].value).toBe('text');
    });

    it('newlines separate tokens', () => {
      const tokens = tokenize('box\ntext');
      expect(tokens[0].value).toBe('box');
      expect(tokens[1].value).toBe('text');
    });

    it('carriage returns are whitespace', () => {
      const tokens = tokenize('box\r\ntext');
      expect(tokens[0].value).toBe('box');
      expect(tokens[1].value).toBe('text');
    });

    it('empty input produces just EOF', () => {
      const tokens = tokenize('');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('EOF');
    });

    it('whitespace-only input produces just EOF', () => {
      const tokens = tokenize('   \n\t  ');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('EOF');
    });
  });

  // ===========================================================================
  // 1.5 Token Positions
  // ===========================================================================

  describe('1.5 Token Positions', () => {
    it('tokens have start line and column', () => {
      const tokens = tokenize('box');
      expect(tokens[0]).toMatchObject({ line: 1, column: 1 });
    });

    it('tokens have end line and column', () => {
      const tokens = tokenize('box');
      expect(tokens[0]).toMatchObject({ endLine: 1, endColumn: 4 });
    });

    it('positions track across lines', () => {
      const tokens = tokenize('box\ntext');
      expect(tokens[0]).toMatchObject({ line: 1, column: 1 });
      expect(tokens[1]).toMatchObject({ line: 2, column: 1 });
    });

    it('positions track within a line', () => {
      const tokens = tokenize('  box  text');
      expect(tokens[0]).toMatchObject({ line: 1, column: 3 });
      expect(tokens[1]).toMatchObject({ line: 1, column: 8 });
    });

    it('multiline strings track end position', () => {
      const tokens = tokenize('"Line1\nLine2" symbol');
      expect(tokens[0]).toMatchObject({ line: 1, column: 1 });
      expect(tokens[1]).toMatchObject({ line: 2, column: 8 });
    });
  });

  // ===========================================================================
  // 1.6 Error Reporting
  // ===========================================================================

  describe('1.6 Error Reporting', () => {
    it('errors include line and column', () => {
      try {
        tokenize('box\n@');
        expect.fail('Should throw');
      } catch (e) {
        expect(e).toBeInstanceOf(TokenizerError);
        expect((e as TokenizerError).line).toBe(2);
        expect((e as TokenizerError).column).toBe(1);
      }
    });

    it('string errors report opening position', () => {
      try {
        tokenize('box "unterminated');
        expect.fail('Should throw');
      } catch (e) {
        expect(e).toBeInstanceOf(TokenizerError);
        expect((e as TokenizerError).line).toBe(1);
        expect((e as TokenizerError).column).toBe(5);
      }
    });
  });
});
