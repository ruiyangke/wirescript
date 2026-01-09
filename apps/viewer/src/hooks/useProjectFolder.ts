import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type FileSystemAPI,
  type FileSystemCapabilities,
  type FileSystemError,
  getCapabilities,
  getFileSystem,
  getFileSystemType,
  type Result,
} from '../lib/filesystem';
import type { FileEntry } from '../types/project';

/**
 * Result type for hook operations
 * Simplifies Result<T> to { data, error } pattern common in React
 */
export interface OperationResult<T> {
  data: T | null;
  error: FileSystemError | null;
}

function toOperationResult<T>(result: Result<T>): OperationResult<T> {
  if (result.ok) {
    return { data: result.value, error: null };
  }
  return { data: null, error: result.error };
}

/**
 * Hook for managing project folder state
 * Handles filesystem operations with proper error handling
 *
 * NOTE: This hook does NOT handle UI concerns like confirmation dialogs.
 * Those should be handled at the component level before calling these methods.
 */
export function useProjectFolder() {
  const [projectName, setProjectName] = useState<string | null>(null);
  const [fileTree, setFileTree] = useState<FileEntry | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastError, setLastError] = useState<FileSystemError | null>(null);

  const fsRef = useRef<FileSystemAPI | null>(null);
  const capabilitiesRef = useRef<FileSystemCapabilities>(getCapabilities());

  // Stable reference to project name for callbacks
  const projectNameRef = useRef<string | null>(null);
  useEffect(() => {
    projectNameRef.current = projectName;
  }, [projectName]);

  // Refresh function using ref to avoid stale closures
  const doRefresh = useCallback(async () => {
    const fs = fsRef.current;
    if (!fs || !fs.isProjectOpen) return;

    const result = await fs.readDirectory('');
    if (result.ok) {
      setFileTree(result.value);
    }
  }, []);

  // Initialize filesystem and try to restore project
  useEffect(() => {
    let mounted = true;

    async function init() {
      const fs = await getFileSystem();
      if (!mounted) return;

      fsRef.current = fs;
      capabilitiesRef.current = fs.capabilities;
      setIsInitialized(true);

      // Try to restore previous project
      const restoreResult = await fs.restoreProject();
      if (restoreResult.ok && mounted) {
        setProjectName(restoreResult.value);
        projectNameRef.current = restoreResult.value;

        const treeResult = await fs.readDirectory('');
        if (treeResult.ok && mounted) {
          setFileTree(treeResult.value);
        }
      }
    }

    void init();
    return () => {
      mounted = false;
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      fsRef.current?.unwatchDirectory();
    };
  }, []);

  /**
   * Open a folder as project
   */
  const openProject = useCallback(async (): Promise<OperationResult<string>> => {
    const fs = fsRef.current || (await getFileSystem());
    fsRef.current = fs;
    setLastError(null);

    const result = await fs.openProject();
    if (!result.ok) {
      // Don't treat cancel as an error for UI purposes
      if (result.error.code !== 'CANCELLED') {
        setLastError(result.error);
      }
      return toOperationResult(result);
    }

    setProjectName(result.value);
    projectNameRef.current = result.value;

    // Read directory tree
    const treeResult = await fs.readDirectory('');
    if (treeResult.ok) {
      setFileTree(treeResult.value);
    }

    // Start watching if supported
    if (fs.capabilities.watch) {
      await fs.watchDirectory('', () => {
        void doRefresh();
      });
    }

    return toOperationResult(result);
  }, [doRefresh]);

  /**
   * Close current project
   */
  const closeProject = useCallback(async () => {
    const fs = fsRef.current;
    if (!fs) return;

    await fs.closeProject();
    setProjectName(null);
    projectNameRef.current = null;
    setFileTree(null);
    setLastError(null);
  }, []);

  /**
   * Refresh the file tree
   */
  const refreshFileTree = useCallback(async () => {
    await doRefresh();
  }, [doRefresh]);

  /**
   * Create a new file
   */
  const createFile = useCallback(
    async (dirPath: string, fileName: string): Promise<OperationResult<string>> => {
      const fs = fsRef.current;
      if (!fs) {
        const error = { code: 'NOT_INITIALIZED' as const, message: 'Filesystem not initialized' };
        return { data: null, error };
      }

      setLastError(null);
      const filePath = dirPath ? `${dirPath}/${fileName}` : fileName;
      const result = await fs.createFile(filePath);

      if (!result.ok) {
        setLastError(result.error);
        return { data: null, error: result.error };
      }

      await doRefresh();
      return { data: filePath, error: null };
    },
    [doRefresh]
  );

  /**
   * Delete a file
   * NOTE: Caller should handle confirmation UI before calling this
   */
  const deleteFile = useCallback(
    async (path: string): Promise<OperationResult<void>> => {
      const fs = fsRef.current;
      if (!fs) {
        const error = { code: 'NOT_INITIALIZED' as const, message: 'Filesystem not initialized' };
        return { data: null, error };
      }

      setLastError(null);
      const result = await fs.deleteFile(path);

      if (!result.ok) {
        setLastError(result.error);
        return { data: null, error: result.error };
      }

      await doRefresh();
      return { data: undefined, error: null };
    },
    [doRefresh]
  );

  /**
   * Rename a file
   */
  const renameFile = useCallback(
    async (oldPath: string, newName: string): Promise<OperationResult<string>> => {
      const fs = fsRef.current;
      if (!fs) {
        const error = { code: 'NOT_INITIALIZED' as const, message: 'Filesystem not initialized' };
        return { data: null, error };
      }

      setLastError(null);

      // Compute new path
      const lastSlash = oldPath.lastIndexOf('/');
      const dirPath = lastSlash > 0 ? oldPath.substring(0, lastSlash) : '';
      const newPath = dirPath ? `${dirPath}/${newName}` : newName;

      const result = await fs.renameFile(oldPath, newPath);

      if (!result.ok) {
        setLastError(result.error);
        return { data: null, error: result.error };
      }

      await doRefresh();
      return { data: newPath, error: null };
    },
    [doRefresh]
  );

  /**
   * Read a file
   */
  const readFile = useCallback(async (path: string) => {
    const fs = fsRef.current;
    if (!fs) return null;

    const result = await fs.readFile(path);
    return result.ok ? result.value : null;
  }, []);

  /**
   * Write to a file
   */
  const writeFile = useCallback(async (path: string, content: string): Promise<boolean> => {
    const fs = fsRef.current;
    if (!fs) return false;

    const result = await fs.writeFile(path, content);
    return result.ok;
  }, []);

  /**
   * Open a standalone file (via picker)
   */
  const openStandaloneFile = useCallback(async () => {
    const fs = fsRef.current || (await getFileSystem());
    fsRef.current = fs;

    const result = await fs.openStandaloneFile();
    return result.ok ? result.value : null;
  }, []);

  /**
   * Save as standalone file (via picker)
   */
  const saveStandaloneFile = useCallback(async (content: string, suggestedName?: string) => {
    const fs = fsRef.current || (await getFileSystem());
    fsRef.current = fs;

    const result = await fs.saveStandaloneFile(content, suggestedName);
    return result.ok ? result.value : null;
  }, []);

  return {
    // State
    projectName,
    fileTree,
    isInitialized,
    lastError,

    // Capabilities
    capabilities: capabilitiesRef.current,
    fsType: getFileSystemType(),

    // Project actions
    openProject,
    closeProject,
    refreshFileTree,

    // File actions
    createFile,
    deleteFile,
    renameFile,
    readFile,
    writeFile,

    // Standalone file actions
    openStandaloneFile,
    saveStandaloneFile,
  };
}

export type ProjectFolderState = ReturnType<typeof useProjectFolder>;
