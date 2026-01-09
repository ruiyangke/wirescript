// Type definitions for Electron API exposed via preload script

/** File entry in directory tree */
interface FileEntry {
  path: string;
  name: string;
  type: 'file' | 'directory';
  children?: FileEntry[];
}

interface ElectronAPI {
  /** Open file dialog and return file content */
  openFile: () => Promise<{ path: string; content: string } | null>;

  /** Save file with dialog (save as) */
  saveFileAs: (content: string) => Promise<string | null>;

  /** Save to specific path */
  saveFile: (filePath: string, content: string) => Promise<boolean>;

  /** Read file by path (for drag & drop) */
  readFile: (filePath: string) => Promise<{ path: string; content: string } | null>;

  /** Get current file path */
  getCurrentFile: () => Promise<string | null>;

  /** Set window title */
  setTitle: (title: string) => Promise<void>;

  /** Open folder dialog */
  openFolder: () => Promise<string | null>;

  /** Read directory structure (recursive, .wire files only) */
  readDirectory: (dirPath: string) => Promise<FileEntry | null>;

  /** Watch directory for changes */
  watchDirectory: (dirPath: string) => Promise<boolean>;

  /** Stop watching directory */
  unwatchDirectory: () => Promise<void>;

  /** Listen for directory changes */
  onDirectoryChanged: (callback: (event: { eventType: string; filename: string }) => void) => void;

  /** Create new file */
  createFile: (filePath: string, content?: string) => Promise<boolean>;

  /** Delete file (with confirmation) */
  deleteFile: (filePath: string) => Promise<boolean>;

  /** Rename file */
  renameFile: (oldPath: string, newPath: string) => Promise<boolean>;

  /** Check if running in Electron */
  isElectron: boolean;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
