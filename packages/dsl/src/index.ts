// Main entry point for @wirescript/dsl

// Formatter
export { type FormatOptions, format } from './formatter.js';
export type { ElementSchema, PropSchema, SchemaExport } from './schema/export.js';
// Schema export for documentation
export { exportSchemas, exportSchemasJson } from './schema/export.js';
// Re-export schema module for explicit access
export * as schema from './schema/index.js';
// Schema-driven parser and types
export { ParserError, parse, SchemaParser } from './schema/parser.js';
export * from './schema/props.js';
export * from './schema/registry.js';
export * from './schema/types.js';
export { NumberValue, StringValue, SymbolValue } from './schema/value.js';
// Tokenizer
export { Tokenizer, TokenizerError, tokenize } from './tokenizer.js';

// Validator
export { type ValidationResult, Validator, validate } from './validator.js';

import { parse } from './schema/parser.js';
import type { ComponentDef, LayoutNode, ParseError, WireDocument } from './schema/types.js';
import { validate } from './validator.js';

export interface CompileResult {
  success: boolean;
  document?: WireDocument;
  errors: ParseError[];
  warnings: ParseError[];
}

export interface ResolvedInclude {
  /** The file content */
  content: string;
  /** The resolved absolute path (used for nested includes and circular detection) */
  resolvedPath: string;
}

export interface CompileOptions {
  /** Path of the source file (used for relative include resolution) */
  filePath?: string;
  /** Resolver function to load included files. Must return both content and resolved absolute path. */
  resolver?: (includePath: string, fromPath: string) => Promise<ResolvedInclude>;
}

/** Maximum include depth to prevent infinite recursion */
const MAX_INCLUDE_DEPTH = 100;

/**
 * Parse and validate WireScript source code.
 * This is the main entry point for compiling WireScript.
 *
 * @param source - WireScript source code
 * @returns Compile result with document, errors, and warnings
 */
export function compile(source: string): CompileResult;

/**
 * Parse and validate WireScript source code with include resolution.
 *
 * @param source - WireScript source code
 * @param options - Compile options with resolver for includes
 * @returns Promise of compile result with document, errors, and warnings
 */
export function compile(source: string, options: CompileOptions): Promise<CompileResult>;

export function compile(
  source: string,
  options?: CompileOptions
): CompileResult | Promise<CompileResult> {
  // Parse
  const parseResult = parse(source);

  if (!parseResult.success || !parseResult.document) {
    return {
      success: false,
      errors: parseResult.errors,
      warnings: [],
    };
  }

  const document = parseResult.document;

  // If no includes or no resolver, return sync result
  if (document.includes.length === 0 || !options?.resolver) {
    return finalize(document, parseResult.errors);
  }

  // Async resolution with includes (we've verified resolver exists above)
  const resolverOptions = options as CompileOptions & {
    resolver: NonNullable<CompileOptions['resolver']>;
  };
  return resolveIncludes(document, resolverOptions, new Set()).then((result) => {
    if (!result.success || !result.document) {
      return result;
    }
    return finalize(result.document, [...parseResult.errors, ...result.errors]);
  });
}

/**
 * Finalize compilation by running validation.
 */
function finalize(document: WireDocument, parseErrors: ParseError[]): CompileResult {
  const allErrors = [...parseErrors];

  // Entry document must have at least one screen
  // (Library files with only define/layout are allowed via includes)
  if (document.screens.length === 0) {
    allErrors.push({
      message: 'Document must have at least one screen',
      line: document.loc?.line ?? 1,
      column: document.loc?.column ?? 1,
    });
  }

  const validationResult = validate(document);

  return {
    success: validationResult.valid && allErrors.length === 0,
    document,
    errors: [...allErrors, ...validationResult.errors],
    warnings: validationResult.warnings,
  };
}

/**
 * Resolve includes recursively, merging components and layouts.
 * Requires options.resolver to be defined.
 */
async function resolveIncludes(
  document: WireDocument,
  options: CompileOptions & { resolver: NonNullable<CompileOptions['resolver']> },
  resolvedPaths: Set<string>,
  depth = 0
): Promise<CompileResult> {
  const errors: ParseError[] = [];
  const filePath = options.filePath || '';
  const resolver = options.resolver;

  // Check max depth
  if (depth > MAX_INCLUDE_DEPTH) {
    return {
      success: false,
      document,
      errors: [
        {
          message: `Maximum include depth (${MAX_INCLUDE_DEPTH}) exceeded. Check for circular includes.`,
          line: 1,
          column: 1,
        },
      ],
      warnings: [],
    };
  }

  // Collect merged components and layouts (last wins)
  const componentsMap = new Map<string, ComponentDef>();
  const layoutsMap = new Map<string, LayoutNode>();

  // Process each include
  for (const include of document.includes) {
    const includePath = include.path;

    try {
      // Resolve and load the included file
      const resolved = await resolver(includePath, filePath);
      const { content: includedSource, resolvedPath } = resolved;

      // Check for circular include using resolved absolute path
      if (resolvedPaths.has(resolvedPath)) {
        errors.push({
          message: `Circular include detected: ${includePath} (${resolvedPath})`,
          line: include.loc?.line || 1,
          column: include.loc?.column || 1,
        });
        continue;
      }

      resolvedPaths.add(resolvedPath);

      // Parse included file
      const includedParseResult = parse(includedSource);

      if (!includedParseResult.success || !includedParseResult.document) {
        errors.push({
          message: `Error in included file '${includePath}': ${includedParseResult.errors[0]?.message || 'Parse error'}`,
          line: include.loc?.line || 1,
          column: include.loc?.column || 1,
        });
        continue;
      }

      const includedDoc = includedParseResult.document;

      // Recursively resolve includes in the included file
      if (includedDoc.includes.length > 0) {
        const nestedResult = await resolveIncludes(
          includedDoc,
          {
            ...options,
            filePath: resolvedPath, // Use RESOLVED path for nested resolution
          },
          resolvedPaths,
          depth + 1
        );

        if (!nestedResult.success || !nestedResult.document) {
          errors.push(...nestedResult.errors);
          continue;
        }

        // Use the resolved document
        Object.assign(includedDoc, {
          components: nestedResult.document.components,
          layouts: nestedResult.document.layouts,
        });
      }

      // Merge components (last wins)
      for (const comp of includedDoc.components) {
        componentsMap.set(comp.name, comp);
      }

      // Merge layouts (last wins)
      for (const layout of includedDoc.layouts) {
        layoutsMap.set(layout.name, layout);
      }
    } catch (err) {
      errors.push({
        message: `Cannot resolve include '${includePath}': ${err instanceof Error ? err.message : String(err)}`,
        line: include.loc?.line || 1,
        column: include.loc?.column || 1,
      });
    }
  }

  // Add components and layouts from the main document (last wins)
  for (const comp of document.components) {
    componentsMap.set(comp.name, comp);
  }
  for (const layout of document.layouts) {
    layoutsMap.set(layout.name, layout);
  }

  // Create merged document
  const mergedDocument: WireDocument = {
    ...document,
    components: Array.from(componentsMap.values()),
    layouts: Array.from(layoutsMap.values()),
    includes: [], // Clear includes after resolution
  };

  return {
    success: errors.length === 0,
    document: mergedDocument,
    errors,
    warnings: [],
  };
}
