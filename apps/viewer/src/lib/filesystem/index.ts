/**
 * Filesystem abstraction layer
 * Provides a unified API for file operations across Electron and browser environments
 */

export { HandleCache } from './cache.js';
export { IndexedDBStorage, LocalStorageAdapter, MemoryStorage } from './storage.js';
export * from './types.js';
export { DirectoryWatcher } from './watcher.js';

import type { FileSystemAPI, FileSystemCapabilities, FileSystemType } from './types.js';
import { detectFileSystemType, hasFileSystemAccess, isElectron } from './types.js';

/**
 * Singleton instance and initialization state
 */
let instance: FileSystemAPI | null = null;
let initPromise: Promise<FileSystemAPI> | null = null;

/**
 * Create a new filesystem instance (no singleton)
 * Use this when you need a fresh instance, e.g. for testing
 */
export async function createFileSystem(type?: FileSystemType): Promise<FileSystemAPI> {
  const fsType = type ?? detectFileSystemType();

  switch (fsType) {
    case 'electron': {
      const { ElectronFileSystem } = await import('./electron.js');
      return new ElectronFileSystem();
    }
    case 'browser': {
      const { BrowserFileSystem } = await import('./browser.js');
      return new BrowserFileSystem();
    }
    case 'fallback': {
      const { FallbackFileSystem } = await import('./fallback.js');
      return new FallbackFileSystem();
    }
  }
}

/**
 * Get the singleton filesystem instance
 * Lazily initializes on first call
 */
export async function getFileSystem(): Promise<FileSystemAPI> {
  if (instance) return instance;
  if (initPromise) return initPromise;

  initPromise = createFileSystem()
    .then((fs) => {
      instance = fs;
      return fs;
    })
    .finally(() => {
      initPromise = null;
    });

  return initPromise;
}

/**
 * Reset the singleton (useful for testing or switching projects)
 */
export async function resetFileSystem(): Promise<void> {
  if (instance) {
    await instance.closeProject();
    instance = null;
  }
  initPromise = null;
}

/**
 * Get the current filesystem type without initializing
 */
export function getFileSystemType(): FileSystemType {
  return detectFileSystemType();
}

/**
 * Get capabilities for a filesystem type without initializing
 */
export function getCapabilities(type?: FileSystemType): FileSystemCapabilities {
  const fsType = type ?? detectFileSystemType();

  switch (fsType) {
    case 'electron':
      return { watch: true, write: true, folders: true, persist: true };
    case 'browser':
      return { watch: true, write: true, folders: true, persist: true };
    case 'fallback':
      return { watch: false, write: false, folders: false, persist: true };
  }
}

/**
 * Check if a specific capability is supported
 */
export function hasCapability(
  capability: keyof FileSystemCapabilities,
  type?: FileSystemType
): boolean {
  return getCapabilities(type)[capability];
}

/**
 * Get a user-friendly description of filesystem capabilities
 */
export function getCapabilitiesDescription(type?: FileSystemType): string {
  const fsType = type ?? detectFileSystemType();

  switch (fsType) {
    case 'electron':
      return 'Full filesystem access (Desktop App)';
    case 'browser':
      return 'Local folder access (File System Access API)';
    case 'fallback':
      return 'Limited access (individual files only)';
  }
}

/**
 * Re-export environment detection helpers
 */
export { isElectron, hasFileSystemAccess };
