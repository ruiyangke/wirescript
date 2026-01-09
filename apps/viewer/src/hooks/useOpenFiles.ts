import { compile, type WireDocument } from '@wirescript/dsl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { OpenFile, TabInfo } from '../types/project';

/** Debounce delay for compilation (ms) */
const COMPILE_DEBOUNCE_MS = 300;

/** LocalStorage key for auto-save */
const STORAGE_KEY = 'wirescript-editor-state';

/** Debounce delay for localStorage save (ms) */
const SAVE_DEBOUNCE_MS = 500;

interface StoredState {
  files: Array<{
    id: string;
    path: string;
    name: string;
    source: string;
    selectedScreen?: string;
  }>;
  activeFileId: string;
}

const DEFAULT_WIRESCRIPT = `(wire
  (meta
    :title "Untitled"
    :context demo)

  (screen main "Main" :desktop
    (box :col :center :gap 24 :padding 48
      (text "New Wireframe" :high)
      (text "Start designing your wireframe" :low))))
`;

/**
 * Compile source and return document/errors
 */
function compileSource(source: string) {
  const result = compile(source);
  if (result.success && result.document) {
    return {
      wireDoc: result.document,
      errors: [] as string[],
      defaultScreen: result.document.screens[0]?.id,
    };
  }
  return {
    wireDoc: null as WireDocument | null,
    errors: result.errors.map((e) => `Line ${e.line}: ${e.message}`),
    defaultScreen: undefined,
  };
}

/**
 * Create a new untitled file
 */
function createUntitledFile(): OpenFile {
  const result = compile(DEFAULT_WIRESCRIPT);
  return {
    id: `untitled-${Date.now()}`,
    path: '',
    name: 'Untitled',
    source: DEFAULT_WIRESCRIPT,
    savedSource: DEFAULT_WIRESCRIPT,
    wireDoc: result.document ?? null,
    errors: result.success ? [] : result.errors.map((e) => `Line ${e.line}: ${e.message}`),
    selectedScreen: result.document?.screens[0]?.id,
  };
}

/**
 * Load state from localStorage
 */
function loadFromStorage(): { files: OpenFile[]; activeFileId: string } | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const state: StoredState = JSON.parse(stored);
    if (!state.files || state.files.length === 0) return null;

    // Recompile all files from their source
    const files: OpenFile[] = state.files.map((f) => {
      const { wireDoc, errors, defaultScreen } = compileSource(f.source);
      return {
        id: f.id,
        path: f.path,
        name: f.name,
        source: f.source,
        savedSource: f.source, // Treat as saved on load
        wireDoc,
        errors,
        selectedScreen: f.selectedScreen || defaultScreen,
      };
    });

    return {
      files,
      activeFileId: state.activeFileId || files[0].id,
    };
  } catch {
    return null;
  }
}

/**
 * Save state to localStorage
 */
function saveToStorage(files: OpenFile[], activeFileId: string): void {
  try {
    const state: StoredState = {
      files: files.map((f) => ({
        id: f.id,
        path: f.path,
        name: f.name,
        source: f.source,
        selectedScreen: f.selectedScreen,
      })),
      activeFileId,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors (e.g., quota exceeded)
  }
}

/**
 * Hook for managing open files state
 */
export function useOpenFiles() {
  // Initialize from localStorage or create default
  const [openFiles, setOpenFiles] = useState<OpenFile[]>(() => {
    const stored = loadFromStorage();
    if (stored) return stored.files;

    const result = compile(DEFAULT_WIRESCRIPT);
    return [
      {
        id: 'untitled',
        path: '',
        name: 'Untitled',
        source: DEFAULT_WIRESCRIPT,
        savedSource: DEFAULT_WIRESCRIPT,
        wireDoc: result.document ?? null,
        errors: result.success ? [] : result.errors.map((e) => `Line ${e.line}: ${e.message}`),
        selectedScreen: result.document?.screens[0]?.id,
      },
    ];
  });

  const [activeFileId, setActiveFileId] = useState<string>(() => {
    const stored = loadFromStorage();
    return stored?.activeFileId || 'untitled';
  });

  // Debounce timer for compilation
  const compileTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce timer for localStorage save
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Save to localStorage when state changes (debounced)
  useEffect(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      saveToStorage(openFiles, activeFileId);
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [openFiles, activeFileId]);

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      if (compileTimerRef.current) {
        clearTimeout(compileTimerRef.current);
      }
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  // Derived state
  const activeFile = useMemo(
    () => openFiles.find((f) => f.id === activeFileId) || null,
    [openFiles, activeFileId]
  );

  const tabs: TabInfo[] = useMemo(
    () =>
      openFiles.map((f) => ({
        id: f.id,
        name: f.name,
        hasChanges: f.source !== f.savedSource,
      })),
    [openFiles]
  );

  const hasUnsavedChanges = useMemo(
    () => openFiles.some((f) => f.source !== f.savedSource),
    [openFiles]
  );

  // Open a file (or switch to it if already open)
  // If forceReload is true, refresh content even if file is already open
  const openFile = useCallback(
    (path: string, content: string, name?: string, forceReload?: boolean) => {
      const existingFile = openFiles.find((f) => f.path === path);

      if (existingFile) {
        // If forceReload and content differs, update the file
        if (forceReload && content !== existingFile.savedSource) {
          const { wireDoc, errors, defaultScreen } = compileSource(content);
          const screenIds = wireDoc?.screens.map((s) => s.id) || [];
          const selectedScreen =
            existingFile.selectedScreen && screenIds.includes(existingFile.selectedScreen)
              ? existingFile.selectedScreen
              : defaultScreen;

          setOpenFiles((prev) =>
            prev.map((f) => {
              if (f.id !== existingFile.id) return f;
              return {
                ...f,
                source: content,
                savedSource: content,
                wireDoc,
                errors,
                selectedScreen,
              };
            })
          );
        }
        setActiveFileId(existingFile.id);
        return;
      }

      const fileName = name || path.split('/').pop() || path.split('\\').pop() || 'Untitled';
      const { wireDoc, errors, defaultScreen } = compileSource(content);

      const newFile: OpenFile = {
        id: path || `untitled-${Date.now()}`,
        path,
        name: fileName,
        source: content,
        savedSource: content,
        wireDoc,
        errors,
        selectedScreen: defaultScreen,
      };

      setOpenFiles((prev) => [...prev, newFile]);
      setActiveFileId(newFile.id);
    },
    [openFiles]
  );

  // Reload a file from external content (e.g., filesystem change)
  const reloadFile = useCallback((path: string, content: string) => {
    setOpenFiles((prev) =>
      prev.map((f) => {
        if (f.path !== path) return f;

        // Only reload if content actually changed
        if (f.savedSource === content) return f;

        const { wireDoc, errors, defaultScreen } = compileSource(content);
        const screenIds = wireDoc?.screens.map((s) => s.id) || [];
        const selectedScreen =
          f.selectedScreen && screenIds.includes(f.selectedScreen)
            ? f.selectedScreen
            : defaultScreen;

        return {
          ...f,
          source: content,
          savedSource: content,
          wireDoc,
          errors,
          selectedScreen,
        };
      })
    );
  }, []);

  // Close a file
  const closeFile = useCallback(
    (id: string) => {
      setOpenFiles((prev) => {
        const newFiles = prev.filter((f) => f.id !== id);

        // If we're closing the active file, switch to another
        if (id === activeFileId && newFiles.length > 0) {
          const closedIndex = prev.findIndex((f) => f.id === id);
          const newActiveIndex = Math.min(closedIndex, newFiles.length - 1);
          setActiveFileId(newFiles[newActiveIndex].id);
        }

        // If no files left, create a new untitled file
        if (newFiles.length === 0) {
          const untitledFile = createUntitledFile();
          setActiveFileId(untitledFile.id);
          return [untitledFile];
        }

        return newFiles;
      });
    },
    [activeFileId]
  );

  // Update file source (while editing) - debounced compilation
  const updateFileSource = useCallback((id: string, source: string) => {
    // Update source immediately for responsive typing
    setOpenFiles((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;
        return { ...f, source };
      })
    );

    // Clear existing timer
    if (compileTimerRef.current) {
      clearTimeout(compileTimerRef.current);
    }

    // Debounce compilation
    compileTimerRef.current = setTimeout(() => {
      const { wireDoc, errors, defaultScreen } = compileSource(source);

      setOpenFiles((prev) =>
        prev.map((f) => {
          if (f.id !== id) return f;

          // Preserve selected screen if it still exists, otherwise use first
          const screenIds = wireDoc?.screens.map((s) => s.id) || [];
          const selectedScreen =
            f.selectedScreen && screenIds.includes(f.selectedScreen)
              ? f.selectedScreen
              : defaultScreen;

          return {
            ...f,
            wireDoc,
            errors,
            selectedScreen,
          };
        })
      );
    }, COMPILE_DEBOUNCE_MS);
  }, []);

  // Mark file as saved
  const markFileSaved = useCallback(
    (id: string, newPath?: string) => {
      setOpenFiles((prev) =>
        prev.map((f) => {
          if (f.id !== id) return f;

          const updatedFile = {
            ...f,
            savedSource: f.source,
          };

          // If path changed (Save As), update path and name
          if (newPath && newPath !== f.path) {
            const newName = newPath.split('/').pop() || newPath.split('\\').pop() || f.name;
            return {
              ...updatedFile,
              id: newPath,
              path: newPath,
              name: newName,
            };
          }

          return updatedFile;
        })
      );

      // Update activeFileId if path changed
      if (newPath && id === activeFileId) {
        setActiveFileId(newPath);
      }
    },
    [activeFileId]
  );

  // Set selected screen for active file
  const setSelectedScreen = useCallback(
    (screenId: string) => {
      if (!activeFileId) return;

      setOpenFiles((prev) =>
        prev.map((f) => (f.id === activeFileId ? { ...f, selectedScreen: screenId } : f))
      );
    },
    [activeFileId]
  );

  // Reorder tabs
  const reorderTabs = useCallback((fromIndex: number, toIndex: number) => {
    setOpenFiles((prev) => {
      const newFiles = [...prev];
      const [moved] = newFiles.splice(fromIndex, 1);
      newFiles.splice(toIndex, 0, moved);
      return newFiles;
    });
  }, []);

  // Check if a file is open
  const isFileOpen = useCallback(
    (path: string) => {
      return openFiles.some((f) => f.path === path);
    },
    [openFiles]
  );

  // Get file by path
  const getFileByPath = useCallback(
    (path: string) => {
      return openFiles.find((f) => f.path === path);
    },
    [openFiles]
  );

  // Get open file paths
  const openFilePaths = useMemo(() => openFiles.map((f) => f.path).filter(Boolean), [openFiles]);

  // Clear localStorage cache (useful when project changes externally)
  const clearCache = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Refresh all open files from filesystem
  // Call this after project restore to sync with external changes
  const refreshAllFromFilesystem = useCallback(
    async (readFileFn: (path: string) => Promise<{ path: string; content: string } | null>) => {
      const filesToRefresh = openFiles.filter((f) => f.path); // Only refresh files with paths

      for (const file of filesToRefresh) {
        const result = await readFileFn(file.path);
        if (result && result.content !== file.savedSource) {
          // File has changed externally - reload it
          const { wireDoc, errors, defaultScreen } = compileSource(result.content);
          const screenIds = wireDoc?.screens.map((s) => s.id) || [];
          const selectedScreen =
            file.selectedScreen && screenIds.includes(file.selectedScreen)
              ? file.selectedScreen
              : defaultScreen;

          setOpenFiles((prev) =>
            prev.map((f) => {
              if (f.id !== file.id) return f;
              return {
                ...f,
                source: result.content,
                savedSource: result.content,
                wireDoc,
                errors,
                selectedScreen,
              };
            })
          );
        }
      }
    },
    [openFiles]
  );

  return {
    openFiles,
    activeFileId,
    activeFile,
    tabs,
    hasUnsavedChanges,
    openFilePaths,
    openFile,
    closeFile,
    updateFileSource,
    markFileSaved,
    setActiveFile: setActiveFileId,
    setSelectedScreen,
    reorderTabs,
    isFileOpen,
    getFileByPath,
    reloadFile,
    clearCache,
    refreshAllFromFilesystem,
  };
}

export type OpenFilesState = ReturnType<typeof useOpenFiles>;
