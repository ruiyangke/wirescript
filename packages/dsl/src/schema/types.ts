/**
 * WireScript Schema v2 - Type Definitions
 *
 * Core types for AST nodes and values.
 */

// =============================================================================
// Reference Types
// =============================================================================

/** Parameter reference - resolved at component instantiation */
export interface ParamRef {
  type: 'param';
  name: string;
}

/** Screen reference - navigation to screen */
export interface ScreenRef {
  type: 'screen';
  id: string;
}

/** Overlay reference - open overlay by id */
export interface OverlayRef {
  type: 'overlay';
  id: string;
}

/** Navigation action */
export interface ActionRef {
  type: 'action';
  action: 'close' | 'back' | 'submit';
}

/** External URL */
export interface UrlRef {
  type: 'url';
  url: string;
}

/** Any reference type */
export type Ref = ParamRef | ScreenRef | OverlayRef | ActionRef | UrlRef;

/** Navigation target (for :to prop) */
export type NavigationTarget = ScreenRef | OverlayRef | ActionRef | UrlRef | ParamRef;

// =============================================================================
// Value Types
// =============================================================================

/** Literal value types */
export type Literal = boolean | string | number;

/** Any prop value - literal or reference */
export type PropValue = Literal | ParamRef | NavigationTarget;

/** Content value (element text content) */
export type ContentValue = string | ParamRef;

// =============================================================================
// Type Guards
// =============================================================================

export function isParamRef(value: PropValue): value is ParamRef {
  return typeof value === 'object' && value !== null && value.type === 'param';
}

export function isScreenRef(value: PropValue): value is ScreenRef {
  return typeof value === 'object' && value !== null && value.type === 'screen';
}

export function isOverlayRef(value: PropValue): value is OverlayRef {
  return typeof value === 'object' && value !== null && value.type === 'overlay';
}

export function isActionRef(value: PropValue): value is ActionRef {
  return typeof value === 'object' && value !== null && value.type === 'action';
}

export function isUrlRef(value: PropValue): value is UrlRef {
  return typeof value === 'object' && value !== null && value.type === 'url';
}

export function isRef(value: PropValue): value is Ref {
  return typeof value === 'object' && value !== null && 'type' in value;
}

export function isLiteral(value: PropValue): value is Literal {
  return typeof value === 'boolean' || typeof value === 'string' || typeof value === 'number';
}

// =============================================================================
// Prop Schema Type
// =============================================================================

/** Props schema - map of prop names to definitions */
export type PropsSchema = Record<string, { type: string; default?: unknown }>;

// =============================================================================
// Source Location
// =============================================================================

export interface SourceLocation {
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
}

// =============================================================================
// Token Types
// =============================================================================

export type TokenType =
  | 'LPAREN'
  | 'RPAREN'
  | 'STRING'
  | 'NUMBER'
  | 'SYMBOL'
  | 'KEYWORD'
  | 'PARAM_REF'
  | 'HASH_REF'
  | 'EOF';

export interface TokenSpan {
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
  offset: number;
  endOffset: number;
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
}

// =============================================================================
// Constants
// =============================================================================

export type Viewport = 'mobile' | 'tablet' | 'desktop';
export const VIEWPORTS: Viewport[] = ['mobile', 'tablet', 'desktop'];
export const VIEWPORTS_SET: ReadonlySet<string> = new Set(VIEWPORTS);

export type OverlayType = 'modal' | 'drawer' | 'popover';
export const OVERLAY_TYPES: OverlayType[] = ['modal', 'drawer', 'popover'];
export const OVERLAY_TYPES_SET: ReadonlySet<string> = new Set(OVERLAY_TYPES);

export type ActionKeyword = 'close' | 'back' | 'submit';
export const ACTION_KEYWORDS: ActionKeyword[] = ['close', 'back', 'submit'];
export const ACTION_KEYWORDS_SET: ReadonlySet<string> = new Set(ACTION_KEYWORDS);

/** Valid element types */
export const ELEMENT_TYPES = [
  // Containers
  'box',
  'card',
  'section',
  'header',
  'footer',
  'nav',
  'form',
  'list',
  'scroll',
  'group',
  // Content
  'text',
  'icon',
  'image',
  'avatar',
  'badge',
  'divider',
  // Interactive
  'button',
  'dropdown',
  // Inputs
  'input',
  'datepicker',
  // Data
  'metric',
  'progress',
  'chart',
  'skeleton',
  // Navigation
  'tabs',
  'tab',
  'breadcrumb',
  'crumb',
  // Utility
  'tooltip',
  'toast',
  'empty',
  'slot',
] as const;

export type ElementTypeName = (typeof ELEMENT_TYPES)[number];
export const ELEMENT_TYPES_SET: ReadonlySet<string> = new Set(ELEMENT_TYPES);

/** Valid flags/props that can be applied to elements */
export const VALID_FLAGS = [
  // Layout
  'row',
  'col',
  'grid',
  'wrap',
  // Alignment
  'start',
  'center',
  'end',
  'between',
  'around',
  'stretch',
  // Emphasis
  'high',
  'medium',
  'low',
  // Variant
  'primary',
  'secondary',
  'ghost',
  'danger',
  'success',
  'warning',
  'info',
  // State
  'disabled',
  'loading',
  'active',
  'checked',
  'open',
  'error',
  // Size
  'full',
  'fit',
  'fill',
  // Position
  'sticky',
  'fixed',
  'absolute',
  'relative',
  'top',
  'bottom',
  'left',
  'right',
  // Viewport
  'mobile',
  'tablet',
  'desktop',
  // Shape
  'circle',
  'text',
] as const;

export type ValidFlag = (typeof VALID_FLAGS)[number];
export const VALID_FLAGS_SET: ReadonlySet<string> = new Set(VALID_FLAGS);

// =============================================================================
// AST Nodes
// =============================================================================

/** Include statement */
export interface IncludeNode {
  type: 'include';
  path: string;
  loc?: SourceLocation;
}

/** Root document */
export interface WireDocument {
  type: 'wire';
  meta: MetaNode;
  includes: IncludeNode[];
  components: ComponentDef[];
  layouts: LayoutNode[];
  screens: ScreenNode[];
  loc?: SourceLocation;
}

/** Metadata */
export interface MetaNode {
  type: 'meta';
  props: Record<string, string>;
  loc?: SourceLocation;
}

/** Component definition */
export interface ComponentDef {
  type: 'define';
  name: string;
  params: string[];
  body: ElementNode;
  loc?: SourceLocation;
}

/** Layout definition */
export interface LayoutNode {
  type: 'layout';
  name: string;
  body: ElementNode;
  loc?: SourceLocation;
}

/** Screen */
export interface ScreenNode {
  type: 'screen';
  id: string;
  name?: string;
  viewport?: Viewport;
  layout?: string;
  root: ElementNode;
  overlays: OverlayNode[];
  loc?: SourceLocation;
}

/** Overlay */
export interface OverlayNode {
  type: 'overlay';
  overlayType: OverlayType;
  id: string;
  props: Record<string, PropValue>;
  children: ChildNode[];
  loc?: SourceLocation;
}

/** Element */
export interface ElementNode {
  type: 'element';
  elementType: string;
  content?: ContentValue;
  props: Record<string, PropValue>;
  children: ChildNode[];
  isComponent?: boolean;
  loc?: SourceLocation;
}

/** Repeat */
export interface RepeatNode {
  type: 'repeat';
  count: number | ParamRef;
  as?: string;
  body: ElementNode;
  loc?: SourceLocation;
}

/** Child node */
export type ChildNode = ElementNode | RepeatNode;

// =============================================================================
// Parse Result
// =============================================================================

export interface ParseError {
  message: string;
  line: number;
  column: number;
}

export interface ParseResult {
  success: boolean;
  document?: WireDocument;
  errors: ParseError[];
}
