/**
 * WireScript Schema v2
 *
 * Unified, type-safe schema system for WireScript DSL.
 */

// Types
export * from './types.js';

// Prop groups
export * from './props.js';

// Element schemas
export * from './elements.js';

// Registry
export * from './registry.js';

// Parser
export { parse, SchemaParser, ParserError } from './parser.js';

// Value wrappers
export { NumberValue, StringValue, SymbolValue } from './value.js';

// Schema export
export { exportSchemas, exportSchemasJson } from './export.js';
export type { PropSchema, ElementSchema, SchemaExport } from './export.js';
