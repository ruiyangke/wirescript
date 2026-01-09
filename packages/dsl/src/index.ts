// Main entry point for @wirescript/dsl

// Tokenizer
export { Tokenizer, TokenizerError, tokenize } from './tokenizer.js';

// Formatter
export { format, type FormatOptions } from './formatter.js';

// Schema-driven parser and types
export { parse, SchemaParser, ParserError } from './schema/parser.js';
export * from './schema/types.js';
export * from './schema/props.js';
export * from './schema/registry.js';
export { NumberValue, StringValue, SymbolValue } from './schema/value.js';

// Schema export for documentation
export { exportSchemas, exportSchemasJson } from './schema/export.js';
export type { PropSchema, ElementSchema, SchemaExport } from './schema/export.js';

// Re-export schema module for explicit access
export * as schema from './schema/index.js';

// Validator
export { type ValidationResult, Validator, validate } from './validator.js';

import { parse } from './schema/parser.js';
import type { ParseError, WireDocument } from './schema/types.js';
import { validate } from './validator.js';

export interface CompileResult {
  success: boolean;
  document?: WireDocument;
  errors: ParseError[];
  warnings: ParseError[];
}

/**
 * Parse and validate WireScript source code.
 * This is the main entry point for compiling WireScript.
 */
export function compile(source: string): CompileResult {
  // Parse
  const parseResult = parse(source);

  if (!parseResult.success || !parseResult.document) {
    return {
      success: false,
      errors: parseResult.errors,
      warnings: [],
    };
  }

  // Validate
  const validationResult = validate(parseResult.document);

  return {
    success: validationResult.valid,
    document: parseResult.document,
    errors: [...parseResult.errors, ...validationResult.errors],
    warnings: validationResult.warnings,
  };
}
