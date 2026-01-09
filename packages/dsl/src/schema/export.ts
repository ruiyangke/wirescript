/**
 * Export schema definitions as JSON for documentation.
 */

import { ELEMENTS, OVERLAY_PROPS } from './registry.js';

export interface PropSchema {
  type: string;
  default?: unknown;
}

export interface ElementSchema {
  type: string;
  content: boolean;
  children: boolean;
  props: Record<string, PropSchema>;
}

export interface SchemaExport {
  version: string;
  elements: Record<string, ElementSchema>;
  overlays: {
    props: Record<string, PropSchema>;
  };
}

/**
 * Export all schemas as a JSON-serializable object.
 */
export function exportSchemas(): SchemaExport {
  const elements: Record<string, ElementSchema> = {};

  for (const [name, schema] of Object.entries(ELEMENTS)) {
    elements[name] = {
      type: schema.type,
      content: schema.content ?? false,
      children: schema.children ?? false,
      props: schema.props as Record<string, PropSchema>,
    };
  }

  return {
    version: '2.0',
    elements,
    overlays: {
      props: OVERLAY_PROPS as Record<string, PropSchema>,
    },
  };
}

/**
 * Export schemas as formatted JSON string.
 */
export function exportSchemasJson(pretty = true): string {
  const schemas = exportSchemas();
  return pretty ? JSON.stringify(schemas, null, 2) : JSON.stringify(schemas);
}
