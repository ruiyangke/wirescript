import { useCallback } from 'react';
import type { TabInfo } from '../../types/project';

interface TabBarProps {
  tabs: TabInfo[];
  activeTabId: string | null;
  onTabSelect: (id: string) => void;
  onTabClose: (id: string) => void;
}

export function TabBar({ tabs, activeTabId, onTabSelect, onTabClose }: TabBarProps) {
  if (tabs.length === 0) {
    return null;
  }

  return (
    <div className="flex bg-gray-100 border-b border-gray-200 overflow-x-auto scrollbar-hide">
      {tabs.map((tab) => (
        <TabItem
          key={tab.id}
          id={tab.id}
          name={tab.name}
          isActive={tab.id === activeTabId}
          hasChanges={tab.hasChanges}
          onSelect={onTabSelect}
          onClose={onTabClose}
        />
      ))}
      {/* Spacer */}
      <div className="flex-1" />
    </div>
  );
}

interface TabItemProps {
  id: string;
  name: string;
  isActive: boolean;
  hasChanges: boolean;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
}

function TabItem({ id, name, isActive, hasChanges, onSelect, onClose }: TabItemProps) {
  const handleClose = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onClose(id);
    },
    [id, onClose]
  );

  const handleMiddleClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 1) {
        e.preventDefault();
        onClose(id);
      }
    },
    [id, onClose]
  );

  return (
    <button
      type="button"
      className={`group flex items-center gap-2 px-3 py-2 border-r border-gray-200 min-w-0 max-w-[200px] transition-all font-medium text-sm ${
        isActive
          ? 'bg-white text-gray-800 border-b-2 border-b-blue-500 -mb-[1px]'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-50'
      }`}
      onClick={() => onSelect(id)}
      onMouseDown={handleMiddleClick}
    >
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <span className="truncate">
        {name}
        {hasChanges && <span className="ml-1 text-blue-500">•</span>}
      </span>
      <button
        type="button"
        className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center transition-opacity ${
          isActive || hasChanges ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        } hover:bg-red-500 hover:text-white`}
        onClick={handleClose}
        tabIndex={-1}
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </button>
  );
}
