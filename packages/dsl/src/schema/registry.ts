/**
 * WireScript Schema v2 - Registry
 *
 * Central registry of all element schemas with type inference.
 */

import {
  avatar,
  badge,
  box,
  breadcrumb,
  button,
  card,
  chart,
  crumb,
  datepicker,
  divider,
  dropdown,
  empty,
  footer,
  form,
  group,
  header,
  icon,
  image,
  input,
  list,
  metric,
  navElement,
  progress,
  scroll,
  section,
  skeleton,
  slot,
  tab,
  tabs,
  text,
  toast,
  tooltip,
  type ElementSchemaConfig,
} from './elements.js';
import { bool, num } from './props.js';

// =============================================================================
// Schema Registry
// =============================================================================

export const ELEMENTS = {
  // Containers (10)
  box,
  card,
  section,
  header,
  footer,
  nav: navElement,
  form,
  list,
  scroll,
  group,

  // Content (6)
  text,
  icon,
  image,
  avatar,
  badge,
  divider,

  // Interactive (2)
  button,
  dropdown,

  // Inputs (2)
  input,
  datepicker,

  // Data (4)
  metric,
  progress,
  chart,
  skeleton,

  // Navigation (4)
  tabs,
  tab,
  breadcrumb,
  crumb,

  // Utility (4)
  tooltip,
  toast,
  empty,
  slot,
} as const;

// =============================================================================
// Type Helpers
// =============================================================================

/** All element type names */
export type ElementType = keyof typeof ELEMENTS;

/** Get props type for an element */
export type ElementProps<T extends ElementType> = (typeof ELEMENTS)[T]['props'];

/** Array of all registered element type names */
export const ELEMENT_TYPE_LIST = Object.keys(ELEMENTS) as ElementType[];

// =============================================================================
// Runtime Lookup
// =============================================================================

/**
 * Get schema for an element type.
 * Returns undefined if type is not a built-in element.
 */
export function getSchema(type: string): ElementSchemaConfig | undefined {
  const schema = ELEMENTS[type as ElementType];
  if (!schema) return undefined;

  return {
    type: schema.type,
    content: schema.content,
    children: schema.children,
    props: schema.props,
  };
}

/**
 * Check if a type is a built-in element.
 */
export function isBuiltinElement(type: string): type is ElementType {
  return type in ELEMENTS;
}

// =============================================================================
// Overlay Schema
// =============================================================================

/** Overlay props schema */
export const OVERLAY_PROPS = {
  id: { type: 'string' as const },
  gap: num(0),
  padding: num(0),
  width: { type: 'any' as const },
  height: { type: 'any' as const },
  title: { type: 'string' as const },
  position: { type: 'symbol' as const },
  // Position flags
  top: bool(),
  bottom: bool(),
  left: bool(),
  right: bool(),
  open: bool(),
} as const;
