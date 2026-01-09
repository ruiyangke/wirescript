/**
 * WireScript Schema v2 - Element Definitions
 *
 * Schema-first approach with type inference (like Zod/TypeBox).
 */

import {
  any,
  bool,
  containerProps,
  contentProps,
  dimensionProps,
  emphasisProps,
  interactiveProps,
  navigationProps,
  num,
  positionProps,
  sizeProps,
  spacingProps,
  str,
  sym,
  variantProps,
} from './props.js';

// =============================================================================
// Element Schema Helper
// =============================================================================

export type ElementSchemaConfig = {
  type: string;
  content?: boolean;
  children?: boolean;
  props: Record<string, { type: string; default?: unknown }>;
};

/**
 * Define an element schema with full type inference.
 * Similar to Zod's z.object() pattern.
 */
function defineElement<
  T extends string,
  P extends Record<string, { type: string; default?: unknown }>,
  Content extends boolean = false,
  Children extends boolean = false,
>(config: { type: T; content?: Content; children?: Children; props: P }) {
  return config;
}

// =============================================================================
// Container Elements
// =============================================================================

export const box = defineElement({
  type: 'box',
  children: true,
  props: {
    ...containerProps,
    ...variantProps,
    ...navigationProps,
    cols: num(),
    rows: num(),
  },
});

export const card = defineElement({
  type: 'card',
  children: true,
  props: {
    ...containerProps,
    ...variantProps,
    ...navigationProps,
  },
});

export const section = defineElement({
  type: 'section',
  content: true,
  children: true,
  props: {
    ...containerProps,
    title: str(),
  },
});

export const header = defineElement({
  type: 'header',
  children: true,
  props: {
    ...containerProps,
  },
});

export const footer = defineElement({
  type: 'footer',
  children: true,
  props: {
    ...containerProps,
  },
});

export const navElement = defineElement({
  type: 'nav',
  children: true,
  props: {
    ...containerProps,
  },
});

export const form = defineElement({
  type: 'form',
  children: true,
  props: {
    ...containerProps,
    ...navigationProps,
  },
});

export const list = defineElement({
  type: 'list',
  children: true,
  props: {
    ...containerProps,
  },
});

export const scroll = defineElement({
  type: 'scroll',
  children: true,
  props: {
    ...containerProps,
  },
});

export const group = defineElement({
  type: 'group',
  children: true,
  props: {
    ...containerProps,
  },
});

// =============================================================================
// Content Elements
// =============================================================================

export const text = defineElement({
  type: 'text',
  content: true,
  props: {
    ...contentProps,
    ...variantProps,
    start: bool(),
    center: bool(),
    end: bool(),
  },
});

export const icon = defineElement({
  type: 'icon',
  content: true,
  props: {
    ...contentProps,
    ...variantProps,
    name: sym(),
    size: num(),
  },
});

export const image = defineElement({
  type: 'image',
  content: true,
  props: {
    ...sizeProps,
    ...dimensionProps,
    ...navigationProps,
    src: str(),
    alt: str(),
  },
});

export const avatar = defineElement({
  type: 'avatar',
  content: true,
  props: {
    ...sizeProps,
    ...emphasisProps,
    ...dimensionProps,
    ...navigationProps,
    src: str(),
    name: str(),
    size: num(),
    active: bool(),
  },
});

export const badge = defineElement({
  type: 'badge',
  content: true,
  props: {
    ...variantProps,
    ...sizeProps,
    ...positionProps,
    ...dimensionProps,
    value: any(),
  },
});

export const divider = defineElement({
  type: 'divider',
  props: {
    ...dimensionProps,
    row: bool(),
    col: bool(),
  },
});

// =============================================================================
// Interactive Elements
// =============================================================================

export const button = defineElement({
  type: 'button',
  content: true,
  children: true,
  props: {
    ...interactiveProps,
    icon: any(),
    start: bool(),
    center: bool(),
    end: bool(),
  },
});

export const dropdown = defineElement({
  type: 'dropdown',
  content: true, // trigger label
  children: true, // menu items
  props: {
    ...spacingProps,
    ...dimensionProps,
    ...variantProps,
    disabled: bool(),
    open: bool(),
  },
});

// =============================================================================
// Input Elements
// =============================================================================

export const input = defineElement({
  type: 'input',
  content: true,
  props: {
    ...sizeProps,
    ...dimensionProps,
    type: sym('text'),
    placeholder: str(),
    value: any(),
    options: str(),
    disabled: bool(),
    error: bool(),
    checked: bool(),
    min: num(),
    max: num(),
    step: num(),
    rows: num(),
  },
});

export const datepicker = defineElement({
  type: 'datepicker',
  content: true,
  props: {
    ...sizeProps,
    ...dimensionProps,
    value: str(),
    placeholder: str(),
    disabled: bool(),
    error: bool(),
  },
});

// =============================================================================
// Data Display Elements
// =============================================================================

export const metric = defineElement({
  type: 'metric',
  content: true,
  children: true,
  props: {
    ...sizeProps,
    ...variantProps,
    ...dimensionProps,
    value: any(),
    label: str(),
    change: any(),
    trend: sym(),
  },
});

export const progress = defineElement({
  type: 'progress',
  content: true,
  props: {
    ...sizeProps,
    ...variantProps,
    ...dimensionProps,
    value: any(),
    max: any(),
  },
});

export const chart = defineElement({
  type: 'chart',
  content: true,
  children: true,
  props: {
    ...sizeProps,
    ...spacingProps,
    ...dimensionProps,
    type: sym(),
  },
});

export const skeleton = defineElement({
  type: 'skeleton',
  children: true,
  props: {
    ...containerProps,
    circle: bool(),
    text: bool(),
  },
});

// =============================================================================
// Navigation Elements
// =============================================================================

export const tabs = defineElement({
  type: 'tabs',
  children: true,
  props: {
    ...containerProps,
  },
});

export const tab = defineElement({
  type: 'tab',
  content: true,
  children: true,
  props: {
    ...sizeProps,
    ...dimensionProps,
    ...navigationProps,
    active: bool(),
    disabled: bool(),
  },
});

export const breadcrumb = defineElement({
  type: 'breadcrumb',
  children: true,
  props: {
    ...containerProps,
  },
});

export const crumb = defineElement({
  type: 'crumb',
  content: true,
  props: {
    ...sizeProps,
    ...navigationProps,
    active: bool(),
  },
});

// =============================================================================
// Utility Elements
// =============================================================================

export const tooltip = defineElement({
  type: 'tooltip',
  content: true,
  children: true,
  props: {
    ...dimensionProps,
  },
});

export const toast = defineElement({
  type: 'toast',
  content: true,
  children: true,
  props: {
    ...variantProps,
    ...dimensionProps,
  },
});

export const empty = defineElement({
  type: 'empty',
  content: true,
  children: true,
  props: {
    ...dimensionProps,
  },
});

export const slot = defineElement({
  type: 'slot',
  props: {},
});
