/**
 * Fallback filesystem for browsers without File System Access API
 * Uses file input for opening and blob download for saving
 * Persists files in localStorage for session continuity
 *
 * LIMITATIONS:
 * - No folder support (can only work with individual files)
 * - No real-time watching
 * - Files saved via download, not to original location
 */

import { LocalStorageAdapter } from './storage.js';
import type {
  DirectoryChangeCallback,
  FileContent,
  FileEntry,
  FileSystemAPI,
  FileSystemCapabilities,
  HandleStorage,
  Result,
} from './types.js';
import { errCode, ok } from './types.js';

const FILES_KEY = 'files';

/**
 * Default template for new .wire files
 */
function defaultFileContent(fileName: string): string {
  const title = fileName.replace('.wire', '');
  return `(wire
  (meta
    :title "${title}"
    :context demo)

  (screen main "Main" :desktop
    (box :col :center :gap 24 :padding 48
      (text "New Wireframe" :high))))
`;
}

/**
 * Fallback File System implementation
 * For browsers that don't support File System Access API (Safari, Firefox)
 */
export class FallbackFileSystem implements FileSystemAPI {
  readonly type = 'fallback' as const;

  readonly capabilities: FileSystemCapabilities = {
    watch: false,
    write: false, // Can edit in memory, but saves are downloads
    folders: false,
    persist: true, // Via localStorage
  };

  private files = new Map<string, string>();

  constructor(private readonly storage: HandleStorage = new LocalStorageAdapter()) {
    this.loadFromStorage();
  }

  get projectName(): string | null {
    // No project concept in fallback mode
    return null;
  }

  get isProjectOpen(): boolean {
    // Always "open" since we don't have project concept
    return true;
  }

  // === Project Lifecycle ===

  async openProject(): Promise<Result<string>> {
    // Show helpful message about limitations
    return errCode(
      'NOT_SUPPORTED',
      'Your browser does not support folder access. ' +
        'You can open individual .wire files using "Open File". ' +
        'For full folder support, use Chrome, Edge, or the desktop app.'
    );
  }

  async restoreProject(): Promise<Result<string>> {
    // No project to restore
    return errCode('NOT_FOUND', 'No project to restore in fallback mode');
  }

  async closeProject(): Promise<void> {
    // No-op - no project concept
  }

  // === Directory Operations ===

  async readDirectory(_path: string): Promise<Result<FileEntry>> {
    // Could potentially list files from localStorage, but that would be misleading
    return errCode('NOT_SUPPORTED', 'Directory listing not supported in fallback mode');
  }

  async watchDirectory(_path: string, _callback: DirectoryChangeCallback): Promise<Result<void>> {
    return errCode('NOT_SUPPORTED', 'Directory watching not supported in fallback mode');
  }

  async unwatchDirectory(): Promise<void> {
    // No-op
  }

  // === File Operations ===

  async readFile(path: string): Promise<Result<FileContent>> {
    const content = this.files.get(path);
    if (content === undefined) {
      return errCode('NOT_FOUND', `File not found: ${path}`, path);
    }
    return ok({ path, content });
  }

  async writeFile(path: string, content: string): Promise<Result<void>> {
    this.files.set(path, content);
    this.saveToStorage();
    return ok(undefined);
  }

  async createFile(path: string, content?: string): Promise<Result<void>> {
    if (this.files.has(path)) {
      return errCode('ALREADY_EXISTS', `File already exists: ${path}`, path);
    }

    const fileContent = content ?? defaultFileContent(path);
    this.files.set(path, fileContent);
    this.saveToStorage();
    return ok(undefined);
  }

  async deleteFile(path: string): Promise<Result<void>> {
    if (!this.files.has(path)) {
      return errCode('NOT_FOUND', `File not found: ${path}`, path);
    }

    this.files.delete(path);
    this.saveToStorage();
    return ok(undefined);
  }

  async renameFile(oldPath: string, newPath: string): Promise<Result<void>> {
    const content = this.files.get(oldPath);
    if (content === undefined) {
      return errCode('NOT_FOUND', `File not found: ${oldPath}`, oldPath);
    }

    if (this.files.has(newPath)) {
      return errCode('ALREADY_EXISTS', `File already exists: ${newPath}`, newPath);
    }

    this.files.set(newPath, content);
    this.files.delete(oldPath);
    this.saveToStorage();
    return ok(undefined);
  }

  // === Standalone File Operations ===

  async openStandaloneFile(): Promise<Result<FileContent>> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.wire';

      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) {
          resolve(errCode('CANCELLED', 'No file selected'));
          return;
        }

        try {
          const content = await file.text();
          const path = file.name;

          // Store in memory for editing
          this.files.set(path, content);
          this.saveToStorage();

          resolve(ok({ path, content }));
        } catch (e) {
          resolve(errCode('IO_ERROR', `Failed to read file: ${(e as Error).message}`));
        }
      };

      // Handle cancel (note: oncancel may not fire in all browsers)
      input.oncancel = () => {
        resolve(errCode('CANCELLED', 'File selection cancelled'));
      };

      // Detect cancel via blur (fallback)
      const handleBlur = () => {
        setTimeout(() => {
          if (!input.files?.length) {
            resolve(errCode('CANCELLED', 'File selection cancelled'));
          }
          window.removeEventListener('focus', handleBlur);
        }, 300);
      };
      window.addEventListener('focus', handleBlur);

      input.click();
    });
  }

  async saveStandaloneFile(content: string, suggestedName?: string): Promise<Result<string>> {
    try {
      const filename = suggestedName || 'untitled.wire';
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();

      URL.revokeObjectURL(url);

      // Update in-memory copy
      this.files.set(filename, content);
      this.saveToStorage();

      return ok(filename);
    } catch (e) {
      return errCode('IO_ERROR', `Failed to save file: ${(e as Error).message}`);
    }
  }

  // === Storage ===

  private loadFromStorage(): void {
    this.storage
      .get<[string, string][]>(FILES_KEY)
      .then((entries) => {
        if (entries) {
          this.files = new Map(entries);
        }
      })
      .catch(() => {
        // Ignore storage errors
      });
  }

  private saveToStorage(): void {
    const entries = Array.from(this.files.entries());
    this.storage.set(FILES_KEY, entries).catch(() => {
      // Ignore storage errors
    });
  }

  // === Additional Methods ===

  /**
   * Get list of files stored in memory
   * Useful for UI to show available files
   */
  getStoredFiles(): string[] {
    return Array.from(this.files.keys());
  }
}
