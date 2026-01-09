/**
 * format command - Format WireScript files
 *
 * Formats .wire files with consistent style:
 * - 2-space indentation
 * - One element per line for containers
 * - Preserves comments
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { format } from '@wirescript/dsl';
import { EXIT_CODES, type ExitCode } from '../utils/errors.js';
import { createOutputOptions, formatFailure, formatSuccess, printError } from '../utils/output.js';

export interface FormatOptions {
  /** Write changes to file (default: true) */
  write?: boolean;
  /** Check if file is formatted (exit 1 if not) */
  check?: boolean;
  /** Disable colored output */
  color?: boolean;
}

export interface FormatResult {
  success: boolean;
  exitCode: ExitCode;
  changed: boolean;
  original: string;
  formatted: string;
}

/**
 * Format a WireScript file
 */
export function formatFile(filePath: string, options: FormatOptions = {}): FormatResult {
  const source = readFileSync(filePath, 'utf-8');
  const formatted = format(source);
  const changed = source !== formatted;

  if (options.check) {
    return {
      success: !changed,
      exitCode: changed ? EXIT_CODES.VALIDATION_ERROR : EXIT_CODES.SUCCESS,
      changed,
      original: source,
      formatted,
    };
  }

  if (options.write !== false && changed) {
    writeFileSync(filePath, formatted);
  }

  return {
    success: true,
    exitCode: EXIT_CODES.SUCCESS,
    changed,
    original: source,
    formatted,
  };
}

/**
 * CLI action handler for format command
 */
export async function formatAction(filePath: string, options: FormatOptions): Promise<ExitCode> {
  const outputOpts = createOutputOptions({ color: options.color });

  try {
    const result = formatFile(filePath, options);

    if (options.check) {
      if (result.changed) {
        printError(formatFailure(`${filePath} needs formatting`, outputOpts));
        return EXIT_CODES.VALIDATION_ERROR;
      } else {
        printError(formatSuccess(`${filePath} is formatted`, outputOpts));
        return EXIT_CODES.SUCCESS;
      }
    }

    if (options.write === false) {
      // Output to stdout
      process.stdout.write(result.formatted);
      return EXIT_CODES.SUCCESS;
    }

    if (result.changed) {
      printError(formatSuccess(`Formatted ${filePath}`, outputOpts));
    } else {
      printError(formatSuccess(`${filePath} already formatted`, outputOpts));
    }

    return EXIT_CODES.SUCCESS;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    printError(formatFailure(`Failed to format ${filePath}: ${message}`, outputOpts));
    return EXIT_CODES.FILE_ERROR;
  }
}
