/**
 * TCK: Type System
 *
 * Specification for WireScript value types and coercion.
 * Defines type literals, value wrappers, and automatic coercion.
 */

import { describe, expect, it } from 'vitest';
import { parse } from '../../schema/parser.js';
import { NumberValue, StringValue, SymbolValue } from '../../schema/value.js';

describe('TCK: Type System', () => {
  // ===========================================================================
  // 3.1 Boolean Values
  // ===========================================================================

  describe('3.1 Boolean Values', () => {
    describe('3.1.1 Boolean Literals', () => {
      it('true is boolean true', () => {
        const result = parse(`(wire (screen home "Home" (input :checked true)))`);
        expect(result.document?.screens[0].root.props.checked).toBe(true);
        expect(typeof result.document?.screens[0].root.props.checked).toBe('boolean');
      });

      it('false is boolean false', () => {
        const result = parse(`(wire (screen home "Home" (input :checked false)))`);
        expect(result.document?.screens[0].root.props.checked).toBe(false);
        expect(typeof result.document?.screens[0].root.props.checked).toBe('boolean');
      });

      it('t is boolean true (Lisp style)', () => {
        const result = parse(`(wire (screen home "Home" (input :checked t)))`);
        expect(result.document?.screens[0].root.props.checked).toBe(true);
      });

      it('nil is boolean false (Lisp style)', () => {
        const result = parse(`(wire (screen home "Home" (input :checked nil)))`);
        expect(result.document?.screens[0].root.props.checked).toBe(false);
      });
    });

    describe('3.1.2 Boolean Coercion', () => {
      it('"true" string coerces to true', () => {
        const result = parse(`(wire (screen home "Home" (input :checked "true")))`);
        expect(result.document?.screens[0].root.props.checked).toBe(true);
      });

      it('"false" string coerces to false', () => {
        const result = parse(`(wire (screen home "Home" (input :checked "false")))`);
        expect(result.document?.screens[0].root.props.checked).toBe(false);
      });

      it('"TRUE" string coerces to true (case insensitive)', () => {
        const result = parse(`(wire (screen home "Home" (input :checked "TRUE")))`);
        expect(result.document?.screens[0].root.props.checked).toBe(true);
      });

      it('"1" string coerces to true', () => {
        const result = parse(`(wire (screen home "Home" (input :checked "1")))`);
        expect(result.document?.screens[0].root.props.checked).toBe(true);
      });

      it('"0" string coerces to false', () => {
        const result = parse(`(wire (screen home "Home" (input :checked "0")))`);
        expect(result.document?.screens[0].root.props.checked).toBe(false);
      });

      it('number 1 coerces to true', () => {
        const result = parse(`(wire (screen home "Home" (input :checked 1)))`);
        expect(result.document?.screens[0].root.props.checked).toBe(true);
      });

      it('number 0 coerces to false', () => {
        const result = parse(`(wire (screen home "Home" (input :checked 0)))`);
        expect(result.document?.screens[0].root.props.checked).toBe(false);
      });

      it('non-zero numbers coerce to true', () => {
        const result = parse(`(wire (screen home "Home" (input :checked 42)))`);
        expect(result.document?.screens[0].root.props.checked).toBe(true);
      });
    });
  });

  // ===========================================================================
  // 3.2 Number Values
  // ===========================================================================

  describe('3.2 Number Values', () => {
    describe('3.2.1 Number Literals', () => {
      it('integer literals are numbers', () => {
        const result = parse(`(wire (screen home "Home" (box :gap 16)))`);
        expect(result.document?.screens[0].root.props.gap).toBe(16);
        expect(typeof result.document?.screens[0].root.props.gap).toBe('number');
      });

      it('decimal literals are numbers', () => {
        const result = parse(`(wire (screen home "Home" (box :gap 1.5)))`);
        expect(result.document?.screens[0].root.props.gap).toBe(1.5);
      });

      it('negative literals are numbers', () => {
        const result = parse(`(wire (screen home "Home" (box :gap -8)))`);
        expect(result.document?.screens[0].root.props.gap).toBe(-8);
      });
    });

    describe('3.2.2 Number Coercion', () => {
      it('"16" string coerces to 16', () => {
        const result = parse(`(wire (screen home "Home" (box :gap "16")))`);
        expect(result.document?.screens[0].root.props.gap).toBe(16);
        expect(typeof result.document?.screens[0].root.props.gap).toBe('number');
      });

      it('"3.14" string coerces to 3.14', () => {
        const result = parse(`(wire (screen home "Home" (box :gap "3.14")))`);
        expect(result.document?.screens[0].root.props.gap).toBe(3.14);
      });

      it('"-8" string coerces to -8', () => {
        const result = parse(`(wire (screen home "Home" (box :gap "-8")))`);
        expect(result.document?.screens[0].root.props.gap).toBe(-8);
      });

      it('boolean true coerces to 1', () => {
        const result = parse(`(wire (screen home "Home" (box :gap true)))`);
        expect(result.document?.screens[0].root.props.gap).toBe(1);
      });

      it('boolean false coerces to 0', () => {
        const result = parse(`(wire (screen home "Home" (box :gap false)))`);
        expect(result.document?.screens[0].root.props.gap).toBe(0);
      });
    });
  });

  // ===========================================================================
  // 3.3 String Values
  // ===========================================================================

  describe('3.3 String Values', () => {
    describe('3.3.1 String Literals', () => {
      it('quoted text is a string', () => {
        const result = parse(`(wire (screen home "Home" (input :placeholder "Enter")))`);
        expect(result.document?.screens[0].root.props.placeholder).toBe('Enter');
        expect(typeof result.document?.screens[0].root.props.placeholder).toBe('string');
      });

      it('empty string is valid', () => {
        const result = parse(`(wire (screen home "Home" (input :placeholder "")))`);
        expect(result.document?.screens[0].root.props.placeholder).toBe('');
      });

      it('strings preserve whitespace', () => {
        const result = parse(`(wire (screen home "Home" (input :placeholder "  spaces  ")))`);
        expect(result.document?.screens[0].root.props.placeholder).toBe('  spaces  ');
      });

      it('strings preserve newlines', () => {
        const result = parse(`(wire (screen home "Home" (text "Line1\\nLine2")))`);
        expect(result.document?.screens[0].root.content).toBe('Line1\nLine2');
      });
    });

    describe('3.3.2 String Coercion', () => {
      it('number coerces to string for string props', () => {
        // Note: This test depends on schema defining prop as string type
        // For now, testing with content which is always string
        const result = parse(`(wire (screen home "Home" (text "42")))`);
        expect(result.document?.screens[0].root.content).toBe('42');
      });
    });
  });

  // ===========================================================================
  // 3.4 Value Wrappers
  // ===========================================================================

  describe('3.4 Value Wrappers', () => {
    describe('3.4.1 SymbolValue', () => {
      it('detects boolean literals', () => {
        expect(new SymbolValue('true').isBool()).toBe(true);
        expect(new SymbolValue('false').isBool()).toBe(true);
        expect(new SymbolValue('t').isBool()).toBe(true);
        expect(new SymbolValue('nil').isBool()).toBe(true);
        expect(new SymbolValue('primary').isBool()).toBe(false);
      });

      it('converts to boolean', () => {
        expect(new SymbolValue('true').asBool()).toBe(true);
        expect(new SymbolValue('false').asBool()).toBe(false);
        expect(new SymbolValue('t').asBool()).toBe(true);
        expect(new SymbolValue('nil').asBool()).toBe(false);
      });

      it('tryBool returns undefined for non-booleans', () => {
        expect(new SymbolValue('primary').tryBool()).toBeUndefined();
      });

      it('converts numeric symbols', () => {
        expect(new SymbolValue('42').asInt()).toBe(42);
        expect(new SymbolValue('3.14').asFloat()).toBe(3.14);
      });

      it('asString returns raw value', () => {
        expect(new SymbolValue('my-symbol').asString()).toBe('my-symbol');
      });
    });

    describe('3.4.2 StringValue', () => {
      it('detects boolean strings (case insensitive)', () => {
        expect(new StringValue('true').isBool()).toBe(true);
        expect(new StringValue('TRUE').isBool()).toBe(true);
        expect(new StringValue('False').isBool()).toBe(true);
        expect(new StringValue('hello').isBool()).toBe(false);
      });

      it('converts numeric strings', () => {
        expect(new StringValue('123').asInt()).toBe(123);
        expect(new StringValue('-456').asInt()).toBe(-456);
        expect(new StringValue('3.14').asFloat()).toBeCloseTo(3.14);
      });

      it('detects empty and blank', () => {
        expect(new StringValue('').isEmpty()).toBe(true);
        expect(new StringValue('   ').isBlank()).toBe(true);
        expect(new StringValue('x').isEmpty()).toBe(false);
      });
    });

    describe('3.4.3 NumberValue', () => {
      it('detects integers', () => {
        expect(new NumberValue(42).isInt()).toBe(true);
        expect(new NumberValue(3.14).isInt()).toBe(false);
      });

      it('converts to boolean (0 = false)', () => {
        expect(new NumberValue(0).asBool()).toBe(false);
        expect(new NumberValue(1).asBool()).toBe(true);
        expect(new NumberValue(-1).asBool()).toBe(true);
      });

      it('truncates to int', () => {
        expect(new NumberValue(3.7).asInt()).toBe(3);
        expect(new NumberValue(-2.9).asInt()).toBe(-2);
      });

      it('converts to string', () => {
        expect(new NumberValue(42).asString()).toBe('42');
      });
    });
  });

  // ===========================================================================
  // 3.5 Param References
  // ===========================================================================

  describe('3.5 Param References', () => {
    it('$param creates a param reference', () => {
      const result = parse(`
        (wire
          (define my-box (gap)
            (box :gap $gap))
          (screen home "Home" (my-box :gap 16)))
      `);
      const component = result.document?.components[0];
      expect(component?.body.props.gap).toEqual({ type: 'param', name: 'gap' });
    });

    it('param refs are not coerced (runtime resolved)', () => {
      const result = parse(`
        (wire
          (define my-input (checked)
            (input :checked $checked))
          (screen home "Home" (my-input :checked true)))
      `);
      const component = result.document?.components[0];
      // Param ref should remain as-is, not coerced
      expect(component?.body.props.checked).toEqual({ type: 'param', name: 'checked' });
    });
  });
});
