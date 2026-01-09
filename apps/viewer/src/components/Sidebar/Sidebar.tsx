import { useState } from 'react';
import { useFiles } from '../../contexts/FilesContext';
import { useProject } from '../../contexts/ProjectContext';
import type { MenuItem, MenuPosition } from '../../types/project';
import { ProjectBrowser } from './ProjectBrowser';
import { SidebarIcons, SidebarTabs } from './SidebarTabs';

interface SidebarProps {
  collapsed: boolean;
  width: number;
  onToggle: () => void;
  onContextMenu: (position: MenuPosition, items: MenuItem[]) => void;
  onRequestCreateFile: (dirPath: string) => void;
  onRequestDeleteFile: (path: string, fileName: string) => void;
  onRequestRenameFile: (path: string, currentName: string) => void;
}

const SIDEBAR_TABS = [
  { id: 'files', label: 'Explorer', icon: SidebarIcons.files },
  { id: 'screens', label: 'Screens', icon: SidebarIcons.screens },
];

export function Sidebar({
  collapsed,
  width,
  onToggle,
  onContextMenu,
  onRequestCreateFile,
  onRequestDeleteFile,
  onRequestRenameFile,
}: SidebarProps) {
  const { projectName, fileTree, openProject, readFile } = useProject();
  const { openFilePaths, activeFile, openFile, setSelectedScreen } = useFiles();

  const [activeTab, setActiveTab] = useState('files');

  // Get screens for current file
  const screens =
    activeFile?.wireDoc?.screens.map((s) => ({
      id: s.id,
      name: s.name,
      viewport: s.viewport as 'mobile' | 'tablet' | 'desktop' | undefined,
    })) || [];

  // Handle file selection from browser
  // Always re-read from filesystem and force reload to pick up external changes
  const handleFileSelect = async (path: string) => {
    const result = await readFile(path);
    if (result) {
      openFile(result.path, result.content, undefined, true); // forceReload = true
    }
  };

  if (collapsed) {
    return (
      <div className="flex">
        <SidebarTabs
          tabs={SIDEBAR_TABS}
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            onToggle(); // Expand when clicking a tab
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Vertical Tab Bar */}
      <SidebarTabs tabs={SIDEBAR_TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      <div
        className="flex flex-col bg-gray-50 border-r border-gray-200 overflow-hidden"
        style={{ width: width - 48 }} // 48px for tab bar
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 flex-shrink-0">
          <span className="text-sm font-medium text-gray-700 truncate">
            {activeTab === 'files' ? projectName || 'Explorer' : 'Screens'}
          </span>
          <div className="flex items-center gap-1">
            {activeTab === 'files' && (
              <button
                type="button"
                onClick={openProject}
                className="p-1 hover:bg-gray-200 rounded"
                title="Open folder"
              >
                <svg
                  className="w-4 h-4 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </button>
            )}
            <button
              type="button"
              onClick={onToggle}
              className="p-1 hover:bg-gray-200 rounded"
              title="Collapse sidebar"
            >
              <svg
                className="w-4 h-4 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {activeTab === 'files' && (
            <ProjectBrowser
              fileTree={fileTree}
              openFilePaths={openFilePaths}
              activeFilePath={activeFile?.path || null}
              onFileSelect={handleFileSelect}
              onOpenFolder={openProject}
              onRequestCreateFile={onRequestCreateFile}
              onRequestDeleteFile={onRequestDeleteFile}
              onRequestRenameFile={onRequestRenameFile}
              onContextMenu={onContextMenu}
            />
          )}
          {activeTab === 'screens' && (
            <ScreensPanel
              screens={screens}
              selectedScreen={activeFile?.selectedScreen}
              onScreenSelect={setSelectedScreen}
              hasFile={!!activeFile}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Screens panel with better UX when no file is open
interface ScreensPanelProps {
  screens: { id: string; name?: string; viewport?: 'mobile' | 'tablet' | 'desktop' }[];
  selectedScreen?: string;
  onScreenSelect: (screenId: string) => void;
  hasFile: boolean;
}

function ScreensPanel({ screens, selectedScreen, onScreenSelect, hasFile }: ScreensPanelProps) {
  if (!hasFile) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-gray-500">
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
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        <p className="text-sm text-center">No file open</p>
        <p className="text-xs text-gray-400 text-center mt-1">
          Open a .wire file to see its screens
        </p>
      </div>
    );
  }

  if (screens.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-gray-500">
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
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <p className="text-sm text-center">No screens defined</p>
        <p className="text-xs text-gray-400 text-center mt-1">Add a screen to your wireframe</p>
      </div>
    );
  }

  return (
    <div className="p-2">
      {screens.map((screen) => {
        const isSelected = screen.id === selectedScreen;
        return (
          <button
            type="button"
            key={screen.id}
            onClick={() => onScreenSelect(screen.id)}
            className={`
              w-full flex items-center gap-3 px-3 py-2 rounded-md text-left
              transition-colors duration-150
              ${isSelected ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}
            `}
          >
            {/* Screen icon based on viewport */}
            <ScreenIcon viewport={screen.viewport} isSelected={isSelected} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{screen.name || screen.id}</div>
              {screen.viewport && (
                <div className="text-xs text-gray-500 capitalize">{screen.viewport}</div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function ScreenIcon({ viewport, isSelected }: { viewport?: string; isSelected: boolean }) {
  const color = isSelected ? 'text-blue-500' : 'text-gray-400';

  if (viewport === 'mobile') {
    return (
      <svg className={`w-5 h-5 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
        />
      </svg>
    );
  }

  if (viewport === 'tablet') {
    return (
      <svg className={`w-5 h-5 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
        />
      </svg>
    );
  }

  // Desktop default
  return (
    <svg className={`w-5 h-5 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}
