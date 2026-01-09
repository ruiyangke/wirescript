import type { ScreenInfo } from '../../types/project';

interface ScreenNavigatorProps {
  screens: ScreenInfo[];
  selectedScreen?: string;
  onScreenSelect: (screenId: string) => void;
}

export function ScreenNavigator({ screens, selectedScreen, onScreenSelect }: ScreenNavigatorProps) {
  if (screens.length === 0) {
    return <div className="p-3 text-sm text-gray-500 text-center">No screens in current file</div>;
  }

  return (
    <div className="flex-1 overflow-auto">
      {screens.map((screen) => {
        const isActive = screen.id === selectedScreen;
        return (
          <button
            type="button"
            key={screen.id}
            className={`w-full flex items-center gap-2 px-3 py-2 text-left ${
              isActive ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-50'
            }`}
            onClick={() => onScreenSelect(screen.id)}
          >
            {/* Screen icon */}
            <svg
              className={`w-4 h-4 ${isActive ? 'text-blue-500' : 'text-gray-400'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>

            {/* Name and viewport */}
            <div className="flex-1 min-w-0">
              <div className="text-sm truncate">{screen.name || screen.id}</div>
              {screen.viewport && (
                <div className="text-xs text-gray-400 capitalize">{screen.viewport}</div>
              )}
            </div>

            {/* Active indicator */}
            {isActive && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
          </button>
        );
      })}
    </div>
  );
}
