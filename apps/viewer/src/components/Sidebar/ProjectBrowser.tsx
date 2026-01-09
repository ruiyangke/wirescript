import { useCallback, useEffect, useState } from 'react';
import type { FileEntry, MenuItem, MenuPosition } from '../../types/project';
import { TreeNode } from './TreeNode';

interface ProjectBrowserProps {
  fileTree: FileEntry | null;
  openFilePaths: string[];
  activeFilePath: string | null;
  onFileSelect: (path: string) => void;
  onOpenFolder: () => void;
  onRequestCreateFile: (dirPath: string) => void;
  onRequestDeleteFile: (path: string, fileName: string) => void;
  onRequestRenameFile: (path: string, currentName: string) => void;
  onContextMenu: (position: MenuPosition, items: MenuItem[]) => void;
}

export function ProjectBrowser({
  fileTree,
  openFilePaths,
  activeFilePath,
  onFileSelect,
  onOpenFolder,
  onRequestCreateFile,
  onRequestDeleteFile,
  onRequestRenameFile,
  onContextMenu,
}: ProjectBrowserProps) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  // Expand root when fileTree changes (properly in useEffect, not during render)
  useEffect(() => {
    if (fileTree && !expandedPaths.has(fileTree.path)) {
      setExpandedPaths(new Set([fileTree.path]));
    }
  }, [fileTree?.path, expandedPaths.has, fileTree]); // Only depend on the path, not expandedPaths

  const handleToggleExpand = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, entry: FileEntry) => {
      e.preventDefault();
      e.stopPropagation();

      const isDirectory = entry.type === 'directory';
      const items: MenuItem[] = [];

      if (isDirectory) {
        items.push({
          label: 'New File',
          onClick: () => onRequestCreateFile(entry.path),
        });
      }

      if (!isDirectory) {
        items.push({
          label: 'Rename',
          onClick: () => onRequestRenameFile(entry.path, entry.name),
        });
        items.push({
          label: 'Delete',
          onClick: () => onRequestDeleteFile(entry.path, entry.name),
          danger: true,
        });
      }

      if (items.length > 0) {
        onContextMenu({ x: e.clientX, y: e.clientY }, items);
      }
    },
    [onRequestCreateFile, onRequestDeleteFile, onRequestRenameFile, onContextMenu]
  );

  if (!fileTree) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 text-gray-500">
        <svg
          className="w-12 h-12 mb-2 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
          />
        </svg>
        <p className="text-sm text-center mb-3">No folder open</p>
        <button
          type="button"
          onClick={onOpenFolder}
          className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Open Folder
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      {fileTree.children && fileTree.children.length > 0 ? (
        fileTree.children.map((child) => (
          <TreeNode
            key={child.path}
            entry={child}
            depth={0}
            openFilePaths={openFilePaths}
            activeFilePath={activeFilePath}
            expandedPaths={expandedPaths}
            onToggleExpand={handleToggleExpand}
            onFileSelect={onFileSelect}
            onContextMenu={handleContextMenu}
          />
        ))
      ) : (
        <div className="p-4 text-sm text-gray-500 text-center">No .wire files in this folder</div>
      )}
    </div>
  );
}
