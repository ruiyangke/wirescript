import type { FileEntry } from '../../types/project';

interface TreeNodeProps {
  entry: FileEntry;
  depth: number;
  openFilePaths: string[];
  activeFilePath: string | null;
  expandedPaths: Set<string>;
  onToggleExpand: (path: string) => void;
  onFileSelect: (path: string) => void;
  onContextMenu: (e: React.MouseEvent, entry: FileEntry) => void;
}

export function TreeNode({
  entry,
  depth,
  openFilePaths,
  activeFilePath,
  expandedPaths,
  onToggleExpand,
  onFileSelect,
  onContextMenu,
}: TreeNodeProps) {
  const isDirectory = entry.type === 'directory';
  const isExpanded = expandedPaths.has(entry.path);
  const isOpen = openFilePaths.includes(entry.path);
  const isActive = activeFilePath === entry.path;
  const paddingLeft = 8 + depth * 16;

  const handleClick = () => {
    if (isDirectory) {
      onToggleExpand(entry.path);
    } else {
      onFileSelect(entry.path);
    }
  };

  return (
    <div>
      <button
        type="button"
        className={`w-full flex items-center gap-1 py-1 px-2 text-left select-none ${
          isActive ? 'bg-blue-100 text-blue-700' : isOpen ? 'bg-gray-100' : 'hover:bg-gray-50'
        }`}
        style={{ paddingLeft }}
        onClick={handleClick}
        onContextMenu={(e) => onContextMenu(e, entry)}
      >
        {/* Expand/collapse icon for directories */}
        {isDirectory ? (
          <svg
            className={`w-3 h-3 text-gray-400 transition-transform flex-shrink-0 ${
              isExpanded ? 'rotate-90' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        ) : (
          <span className="w-3 flex-shrink-0" />
        )}

        {/* Icon */}
        {isDirectory ? (
          <svg
            className={`w-4 h-4 flex-shrink-0 ${isExpanded ? 'text-yellow-500' : 'text-yellow-600'}`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
          </svg>
        ) : (
          <svg
            className={`w-4 h-4 flex-shrink-0 ${
              isActive ? 'text-blue-500' : isOpen ? 'text-gray-600' : 'text-gray-400'
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        )}

        {/* Name */}
        <span className="truncate text-sm">{entry.name}</span>
      </button>

      {/* Children (for directories) */}
      {isDirectory && isExpanded && entry.children && (
        <div>
          {entry.children.map((child) => (
            <TreeNode
              key={child.path}
              entry={child}
              depth={depth + 1}
              openFilePaths={openFilePaths}
              activeFilePath={activeFilePath}
              expandedPaths={expandedPaths}
              onToggleExpand={onToggleExpand}
              onFileSelect={onFileSelect}
              onContextMenu={onContextMenu}
            />
          ))}
        </div>
      )}
    </div>
  );
}
