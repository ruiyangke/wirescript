/**
 * Value wrapper for type-safe coercion without typeof checks
 *
 * Usage:
 *   const sym = new SymbolValue('true');
 *   if (sym.isBool()) return sym.asBool();  // true
 *   return sym.asString();                   // 'true'
 */

/** Wrapper for symbol token values */
export class SymbolValue {
  constructor(private readonly raw: string) {}

  /** Raw symbol string */
  get value(): string {
    return this.raw;
  }

  /** Check if this is a boolean literal (true/false/t/nil) */
  isBool(): boolean {
    return this.raw === 'true' || this.raw === 'false' || this.raw === 't' || this.raw === 'nil';
  }

  /** Convert to boolean - throws if not a bool literal */
  asBool(): boolean {
    if (this.raw === 'true' || this.raw === 't') return true;
    if (this.raw === 'false' || this.raw === 'nil') return false;
    throw new Error(`Symbol '${this.raw}' is not a boolean literal`);
  }

  /** Try to convert to boolean - returns undefined if not a bool literal */
  tryBool(): boolean | undefined {
    if (this.raw === 'true' || this.raw === 't') return true;
    if (this.raw === 'false' || this.raw === 'nil') return false;
    return undefined;
  }

  /** Convert to integer - throws if not a valid integer */
  asInt(): number {
    const n = Number.parseInt(this.raw, 10);
    if (Number.isNaN(n)) throw new Error(`Symbol '${this.raw}' is not an integer`);
    return n;
  }

  /** Try to convert to integer - returns undefined if not valid */
  tryInt(): number | undefined {
    const n = Number.parseInt(this.raw, 10);
    return Number.isNaN(n) ? undefined : n;
  }

  /** Convert to float - throws if not a valid number */
  asFloat(): number {
    const n = Number.parseFloat(this.raw);
    if (Number.isNaN(n)) throw new Error(`Symbol '${this.raw}' is not a number`);
    return n;
  }

  /** Try to convert to float - returns undefined if not valid */
  tryFloat(): number | undefined {
    const n = Number.parseFloat(this.raw);
    return Number.isNaN(n) ? undefined : n;
  }

  /** Get as string (identity) */
  asString(): string {
    return this.raw;
  }

  toString(): string {
    return this.raw;
  }
}

/** Wrapper for string token values */
export class StringValue {
  constructor(private readonly raw: string) {}

  /** Raw string content */
  get value(): string {
    return this.raw;
  }

  /** Check if this looks like a boolean string */
  isBool(): boolean {
    const lower = this.raw.toLowerCase();
    return lower === 'true' || lower === 'false';
  }

  /** Convert to boolean - throws if not a bool string */
  asBool(): boolean {
    const lower = this.raw.toLowerCase();
    if (lower === 'true') return true;
    if (lower === 'false') return false;
    throw new Error(`String '${this.raw}' is not a boolean`);
  }

  /** Try to convert to boolean */
  tryBool(): boolean | undefined {
    const lower = this.raw.toLowerCase();
    if (lower === 'true') return true;
    if (lower === 'false') return false;
    return undefined;
  }

  /** Convert to integer */
  asInt(): number {
    const n = Number.parseInt(this.raw, 10);
    if (Number.isNaN(n)) throw new Error(`String '${this.raw}' is not an integer`);
    return n;
  }

  /** Try to convert to integer */
  tryInt(): number | undefined {
    const n = Number.parseInt(this.raw, 10);
    return Number.isNaN(n) ? undefined : n;
  }

  /** Convert to float */
  asFloat(): number {
    const n = Number.parseFloat(this.raw);
    if (Number.isNaN(n)) throw new Error(`String '${this.raw}' is not a number`);
    return n;
  }

  /** Try to convert to float */
  tryFloat(): number | undefined {
    const n = Number.parseFloat(this.raw);
    return Number.isNaN(n) ? undefined : n;
  }

  /** Get as string (identity) */
  asString(): string {
    return this.raw;
  }

  /** Check if empty */
  isEmpty(): boolean {
    return this.raw.length === 0;
  }

  /** Check if blank (empty or whitespace only) */
  isBlank(): boolean {
    return this.raw.trim().length === 0;
  }

  toString(): string {
    return this.raw;
  }
}

/** Wrapper for number token values */
export class NumberValue {
  private readonly num: number;

  constructor(raw: string | number) {
    this.num = typeof raw === 'number' ? raw : Number.parseFloat(raw);
  }

  /** Raw number value */
  get value(): number {
    return this.num;
  }

  /** Always false for numbers */
  isBool(): boolean {
    return false;
  }

  /** Convert to boolean (0 = false, else true) */
  asBool(): boolean {
    return this.num !== 0;
  }

  /** Convert to integer (truncate) */
  asInt(): number {
    return Math.trunc(this.num);
  }

  /** Get as float (identity) */
  asFloat(): number {
    return this.num;
  }

  /** Convert to string */
  asString(): string {
    return String(this.num);
  }

  /** Check if integer (no decimal part) */
  isInt(): boolean {
    return Number.isInteger(this.num);
  }

  toString(): string {
    return String(this.num);
  }
}
