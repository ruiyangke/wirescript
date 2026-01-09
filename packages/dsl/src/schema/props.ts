/**
 * WireScript Schema v2 - Prop Definitions
 *
 * Schema-first approach with type inference (like Zod/TypeBox).
 */

// =============================================================================
// Prop Definition Helpers
// =============================================================================

/** Boolean prop - defaults to true when present without value */
export function bool<D extends boolean | undefined = true>(def?: D) {
  return { type: 'boolean' as const, default: (def ?? true) as D extends undefined ? true : D };
}

/** Number prop */
export function num<D extends number | undefined = undefined>(def?: D) {
  return { type: 'number' as const, default: def };
}

/** String prop */
export function str<D extends string | undefined = undefined>(def?: D) {
  return { type: 'string' as const, default: def };
}

/** Symbol prop (unquoted identifier) */
export function sym<D extends string | undefined = undefined>(def?: D) {
  return { type: 'symbol' as const, default: def };
}

/** Any value type */
export function any() {
  return { type: 'any' as const };
}

/** Navigation target */
export function nav() {
  return { type: 'navigation' as const };
}

// =============================================================================
// Prop Type
// =============================================================================

export type PropDef = ReturnType<
  typeof bool | typeof num | typeof str | typeof sym | typeof any | typeof nav
>;

// =============================================================================
// Prop Groups
// =============================================================================

/** Layout direction props */
export const layoutProps = {
  row: bool(),
  col: bool(),
  grid: bool(),
  wrap: bool(),
} as const;

/** Alignment props */
export const alignProps = {
  center: bool(),
  start: bool(),
  end: bool(),
  between: bool(),
  around: bool(),
  stretch: bool(),
} as const;

/** Size props */
export const sizeProps = {
  full: bool(),
  fit: bool(),
  fill: bool(),
} as const;

/** Spacing props */
export const spacingProps = {
  gap: num(0),
  padding: num(0),
} as const;

/** Dimension props */
export const dimensionProps = {
  width: any(),
  height: any(),
} as const;

/** Position props */
export const positionProps = {
  sticky: bool(),
  fixed: bool(),
  absolute: bool(),
  relative: bool(),
  top: num(),
  left: num(),
  right: num(),
  bottom: num(),
} as const;

/** Variant props */
export const variantProps = {
  primary: bool(),
  secondary: bool(),
  ghost: bool(),
  danger: bool(),
  success: bool(),
  warning: bool(),
  info: bool(),
} as const;

/** State props */
export const stateProps = {
  disabled: bool(),
  loading: bool(),
  active: bool(),
  checked: bool(),
  open: bool(),
  error: bool(),
} as const;

/** Emphasis props */
export const emphasisProps = {
  high: bool(),
  medium: bool(),
  low: bool(),
} as const;

/** Navigation props */
export const navigationProps = {
  to: nav(),
} as const;

// =============================================================================
// Composed Prop Groups
// =============================================================================

/** Container props (layout + align + size + spacing + dimension + position) */
export const containerProps = {
  ...layoutProps,
  ...alignProps,
  ...sizeProps,
  ...spacingProps,
  ...dimensionProps,
  ...positionProps,
} as const;

/** Content props (emphasis + size + dimension + navigation) */
export const contentProps = {
  ...emphasisProps,
  ...sizeProps,
  ...dimensionProps,
  ...navigationProps,
} as const;

/** Interactive props (variant + size + dimension + navigation + states) */
export const interactiveProps = {
  ...variantProps,
  ...sizeProps,
  ...dimensionProps,
  ...navigationProps,
  disabled: bool(),
  loading: bool(),
  active: bool(),
} as const;
