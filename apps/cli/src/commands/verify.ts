/**
 * verify command - Validate WireScript files
 */

import type { ParseError } from '@wirescript/dsl';
import { EXIT_CODES, type ExitCode, getErrorMessage } from '../utils/errors.js';
import { compileWireFile } from '../utils/input.js';
import {
  createOutputOptions,
  formatErrors,
  formatFailure,
  formatSuccess,
  formatWarnings,
  printError,
} from '../utils/output.js';

export interface VerifyOptions {
  json?: boolean;
  quiet?: boolean;
  warnings?: boolean;
  color?: boolean;
}

export interface VerifyResult {
  success: boolean;
  exitCode: ExitCode;
  file: string;
  errors: ParseError[];
  warnings: ParseError[];
  screens: Array<{ id: string; name?: string; viewport: string }>;
}

/**
 * Verify a WireScript file
 * Returns result object - does not call process.exit
 */
export async function verify(filePath: string, options: VerifyOptions = {}): Promise<VerifyResult> {
  // Read, validate, and compile (don't throw on error - report it)
  const { result } = await compileWireFile(filePath);

  // Extract screen info
  const screens =
    result.document?.screens.map((s) => ({
      id: s.id,
      name: s.name,
      viewport: s.viewport || 'desktop',
    })) || [];

  // Determine success
  const hasErrors = result.errors.length > 0;
  const hasWarnings = options.warnings && result.warnings.length > 0;
  const success = result.success && !hasErrors && !hasWarnings;

  return {
    success,
    exitCode: success ? EXIT_CODES.SUCCESS : EXIT_CODES.VALIDATION_ERROR,
    file: filePath,
    errors: result.errors,
    warnings: result.warnings,
    screens,
  };
}

/**
 * Format verify result for console output
 */
export function formatVerifyResult(result: VerifyResult, options: VerifyOptions = {}): string {
  const outputOpts = createOutputOptions({ color: options.color, quiet: options.quiet });

  if (options.json) {
    return JSON.stringify(
      {
        success: result.success,
        file: result.file,
        errors: result.errors,
        warnings: result.warnings,
        screens: result.screens,
      },
      null,
      2
    );
  }

  const parts: string[] = [];

  // Errors
  if (result.errors.length > 0) {
    parts.push(formatErrors(result.errors, 'Errors', outputOpts));
  }

  // Warnings
  if (result.warnings.length > 0) {
    parts.push(formatWarnings(result.warnings, outputOpts));
  }

  // Summary
  if (!options.quiet) {
    const screenCount = result.screens.length;
    const screenText = `${screenCount} screen${screenCount !== 1 ? 's' : ''}`;

    if (result.success) {
      parts.push(formatSuccess(`${result.file} (${screenText})`, outputOpts));
    } else {
      parts.push(formatFailure(result.file, outputOpts));
    }
  }

  return parts.join('\n');
}

/**
 * CLI action handler for verify command
 * Returns exit code instead of calling process.exit directly
 */
export async function verifyAction(filePath: string, options: VerifyOptions): Promise<ExitCode> {
  const outputOpts = createOutputOptions({ color: options.color, quiet: options.quiet });

  try {
    const result = await verify(filePath, options);
    const output = formatVerifyResult(result, options);

    if (output) {
      if (options.json || result.success) {
        console.log(output);
      } else {
        printError(output);
      }
    }

    return result.exitCode;
  } catch (error) {
    const message = getErrorMessage(error);
    if (options.json) {
      console.log(
        JSON.stringify(
          {
            success: false,
            file: filePath,
            errors: [{ message, line: 0, column: 0 }],
            warnings: [],
            screens: [],
          },
          null,
          2
        )
      );
    } else {
      printError(formatFailure(message, outputOpts));
    }
    return EXIT_CODES.FILE_ERROR;
  }
}
