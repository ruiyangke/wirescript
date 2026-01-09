/**
 * Electron filesystem implementation
 * Wraps the electronAPI exposed via preload script
 */

import type {
  DirectoryChangeCallback,
  DirectoryChangeEvent,
  FileContent,
  FileEntry,
  FileSystemAPI,
  FileSystemCapabilities,
  Result,
} from './types.js';
import { errCode, ok } from './types.js';

/**
 * ElectronAPI interface (exposed via preload)
 */
interface ElectronAPI {
  isElectron: boolean;
  openFile: () => Promise<{ path: string; content: string } | null>;
  saveFileAs: (content: string) => Promise<string | null>;
  saveFile: (filePath: string, content: string) => Promise<boolean>;
  readFile: (filePath: string) => Promise<{ path: string; content: string } | null>;
  openFolder: () => Promise<string | null>;
  readDirectory: (dirPath: string) => Promise<FileEntry | null>;
  watchDirectory: (dirPath: string) => Promise<boolean>;
  unwatchDirectory: () => Promise<void>;
  onDirectoryChanged: (
    callback: (event: { eventType: string; filename: string }) => void
  ) => () => void;
  createFile: (filePath: string, content?: string) => Promise<boolean>;
  deleteFile: (filePath: string) => Promise<boolean>;
  renameFile: (oldPath: string, newPath: string) => Promise<boolean>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

/**
 * Electron File System implementation
 * Wraps IPC calls to main process
 */
export class ElectronFileSystem implements FileSystemAPI {
  readonly type = 'electron' as const;

  readonly capabilities: FileSystemCapabilities = {
    watch: true,
    write: true,
    folders: true,
    persist: true,
  };

  private _projectName: string | null = null;
  private _projectPath: string | null = null;
  private unsubscribe: (() => void) | null = null;

  private get api(): ElectronAPI {
    const api = window.electronAPI;
    if (!api) {
      throw new Error('ElectronFileSystem: electronAPI not available');
    }
    return api;
  }

  get projectName(): string | null {
    return this._projectName;
  }

  get isProjectOpen(): boolean {
    return this._projectPath !== null;
  }

  // === Project Lifecycle ===

  async openProject(): Promise<Result<string>> {
    try {
      const path = await this.api.openFolder();
      if (!path) {
        return errCode('CANCELLED', 'User cancelled folder selection');
      }

      this._projectPath = path;
      this._projectName = path.split(/[/\\]/).pop() || path;

      return ok(this._projectName);
    } catch (e) {
      return errCode('IO_ERROR', `Failed to open folder: ${(e as Error).message}`);
    }
  }

  async restoreProject(): Promise<Result<string>> {
    // Electron doesn't need session restore - projects are opened fresh
    return errCode('NOT_SUPPORTED', 'Electron does not support session restore');
  }

  async closeProject(): Promise<void> {
    await this.unwatchDirectory();
    this._projectPath = null;
    this._projectName = null;
  }

  // === Directory Operations ===

  async readDirectory(path: string): Promise<Result<FileEntry>> {
    if (!this._projectPath) {
      return errCode('NOT_INITIALIZED', 'No project open');
    }

    try {
      // Convert project-relative path to absolute
      const absolutePath = path ? `${this._projectPath}/${path}` : this._projectPath;
      const result = await this.api.readDirectory(absolutePath);

      if (!result) {
        return errCode('NOT_FOUND', `Directory not found: ${path}`, path);
      }

      // Convert absolute paths in result to project-relative
      return ok(this.toRelativePaths(result));
    } catch (e) {
      return errCode('IO_ERROR', `Failed to read directory: ${(e as Error).message}`, path);
    }
  }

  async watchDirectory(path: string, callback: DirectoryChangeCallback): Promise<Result<void>> {
    if (!this._projectPath) {
      return errCode('NOT_INITIALIZED', 'No project open');
    }

    // Remove existing listener
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    // Wrap callback to convert paths
    this.unsubscribe = this.api.onDirectoryChanged((event) => {
      const relPath = this.toRelativePath(event.filename);
      const mappedEvent: DirectoryChangeEvent = {
        type: this.mapEventType(event.eventType),
        path: relPath,
      };
      callback(mappedEvent);
    });

    try {
      const absolutePath = path ? `${this._projectPath}/${path}` : this._projectPath;
      const success = await this.api.watchDirectory(absolutePath);
      if (!success) {
        return errCode('IO_ERROR', 'Failed to start watching directory');
      }
      return ok(undefined);
    } catch (e) {
      return errCode('IO_ERROR', `Failed to watch directory: ${(e as Error).message}`);
    }
  }

  async unwatchDirectory(): Promise<void> {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    await this.api.unwatchDirectory();
  }

  // === File Operations ===

  async readFile(path: string): Promise<Result<FileContent>> {
    if (!this._projectPath) {
      return errCode('NOT_INITIALIZED', 'No project open', path);
    }

    try {
      const absolutePath = `${this._projectPath}/${path}`;
      const result = await this.api.readFile(absolutePath);

      if (!result) {
        return errCode('NOT_FOUND', `File not found: ${path}`, path);
      }

      return ok({ path, content: result.content });
    } catch (e) {
      return errCode('IO_ERROR', `Failed to read file: ${(e as Error).message}`, path);
    }
  }

  async writeFile(path: string, content: string): Promise<Result<void>> {
    if (!this._projectPath) {
      return errCode('NOT_INITIALIZED', 'No project open', path);
    }

    try {
      const absolutePath = `${this._projectPath}/${path}`;
      const success = await this.api.saveFile(absolutePath, content);

      if (!success) {
        return errCode('IO_ERROR', `Failed to write file: ${path}`, path);
      }

      return ok(undefined);
    } catch (e) {
      return errCode('IO_ERROR', `Failed to write file: ${(e as Error).message}`, path);
    }
  }

  async createFile(path: string, content?: string): Promise<Result<void>> {
    if (!this._projectPath) {
      return errCode('NOT_INITIALIZED', 'No project open', path);
    }

    try {
      const absolutePath = `${this._projectPath}/${path}`;
      const success = await this.api.createFile(absolutePath, content);

      if (!success) {
        return errCode('IO_ERROR', `Failed to create file: ${path}`, path);
      }

      return ok(undefined);
    } catch (e) {
      return errCode('IO_ERROR', `Failed to create file: ${(e as Error).message}`, path);
    }
  }

  async deleteFile(path: string): Promise<Result<void>> {
    if (!this._projectPath) {
      return errCode('NOT_INITIALIZED', 'No project open', path);
    }

    try {
      const absolutePath = `${this._projectPath}/${path}`;
      const success = await this.api.deleteFile(absolutePath);

      if (!success) {
        return errCode('IO_ERROR', `Failed to delete file: ${path}`, path);
      }

      return ok(undefined);
    } catch (e) {
      return errCode('IO_ERROR', `Failed to delete file: ${(e as Error).message}`, path);
    }
  }

  async renameFile(oldPath: string, newPath: string): Promise<Result<void>> {
    if (!this._projectPath) {
      return errCode('NOT_INITIALIZED', 'No project open');
    }

    try {
      const oldAbsPath = `${this._projectPath}/${oldPath}`;
      const newAbsPath = `${this._projectPath}/${newPath}`;
      const success = await this.api.renameFile(oldAbsPath, newAbsPath);

      if (!success) {
        return errCode('IO_ERROR', `Failed to rename file: ${oldPath}`);
      }

      return ok(undefined);
    } catch (e) {
      return errCode('IO_ERROR', `Failed to rename file: ${(e as Error).message}`);
    }
  }

  // === Standalone File Operations ===

  async openStandaloneFile(): Promise<Result<FileContent>> {
    try {
      const result = await this.api.openFile();
      if (!result) {
        return errCode('CANCELLED', 'User cancelled file selection');
      }

      // For standalone files, use the filename as path
      const filename = result.path.split(/[/\\]/).pop() || result.path;
      return ok({ path: filename, content: result.content });
    } catch (e) {
      return errCode('IO_ERROR', `Failed to open file: ${(e as Error).message}`);
    }
  }

  async saveStandaloneFile(content: string, _suggestedName?: string): Promise<Result<string>> {
    try {
      const path = await this.api.saveFileAs(content);
      if (!path) {
        return errCode('CANCELLED', 'User cancelled save');
      }

      const filename = path.split(/[/\\]/).pop() || path;
      return ok(filename);
    } catch (e) {
      return errCode('IO_ERROR', `Failed to save file: ${(e as Error).message}`);
    }
  }

  // === Helper Methods ===

  /**
   * Convert absolute paths in FileEntry tree to project-relative
   */
  private toRelativePaths(entry: FileEntry): FileEntry {
    return {
      ...entry,
      path: this.toRelativePath(entry.path),
      children: entry.children?.map((c) => this.toRelativePaths(c)),
    };
  }

  /**
   * Convert absolute path to project-relative
   */
  private toRelativePath(absolutePath: string): string {
    if (!this._projectPath) return absolutePath;

    // Normalize separators
    const normalized = absolutePath.replace(/\\/g, '/');
    const projectNormalized = this._projectPath.replace(/\\/g, '/');

    if (normalized === projectNormalized) {
      return '';
    }

    if (normalized.startsWith(`${projectNormalized}/`)) {
      return normalized.slice(projectNormalized.length + 1);
    }

    return absolutePath;
  }

  /**
   * Map event type string to DirectoryChangeEvent type
   */
  private mapEventType(eventType: string): DirectoryChangeEvent['type'] {
    switch (eventType) {
      case 'add':
      case 'addDir':
        return 'create';
      case 'change':
        return 'modify';
      case 'unlink':
      case 'unlinkDir':
        return 'delete';
      default:
        return 'unknown';
    }
  }
}
