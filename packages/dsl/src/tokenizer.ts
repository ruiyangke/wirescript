import type { Token, TokenType } from './schema/types.js';

export class TokenizerError extends Error {
  constructor(
    message: string,
    public line: number,
    public column: number
  ) {
    super(`${message} at line ${line}, column ${column}`);
    this.name = 'TokenizerError';
  }
}

/**
 * Position tracker for accurate span reporting
 */
interface Position {
  offset: number;
  line: number;
  column: number;
}

/**
 * WireScript Tokenizer
 *
 * Features:
 * - Token spans (start and end positions)
 * - O(n) string slicing instead of concatenation
 * - Full escape sequence support (\n, \t, \r, \\, \", \xNN, \uNNNN)
 * - Consistent token creation pattern
 * - Proper EOF handling in all contexts
 */
export class Tokenizer {
  private input: string;
  private pos: number = 0;
  private line: number = 1;
  private column: number = 1;

  constructor(input: string) {
    this.input = input;
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];

    while (this.pos < this.input.length) {
      this.skipWhitespace();
      if (this.pos >= this.input.length) break;

      const token = this.readToken();
      if (token) {
        tokens.push(token);
      }
    }

    tokens.push(this.makeEOFToken());
    return tokens;
  }

  private getPosition(): Position {
    return { offset: this.pos, line: this.line, column: this.column };
  }

  private makeToken(type: TokenType, value: string, start: Position): Token {
    return {
      type,
      value,
      line: start.line,
      column: start.column,
      endLine: this.line,
      endColumn: this.column,
    };
  }

  private makeEOFToken(): Token {
    return {
      type: 'EOF',
      value: '',
      line: this.line,
      column: this.column,
      endLine: this.line,
      endColumn: this.column,
    };
  }

  private readToken(): Token | null {
    const char = this.peek();

    // Comment - skip entirely
    if (char === ';') {
      this.skipComment();
      return null;
    }

    // Parentheses
    if (char === '(') {
      const start = this.getPosition();
      this.advance();
      return this.makeToken('LPAREN', '(', start);
    }
    if (char === ')') {
      const start = this.getPosition();
      this.advance();
      return this.makeToken('RPAREN', ')', start);
    }

    // String
    if (char === '"') {
      return this.readString();
    }

    // Parameter reference ($name)
    if (char === '$') {
      return this.readParamRef();
    }

    // Hash reference (#id) - overlay references
    if (char === '#') {
      return this.readHashRef();
    }

    // Keyword (:keyword)
    if (char === ':') {
      return this.readKeyword();
    }

    // Number (including negative)
    if (this.isDigit(char) || (char === '-' && this.isDigit(this.peekNext()))) {
      return this.readNumber();
    }

    // Symbol
    if (this.isSymbolStart(char)) {
      return this.readSymbol();
    }

    throw new TokenizerError(`Unexpected character: ${char}`, this.line, this.column);
  }

  private readString(): Token {
    const start = this.getPosition();
    this.advance(); // skip opening quote

    // Track string content with escape processing
    let value = '';

    while (this.pos < this.input.length && this.peek() !== '"') {
      if (this.peek() === '\\') {
        // Process escape sequence
        this.advance(); // skip backslash

        if (this.pos >= this.input.length) {
          throw new TokenizerError('Unterminated escape sequence', this.line, this.column);
        }

        const escaped = this.peek();
        this.advance();

        switch (escaped) {
          case 'n':
            value += '\n';
            break;
          case 't':
            value += '\t';
            break;
          case 'r':
            value += '\r';
            break;
          case '"':
            value += '"';
            break;
          case '\\':
            value += '\\';
            break;
          case 'x':
            // Hex escape: \xNN
            value += this.readHexEscape(2);
            break;
          case 'u':
            // Unicode escape: \uNNNN or \u{NNNNNN}
            if (this.peek() === '{') {
              value += this.readBracedUnicodeEscape();
            } else {
              value += this.readHexEscape(4);
            }
            break;
          default:
            // Unknown escape - keep the character as-is (common behavior)
            value += escaped;
        }
      } else {
        const char = this.peek();
        value += char;
        this.advanceWithNewlineTracking();
      }
    }

    if (this.pos >= this.input.length) {
      throw new TokenizerError('Unterminated string', start.line, start.column);
    }

    this.advance(); // skip closing quote
    return this.makeToken('STRING', value, start);
  }

  private readHexEscape(digits: number): string {
    const start = this.getPosition();
    let hex = '';

    for (let i = 0; i < digits; i++) {
      if (this.pos >= this.input.length) {
        throw new TokenizerError(
          `Expected ${digits} hex digits in escape sequence`,
          start.line,
          start.column
        );
      }
      const char = this.peek();
      if (!this.isHexDigit(char)) {
        throw new TokenizerError(
          `Invalid hex digit '${char}' in escape sequence`,
          this.line,
          this.column
        );
      }
      hex += char;
      this.advance();
    }

    const codePoint = Number.parseInt(hex, 16);
    return String.fromCharCode(codePoint);
  }

  private readBracedUnicodeEscape(): string {
    const start = this.getPosition();
    this.advance(); // skip {

    let hex = '';
    while (this.pos < this.input.length && this.peek() !== '}') {
      const char = this.peek();
      if (!this.isHexDigit(char)) {
        throw new TokenizerError(
          `Invalid hex digit '${char}' in unicode escape`,
          this.line,
          this.column
        );
      }
      hex += char;
      this.advance();
    }

    if (this.pos >= this.input.length) {
      throw new TokenizerError('Unterminated unicode escape sequence', start.line, start.column);
    }

    this.advance(); // skip }

    if (hex.length === 0 || hex.length > 6) {
      throw new TokenizerError('Unicode escape must have 1-6 hex digits', start.line, start.column);
    }

    const codePoint = Number.parseInt(hex, 16);
    if (codePoint > 0x10ffff) {
      throw new TokenizerError(`Unicode code point ${hex} out of range`, start.line, start.column);
    }

    return String.fromCodePoint(codePoint);
  }

  private readParamRef(): Token {
    const start = this.getPosition();
    this.advance(); // skip $

    const nameStart = this.pos;
    while (this.pos < this.input.length && this.isSymbolChar(this.peek())) {
      this.advance();
    }

    const name = this.input.slice(nameStart, this.pos);
    if (name.length === 0) {
      throw new TokenizerError('Expected parameter name after $', start.line, start.column);
    }

    return this.makeToken('PARAM_REF', name, start);
  }

  private readHashRef(): Token {
    const start = this.getPosition();
    this.advance(); // skip #

    const nameStart = this.pos;
    while (this.pos < this.input.length && this.isSymbolChar(this.peek())) {
      this.advance();
    }

    const name = this.input.slice(nameStart, this.pos);
    if (name.length === 0) {
      throw new TokenizerError('Expected identifier after #', start.line, start.column);
    }

    return this.makeToken('HASH_REF', name, start);
  }

  private readKeyword(): Token {
    const start = this.getPosition();
    this.advance(); // skip :

    const nameStart = this.pos;
    while (this.pos < this.input.length && this.isSymbolChar(this.peek())) {
      this.advance();
    }

    const name = this.input.slice(nameStart, this.pos);
    if (name.length === 0) {
      throw new TokenizerError('Expected keyword after :', start.line, start.column);
    }

    return this.makeToken('KEYWORD', name, start);
  }

  private readNumber(): Token {
    const start = this.getPosition();
    const numStart = this.pos;

    // Handle negative
    if (this.peek() === '-') {
      this.advance();
    }

    // Integer part
    while (this.pos < this.input.length && this.isDigit(this.peek())) {
      this.advance();
    }

    // Decimal part
    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      this.advance(); // .
      while (this.pos < this.input.length && this.isDigit(this.peek())) {
        this.advance();
      }
    }

    const value = this.input.slice(numStart, this.pos);
    return this.makeToken('NUMBER', value, start);
  }

  private readSymbol(): Token {
    const start = this.getPosition();
    const symStart = this.pos;

    while (this.pos < this.input.length && this.isSymbolChar(this.peek())) {
      this.advance();
    }

    const value = this.input.slice(symStart, this.pos);
    return this.makeToken('SYMBOL', value, start);
  }

  private skipWhitespace(): void {
    while (this.pos < this.input.length) {
      const char = this.peek();
      if (char === ' ' || char === '\t' || char === '\r') {
        this.advance();
      } else if (char === '\n') {
        this.advance();
        this.line++;
        this.column = 1;
      } else {
        break;
      }
    }
  }

  private skipComment(): void {
    while (this.pos < this.input.length && this.peek() !== '\n') {
      this.advance();
    }
  }

  private peek(): string {
    return this.input[this.pos] || '';
  }

  private peekNext(): string {
    return this.input[this.pos + 1] || '';
  }

  private advance(): void {
    this.pos++;
    this.column++;
  }

  private advanceWithNewlineTracking(): void {
    const char = this.input[this.pos];
    this.pos++;
    if (char === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  private isHexDigit(char: string): boolean {
    return (
      (char >= '0' && char <= '9') || (char >= 'a' && char <= 'f') || (char >= 'A' && char <= 'F')
    );
  }

  private isSymbolStart(char: string): boolean {
    return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char === '_';
  }

  private isSymbolChar(char: string): boolean {
    return this.isSymbolStart(char) || this.isDigit(char) || char === '-';
  }
}

export function tokenize(input: string): Token[] {
  return new Tokenizer(input).tokenize();
}
