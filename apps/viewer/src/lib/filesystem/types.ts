/**
 * Filesystem abstraction layer types
 *
 * PATH CONTRACT:
 * All paths in this API are "project-relative" paths:
 * - Root directory is represented as empty string ""
 * - Files are "subdir/file.wire" (no leading slash)
 * - The project name is NOT part of the path
 *
 * Example: If user opens folder "my-project" containing "screens/home.wire"
 * - projectName = "my-project"
 * - file path = "screens/home.wire"
 *
 * For standalone files (opened via openFile picker, not part of project):
 * - path = filename only, e.g. "standalone.wire"
 */

/**
 * Error codes for filesystem operations
 */
export type FileSystemErrorCode =
  | 'NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'ALREADY_EXISTS'
  | 'NOT_INITIALIZED'
  | 'CANCELLED'
  | 'INVALID_PATH'
  | 'IO_ERROR'
  | 'NOT_SUPPORTED'
  | 'QUOTA_EXCEEDED';

/**
 * Structured error for filesystem operations
 */
export interface FileSystemError {
  code: FileSystemErrorCode;
  message: string;
  path?: string;
  cause?: unknown;
}

/**
 * Create a filesystem error
 */
export function fsError(
  code: FileSystemErrorCode,
  message: string,
  path?: string,
  cause?: unknown
): FileSystemError {
  return { code, message, path, cause };
}

/**
 * Result type - all fallible operations return this
 */
export type Result<T> = { ok: true; value: T } | { ok: false; error: FileSystemError };

/**
 * Helpers for creating results
 */
export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function err(error: FileSystemError): Result<never> {
  return { ok: false, error };
}

export function errCode(code: FileSystemErrorCode, message: string, path?: string): Result<never> {
  return { ok: false, error: fsError(code, message, path) };
}

/**
 * Represents a file or directory in the project tree
 */
export interface FileEntry {
  /** Project-relative path (empty string for root) */
  path: string;
  /** Display name */
  name: string;
  /** Entry type */
  type: 'file' | 'directory';
  /** Children (for directories) */
  children?: FileEntry[];
}

/**
 * Result of reading a file
 */
export interface FileContent {
  /** Project-relative path */
  path: string;
  /** File content as string */
  content: string;
}

/**
 * Directory change event
 */
export interface DirectoryChangeEvent {
  type: 'create' | 'modify' | 'delete' | 'rename' | 'unknown';
  path: string;
}

/**
 * Callback for directory changes
 */
export type DirectoryChangeCallback = (event: DirectoryChangeEvent) => void;

/**
 * Filesystem capabilities - what this implementation supports
 */
export interface FileSystemCapabilities {
  /** Can watch for real-time changes */
  watch: boolean;
  /** Can create/modify/delete files */
  write: boolean;
  /** Can open folders (vs single files only) */
  folders: boolean;
  /** Can persist across sessions */
  persist: boolean;
}

/**
 * Filesystem type identifier
 */
export type FileSystemType = 'electron' | 'browser' | 'fallback';

/**
 * Abstract filesystem interface
 *
 * All paths are project-relative (see PATH CONTRACT above).
 * All fallible operations return Result<T> for proper error handling.
 */
export interface FileSystemAPI {
  /** Implementation type */
  readonly type: FileSystemType;

  /** What this implementation supports */
  readonly capabilities: FileSystemCapabilities;

  /** Current project name (folder name), null if no project open */
  readonly projectName: string | null;

  /** Whether a project is currently open */
  readonly isProjectOpen: boolean;

  // === Project Lifecycle ===

  /**
   * Open a folder as project root via picker dialog
   * @returns Project name on success
   */
  openProject(): Promise<Result<string>>;

  /**
   * Try to restore previously opened project (browser session restore)
   * @returns Project name on success, NOT_FOUND if nothing to restore
   */
  restoreProject(): Promise<Result<string>>;

  /**
   * Close current project and reset state
   */
  closeProject(): Promise<void>;

  // === Directory Operations ===

  /**
   * Read directory tree (filtered to .wire files)
   * @param path Project-relative path (empty string for root)
   */
  readDirectory(path: string): Promise<Result<FileEntry>>;

  /**
   * Start watching directory for changes
   * @param path Project-relative path
   * @param callback Called on changes
   */
  watchDirectory(path: string, callback: DirectoryChangeCallback): Promise<Result<void>>;

  /**
   * Stop watching directory
   */
  unwatchDirectory(): Promise<void>;

  // === File Operations ===

  /**
   * Read file content
   * @param path Project-relative path
   */
  readFile(path: string): Promise<Result<FileContent>>;

  /**
   * Write content to existing file
   * @param path Project-relative path
   * @param content New content
   */
  writeFile(path: string, content: string): Promise<Result<void>>;

  /**
   * Create new file
   * @param path Project-relative path
   * @param content Initial content (uses template if not provided)
   */
  createFile(path: string, content?: string): Promise<Result<void>>;

  /**
   * Delete file
   * @param path Project-relative path
   */
  deleteFile(path: string): Promise<Result<void>>;

  /**
   * Rename/move file
   * @param oldPath Current project-relative path
   * @param newPath New project-relative path
   */
  renameFile(oldPath: string, newPath: string): Promise<Result<void>>;

  // === Standalone File Operations (outside project) ===

  /**
   * Open single file via picker (not part of project)
   * Useful for quick edits or when folders not supported
   */
  openStandaloneFile(): Promise<Result<FileContent>>;

  /**
   * Save content to new file via picker
   * @param content Content to save
   * @param suggestedName Suggested filename
   * @returns Chosen filename
   */
  saveStandaloneFile(content: string, suggestedName?: string): Promise<Result<string>>;
}

/**
 * Storage adapter for handle persistence (IndexedDB abstraction)
 */
export interface HandleStorage {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<void>;
}

/**
 * Environment detection
 */
export function isElectron(): boolean {
  return typeof window !== 'undefined' && !!window.electronAPI?.isElectron;
}

export function hasFileSystemAccess(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

export function detectFileSystemType(): FileSystemType {
  if (isElectron()) return 'electron';
  if (hasFileSystemAccess()) return 'browser';
  return 'fallback';
}
