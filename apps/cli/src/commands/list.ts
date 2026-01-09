/**
 * list command - List screens in a WireScript file
 */

import type { ParseError } from '@wirescript/dsl';
import { EXIT_CODES, getErrorMessage, type ExitCode } from '../utils/errors.js';
import { compileWireFile } from '../utils/input.js';
import { createOutputOptions, formatFailure, printError } from '../utils/output.js';

export interface ListOptions {
  json?: boolean;
  color?: boolean;
}

export interface ScreenInfo {
  id: string;
  name?: string;
  viewport: string;
}

export interface ListResult {
  success: boolean;
  exitCode: ExitCode;
  file: string;
  screens: ScreenInfo[];
  errors: ParseError[];
}

/**
 * List screens in a WireScript file
 * Returns result object - does not call process.exit
 */
export async function list(filePath: string, _options: ListOptions = {}): Promise<ListResult> {
  // Read, validate, and compile (don't throw on error - report it)
  const { result } = await compileWireFile(filePath);

  if (!result.success || !result.document) {
    return {
      success: false,
      exitCode: EXIT_CODES.VALIDATION_ERROR,
      file: filePath,
      screens: [],
      errors: result.errors,
    };
  }

  // Extract screen info
  const screens = result.document.screens.map((s) => ({
    id: s.id,
    name: s.name,
    viewport: s.viewport || 'desktop',
  }));

  return {
    success: true,
    exitCode: EXIT_CODES.SUCCESS,
    file: filePath,
    screens,
    errors: [],
  };
}

/**
 * Format list result for console output
 */
export function formatListResult(result: ListResult, options: ListOptions = {}): string {
  if (options.json) {
    if (!result.success) {
      return JSON.stringify(
        {
          success: false,
          file: result.file,
          screens: [],
          errors: result.errors.map((e) => ({
            message: e.message,
            line: e.line,
            column: e.column,
          })),
        },
        null,
        2
      );
    }
    return JSON.stringify(result.screens, null, 2);
  }

  if (!result.success) {
    const errorLines = result.errors.map((e) => `  ${e.line}:${e.column} ${e.message}`);
    return `Failed to parse ${result.file}:\n${errorLines.join('\n')}`;
  }

  if (result.screens.length === 0) {
    return 'No screens found';
  }

  // Calculate column widths
  const idWidth = Math.max(4, ...result.screens.map((s) => s.id.length));
  const nameWidth = Math.max(4, ...result.screens.map((s) => (s.name || s.id).length));

  // Format as table
  const lines = result.screens.map((screen) => {
    const id = screen.id.padEnd(idWidth);
    const name = (screen.name || screen.id).padEnd(nameWidth);
    const viewport = screen.viewport;
    return `  ${id}  ${name}  ${viewport}`;
  });

  return lines.join('\n');
}

/**
 * CLI action handler for list command
 * Returns exit code instead of calling process.exit directly
 */
export async function listAction(filePath: string, options: ListOptions): Promise<ExitCode> {
  const outputOpts = createOutputOptions({ color: options.color });

  try {
    const result = await list(filePath, options);

    if (!result.success) {
      const output = formatListResult(result, options);
      if (options.json) {
        console.log(output);
      } else {
        printError(output);
      }
      return result.exitCode;
    }

    console.log(formatListResult(result, options));
    return EXIT_CODES.SUCCESS;
  } catch (error) {
    const message = getErrorMessage(error);
    if (options.json) {
      console.log(
        JSON.stringify(
          {
            success: false,
            error: message,
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
