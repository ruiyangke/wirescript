import * as vscode from 'vscode';
import { compile, type CompileResult, type ResolvedInclude } from '@wirescript/dsl';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';

interface CacheEntry {
  version: number;
  result: CompileResult;
}

/**
 * Shared compilation cache to avoid re-compiling on every provider call.
 * Caches compile results by document URI and version.
 * Uses a file resolver for include resolution.
 */
export class CompilationCache {
  private static instance: CompilationCache;
  private cache = new Map<string, CacheEntry>();

  static getInstance(): CompilationCache {
    if (!CompilationCache.instance) {
      CompilationCache.instance = new CompilationCache();
    }
    return CompilationCache.instance;
  }

  /**
   * File resolver for includes - reads files on-demand from disk
   */
  private async resolver(includePath: string, fromPath: string): Promise<ResolvedInclude> {
    const resolvedPath = resolve(dirname(fromPath), includePath);
    const content = await readFile(resolvedPath, 'utf-8');
    return { content, resolvedPath };
  }

  /**
   * Get compilation result for a document.
   * Returns cached result if document version matches, otherwise recompiles.
   * Supports includes via file resolver.
   */
  async get(document: vscode.TextDocument): Promise<CompileResult> {
    const key = document.uri.toString();
    const cached = this.cache.get(key);

    if (cached && cached.version === document.version) {
      return cached.result;
    }

    // Compile with file resolver for include support
    const result = await compile(document.getText(), {
      filePath: document.uri.fsPath,
      resolver: this.resolver.bind(this),
    });

    this.cache.set(key, { version: document.version, result });
    return result;
  }

  /**
   * Invalidate cache for a specific document.
   */
  invalidate(uri: vscode.Uri): void {
    this.cache.delete(uri.toString());
  }

  /**
   * Clear entire cache.
   */
  clear(): void {
    this.cache.clear();
  }
}
