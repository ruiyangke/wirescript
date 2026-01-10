import type * as vscode from 'vscode';
import { compile, type CompileResult } from '@wirescript/dsl';

interface CacheEntry {
  version: number;
  result: CompileResult;
}

/**
 * Shared compilation cache to avoid re-compiling on every provider call.
 * Caches compile results by document URI and version.
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
   * Get compilation result for a document.
   * Returns cached result if document version matches, otherwise recompiles.
   */
  get(document: vscode.TextDocument): CompileResult {
    const key = document.uri.toString();
    const cached = this.cache.get(key);

    if (cached && cached.version === document.version) {
      return cached.result;
    }

    const result = compile(document.getText());
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
