/**
 * Handle cache for Browser FileSystem Access API
 * Caches FileSystemHandle objects by path for efficient access
 */

/// <reference path="./file-system-access.d.ts" />

/**
 * Cache for FileSystemHandle objects
 * Paths are project-relative (no leading slash, no project name prefix)
 */
export class HandleCache {
  private cache = new Map<string, FileSystemHandle>();

  /**
   * Get a handle from cache
   */
  get(path: string): FileSystemHandle | undefined {
    return this.cache.get(path);
  }

  /**
   * Get a file handle from cache
   */
  getFile(path: string): FileSystemFileHandle | undefined {
    const handle = this.cache.get(path);
    return handle?.kind === 'file' ? (handle as FileSystemFileHandle) : undefined;
  }

  /**
   * Get a directory handle from cache
   */
  getDirectory(path: string): FileSystemDirectoryHandle | undefined {
    const handle = this.cache.get(path);
    return handle?.kind === 'directory' ? (handle as FileSystemDirectoryHandle) : undefined;
  }

  /**
   * Store a handle in cache
   */
  set(path: string, handle: FileSystemHandle): void {
    this.cache.set(path, handle);
  }

  /**
   * Remove a handle from cache
   */
  delete(path: string): boolean {
    return this.cache.delete(path);
  }

  /**
   * Check if path is in cache
   */
  has(path: string): boolean {
    return this.cache.has(path);
  }

  /**
   * Clear all cached handles
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get number of cached handles
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Remove all handles that start with given prefix
   * Useful when a directory is deleted
   */
  deleteByPrefix(prefix: string): void {
    const toDelete: string[] = [];
    for (const path of this.cache.keys()) {
      if (path === prefix || path.startsWith(`${prefix}/`)) {
        toDelete.push(path);
      }
    }
    for (const p of toDelete) {
      this.cache.delete(p);
    }
  }
}
