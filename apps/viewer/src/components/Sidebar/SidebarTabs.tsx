interface SidebarTab {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface SidebarTabsProps {
  tabs: SidebarTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

/**
 * Vertical tab bar for sidebar navigation.
 * Shows icons with tooltips.
 */
export function SidebarTabs({ tabs, activeTab, onTabChange }: SidebarTabsProps) {
  return (
    <div className="flex flex-col bg-gray-100 border-r border-gray-200">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            type="button"
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              relative w-12 h-12 flex items-center justify-center
              transition-colors duration-150
              ${
                isActive
                  ? 'text-blue-600 bg-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }
            `}
            title={tab.label}
          >
            {/* Active indicator */}
            {isActive && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-blue-600 rounded-r" />
            )}
            {tab.icon}
          </button>
        );
      })}
    </div>
  );
}

// Pre-built icons for common tabs
export const SidebarIcons = {
  files: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
      />
    </svg>
  ),
  screens: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  ),
};
