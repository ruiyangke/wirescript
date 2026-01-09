import { describe, expect, it } from 'vitest';
import { TokenizerError, tokenize } from './tokenizer.js';

describe('Tokenizer', () => {
  describe('basic tokenization', () => {
    it('should tokenize empty input', () => {
      const tokens = tokenize('');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('EOF');
    });

    it('should tokenize whitespace-only input', () => {
      const tokens = tokenize('   \n\t  \n  ');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('EOF');
    });

    it('should tokenize comment-only input', () => {
      const tokens = tokenize('; this is a comment');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('EOF');
    });

    it('should tokenize parentheses', () => {
      const tokens = tokenize('()');
      expect(tokens).toHaveLength(3);
      expect(tokens[0].type).toBe('LPAREN');
      expect(tokens[1].type).toBe('RPAREN');
      expect(tokens[2].type).toBe('EOF');
    });
  });

  describe('symbols', () => {
    it('should tokenize simple symbols', () => {
      const tokens = tokenize('wire screen box');
      expect(tokens).toHaveLength(4);
      expect(tokens[0]).toMatchObject({ type: 'SYMBOL', value: 'wire' });
      expect(tokens[1]).toMatchObject({ type: 'SYMBOL', value: 'screen' });
      expect(tokens[2]).toMatchObject({ type: 'SYMBOL', value: 'box' });
    });

    it('should tokenize symbols with hyphens', () => {
      const tokens = tokenize('my-component');
      expect(tokens[0]).toMatchObject({ type: 'SYMBOL', value: 'my-component' });
    });

    it('should tokenize symbols starting with underscore', () => {
      const tokens = tokenize('_private __dunder');
      expect(tokens[0]).toMatchObject({ type: 'SYMBOL', value: '_private' });
      expect(tokens[1]).toMatchObject({ type: 'SYMBOL', value: '__dunder' });
    });

    it('should tokenize symbols with digits', () => {
      const tokens = tokenize('item1 box2d h264');
      expect(tokens[0]).toMatchObject({ type: 'SYMBOL', value: 'item1' });
      expect(tokens[1]).toMatchObject({ type: 'SYMBOL', value: 'box2d' });
      expect(tokens[2]).toMatchObject({ type: 'SYMBOL', value: 'h264' });
    });
  });

  describe('keywords', () => {
    it('should tokenize keywords', () => {
      const tokens = tokenize(':primary :col :gap');
      expect(tokens).toHaveLength(4);
      expect(tokens[0]).toMatchObject({ type: 'KEYWORD', value: 'primary' });
      expect(tokens[1]).toMatchObject({ type: 'KEYWORD', value: 'col' });
      expect(tokens[2]).toMatchObject({ type: 'KEYWORD', value: 'gap' });
    });

    it('should tokenize keyword at EOF', () => {
      const tokens = tokenize(':foo');
      expect(tokens[0]).toMatchObject({ type: 'KEYWORD', value: 'foo' });
    });
  });

  describe('strings', () => {
    it('should tokenize simple strings', () => {
      const tokens = tokenize('"Hello World"');
      expect(tokens[0]).toMatchObject({ type: 'STRING', value: 'Hello World' });
    });

    it('should tokenize empty strings', () => {
      const tokens = tokenize('""');
      expect(tokens[0]).toMatchObject({ type: 'STRING', value: '' });
    });

    it('should tokenize strings with basic escape sequences', () => {
      expect(tokenize('"Hello\\nWorld"')[0].value).toBe('Hello\nWorld');
      expect(tokenize('"Tab\\tHere"')[0].value).toBe('Tab\tHere');
      expect(tokenize('"Return\\rHere"')[0].value).toBe('Return\rHere');
      expect(tokenize('"Quote\\"Here"')[0].value).toBe('Quote"Here');
      expect(tokenize('"Back\\\\slash"')[0].value).toBe('Back\\slash');
    });

    it('should tokenize strings with hex escapes', () => {
      expect(tokenize('"\\x41\\x42\\x43"')[0].value).toBe('ABC');
      expect(tokenize('"\\x00"')[0].value).toBe('\x00');
      expect(tokenize('"\\xff"')[0].value).toBe('\xff');
    });

    it('should tokenize strings with unicode escapes', () => {
      expect(tokenize('"\\u0041"')[0].value).toBe('A');
      expect(tokenize('"\\u4e2d\\u6587"')[0].value).toBe('中文');
      expect(tokenize('"\\u{1F600}"')[0].value).toBe('😀');
      expect(tokenize('"\\u{41}"')[0].value).toBe('A');
    });

    it('should handle unknown escape sequences', () => {
      // Unknown escapes keep the character
      expect(tokenize('"\\z"')[0].value).toBe('z');
      expect(tokenize('"\\a"')[0].value).toBe('a');
    });

    it('should tokenize multiline strings', () => {
      const tokens = tokenize('"Line1\nLine2\nLine3"');
      expect(tokens[0].value).toBe('Line1\nLine2\nLine3');
    });

    it('should track positions across multiline strings', () => {
      const tokens = tokenize('"Line1\nLine2" symbol');
      expect(tokens[0]).toMatchObject({ line: 1, column: 1 });
      expect(tokens[1]).toMatchObject({ line: 2, column: 8 });
    });

    it('should tokenize unicode in strings', () => {
      const tokens = tokenize('"café naïve 北京"');
      expect(tokens[0].value).toBe('café naïve 北京');
    });
  });

  describe('numbers', () => {
    it('should tokenize positive integers', () => {
      const tokens = tokenize('42');
      expect(tokens[0]).toMatchObject({ type: 'NUMBER', value: '42' });
    });

    it('should tokenize negative numbers', () => {
      const tokens = tokenize('-10');
      expect(tokens[0]).toMatchObject({ type: 'NUMBER', value: '-10' });
    });

    it('should tokenize decimal numbers', () => {
      const tokens = tokenize('3.14');
      expect(tokens[0]).toMatchObject({ type: 'NUMBER', value: '3.14' });
    });

    it('should tokenize negative decimals', () => {
      const tokens = tokenize('-0.5');
      expect(tokens[0]).toMatchObject({ type: 'NUMBER', value: '-0.5' });
    });

    it('should tokenize zero', () => {
      const tokens = tokenize('0 0.0');
      expect(tokens[0]).toMatchObject({ type: 'NUMBER', value: '0' });
      expect(tokens[1]).toMatchObject({ type: 'NUMBER', value: '0.0' });
    });

    it('should not treat trailing dot as decimal', () => {
      // "5." should be NUMBER "5" followed by unexpected char "."
      expect(() => tokenize('5.')).toThrow('Unexpected character: .');
    });

    it('should not treat leading dot as number', () => {
      expect(() => tokenize('.5')).toThrow('Unexpected character: .');
    });
  });

  describe('parameter references', () => {
    it('should tokenize parameter references', () => {
      const tokens = tokenize('$title $name');
      expect(tokens[0]).toMatchObject({ type: 'PARAM_REF', value: 'title' });
      expect(tokens[1]).toMatchObject({ type: 'PARAM_REF', value: 'name' });
    });

    it('should tokenize parameter refs with hyphens', () => {
      const tokens = tokenize('$my-param');
      expect(tokens[0]).toMatchObject({ type: 'PARAM_REF', value: 'my-param' });
    });
  });

  describe('hash references', () => {
    it('should tokenize hash references', () => {
      const tokens = tokenize('#overlay1 #modal');
      expect(tokens[0]).toMatchObject({ type: 'HASH_REF', value: 'overlay1' });
      expect(tokens[1]).toMatchObject({ type: 'HASH_REF', value: 'modal' });
    });

    it('should tokenize hash refs with numeric suffix', () => {
      const tokens = tokenize('#dialog123');
      expect(tokens[0]).toMatchObject({ type: 'HASH_REF', value: 'dialog123' });
    });
  });

  describe('comments', () => {
    it('should skip single-line comments', () => {
      const tokens = tokenize('; this is a comment\nbox');
      expect(tokens).toHaveLength(2);
      expect(tokens[0]).toMatchObject({ type: 'SYMBOL', value: 'box' });
    });

    it('should handle comment at end of file', () => {
      const tokens = tokenize('box ; trailing comment');
      expect(tokens).toHaveLength(2);
      expect(tokens[0]).toMatchObject({ type: 'SYMBOL', value: 'box' });
    });

    it('should handle multiple comments', () => {
      const tokens = tokenize('; comment 1\n; comment 2\nbox');
      expect(tokens).toHaveLength(2);
      expect(tokens[0]).toMatchObject({ type: 'SYMBOL', value: 'box' });
    });
  });

  describe('whitespace handling', () => {
    it('should skip whitespace between tokens', () => {
      const tokens = tokenize('  box  \n  text  ');
      expect(tokens).toHaveLength(3);
      expect(tokens[0]).toMatchObject({ type: 'SYMBOL', value: 'box' });
      expect(tokens[1]).toMatchObject({ type: 'SYMBOL', value: 'text' });
    });

    it('should handle tabs and carriage returns', () => {
      const tokens = tokenize('box\t\r\ntext');
      expect(tokens[0]).toMatchObject({ type: 'SYMBOL', value: 'box' });
      expect(tokens[1]).toMatchObject({ type: 'SYMBOL', value: 'text' });
    });
  });

  describe('token spans', () => {
    it('should track start and end positions', () => {
      const tokens = tokenize('box');
      expect(tokens[0]).toMatchObject({
        line: 1,
        column: 1,
        endLine: 1,
        endColumn: 4,
      });
    });

    it('should track positions for strings', () => {
      const tokens = tokenize('"hello"');
      expect(tokens[0]).toMatchObject({
        line: 1,
        column: 1,
        endLine: 1,
        endColumn: 8,
      });
    });

    it('should track line and column numbers', () => {
      const tokens = tokenize('box\ntext');
      expect(tokens[0]).toMatchObject({ line: 1, column: 1 });
      expect(tokens[1]).toMatchObject({ line: 2, column: 1 });
    });

    it('should track column within a line', () => {
      const tokens = tokenize('  box  text');
      expect(tokens[0]).toMatchObject({ line: 1, column: 3, endColumn: 6 });
      expect(tokens[1]).toMatchObject({ line: 1, column: 8, endColumn: 12 });
    });
  });

  describe('complete expressions', () => {
    it('should tokenize a complete expression', () => {
      const tokens = tokenize('(box :col :gap 16 (text "Hello"))');
      const types = tokens.map((t) => t.type);
      expect(types).toEqual([
        'LPAREN',
        'SYMBOL',
        'KEYWORD',
        'KEYWORD',
        'NUMBER',
        'LPAREN',
        'SYMBOL',
        'STRING',
        'RPAREN',
        'RPAREN',
        'EOF',
      ]);
    });

    it('should tokenize nested expressions', () => {
      const tokens = tokenize('(((deep)))');
      const types = tokens.map((t) => t.type);
      expect(types).toEqual([
        'LPAREN',
        'LPAREN',
        'LPAREN',
        'SYMBOL',
        'RPAREN',
        'RPAREN',
        'RPAREN',
        'EOF',
      ]);
    });
  });

  describe('error handling', () => {
    it('should throw on unterminated string', () => {
      expect(() => tokenize('"hello')).toThrow(TokenizerError);
      expect(() => tokenize('"hello')).toThrow('Unterminated string');
    });

    it('should throw on unterminated escape sequence', () => {
      expect(() => tokenize('"hello\\')).toThrow(TokenizerError);
      expect(() => tokenize('"hello\\')).toThrow('Unterminated escape sequence');
    });

    it('should throw on empty keyword', () => {
      expect(() => tokenize(': ')).toThrow(TokenizerError);
      expect(() => tokenize(': ')).toThrow('Expected keyword after :');
    });

    it('should throw on empty param ref', () => {
      expect(() => tokenize('$ ')).toThrow(TokenizerError);
      expect(() => tokenize('$ ')).toThrow('Expected parameter name after $');
    });

    it('should throw on empty hash ref', () => {
      expect(() => tokenize('# ')).toThrow(TokenizerError);
      expect(() => tokenize('# ')).toThrow('Expected identifier after #');
    });

    it('should throw on unexpected character', () => {
      expect(() => tokenize('@')).toThrow(TokenizerError);
      expect(() => tokenize('@')).toThrow('Unexpected character');
    });

    it('should throw on invalid hex escape', () => {
      expect(() => tokenize('"\\xGG"')).toThrow('Invalid hex digit');
      // \x4" - the " is not a valid hex digit
      expect(() => tokenize('"\\x4"')).toThrow('Invalid hex digit');
    });

    it('should throw on invalid unicode escape', () => {
      expect(() => tokenize('"\\uGGGG"')).toThrow('Invalid hex digit');
      expect(() => tokenize('"\\u{GGGG}"')).toThrow('Invalid hex digit');
      expect(() => tokenize('"\\u{}"')).toThrow('Unicode escape must have 1-6 hex digits');
      expect(() => tokenize('"\\u{1234567}"')).toThrow('Unicode escape must have 1-6 hex digits');
      expect(() => tokenize('"\\u{FFFFFF}"')).toThrow('out of range');
    });

    it('should throw on unterminated unicode escape', () => {
      expect(() => tokenize('"\\u{1234')).toThrow('Unterminated unicode escape');
    });

    it('should include line and column in error', () => {
      try {
        tokenize('box\n@');
      } catch (e) {
        expect(e).toBeInstanceOf(TokenizerError);
        expect((e as TokenizerError).line).toBe(2);
        expect((e as TokenizerError).column).toBe(1);
      }
    });

    it('should report correct position for string errors', () => {
      try {
        tokenize('box "unterminated');
      } catch (e) {
        expect(e).toBeInstanceOf(TokenizerError);
        expect((e as TokenizerError).line).toBe(1);
        expect((e as TokenizerError).column).toBe(5);
      }
    });
  });
});
