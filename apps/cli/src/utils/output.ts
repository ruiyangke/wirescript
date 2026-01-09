/**
 * Console output formatting utilities
 *
 * Uses explicit options passing instead of global mutable state.
 */

import type { ParseError } from '@wirescript/dsl';
import pc from 'picocolors';

export interface OutputOptions {
  color: boolean;
  quiet: boolean;
}

export const DEFAULT_OUTPUT_OPTIONS: OutputOptions = {
  color: true,
  quiet: false,
};

/**
 * Create output options from CLI flags
 */
export function createOutputOptions(flags: { color?: boolean; quiet?: boolean }): OutputOptions {
  return {
    color: flags.color !== false,
    quiet: flags.quiet === true,
  };
}

/**
 * Color wrapper that respects options
 */
function c(fn: (s: string) => string, text: string, options: OutputOptions): string {
  return options.color ? fn(text) : text;
}

/**
 * Format a location as "line:column"
 */
export function formatLocation(
  line: number,
  column: number,
  options: OutputOptions = DEFAULT_OUTPUT_OPTIONS
): string {
  return c(pc.dim, `${line}:${column}`, options);
}

/**
 * Format a single error/warning
 */
export function formatError(
  error: ParseError,
  options: OutputOptions = DEFAULT_OUTPUT_OPTIONS
): string {
  const location = formatLocation(error.line, error.column, options);
  return `  ${location} ${error.message}`;
}

/**
 * Format error list with header
 */
export function formatErrors(
  errors: ParseError[],
  label = 'Errors',
  options: OutputOptions = DEFAULT_OUTPUT_OPTIONS
): string {
  if (errors.length === 0) return '';

  const header = c(pc.red, `${c(pc.bold, `${label}:`, options)} (${errors.length})`, options);
  const lines = errors.map((e) => formatError(e, options));

  return `\n${header}\n${lines.join('\n')}`;
}

/**
 * Format warning list with header
 */
export function formatWarnings(
  warnings: ParseError[],
  options: OutputOptions = DEFAULT_OUTPUT_OPTIONS
): string {
  if (warnings.length === 0) return '';

  const header = c(pc.yellow, `${c(pc.bold, 'Warnings:', options)} (${warnings.length})`, options);
  const lines = warnings.map((e) => formatError(e, options));

  return `\n${header}\n${lines.join('\n')}`;
}

/**
 * Format success message
 */
export function formatSuccess(
  message: string,
  options: OutputOptions = DEFAULT_OUTPUT_OPTIONS
): string {
  return `${c(pc.green, c(pc.bold, '✓', options), options)} ${message}`;
}

/**
 * Format failure message
 */
export function formatFailure(
  message: string,
  options: OutputOptions = DEFAULT_OUTPUT_OPTIONS
): string {
  return `${c(pc.red, c(pc.bold, '✗', options), options)} ${message}`;
}

/**
 * Format info message (dim)
 */
export function formatInfo(
  message: string,
  options: OutputOptions = DEFAULT_OUTPUT_OPTIONS
): string {
  return c(pc.dim, message, options);
}

/**
 * Print to stdout (respects quiet mode)
 */
export function print(message: string, options: OutputOptions = DEFAULT_OUTPUT_OPTIONS): void {
  if (!options.quiet) {
    console.log(message);
  }
}

/**
 * Print to stderr (ignores quiet mode - errors always shown)
 */
export function printError(message: string): void {
  console.error(message);
}

/**
 * Print success with checkmark
 */
export function printSuccess(
  message: string,
  options: OutputOptions = DEFAULT_OUTPUT_OPTIONS
): void {
  print(formatSuccess(message, options), options);
}

/**
 * Print failure with X
 */
export function printFailure(
  message: string,
  options: OutputOptions = DEFAULT_OUTPUT_OPTIONS
): void {
  printError(formatFailure(message, options));
}
