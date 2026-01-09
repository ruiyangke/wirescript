/**
 * Browser filesystem implementation using File System Access API
 * Works in Chrome, Edge, and Opera
 */

/// <reference path="./file-system-access.d.ts" />

import { HandleCache } from './cache.js';
import { IndexedDBStorage } from './storage.js';
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
import { DirectoryWatcher } from './watcher.js';

const PROJECT_KEY = 'projectRoot';

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
 * Browser File System implementation using File System Access API
 *
 * Dependencies are injected for testability:
 * - storage: For persisting handles across sessions
 * - cache: For caching file/directory handles
 * - watcher: For directory change detection
 */
export class BrowserFileSystem implements FileSystemAPI {
  readonly type = 'browser' as const;

  readonly capabilities: FileSystemCapabilities = {
    watch: true, // Via polling
    write: true,
    folders: true,
    persist: true,
  };

  private rootHandle: FileSystemDirectoryHandle | null = null;
  private _projectName: string | null = null;
  private standaloneHandles = new Map<string, FileSystemFileHandle>();

  constructor(
    private readonly storage: HandleStorage = new IndexedDBStorage(),
    private readonly cache: HandleCache = new HandleCache(),
    private readonly watcher: DirectoryWatcher = new DirectoryWatcher((path) =>
      this.readDirectoryInternal(path)
    )
  ) {}

  get projectName(): string | null {
    return this._projectName;
  }

  get isProjectOpen(): boolean {
    return this.rootHandle !== null;
  }

  // === Project Lifecycle ===

  async openProject(): Promise<Result<string>> {
    try {
      const handle = await window.showDirectoryPicker({ mode: 'readwrite' });

      this.rootHandle = handle;
      this._projectName = handle.name;
      this.cache.clear();
      this.cache.set('', handle);

      // Persist for session restore
      await this.storage.set(PROJECT_KEY, handle);

      return ok(handle.name);
    } catch (e) {
      const error = e as Error;
      if (error.name === 'AbortError') {
        return errCode('CANCELLED', 'User cancelled folder selection');
      }
      return errCode('IO_ERROR', `Failed to open folder: ${error.message}`);
    }
  }

  async restoreProject(): Promise<Result<string>> {
    try {
      const handle = await this.storage.get<FileSystemDirectoryHandle>(PROJECT_KEY);
      if (!handle) {
        return errCode('NOT_FOUND', 'No previous project to restore');
      }

      // Request permission
      const permission = await handle.requestPermission({ mode: 'readwrite' });
      if (permission !== 'granted') {
        await this.storage.delete(PROJECT_KEY);
        return errCode('PERMISSION_DENIED', 'Permission denied for previous project');
      }

      this.rootHandle = handle;
      this._projectName = handle.name;
      this.cache.clear();
      this.cache.set('', handle);

      return ok(handle.name);
    } catch (e) {
      await this.storage.delete(PROJECT_KEY).catch(() => {});
      return errCode('IO_ERROR', `Failed to restore project: ${(e as Error).message}`);
    }
  }

  async closeProject(): Promise<void> {
    await this.watcher.stop();
    this.rootHandle = null;
    this._projectName = null;
    this.cache.clear();
  }

  // === Directory Operations ===

  async readDirectory(path: string): Promise<Result<FileEntry>> {
    if (!this.rootHandle) {
      return errCode('NOT_INITIALIZED', 'No project open');
    }

    const result = await this.readDirectoryInternal(path);
    if (!result) {
      return errCode('NOT_FOUND', `Directory not found: ${path}`, path);
    }
    return ok(result);
  }

  /**
   * Internal directory read (also used by watcher)
   */
  private async readDirectoryInternal(path: string): Promise<FileEntry | null> {
    if (!this.rootHandle) return null;

    try {
      const dirHandle = path === '' ? this.rootHandle : await this.resolveDirHandle(path);

      if (!dirHandle) return null;

      return await this.readDirRecursive(dirHandle, path);
    } catch {
      return null;
    }
  }

  private async readDirRecursive(
    handle: FileSystemDirectoryHandle,
    path: string
  ): Promise<FileEntry> {
    const children: FileEntry[] = [];

    for await (const [name, childHandle] of handle.entries()) {
      // Skip hidden and common non-project dirs
      if (name.startsWith('.') || name === 'node_modules' || name === 'dist') {
        continue;
      }

      const childPath = path ? `${path}/${name}` : name;

      if (childHandle.kind === 'directory') {
        this.cache.set(childPath, childHandle);
        const childEntry = await this.readDirRecursive(childHandle, childPath);
        // Only include dirs that contain .wire files
        if (childEntry.children && childEntry.children.length > 0) {
          children.push(childEntry);
        }
      } else if (name.endsWith('.wire')) {
        this.cache.set(childPath, childHandle);
        children.push({ path: childPath, name, type: 'file' });
      }
    }

    // Sort: directories first, then alphabetically
    children.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return {
      path,
      name: handle.name,
      type: 'directory',
      children,
    };
  }

  async watchDirectory(path: string, callback: DirectoryChangeCallback): Promise<Result<void>> {
    if (!this.rootHandle) {
      return errCode('NOT_INITIALIZED', 'No project open');
    }

    await this.watcher.start(path, callback);
    return ok(undefined);
  }

  async unwatchDirectory(): Promise<void> {
    this.watcher.stop();
  }

  // === File Operations ===

  async readFile(path: string): Promise<Result<FileContent>> {
    // Check standalone files first
    const standaloneHandle = this.standaloneHandles.get(path);
    if (standaloneHandle) {
      try {
        const file = await standaloneHandle.getFile();
        const content = await file.text();
        return ok({ path, content });
      } catch (e) {
        return errCode('IO_ERROR', `Failed to read file: ${(e as Error).message}`, path);
      }
    }

    if (!this.rootHandle) {
      return errCode('NOT_INITIALIZED', 'No project open', path);
    }

    const handle = await this.resolveFileHandle(path);
    if (!handle) {
      return errCode('NOT_FOUND', `File not found: ${path}`, path);
    }

    try {
      const file = await handle.getFile();
      const content = await file.text();
      return ok({ path, content });
    } catch (e) {
      return errCode('IO_ERROR', `Failed to read file: ${(e as Error).message}`, path);
    }
  }

  async writeFile(path: string, content: string): Promise<Result<void>> {
    // Check standalone files first
    const standaloneHandle = this.standaloneHandles.get(path);
    if (standaloneHandle) {
      try {
        const writable = await standaloneHandle.createWritable();
        await writable.write(content);
        await writable.close();
        return ok(undefined);
      } catch (e) {
        return errCode('IO_ERROR', `Failed to write file: ${(e as Error).message}`, path);
      }
    }

    if (!this.rootHandle) {
      return errCode('NOT_INITIALIZED', 'No project open', path);
    }

    const handle = await this.resolveFileHandle(path);
    if (!handle) {
      return errCode('NOT_FOUND', `File not found: ${path}`, path);
    }

    try {
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
      return ok(undefined);
    } catch (e) {
      return errCode('IO_ERROR', `Failed to write file: ${(e as Error).message}`, path);
    }
  }

  async createFile(path: string, content?: string): Promise<Result<void>> {
    if (!this.rootHandle) {
      return errCode('NOT_INITIALIZED', 'No project open', path);
    }

    const { dir, name } = this.splitPath(path);
    if (!name) {
      return errCode('INVALID_PATH', 'Invalid file path', path);
    }

    const parentHandle = dir ? await this.resolveDirHandle(dir) : this.rootHandle;
    if (!parentHandle) {
      return errCode('NOT_FOUND', `Parent directory not found: ${dir}`, path);
    }

    try {
      const fileHandle = await parentHandle.getFileHandle(name, { create: true });
      this.cache.set(path, fileHandle);

      const fileContent = content ?? defaultFileContent(name);
      const writable = await fileHandle.createWritable();
      await writable.write(fileContent);
      await writable.close();

      return ok(undefined);
    } catch (e) {
      return errCode('IO_ERROR', `Failed to create file: ${(e as Error).message}`, path);
    }
  }

  async deleteFile(path: string): Promise<Result<void>> {
    if (!this.rootHandle) {
      return errCode('NOT_INITIALIZED', 'No project open', path);
    }

    const { dir, name } = this.splitPath(path);
    if (!name) {
      return errCode('INVALID_PATH', 'Invalid file path', path);
    }

    const parentHandle = dir ? await this.resolveDirHandle(dir) : this.rootHandle;
    if (!parentHandle) {
      return errCode('NOT_FOUND', `Parent directory not found: ${dir}`, path);
    }

    try {
      await parentHandle.removeEntry(name);
      this.cache.delete(path);
      return ok(undefined);
    } catch (e) {
      const error = e as Error;
      if (error.name === 'NotFoundError') {
        return errCode('NOT_FOUND', `File not found: ${path}`, path);
      }
      return errCode('IO_ERROR', `Failed to delete file: ${error.message}`, path);
    }
  }

  async renameFile(oldPath: string, newPath: string): Promise<Result<void>> {
    // Read content first (before any modifications)
    const readResult = await this.readFile(oldPath);
    if (!readResult.ok) {
      return readResult;
    }

    // Create new file
    const createResult = await this.createFile(newPath, readResult.value.content);
    if (!createResult.ok) {
      return createResult;
    }

    // Delete old file
    const deleteResult = await this.deleteFile(oldPath);
    if (!deleteResult.ok) {
      // Rollback: try to delete the new file
      await this.deleteFile(newPath).catch(() => {});
      return deleteResult;
    }

    return ok(undefined);
  }

  // === Standalone File Operations ===

  async openStandaloneFile(): Promise<Result<FileContent>> {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [{ description: 'WireScript Files', accept: { 'text/plain': ['.wire'] } }],
      });

      const file = await handle.getFile();
      const content = await file.text();
      const path = handle.name;

      // Store handle for later saves
      this.standaloneHandles.set(path, handle);

      return ok({ path, content });
    } catch (e) {
      const error = e as Error;
      if (error.name === 'AbortError') {
        return errCode('CANCELLED', 'User cancelled file selection');
      }
      return errCode('IO_ERROR', `Failed to open file: ${error.message}`);
    }
  }

  async saveStandaloneFile(content: string, suggestedName?: string): Promise<Result<string>> {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: suggestedName || 'untitled.wire',
        types: [{ description: 'WireScript Files', accept: { 'text/plain': ['.wire'] } }],
      });

      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();

      // Store handle for later saves
      this.standaloneHandles.set(handle.name, handle);

      return ok(handle.name);
    } catch (e) {
      const error = e as Error;
      if (error.name === 'AbortError') {
        return errCode('CANCELLED', 'User cancelled save');
      }
      return errCode('IO_ERROR', `Failed to save file: ${error.message}`);
    }
  }

  // === Helper Methods ===

  /**
   * Resolve a directory handle by path
   */
  private async resolveDirHandle(path: string): Promise<FileSystemDirectoryHandle | null> {
    if (!path) return this.rootHandle;

    // Check cache
    const cached = this.cache.getDirectory(path);
    if (cached) return cached;

    if (!this.rootHandle) return null;

    // Navigate from root
    const parts = path.split('/').filter(Boolean);
    let current = this.rootHandle;

    for (const part of parts) {
      try {
        current = await current.getDirectoryHandle(part);
      } catch {
        return null;
      }
    }

    this.cache.set(path, current);
    return current;
  }

  /**
   * Resolve a file handle by path
   */
  private async resolveFileHandle(path: string): Promise<FileSystemFileHandle | null> {
    // Check cache
    const cached = this.cache.getFile(path);
    if (cached) return cached;

    const { dir, name } = this.splitPath(path);
    if (!name) return null;

    const parentHandle = dir ? await this.resolveDirHandle(dir) : this.rootHandle;
    if (!parentHandle) return null;

    try {
      const handle = await parentHandle.getFileHandle(name);
      this.cache.set(path, handle);
      return handle;
    } catch {
      return null;
    }
  }

  /**
   * Split path into directory and filename
   */
  private splitPath(path: string): { dir: string; name: string } {
    const lastSlash = path.lastIndexOf('/');
    if (lastSlash === -1) {
      return { dir: '', name: path };
    }
    return {
      dir: path.substring(0, lastSlash),
      name: path.substring(lastSlash + 1),
    };
  }
}
