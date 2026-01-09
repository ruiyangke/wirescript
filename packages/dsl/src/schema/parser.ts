/**
 * WireScript Schema v2 - Parser
 *
 * Schema-driven parser that produces the v2 AST.
 *
 * Features:
 * - Accurate source locations using token spans
 * - Prop type validation against schema
 * - Error recovery (continue parsing after errors)
 * - Single-pass component resolution with forward reference support
 * - Comprehensive URL/protocol detection
 */

import { TokenizerError, tokenize } from '../tokenizer.js';
import { getSchema } from './registry.js';
import {
  ACTION_KEYWORDS_SET,
  type ActionRef,
  type ChildNode,
  type ComponentDef,
  type ContentValue,
  type ElementNode,
  type IncludeNode,
  type LayoutNode,
  type MetaNode,
  type NavigationTarget,
  OVERLAY_TYPES_SET,
  type OverlayNode,
  type OverlayType,
  type ParamRef,
  type ParseError,
  type ParseResult,
  type PropsSchema,
  type PropValue,
  type RepeatNode,
  type ScreenNode,
  type SourceLocation,
  type Token,
  type UrlRef,
  VIEWPORTS_SET,
  type Viewport,
  type WireDocument,
} from './types.js';
import { NumberValue, StringValue, SymbolValue } from './value.js';

// =============================================================================
// Constants
// =============================================================================

/** URL protocols that should be detected as UrlRef */
const URL_PROTOCOLS = [
  'http://',
  'https://',
  'ftp://',
  'ftps://',
  'mailto:',
  'tel:',
  'file://',
  'data:',
  '//', // Protocol-relative
] as const;

// =============================================================================
// Parser Error
// =============================================================================

export class ParserError extends Error {
  constructor(
    message: string,
    public line: number,
    public column: number
  ) {
    super(`${message} at line ${line}, column ${column}`);
    this.name = 'ParserError';
  }
}

// =============================================================================
// Parser
// =============================================================================

export class SchemaParser {
  private tokens: Token[];
  private pos: number = 0;
  private componentNames: Set<string> = new Set();
  private errors: ParseError[] = [];
  private lastToken: Token;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
    // Store last non-EOF token for error reporting
    this.lastToken = tokens.length > 1 ? tokens[tokens.length - 2] : tokens[0];
  }

  parse(): ParseResult {
    try {
      // First pass: collect component names for forward references
      this.collectComponentNames();
      this.pos = 0;

      const document = this.parseDocument();
      return {
        success: this.errors.length === 0,
        document,
        errors: this.errors,
      };
    } catch (error) {
      if (error instanceof ParserError) {
        this.errors.push({
          message: error.message,
          line: error.line,
          column: error.column,
        });
      } else if (error instanceof Error) {
        const token = this.current();
        this.errors.push({
          message: error.message,
          line: token.line,
          column: token.column,
        });
      }
      return {
        success: false,
        errors: this.errors,
      };
    }
  }

  // ===========================================================================
  // Component Name Collection
  // ===========================================================================

  /**
   * Collect component names in a single pass for forward reference support.
   * Uses balanced parenthesis tracking with overflow protection.
   */
  private collectComponentNames(): void {
    let depth = 0;
    let inWire = false;

    for (let i = 0; i < this.tokens.length; i++) {
      const token = this.tokens[i];

      if (token.type === 'LPAREN') {
        depth++;
        // Sanity check - prevent runaway depth on malformed input
        if (depth > 1000) {
          this.addError('Maximum nesting depth exceeded', token);
          return;
        }

        const next = this.tokens[i + 1];
        if (depth === 1 && next?.type === 'SYMBOL' && next.value === 'wire') {
          inWire = true;
        }
        if (inWire && depth === 2 && next?.type === 'SYMBOL' && next.value === 'define') {
          const nameToken = this.tokens[i + 2];
          if (nameToken?.type === 'SYMBOL') {
            this.componentNames.add(nameToken.value);
          }
        }
      } else if (token.type === 'RPAREN') {
        if (depth === 1) inWire = false;
        depth = Math.max(0, depth - 1); // Prevent negative depth
      }
    }
  }

  // ===========================================================================
  // Document Parsing
  // ===========================================================================

  private parseDocument(): WireDocument {
    const startToken = this.expect('LPAREN');
    this.expectSymbol('wire');

    let meta: MetaNode = { type: 'meta', props: {} };
    const includes: IncludeNode[] = [];
    const components: ComponentDef[] = [];
    const layouts: LayoutNode[] = [];
    const screens: ScreenNode[] = [];

    while (!this.check('RPAREN') && !this.check('EOF')) {
      try {
        const formStart = this.expect('LPAREN');
        const formType = this.expectSymbol();

        switch (formType) {
          case 'include':
            includes.push(this.parseInclude(formStart));
            break;
          case 'meta':
            meta = this.parseMeta(formStart);
            break;
          case 'define':
            components.push(this.parseDefine(formStart));
            break;
          case 'layout':
            layouts.push(this.parseLayout(formStart));
            break;
          case 'screen':
            screens.push(this.parseScreen(formStart));
            break;
          default:
            this.addError(`Unknown form type: ${formType}`, formStart);
            this.skipToMatchingParen();
        }
      } catch (error) {
        // Error recovery: skip to next top-level form
        if (error instanceof ParserError) {
          this.errors.push({
            message: error.message,
            line: error.line,
            column: error.column,
          });
        }
        this.skipToMatchingParen();
        this.recoverToNextForm();
      }
    }

    const endToken = this.expect('RPAREN');

    // Note: "Document must have at least one screen" check moved to compile()
    // to allow library files with only define/layout declarations

    return {
      type: 'wire',
      meta,
      includes,
      components,
      layouts,
      screens,
      loc: this.makeLoc(startToken, endToken),
    };
  }

  private parseInclude(startToken: Token): IncludeNode {
    if (!this.check('STRING')) {
      throw this.error('Include expects a string path');
    }
    const path = this.advance().value;
    const endToken = this.expect('RPAREN');
    return { type: 'include', path, loc: this.makeLoc(startToken, endToken) };
  }

  private parseMeta(startToken: Token): MetaNode {
    const props: Record<string, string> = {};

    while (this.check('KEYWORD')) {
      const key = this.advance().value;
      if (this.hasValue()) {
        const value = this.parseValue();
        props[key] = String(value);
      }
    }

    const endToken = this.expect('RPAREN');
    return { type: 'meta', props, loc: this.makeLoc(startToken, endToken) };
  }

  private parseDefine(startToken: Token): ComponentDef {
    const name = this.expectSymbol();

    // Parse parameter list
    this.expect('LPAREN');
    const params: string[] = [];
    while (!this.check('RPAREN') && !this.check('EOF')) {
      params.push(this.expectSymbol());
    }
    this.expect('RPAREN');

    // Parse body element
    const body = this.parseElement();

    const endToken = this.expect('RPAREN');
    return { type: 'define', name, params, body, loc: this.makeLoc(startToken, endToken) };
  }

  private parseLayout(startToken: Token): LayoutNode {
    const name = this.expectSymbol();
    const body = this.parseElement();
    const endToken = this.expect('RPAREN');
    return { type: 'layout', name, body, loc: this.makeLoc(startToken, endToken) };
  }

  private parseScreen(startToken: Token): ScreenNode {
    const id = this.expectSymbol();
    let name: string | undefined;
    let viewport: Viewport | undefined;
    let layout: string | undefined;
    const overlays: OverlayNode[] = [];

    // Optional name (string)
    if (this.check('STRING')) {
      name = this.advance().value;
    }

    // Optional viewport flag
    if (this.check('KEYWORD') && VIEWPORTS_SET.has(this.current().value)) {
      viewport = this.advance().value as Viewport;
    }

    // Optional :layout reference
    if (this.check('KEYWORD') && this.current().value === 'layout') {
      this.advance();
      layout = this.expectSymbol();
    }

    // Parse root element
    const root = this.parseElement();

    // Parse overlays at screen level (use lookahead without backtracking)
    while (this.isOverlayAhead()) {
      this.advance(); // LPAREN
      const overlayType = this.advance().value as OverlayType;
      overlays.push(this.parseOverlay(overlayType, this.tokens[this.pos - 2]));
    }

    const endToken = this.expect('RPAREN');
    return {
      type: 'screen',
      id,
      name,
      viewport,
      layout,
      root,
      overlays,
      loc: this.makeLoc(startToken, endToken),
    };
  }

  /**
   * Check if an overlay form is ahead without advancing position.
   */
  private isOverlayAhead(): boolean {
    if (!this.check('LPAREN')) return false;
    const next = this.tokens[this.pos + 1];
    return next?.type === 'SYMBOL' && OVERLAY_TYPES_SET.has(next.value);
  }

  private parseOverlay(overlayType: OverlayType, startToken: Token): OverlayNode {
    const props: Record<string, PropValue> = {};
    let id = '';

    // Parse props
    while (this.check('KEYWORD')) {
      const keyToken = this.current();
      const key = this.advance().value;

      if (key === 'id') {
        const value = this.parseValue();
        if (typeof value === 'string') {
          id = value;
        } else {
          this.addError('Overlay :id must be a string', keyToken);
        }
      } else if (this.hasValue()) {
        props[key] = this.parseValue();
      } else {
        props[key] = true;
      }
    }

    const children = this.parseChildren();
    const endToken = this.expect('RPAREN');

    if (!id) {
      this.addError(`${overlayType} must have an :id property`, startToken);
      id = `${overlayType}-${Date.now()}`; // Generate fallback ID
    }

    return {
      type: 'overlay',
      overlayType,
      id,
      props,
      children,
      loc: this.makeLoc(startToken, endToken),
    };
  }

  // ===========================================================================
  // Element Parsing
  // ===========================================================================

  private parseElement(): ElementNode {
    const startToken = this.expect('LPAREN');
    const elementType = this.expectSymbol();

    // Handle repeat specially - no longer wrap in phantom box
    if (elementType === 'repeat') {
      const repeat = this.parseRepeat(startToken);
      // Return a special repeat-container element
      return {
        type: 'element',
        elementType: 'repeat-container',
        props: {},
        children: [repeat],
        loc: repeat.loc,
      };
    }

    const schema = getSchema(elementType);

    if (schema) {
      return this.parseBuiltinElement(elementType, schema, startToken);
    } else if (this.componentNames.has(elementType)) {
      return this.parseComponentCall(elementType, startToken);
    } else {
      // Unknown element - treat as component call but warn
      // (Could be a forward reference or typo)
      return this.parseComponentCall(elementType, startToken);
    }
  }

  private parseBuiltinElement(
    elementType: string,
    schema: { content?: boolean; children?: boolean; props: PropsSchema },
    startToken: Token
  ): ElementNode {
    // 1. Optional content
    const content = schema.content ? this.parseContent() : undefined;

    // 2. Props with type validation
    const props = this.parseProps(schema.props, true);

    // 3. Children
    const children = schema.children ? this.parseChildren() : [];

    // If element doesn't support children but has them, report error
    if (!schema.children && this.check('LPAREN')) {
      const token = this.current();
      this.addError(`Element '${elementType}' does not support children`, token);
      // Parse and discard children for error recovery
      while (this.check('LPAREN')) {
        this.parseChild();
      }
    }

    const endToken = this.expect('RPAREN');

    return {
      type: 'element',
      elementType,
      content,
      props,
      children,
      loc: this.makeLoc(startToken, endToken),
    };
  }

  private parseComponentCall(componentName: string, startToken: Token): ElementNode {
    // Optional content (string or param ref)
    const content = this.parseContent();

    const props: Record<string, PropValue> = {};

    // Parse all :key value pairs
    while (this.check('KEYWORD')) {
      const key = this.advance().value;
      if (this.hasValue()) {
        props[key] = this.parseValue();
      } else {
        props[key] = true;
      }
    }

    // Parse children
    const children = this.parseChildren();

    const endToken = this.expect('RPAREN');

    return {
      type: 'element',
      elementType: componentName,
      content,
      props,
      children,
      isComponent: true,
      loc: this.makeLoc(startToken, endToken),
    };
  }

  private parseRepeat(startToken: Token): RepeatNode {
    let count: number | ParamRef = 1;
    let as: string | undefined;

    while (this.check('KEYWORD')) {
      const key = this.current().value;

      if (key === 'count') {
        this.advance();
        const value = this.parseValue();
        if (typeof value === 'number') {
          count = value;
        } else if (typeof value === 'object' && 'type' in value && value.type === 'param') {
          count = value as ParamRef;
        } else {
          this.addError(':count must be a number or parameter reference', this.current());
        }
      } else if (key === 'as') {
        this.advance();
        const value = this.parseValue();
        if (typeof value === 'string') {
          as = value;
        } else {
          this.addError(':as must be a string', this.current());
        }
      } else {
        break;
      }
    }

    const body = this.parseElement();
    const endToken = this.expect('RPAREN');

    return { type: 'repeat', count, as, body, loc: this.makeLoc(startToken, endToken) };
  }

  private parseChild(): ChildNode {
    const savedPos = this.pos;
    this.expect('LPAREN');
    const sym = this.current();

    if (sym.type === 'SYMBOL' && sym.value === 'repeat') {
      this.advance();
      return this.parseRepeat(this.tokens[savedPos]);
    }

    this.pos = savedPos;
    return this.parseElement();
  }

  private parseChildren(): ChildNode[] {
    const children: ChildNode[] = [];
    while (this.check('LPAREN') && !this.isOverlayAhead()) {
      try {
        children.push(this.parseChild());
      } catch (error) {
        // Error recovery for child elements
        if (error instanceof ParserError) {
          this.errors.push({
            message: error.message,
            line: error.line,
            column: error.column,
          });
        }
        this.skipToMatchingParen();
      }
    }
    return children;
  }

  // ===========================================================================
  // Value Parsing
  // ===========================================================================

  private parseContent(): ContentValue | undefined {
    if (this.check('STRING')) {
      return this.advance().value;
    }
    if (this.check('PARAM_REF')) {
      return { type: 'param', name: this.advance().value };
    }
    return undefined;
  }

  private parseValue(): PropValue {
    // Param ref
    if (this.check('PARAM_REF')) {
      return { type: 'param', name: this.advance().value };
    }

    // Hash ref (overlay)
    if (this.check('HASH_REF')) {
      return { type: 'overlay', id: this.advance().value };
    }

    // String - use StringValue wrapper
    if (this.check('STRING')) {
      const str = new StringValue(this.advance().value);
      // Check if URL
      if (this.isUrl(str.value)) {
        return { type: 'url', url: str.value } as UrlRef;
      }
      return str.asString();
    }

    // Number - use NumberValue wrapper
    if (this.check('NUMBER')) {
      const num = new NumberValue(this.advance().value);
      return num.isInt() ? num.asInt() : num.asFloat();
    }

    // Symbol - use SymbolValue wrapper for clean bool detection
    if (this.check('SYMBOL')) {
      const sym = new SymbolValue(this.advance().value);
      // Check for boolean literals (true/false/t/nil)
      const bool = sym.tryBool();
      if (bool !== undefined) return bool;
      return sym.asString();
    }

    // Keyword as value (for actions like :close)
    if (this.check('KEYWORD')) {
      const sym = new SymbolValue(this.advance().value);
      if (ACTION_KEYWORDS_SET.has(sym.value)) {
        return { type: 'action', action: sym.value as ActionRef['action'] };
      }
      return sym.asString();
    }

    throw this.error('Expected value');
  }

  private parseNavigationTarget(): NavigationTarget | string {
    // Hash ref - overlay
    if (this.check('HASH_REF')) {
      return { type: 'overlay', id: this.advance().value };
    }

    // Param ref
    if (this.check('PARAM_REF')) {
      return { type: 'param', name: this.advance().value };
    }

    // Keyword - action (only recognized actions are action refs)
    if (this.check('KEYWORD')) {
      const action = this.advance().value;
      if (ACTION_KEYWORDS_SET.has(action)) {
        return { type: 'action', action: action as ActionRef['action'] };
      }
      // Unknown keywords become plain string values (forward-compatible)
      return action;
    }

    // String - URL, overlay (if starts with #), or screen
    if (this.check('STRING')) {
      const value = this.advance().value;
      if (this.isUrl(value)) {
        return { type: 'url', url: value };
      }
      // Handle quoted overlay refs like "#modal-id"
      if (value.startsWith('#')) {
        return { type: 'overlay', id: value.slice(1) };
      }
      return { type: 'screen', id: value };
    }

    // Symbol - screen
    if (this.check('SYMBOL')) {
      return { type: 'screen', id: this.advance().value };
    }

    throw this.error('Expected navigation target (screen, overlay, action, or URL)');
  }

  /**
   * Parse props with optional type validation against schema.
   */
  private parseProps(schema: PropsSchema, validate: boolean): Record<string, PropValue> {
    const props: Record<string, PropValue> = {};

    while (this.check('KEYWORD')) {
      const keyToken = this.current();
      const key = keyToken.value;
      this.advance();

      const def = schema[key];

      if (def) {
        // Known prop - use schema type
        if (def.type === 'navigation') {
          props[key] = this.parseNavigationTarget();
        } else if (this.hasValue()) {
          const value = this.parseValue();
          // Dynamic type coercion based on schema
          props[key] = validate ? this.coercePropValue(value, def.type) : value;
        } else if (def.default !== undefined) {
          props[key] = def.default as PropValue;
        } else {
          // Boolean prop without value - default to true
          props[key] = true;
        }
      } else {
        // Unknown prop - parse generically (forward-compatible)
        if (this.hasValue()) {
          props[key] = this.parseValue();
        } else {
          props[key] = true;
        }
      }
    }

    return props;
  }

  /**
   * Coerce a prop value to match its expected schema type.
   * Supports dynamic coercion: "16" → 16 if schema expects number.
   */
  private coercePropValue(value: PropValue, expectedType: string): PropValue {
    // Skip coercion for 'any' type
    if (expectedType === 'any') return value;

    // Allow param refs for any type (runtime resolved)
    if (typeof value === 'object' && value !== null && 'type' in value && value.type === 'param') {
      return value;
    }

    // Already correct type
    const actualType = typeof value;

    switch (expectedType) {
      case 'boolean':
        if (actualType === 'boolean') return value;
        // Coerce string to boolean
        if (actualType === 'string') {
          const str = new StringValue(value as string);
          const bool = str.tryBool();
          if (bool !== undefined) return bool;
          // Also handle "1"/"0" as true/false
          if (value === '1') return true;
          if (value === '0') return false;
        }
        // Coerce number to boolean (0 = false, else true)
        if (actualType === 'number') {
          return (value as number) !== 0;
        }
        return value; // Can't coerce, return as-is

      case 'number':
        if (actualType === 'number') return value;
        // Coerce string to number
        if (actualType === 'string') {
          const str = new StringValue(value as string);
          const num = str.tryFloat();
          if (num !== undefined) return num;
        }
        // Coerce boolean to number
        if (actualType === 'boolean') {
          return value ? 1 : 0;
        }
        return value; // Can't coerce, return as-is

      case 'string':
      case 'symbol':
        if (actualType === 'string') return value;
        // Coerce number/boolean to string
        if (actualType === 'number' || actualType === 'boolean') {
          return String(value);
        }
        return value; // Can't coerce, return as-is

      default:
        return value;
    }
  }

  /**
   * Check if a string value looks like a URL.
   */
  private isUrl(value: string): boolean {
    const lower = value.toLowerCase();
    return URL_PROTOCOLS.some((proto) => lower.startsWith(proto));
  }

  private hasValue(): boolean {
    const t = this.current().type;
    return (
      t === 'STRING' || t === 'NUMBER' || t === 'SYMBOL' || t === 'PARAM_REF' || t === 'HASH_REF'
    );
  }

  // ===========================================================================
  // Error Recovery
  // ===========================================================================

  /**
   * Skip tokens until we find a matching closing paren.
   */
  private skipToMatchingParen(): void {
    let depth = 1;
    while (depth > 0 && !this.check('EOF')) {
      if (this.check('LPAREN')) depth++;
      else if (this.check('RPAREN')) depth--;
      this.advance();
    }
  }

  /**
   * Recover to the next top-level form after an error.
   */
  private recoverToNextForm(): void {
    // Skip until we find LPAREN at depth 1
    while (!this.check('EOF') && !this.check('RPAREN')) {
      if (this.check('LPAREN')) {
        // Check if this looks like a valid top-level form
        const next = this.tokens[this.pos + 1];
        if (
          next?.type === 'SYMBOL' &&
          ['include', 'meta', 'define', 'layout', 'screen'].includes(next.value)
        ) {
          return; // Found recovery point
        }
      }
      this.advance();
    }
  }

  /**
   * Add an error without throwing (for non-fatal issues).
   */
  private addError(message: string, token: Token): void {
    this.errors.push({
      message: `${message} at line ${token.line}, column ${token.column}`,
      line: token.line,
      column: token.column,
    });
  }

  // ===========================================================================
  // Token Helpers
  // ===========================================================================

  private current(): Token {
    if (this.pos >= this.tokens.length) {
      // Return last token position for EOF errors
      return {
        type: 'EOF',
        value: '',
        line: this.lastToken.endLine,
        column: this.lastToken.endColumn,
        endLine: this.lastToken.endLine,
        endColumn: this.lastToken.endColumn,
      };
    }
    return this.tokens[this.pos];
  }

  private check(type: string): boolean {
    return this.current().type === type;
  }

  private advance(): Token {
    const token = this.current();
    if (this.pos < this.tokens.length) {
      this.pos++;
    }
    return token;
  }

  private expect(type: string): Token {
    if (!this.check(type)) {
      const curr = this.current();
      throw this.error(`Expected ${type}, got ${curr.type}${curr.value ? ` '${curr.value}'` : ''}`);
    }
    return this.advance();
  }

  private expectSymbol(value?: string): string {
    const token = this.expect('SYMBOL');
    if (value !== undefined && token.value !== value) {
      throw this.error(`Expected '${value}', got '${token.value}'`);
    }
    return token.value;
  }

  /**
   * Create source location from start and end tokens.
   * Uses token endLine/endColumn for accurate spans.
   */
  private makeLoc(startToken: Token, endToken?: Token): SourceLocation {
    return {
      line: startToken.line,
      column: startToken.column,
      endLine: endToken?.endLine ?? startToken.endLine,
      endColumn: endToken?.endColumn ?? startToken.endColumn,
    };
  }

  private error(message: string): ParserError {
    const token = this.current();
    return new ParserError(message, token.line, token.column);
  }
}

// =============================================================================
// Parse Function
// =============================================================================

export function parse(input: string): ParseResult {
  try {
    const tokens = tokenize(input);
    const parser = new SchemaParser(tokens);
    return parser.parse();
  } catch (error) {
    if (error instanceof TokenizerError) {
      return {
        success: false,
        errors: [
          {
            message: error.message,
            line: error.line,
            column: error.column,
          },
        ],
      };
    }
    throw error;
  }
}
