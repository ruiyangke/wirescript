import { type FSWatcher, watch } from 'node:fs';
import { readdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';

// Enable Wayland support if available
if (process.env.XDG_SESSION_TYPE === 'wayland') {
  app.commandLine.appendSwitch('ozone-platform', 'wayland');
  app.commandLine.appendSwitch('enable-features', 'UseOzonePlatform,WaylandWindowDecorations');
}

// File entry type for directory tree
interface FileEntry {
  path: string;
  name: string;
  type: 'file' | 'directory';
  children?: FileEntry[];
}

let mainWindow: BrowserWindow | null = null;
let currentFilePath: string | null = null;
let directoryWatcher: FSWatcher | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: join(__dirname, 'preload.cjs'),
    },
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 15, y: 15 },
  });

  // Load the app
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'));
  }

  // Update title when file is opened
  mainWindow.on('page-title-updated', (e) => {
    e.preventDefault();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers

// Open file dialog
ipcMain.handle('open-file-dialog', async () => {
  if (!mainWindow) return null;

  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Open WireScript File',
    filters: [
      { name: 'WireScript Files', extensions: ['wire'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    properties: ['openFile'],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const filePath = result.filePaths[0];
  try {
    const content = await readFile(filePath, 'utf-8');
    currentFilePath = filePath;
    updateWindowTitle(filePath);
    return { path: filePath, content };
  } catch (error) {
    dialog.showErrorBox('Error', `Failed to read file: ${(error as Error).message}`);
    return null;
  }
});

// Save file dialog (save as)
ipcMain.handle('save-file-dialog', async (_event, content: string) => {
  if (!mainWindow) return null;

  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Save WireScript File',
    defaultPath: currentFilePath || 'untitled.wire',
    filters: [
      { name: 'WireScript Files', extensions: ['wire'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (result.canceled || !result.filePath) {
    return null;
  }

  try {
    await writeFile(result.filePath, content, 'utf-8');
    currentFilePath = result.filePath;
    updateWindowTitle(result.filePath);
    return result.filePath;
  } catch (error) {
    dialog.showErrorBox('Error', `Failed to save file: ${(error as Error).message}`);
    return null;
  }
});

// Save to current file
ipcMain.handle('save-file', async (_event, filePath: string, content: string) => {
  try {
    await writeFile(filePath, content, 'utf-8');
    currentFilePath = filePath;
    updateWindowTitle(filePath);
    return true;
  } catch (error) {
    dialog.showErrorBox('Error', `Failed to save file: ${(error as Error).message}`);
    return false;
  }
});

// Read file by path (for drag & drop)
ipcMain.handle('read-file', async (_event, filePath: string) => {
  try {
    const content = await readFile(filePath, 'utf-8');
    currentFilePath = filePath;
    updateWindowTitle(filePath);
    return { path: filePath, content };
  } catch (error) {
    dialog.showErrorBox('Error', `Failed to read file: ${(error as Error).message}`);
    return null;
  }
});

// Get current file path
ipcMain.handle('get-current-file', () => {
  return currentFilePath;
});

// Set window title
ipcMain.handle('set-title', (_event, title: string) => {
  if (mainWindow) {
    mainWindow.setTitle(title);
  }
});

function updateWindowTitle(filePath: string | null) {
  if (!mainWindow) return;

  if (filePath) {
    const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || filePath;
    mainWindow.setTitle(`${fileName} - WireScript`);
  } else {
    mainWindow.setTitle('WireScript');
  }
}

// Helper: Read directory recursively (only .wire files)
async function readDirectoryRecursive(dirPath: string): Promise<FileEntry> {
  const name = basename(dirPath);
  const entries = await readdir(dirPath, { withFileTypes: true });
  const children: FileEntry[] = [];

  for (const entry of entries) {
    // Skip hidden files and common non-project directories
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') {
      continue;
    }

    const childPath = join(dirPath, entry.name);

    if (entry.isDirectory()) {
      const childDir = await readDirectoryRecursive(childPath);
      // Only include directories that contain .wire files
      if (childDir.children && childDir.children.length > 0) {
        children.push(childDir);
      }
    } else if (entry.name.endsWith('.wire')) {
      children.push({ path: childPath, name: entry.name, type: 'file' });
    }
  }

  // Sort: directories first, then files, alphabetically
  children.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return { path: dirPath, name, type: 'directory', children };
}

// Open folder dialog
ipcMain.handle('open-folder-dialog', async () => {
  if (!mainWindow) return null;

  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Open Project Folder',
    properties: ['openDirectory'],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
});

// Read directory contents
ipcMain.handle('read-directory', async (_event, dirPath: string) => {
  try {
    return await readDirectoryRecursive(dirPath);
  } catch (error) {
    console.error('Failed to read directory:', error);
    return null;
  }
});

// Watch directory for changes
ipcMain.handle('watch-directory', async (_event, dirPath: string) => {
  // Clean up existing watcher
  if (directoryWatcher) {
    directoryWatcher.close();
    directoryWatcher = null;
  }

  try {
    directoryWatcher = watch(dirPath, { recursive: true }, (eventType, filename) => {
      if (filename?.endsWith('.wire')) {
        mainWindow?.webContents.send('directory-changed', { eventType, filename });
      }
    });
    return true;
  } catch (error) {
    console.error('Failed to watch directory:', error);
    return false;
  }
});

// Stop watching directory
ipcMain.handle('unwatch-directory', async () => {
  if (directoryWatcher) {
    directoryWatcher.close();
    directoryWatcher = null;
  }
});

// Create new file
ipcMain.handle('create-file', async (_event, filePath: string, content: string = '') => {
  try {
    // Default content for new .wire files
    const defaultContent =
      content ||
      `(wire
  (meta
    :title "${basename(filePath, '.wire')}"
    :context demo)

  (screen main "Main" :desktop
    (box :col :center :gap 24 :padding 48
      (text "New Wireframe" :high))))
`;
    await writeFile(filePath, defaultContent, 'utf-8');
    return true;
  } catch (error) {
    dialog.showErrorBox('Error', `Failed to create file: ${(error as Error).message}`);
    return false;
  }
});

// Delete file
ipcMain.handle('delete-file', async (_event, filePath: string) => {
  if (!mainWindow) return false;

  const result = await dialog.showMessageBox(mainWindow, {
    type: 'warning',
    buttons: ['Delete', 'Cancel'],
    defaultId: 1,
    title: 'Confirm Delete',
    message: `Are you sure you want to delete "${basename(filePath)}"?`,
  });

  if (result.response === 0) {
    try {
      await unlink(filePath);
      return true;
    } catch (error) {
      dialog.showErrorBox('Error', `Failed to delete file: ${(error as Error).message}`);
    }
  }
  return false;
});

// Rename file
ipcMain.handle('rename-file', async (_event, oldPath: string, newPath: string) => {
  try {
    await rename(oldPath, newPath);
    return true;
  } catch (error) {
    dialog.showErrorBox('Error', `Failed to rename file: ${(error as Error).message}`);
    return false;
  }
});
