/**
 * Error types and exit codes for the CLI
 */

export const EXIT_CODES = {
  SUCCESS: 0,
  VALIDATION_ERROR: 1,
  FILE_ERROR: 2,
  RENDER_ERROR: 3,
} as const;

export type ExitCode = (typeof EXIT_CODES)[keyof typeof EXIT_CODES];

export interface SourceLocation {
  line: number;
  column: number;
}

export class WireScriptError extends Error {
  constructor(
    message: string,
    public readonly code: ExitCode,
    public readonly file?: string,
    public readonly location?: SourceLocation
  ) {
    super(message);
    this.name = 'WireScriptError';
  }
}

export class FileError extends WireScriptError {
  constructor(message: string, file?: string) {
    super(message, EXIT_CODES.FILE_ERROR, file);
    this.name = 'FileError';
  }
}

export class ValidationError extends WireScriptError {
  constructor(message: string, file?: string, location?: SourceLocation) {
    super(message, EXIT_CODES.VALIDATION_ERROR, file, location);
    this.name = 'ValidationError';
  }
}

export class RenderError extends WireScriptError {
  constructor(message: string, file?: string) {
    super(message, EXIT_CODES.RENDER_ERROR, file);
    this.name = 'RenderError';
  }
}

/**
 * Safely extract error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Safely extract exit code from error, defaulting to provided fallback
 */
export function getErrorCode(error: unknown, fallback: ExitCode): ExitCode {
  if (error instanceof WireScriptError) {
    return error.code;
  }
  return fallback;
}
