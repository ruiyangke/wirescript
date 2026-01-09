import { contextBridge, type IpcRendererEvent, ipcRenderer } from 'electron';

interface FileEntry {
  path: string;
  name: string;
  type: 'file' | 'directory';
  children?: FileEntry[];
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Open file dialog and return file content
  openFile: (): Promise<{ path: string; content: string } | null> => {
    return ipcRenderer.invoke('open-file-dialog');
  },

  // Save file with dialog (save as)
  saveFileAs: (content: string): Promise<string | null> => {
    return ipcRenderer.invoke('save-file-dialog', content);
  },

  // Save to specific path
  saveFile: (filePath: string, content: string): Promise<boolean> => {
    return ipcRenderer.invoke('save-file', filePath, content);
  },

  // Read file by path (for drag & drop)
  readFile: (filePath: string): Promise<{ path: string; content: string } | null> => {
    return ipcRenderer.invoke('read-file', filePath);
  },

  // Get current file path
  getCurrentFile: (): Promise<string | null> => {
    return ipcRenderer.invoke('get-current-file');
  },

  // Set window title
  setTitle: (title: string): Promise<void> => {
    return ipcRenderer.invoke('set-title', title);
  },

  // Open folder dialog
  openFolder: (): Promise<string | null> => {
    return ipcRenderer.invoke('open-folder-dialog');
  },

  // Read directory structure
  readDirectory: (dirPath: string): Promise<FileEntry | null> => {
    return ipcRenderer.invoke('read-directory', dirPath);
  },

  // Watch directory for changes
  watchDirectory: (dirPath: string): Promise<boolean> => {
    return ipcRenderer.invoke('watch-directory', dirPath);
  },

  // Stop watching directory
  unwatchDirectory: (): Promise<void> => {
    return ipcRenderer.invoke('unwatch-directory');
  },

  // Listen for directory changes (returns unsubscribe function)
  onDirectoryChanged: (
    callback: (event: { eventType: string; filename: string }) => void
  ): (() => void) => {
    const handler = (_event: IpcRendererEvent, data: { eventType: string; filename: string }) =>
      callback(data);
    ipcRenderer.on('directory-changed', handler);
    // Return unsubscribe function
    return () => {
      ipcRenderer.removeListener('directory-changed', handler);
    };
  },

  // Create new file
  createFile: (filePath: string, content?: string): Promise<boolean> => {
    return ipcRenderer.invoke('create-file', filePath, content);
  },

  // Delete file
  deleteFile: (filePath: string): Promise<boolean> => {
    return ipcRenderer.invoke('delete-file', filePath);
  },

  // Rename file
  renameFile: (oldPath: string, newPath: string): Promise<boolean> => {
    return ipcRenderer.invoke('rename-file', oldPath, newPath);
  },

  // Check if running in Electron
  isElectron: true,
});
