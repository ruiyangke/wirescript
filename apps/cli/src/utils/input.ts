/**
 * Input handling for file and stdin
 */

import { readFileSync, statSync } from 'node:fs';
import { basename } from 'node:path';
import { type CompileResult, compile } from '@wirescript/dsl';
import { FileError, RenderError } from './errors.js';
import { STDIN_TIMEOUT_MS } from './constants.js';

export interface InputSource {
  content: string;
  filename: string;
  isStdin: boolean;
}

/**
 * Read input from file path or stdin
 * Use "-" for stdin
 */
export async function readInput(fileArg: string): Promise<InputSource> {
  if (fileArg === '-') {
    return readStdin();
  }
  return readFile(fileArg);
}

function readFile(filePath: string): InputSource {
  try {
    const stat = statSync(filePath);
    if (stat.isDirectory()) {
      throw new FileError(`Path is a directory, not a file: ${filePath}`, filePath);
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new FileError(`File not found: ${filePath}`, filePath);
    }
    if (error instanceof FileError) {
      throw error;
    }
    throw new FileError(`Cannot access file: ${filePath}`, filePath);
  }

  try {
    const content = readFileSync(filePath, 'utf-8');
    return {
      content,
      filename: basename(filePath),
      isStdin: false,
    };
  } catch {
    throw new FileError(`Failed to read file: ${filePath}`, filePath);
  }
}

async function readStdin(): Promise<InputSource> {
  // Detect if stdin is a TTY (interactive terminal)
  if (process.stdin.isTTY) {
    throw new FileError(
      'Cannot read from stdin in interactive mode. Pipe input or use a file path instead.',
      'stdin'
    );
  }

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let hasData = false;
    let settled = false;

    const cleanup = () => {
      clearTimeout(timeout);
      process.stdin.removeListener('data', onData);
      process.stdin.removeListener('end', onEnd);
      process.stdin.removeListener('error', onError);
    };

    const onData = (chunk: Buffer) => {
      hasData = true;
      chunks.push(chunk);
    };

    const onEnd = () => {
      if (settled) return;
      settled = true;
      cleanup();

      const content = Buffer.concat(chunks).toString('utf-8');
      if (!content.trim()) {
        reject(new FileError('Empty input from stdin', 'stdin'));
        return;
      }
      resolve({
        content,
        filename: 'stdin',
        isStdin: true,
      });
    };

    const onError = (error: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new FileError(`Failed to read stdin: ${error.message}`, 'stdin'));
    };

    // Set timeout for stdin
    const timeout = setTimeout(() => {
      if (settled) return;
      if (!hasData) {
        settled = true;
        cleanup();
        reject(new FileError('No input received from stdin (timeout)', 'stdin'));
      }
    }, STDIN_TIMEOUT_MS);

    process.stdin.on('data', onData);
    process.stdin.on('end', onEnd);
    process.stdin.on('error', onError);
  });
}

/**
 * Validate that a file has .wire extension
 */
export function validateWireFile(filename: string): void {
  if (!filename.endsWith('.wire') && filename !== 'stdin') {
    // Just a warning, don't throw
    console.error(`Warning: File does not have .wire extension: ${filename}`);
  }
}

export interface CompileWireFileResult {
  input: InputSource;
  result: CompileResult;
}

export interface CompileWireFileOptions {
  /** If true, throws RenderError on compile failure */
  throwOnError?: boolean;
}

/**
 * Read, validate, and compile a WireScript file
 *
 * This is a convenience function that combines:
 * - readInput()
 * - validateWireFile()
 * - compile()
 *
 * @param filePath - Path to the .wire file or "-" for stdin
 * @param options - Optional settings
 * @returns The input source and compile result
 * @throws RenderError if throwOnError is true and compilation fails
 */
export async function compileWireFile(
  filePath: string,
  options: CompileWireFileOptions = {}
): Promise<CompileWireFileResult> {
  const input = await readInput(filePath);
  validateWireFile(input.filename);

  const result = compile(input.content);

  if (options.throwOnError && (!result.success || !result.document)) {
    throw new RenderError(
      result.errors.map((e) => `${e.line}:${e.column} ${e.message}`).join('\n'),
      filePath
    );
  }

  return { input, result };
}
