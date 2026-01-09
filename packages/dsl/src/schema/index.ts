/**
 * WireScript Schema v2
 *
 * Unified, type-safe schema system for WireScript DSL.
 */

// Element schemas
export * from './elements.js';
export type { ElementSchema, PropSchema, SchemaExport } from './export.js';
// Schema export
export { exportSchemas, exportSchemasJson } from './export.js';
// Parser
export { ParserError, parse, SchemaParser } from './parser.js';
// Prop groups
export * from './props.js';
// Registry
export * from './registry.js';
// Types
export * from './types.js';
// Value wrappers
export { NumberValue, StringValue, SymbolValue } from './value.js';
