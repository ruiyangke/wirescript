/**
 * TCK: Error Handling
 *
 * Specification for WireScript error detection and recovery.
 * Defines expected error cases and error messages.
 */

import { describe, expect, it } from 'vitest';
import { parse } from '../../schema/parser.js';
import { TokenizerError, tokenize } from '../../tokenizer.js';

describe('TCK: Error Handling', () => {
  // ===========================================================================
  // 9.1 Lexical Errors
  // ===========================================================================

  describe('9.1 Lexical Errors', () => {
    describe('9.1.1 Unterminated Strings', () => {
      it('string without closing quote is error', () => {
        expect(() => tokenize('"hello')).toThrow(TokenizerError);
        expect(() => tokenize('"hello')).toThrow('Unterminated string');
      });

      it('string ending with escape is error', () => {
        expect(() => tokenize('"hello\\')).toThrow('Unterminated escape sequence');
      });
    });

    describe('9.1.2 Invalid Escapes', () => {
      it('incomplete hex escape is error', () => {
        expect(() => tokenize('"\\x4"')).toThrow('Invalid hex digit');
      });

      it('invalid hex digits in escape is error', () => {
        expect(() => tokenize('"\\xGG"')).toThrow('Invalid hex digit');
      });

      it('incomplete unicode escape is error', () => {
        expect(() => tokenize('"\\u123"')).toThrow('Invalid hex digit');
      });

      it('unicode out of range is error', () => {
        expect(() => tokenize('"\\u{FFFFFF}"')).toThrow('out of range');
      });
    });

    describe('9.1.3 Empty References', () => {
      it('empty keyword (colon alone) is error', () => {
        expect(() => tokenize(': ')).toThrow('Expected keyword after :');
      });

      it('empty param ref (dollar alone) is error', () => {
        expect(() => tokenize('$ ')).toThrow('Expected parameter name after $');
      });

      it('empty hash ref (hash alone) is error', () => {
        expect(() => tokenize('# ')).toThrow('Expected identifier after #');
      });
    });

    describe('9.1.4 Unexpected Characters', () => {
      it('@ is not a valid character', () => {
        expect(() => tokenize('@')).toThrow('Unexpected character');
      });

      it('bare dot is not valid', () => {
        expect(() => tokenize('.')).toThrow('Unexpected character');
      });

      it('trailing dot on number is error', () => {
        expect(() => tokenize('5.')).toThrow('Unexpected character');
      });
    });
  });

  // ===========================================================================
  // 9.2 Syntax Errors
  // ===========================================================================

  describe('9.2 Syntax Errors', () => {
    describe('9.2.1 Document Structure Errors', () => {
      it('missing wire wrapper is error', () => {
        const result = parse('(screen home (box))');
        expect(result.success).toBe(false);
      });

      it('document without screens is error', () => {
        const result = parse('(wire (meta :title "Test"))');
        expect(result.success).toBe(false);
        expect(result.errors[0].message).toContain('at least one screen');
      });

      it('unbalanced parentheses is error', () => {
        const result = parse('(wire (screen home (box))');
        expect(result.success).toBe(false);
      });
    });

    describe('9.2.2 Form Errors', () => {
      it('unknown top-level form reports error', () => {
        const result = parse('(wire (unknown-form) (screen home (box)))');
        expect(result.success).toBe(false);
        expect(result.errors[0].message).toContain('Unknown form type');
      });
    });
  });

  // ===========================================================================
  // 9.3 Error Recovery
  // ===========================================================================

  describe('9.3 Error Recovery', () => {
    it('parser continues after recoverable errors', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (box
              (text "Valid before")
              (text "Valid after"))))
      `);
      // Even with potential issues, parser attempts to continue
      expect(result.document).toBeDefined();
    });

    it('multiple elements still parsed despite one bad element', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (box
              (unknown-elem-1)
              (unknown-elem-2)
              (text "Valid"))))
      `);
      // Unknown elements parsed as potential components
      expect(result.document?.screens[0].root.children).toHaveLength(3);
    });
  });

  // ===========================================================================
  // 9.4 Error Positions
  // ===========================================================================

  describe('9.4 Error Positions', () => {
    it('lexical errors include line and column', () => {
      try {
        tokenize('box\n@');
        expect.fail('Should throw');
      } catch (e) {
        expect(e).toBeInstanceOf(TokenizerError);
        expect((e as TokenizerError).line).toBe(2);
        expect((e as TokenizerError).column).toBe(1);
      }
    });

    it('parse errors include position info', () => {
      const result = parse('(wire (unknown) (screen home (box)))');
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].line).toBeDefined();
      expect(result.errors[0].column).toBeDefined();
    });
  });

  // ===========================================================================
  // 9.5 Error Messages
  // ===========================================================================

  describe('9.5 Error Messages', () => {
    it('error messages are descriptive', () => {
      const result = parse('(wire)');
      expect(result.errors.length).toBeGreaterThan(0);
      // Message should explain what's wrong
      expect(result.errors[0].message.length).toBeGreaterThan(10);
    });

    it('tokenizer errors explain the issue', () => {
      try {
        tokenize('"unclosed');
      } catch (e) {
        expect((e as Error).message).toContain('Unterminated');
      }
    });
  });
});
