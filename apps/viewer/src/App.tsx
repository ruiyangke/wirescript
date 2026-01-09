import { ThemeProvider, type Viewport } from '@wirescript/renderer';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ContextMenu } from './components/ContextMenu';
import { Editor } from './components/Editor';
import { Sidebar } from './components/Sidebar';
import { ConfirmDialog, EditorDrawerHandle, InputDialog } from './components/shared';
import { TabBar } from './components/TabBar';
import { getViewportForScreen, Toolbar } from './components/Toolbar';
import { Viewer } from './components/Viewer';
import { FilesProvider, useFiles } from './contexts/FilesContext';
import { ProjectProvider, useProject } from './contexts/ProjectContext';
import type { MenuItem, MenuPosition, ScreenInfo } from './types/project';
import './electron.d.ts';

const SIDEBAR_WIDTH = 250;
const EDITOR_MIN_WIDTH = 250;
const EDITOR_MAX_WIDTH = 800;
const EDITOR_DEFAULT_WIDTH = 400;

// Dialog state types
interface CreateFileDialog {
  type: 'create';
  dirPath: string;
}

interface RenameFileDialog {
  type: 'rename';
  path: string;
  currentName: string;
}

interface DeleteFileDialog {
  type: 'delete';
  path: string;
  fileName: string;
}

type FileDialog = CreateFileDialog | RenameFileDialog | DeleteFileDialog | null;

function AppContent() {
  const { projectName, openProject, createFile, deleteFile, renameFile, readFile, isInitialized } =
    useProject();
  const {
    openFiles,
    activeFileId,
    activeFile,
    tabs,
    openFile,
    closeFile,
    updateFileSource,
    markFileSaved,
    setActiveFile,
    setSelectedScreen,
    refreshAllFromFilesystem,
  } = useFiles();

  // Refresh open files from filesystem after project restore
  // This ensures external file changes are picked up on page refresh
  const hasRefreshedRef = useRef(false);
  useEffect(() => {
    if (isInitialized && projectName && !hasRefreshedRef.current) {
      hasRefreshedRef.current = true;
      // Wrap readFile to match expected signature
      const readFileFn = async (path: string) => {
        const result = await readFile(path);
        return result;
      };
      refreshAllFromFilesystem(readFileFn);
    }
  }, [isInitialized, projectName, readFile, refreshAllFromFilesystem]);

  // UI state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [editorCollapsed, setEditorCollapsed] = useState(true);
  const [editorWidth, setEditorWidth] = useState(EDITOR_DEFAULT_WIDTH);
  const [viewport, setViewport] = useState<Viewport>({ width: 1280, height: 800 }); // Desktop default
  const [zoom, setZoom] = useState(100);
  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'success' | 'error'>(
    'idle'
  );

  // Get current screen's viewport from WireScript definition
  const currentScreen = activeFile?.wireDoc?.screens.find(
    (s) => s.id === activeFile?.selectedScreen
  );
  const screenViewport = currentScreen?.viewport as 'mobile' | 'tablet' | 'desktop' | undefined;

  // Sync viewport when screen changes - update to match screen's defined viewport
  const prevScreenIdRef = useRef<string | undefined>();
  useEffect(() => {
    const currentScreenId = activeFile?.selectedScreen;
    if (currentScreenId && currentScreenId !== prevScreenIdRef.current) {
      prevScreenIdRef.current = currentScreenId;
      // Update viewport to match the new screen's definition
      const newViewport = getViewportForScreen(screenViewport);
      setViewport(newViewport);
    }
  }, [activeFile?.selectedScreen, screenViewport]);

  // Handle editor resize
  const handleEditorResize = useCallback((delta: number) => {
    setEditorWidth((prev) => {
      const newWidth = prev + delta;
      return Math.min(EDITOR_MAX_WIDTH, Math.max(EDITOR_MIN_WIDTH, newWidth));
    });
  }, []);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    position: MenuPosition;
    items: MenuItem[];
  } | null>(null);

  // Dialog state
  const [fileDialog, setFileDialog] = useState<FileDialog>(null);

  // Get screens for current file
  const screens: ScreenInfo[] =
    activeFile?.wireDoc?.screens.map((s) => ({
      id: s.id,
      name: s.name,
      viewport: s.viewport as 'mobile' | 'tablet' | 'desktop' | undefined,
    })) || [];

  // Use filesystem abstraction from project hook
  const { openStandaloneFile, writeFile, saveStandaloneFile } = useProject();

  // File handlers (work in both Electron and Browser)
  const handleOpen = useCallback(async () => {
    const result = await openStandaloneFile();
    if (result) {
      openFile(result.path, result.content);
    }
  }, [openFile, openStandaloneFile]);

  const handleSave = useCallback(async () => {
    if (!activeFile) return;

    if (activeFile.path) {
      const success = await writeFile(activeFile.path, activeFile.source);
      if (success) {
        markFileSaved(activeFile.id);
      }
    } else {
      const path = await saveStandaloneFile(activeFile.source);
      if (path) {
        markFileSaved(activeFile.id, path);
      }
    }
  }, [activeFile, markFileSaved, writeFile, saveStandaloneFile]);

  const handleSaveAs = useCallback(async () => {
    if (!activeFile) return;
    const fileName = activeFile.path?.split('/').pop() || 'untitled.wire';
    const path = await saveStandaloneFile(activeFile.source, fileName);
    if (path) {
      markFileSaved(activeFile.id, path);
    }
  }, [activeFile, markFileSaved, saveStandaloneFile]);

  // Handle tab close with unsaved warning
  const handleTabClose = useCallback(
    async (id: string) => {
      const file = openFiles.find((f) => f.id === id);
      if (!file) return;

      // TODO: Add confirmation dialog for unsaved changes
      closeFile(id);
    },
    [openFiles, closeFile]
  );

  // Dialog handlers
  const handleRequestCreateFile = useCallback((dirPath: string) => {
    setFileDialog({ type: 'create', dirPath });
  }, []);

  const handleRequestRenameFile = useCallback((path: string, currentName: string) => {
    setFileDialog({ type: 'rename', path, currentName });
  }, []);

  const handleRequestDeleteFile = useCallback((path: string, fileName: string) => {
    setFileDialog({ type: 'delete', path, fileName });
  }, []);

  const handleConfirmCreateFile = useCallback(
    async (fileName: string) => {
      if (fileDialog?.type !== 'create') return;
      const name = fileName.endsWith('.wire') ? fileName : `${fileName}.wire`;
      const createResult = await createFile(fileDialog.dirPath, name);
      if (createResult.data) {
        const result = await readFile(createResult.data);
        if (result) {
          openFile(result.path, result.content);
        }
      }
      setFileDialog(null);
    },
    [fileDialog, createFile, readFile, openFile]
  );

  const handleConfirmRenameFile = useCallback(
    async (newName: string) => {
      if (fileDialog?.type !== 'rename') return;
      const renameResult = await renameFile(fileDialog.path, newName);
      if (renameResult.data) {
        // Update open file if it was renamed
        const openedFile = openFiles.find((f) => f.path === fileDialog.path);
        if (openedFile) {
          markFileSaved(openedFile.id, renameResult.data);
        }
      }
      setFileDialog(null);
    },
    [fileDialog, renameFile, openFiles, markFileSaved]
  );

  const handleConfirmDeleteFile = useCallback(async () => {
    if (fileDialog?.type !== 'delete') return;
    const deleteResult = await deleteFile(fileDialog.path);
    if (!deleteResult.error) {
      // Close if open
      const openedFile = openFiles.find((f) => f.path === fileDialog.path);
      if (openedFile) {
        closeFile(openedFile.id);
      }
    }
    setFileDialog(null);
  }, [fileDialog, deleteFile, openFiles, closeFile]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && e.key === 'o') {
        e.preventDefault();
        void handleOpen();
      } else if (modifier && e.shiftKey && e.key === 's') {
        e.preventDefault();
        void handleSaveAs();
      } else if (modifier && e.key === 's') {
        e.preventDefault();
        void handleSave();
      } else if (modifier && e.key === 'w') {
        e.preventDefault();
        if (activeFileId) {
          void handleTabClose(activeFileId);
        }
      } else if (modifier && e.key === 'b') {
        e.preventDefault();
        setSidebarCollapsed(!sidebarCollapsed);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleOpen, handleSave, handleSaveAs, handleTabClose, activeFileId, sidebarCollapsed]);

  // Drag & drop support (works in both Electron and browser)
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        for (const file of Array.from(files)) {
          if (!file.name.endsWith('.wire')) continue;

          // Electron: files have .path property (Electron File extension)
          const filePath = 'path' in file ? (file as File & { path: string }).path : null;
          if (filePath && window.electronAPI) {
            const result = await window.electronAPI.readFile(filePath);
            if (result) {
              openFile(result.path, result.content);
            }
          } else {
            // Browser: read file content directly
            try {
              const content = await file.text();
              openFile(file.name, content);
            } catch (err) {
              console.error('Failed to read dropped file:', err);
            }
          }
        }
      }
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);
    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [openFile]);

  // Handle source change for active file
  const handleSourceChange = useCallback(
    (newSource: string) => {
      if (activeFileId) {
        updateFileSource(activeFileId, newSource);
      }
    },
    [activeFileId, updateFileSource]
  );

  // Context menu handler
  const handleContextMenu = useCallback((position: MenuPosition, items: MenuItem[]) => {
    setContextMenu({ position, items });
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Toolbar
        screens={screens.map((s) => ({ id: s.id, name: s.name }))}
        selectedScreen={activeFile?.selectedScreen}
        onScreenChange={setSelectedScreen}
        viewport={viewport}
        onViewportChange={setViewport}
        screenViewport={screenViewport}
        currentFile={activeFile?.path || null}
        hasChanges={activeFile ? activeFile.source !== activeFile.savedSource : false}
        onOpen={handleOpen}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        onOpenFolder={openProject}
        projectRoot={projectName}
        zoom={zoom}
        onZoomChange={setZoom}
        exportStatus={exportStatus}
        onExportStatusChange={setExportStatus}
      />

      {/* Tab Bar */}
      <TabBar
        tabs={tabs}
        activeTabId={activeFileId}
        onTabSelect={setActiveFile}
        onTabClose={handleTabClose}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          collapsed={sidebarCollapsed}
          width={SIDEBAR_WIDTH}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          onContextMenu={handleContextMenu}
          onRequestCreateFile={handleRequestCreateFile}
          onRequestDeleteFile={handleRequestDeleteFile}
          onRequestRenameFile={handleRequestRenameFile}
        />

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Editor Panel */}
          {!editorCollapsed && (
            <div className="relative flex flex-col h-full bg-white" style={{ width: editorWidth }}>
              <Editor
                value={activeFile?.source || ''}
                onChange={handleSourceChange}
                errors={activeFile?.errors || []}
              />
            </div>
          )}

          {/* Unified Resize Handle + Collapse Toggle */}
          <EditorDrawerHandle
            collapsed={editorCollapsed}
            onCollapsedChange={setEditorCollapsed}
            onResize={handleEditorResize}
          />

          {/* Preview Panel */}
          <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden min-w-0">
            <Viewer
              wireDoc={activeFile?.wireDoc || null}
              screenId={activeFile?.selectedScreen}
              errors={activeFile?.errors || []}
              viewport={viewport}
              onScreenChange={setSelectedScreen}
              zoom={zoom}
              onZoomChange={setZoom}
              exportStatus={exportStatus}
              onExportStatusChange={setExportStatus}
            />
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          items={contextMenu.items}
          position={contextMenu.position}
          onClose={handleCloseContextMenu}
        />
      )}

      {/* Create File Dialog */}
      <InputDialog
        isOpen={fileDialog?.type === 'create'}
        title="New File"
        message="Enter a name for the new file:"
        defaultValue="untitled.wire"
        placeholder="filename.wire"
        confirmLabel="Create"
        onConfirm={handleConfirmCreateFile}
        onCancel={() => setFileDialog(null)}
        validate={(value) => {
          if (!value.trim()) return 'File name is required';
          if (!/^[\w\-. ]+$/.test(value)) return 'Invalid characters in file name';
          return null;
        }}
      />

      {/* Rename File Dialog */}
      <InputDialog
        isOpen={fileDialog?.type === 'rename'}
        title="Rename File"
        message="Enter a new name for the file:"
        defaultValue={fileDialog?.type === 'rename' ? fileDialog.currentName : ''}
        placeholder="filename.wire"
        confirmLabel="Rename"
        onConfirm={handleConfirmRenameFile}
        onCancel={() => setFileDialog(null)}
        validate={(value) => {
          if (!value.trim()) return 'File name is required';
          if (!/^[\w\-. ]+$/.test(value)) return 'Invalid characters in file name';
          return null;
        }}
      />

      {/* Delete File Dialog */}
      <ConfirmDialog
        isOpen={fileDialog?.type === 'delete'}
        title="Delete File"
        message={`Are you sure you want to delete "${fileDialog?.type === 'delete' ? fileDialog.fileName : ''}"? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleConfirmDeleteFile}
        onCancel={() => setFileDialog(null)}
      />
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <ProjectProvider>
        <FilesProvider>
          <AppContent />
        </FilesProvider>
      </ProjectProvider>
    </ThemeProvider>
  );
}
