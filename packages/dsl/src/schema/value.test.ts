import { describe, expect, it } from 'vitest';
import { NumberValue, StringValue, SymbolValue } from './value.js';

describe('SymbolValue', () => {
  describe('boolean detection', () => {
    it('should detect true as boolean', () => {
      const sym = new SymbolValue('true');
      expect(sym.isBool()).toBe(true);
      expect(sym.asBool()).toBe(true);
      expect(sym.tryBool()).toBe(true);
    });

    it('should detect false as boolean', () => {
      const sym = new SymbolValue('false');
      expect(sym.isBool()).toBe(true);
      expect(sym.asBool()).toBe(false);
      expect(sym.tryBool()).toBe(false);
    });

    it('should detect t as boolean (Lisp style)', () => {
      const sym = new SymbolValue('t');
      expect(sym.isBool()).toBe(true);
      expect(sym.asBool()).toBe(true);
      expect(sym.tryBool()).toBe(true);
    });

    it('should detect nil as boolean (Lisp style)', () => {
      const sym = new SymbolValue('nil');
      expect(sym.isBool()).toBe(true);
      expect(sym.asBool()).toBe(false);
      expect(sym.tryBool()).toBe(false);
    });

    it('should not detect regular symbols as boolean', () => {
      const sym = new SymbolValue('primary');
      expect(sym.isBool()).toBe(false);
      expect(sym.tryBool()).toBeUndefined();
      expect(() => sym.asBool()).toThrow("Symbol 'primary' is not a boolean literal");
    });
  });

  describe('number coercion', () => {
    it('should convert numeric symbols to int', () => {
      const sym = new SymbolValue('42');
      expect(sym.asInt()).toBe(42);
      expect(sym.tryInt()).toBe(42);
    });

    it('should convert numeric symbols to float', () => {
      const sym = new SymbolValue('3.14');
      expect(sym.asFloat()).toBe(3.14);
      expect(sym.tryFloat()).toBe(3.14);
    });

    it('should throw for non-numeric symbols', () => {
      const sym = new SymbolValue('hello');
      expect(() => sym.asInt()).toThrow("Symbol 'hello' is not an integer");
      expect(() => sym.asFloat()).toThrow("Symbol 'hello' is not a number");
      expect(sym.tryInt()).toBeUndefined();
      expect(sym.tryFloat()).toBeUndefined();
    });
  });

  describe('string conversion', () => {
    it('should return raw value as string', () => {
      const sym = new SymbolValue('my-symbol');
      expect(sym.asString()).toBe('my-symbol');
      expect(sym.value).toBe('my-symbol');
      expect(sym.toString()).toBe('my-symbol');
    });
  });
});

describe('StringValue', () => {
  describe('boolean detection', () => {
    it('should detect "true" string as boolean (case insensitive)', () => {
      expect(new StringValue('true').isBool()).toBe(true);
      expect(new StringValue('TRUE').isBool()).toBe(true);
      expect(new StringValue('True').tryBool()).toBe(true);
    });

    it('should detect "false" string as boolean (case insensitive)', () => {
      expect(new StringValue('false').isBool()).toBe(true);
      expect(new StringValue('FALSE').isBool()).toBe(true);
      expect(new StringValue('False').tryBool()).toBe(false);
    });

    it('should not detect other strings as boolean', () => {
      const str = new StringValue('hello');
      expect(str.isBool()).toBe(false);
      expect(str.tryBool()).toBeUndefined();
    });
  });

  describe('number coercion', () => {
    it('should convert numeric strings to int', () => {
      expect(new StringValue('123').asInt()).toBe(123);
      expect(new StringValue('-456').asInt()).toBe(-456);
    });

    it('should convert numeric strings to float', () => {
      expect(new StringValue('3.14159').asFloat()).toBeCloseTo(Math.PI);
      expect(new StringValue('-0.5').asFloat()).toBe(-0.5);
    });

    it('should throw for non-numeric strings', () => {
      expect(() => new StringValue('abc').asInt()).toThrow();
      expect(() => new StringValue('').asFloat()).toThrow();
    });
  });

  describe('string utilities', () => {
    it('should detect empty strings', () => {
      expect(new StringValue('').isEmpty()).toBe(true);
      expect(new StringValue('x').isEmpty()).toBe(false);
    });

    it('should detect blank strings', () => {
      expect(new StringValue('').isBlank()).toBe(true);
      expect(new StringValue('   ').isBlank()).toBe(true);
      expect(new StringValue('  x  ').isBlank()).toBe(false);
    });
  });
});

describe('NumberValue', () => {
  describe('construction', () => {
    it('should accept number', () => {
      const num = new NumberValue(42);
      expect(num.value).toBe(42);
    });

    it('should accept string', () => {
      const num = new NumberValue('3.14');
      expect(num.value).toBeCloseTo(3.14);
    });
  });

  describe('integer detection', () => {
    it('should detect integers', () => {
      expect(new NumberValue(42).isInt()).toBe(true);
      expect(new NumberValue(0).isInt()).toBe(true);
      expect(new NumberValue(-10).isInt()).toBe(true);
    });

    it('should detect non-integers', () => {
      expect(new NumberValue(3.14).isInt()).toBe(false);
      expect(new NumberValue(0.5).isInt()).toBe(false);
    });
  });

  describe('type coercion', () => {
    it('should convert to bool (0 = false, else true)', () => {
      expect(new NumberValue(0).asBool()).toBe(false);
      expect(new NumberValue(1).asBool()).toBe(true);
      expect(new NumberValue(-1).asBool()).toBe(true);
    });

    it('should truncate to int', () => {
      expect(new NumberValue(3.7).asInt()).toBe(3);
      expect(new NumberValue(-2.9).asInt()).toBe(-2);
    });

    it('should convert to string', () => {
      expect(new NumberValue(42).asString()).toBe('42');
      expect(new NumberValue(3.14).asString()).toBe('3.14');
    });
  });
});
