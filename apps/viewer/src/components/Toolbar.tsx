import type { Viewport } from '@wirescript/renderer';

interface Screen {
  id: string;
  name?: string;
}

/** Viewport presets matching WireScript screen definitions */
const VIEWPORT_PRESETS: Record<string, Viewport> = {
  Mobile: { width: 375, height: 667 },
  Tablet: { width: 768, height: 1024 },
  Desktop: { width: 1280, height: 800 },
  Wide: { width: 1920, height: 1080 },
};

/** Map screen viewport flags to preset names */
const SCREEN_VIEWPORT_TO_PRESET: Record<string, string> = {
  mobile: 'Mobile',
  tablet: 'Tablet',
  desktop: 'Desktop',
};

/** Zoom presets */
const ZOOM_PRESETS = [50, 75, 100, 125, 150, 200];
const MIN_ZOOM = 25;
const MAX_ZOOM = 300;

interface ToolbarProps {
  screens: Screen[];
  selectedScreen?: string;
  onScreenChange: (screenId: string) => void;
  viewport: Viewport;
  onViewportChange: (viewport: Viewport) => void;
  /** The viewport flag from the current screen's WireScript definition */
  screenViewport?: 'mobile' | 'tablet' | 'desktop';
  currentFile?: string | null;
  hasChanges?: boolean;
  onOpen?: () => void;
  onSave?: () => void;
  onSaveAs?: () => void;
  onOpenFolder?: () => void;
  projectRoot?: string | null;
  // Zoom controls
  zoom: number;
  onZoomChange: (zoom: number) => void;
  exportStatus: 'idle' | 'exporting' | 'success' | 'error';
  onExportStatusChange: (status: 'idle' | 'exporting' | 'success' | 'error') => void;
}

/** Get viewport preset for a screen's viewport flag */
export function getViewportForScreen(screenViewport?: 'mobile' | 'tablet' | 'desktop'): Viewport {
  const presetName = SCREEN_VIEWPORT_TO_PRESET[screenViewport || 'desktop'] || 'Desktop';
  return VIEWPORT_PRESETS[presetName];
}

export function Toolbar({
  screens,
  selectedScreen,
  onScreenChange,
  viewport,
  onViewportChange,
  screenViewport,
  currentFile,
  hasChanges,
  onOpen,
  onSave,
  onSaveAs,
  onOpenFolder,
  projectRoot: _projectRoot,
  zoom,
  onZoomChange,
  exportStatus,
  onExportStatusChange: _onExportStatusChange,
}: ToolbarProps) {
  const isElectron = typeof window !== 'undefined' && window.electronAPI?.isElectron;
  const fileName = currentFile?.split('/').pop() || currentFile?.split('\\').pop() || 'Untitled';

  // Find matching preset
  const currentPreset =
    Object.entries(VIEWPORT_PRESETS).find(
      ([, v]) => v.width === viewport.width && v.height === viewport.height
    )?.[0] || 'Custom';

  // Get the screen's defined viewport preset (shown with ● indicator)
  const screenPreset = SCREEN_VIEWPORT_TO_PRESET[screenViewport || 'desktop'] || 'Desktop';

  const handlePresetChange = (preset: string) => {
    if (preset === 'Custom') return;
    onViewportChange(VIEWPORT_PRESETS[preset]);
  };

  const handleWidthChange = (width: number) => {
    if (width > 0) {
      onViewportChange({ ...viewport, width });
    }
  };

  const handleHeightChange = (height: number) => {
    if (height > 0) {
      onViewportChange({ ...viewport, height });
    }
  };

  const handleZoomIn = () => {
    onZoomChange(Math.min(MAX_ZOOM, zoom + 25));
  };

  const handleZoomOut = () => {
    onZoomChange(Math.max(MIN_ZOOM, zoom - 25));
  };

  const handleZoomReset = () => {
    onZoomChange(100);
  };

  const handleExport = async () => {
    // Export is handled by Viewer which has access to the preview ref
    // This just triggers a custom event that Viewer listens for
    window.dispatchEvent(new CustomEvent('wireframe-export'));
  };

  // Get display values for inputs (show empty for 'auto')
  const displayWidth = typeof viewport.width === 'number' ? viewport.width : '';
  const displayHeight = typeof viewport.height === 'number' ? viewport.height : '';

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
      {/* Logo & File Controls */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <svg
            className="w-6 h-6 text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
            />
          </svg>
          <span className="font-semibold text-gray-800">WireScript</span>
        </div>

        {/* File buttons (Electron only) */}
        {isElectron && (
          <div className="flex items-center gap-1 border-l border-gray-200 pl-4">
            <button
              type="button"
              onClick={onOpenFolder}
              className="px-2 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
              title="Open folder"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
            </button>
            <div className="w-px h-4 bg-gray-300 mx-1" />
            <button
              type="button"
              onClick={onOpen}
              className="px-2 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
              title="Open file (Ctrl+O)"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={onSave}
              className="px-2 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
              title="Save (Ctrl+S)"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={onSaveAs}
              className="px-2 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
              title="Save As (Ctrl+Shift+S)"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </button>
            <span className="ml-2 text-sm text-gray-500">
              {fileName}
              {hasChanges && ' •'}
            </span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        {/* Screen Selector */}
        {screens.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Screen:</span>
            <select
              value={selectedScreen || ''}
              onChange={(e) => onScreenChange(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
            >
              {screens.map((screen) => (
                <option key={screen.id} value={screen.id}>
                  {screen.name || screen.id}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Viewport Controls */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Viewport:</span>
          <select
            value={currentPreset}
            onChange={(e) => handlePresetChange(e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
          >
            {Object.keys(VIEWPORT_PRESETS).map((preset) => (
              <option key={preset} value={preset}>
                {preset}
                {preset === screenPreset ? ' ●' : ''}
              </option>
            ))}
            {currentPreset === 'Custom' && <option value="Custom">Custom</option>}
          </select>
          <input
            type="number"
            value={displayWidth}
            onChange={(e) => handleWidthChange(Number(e.target.value) || 0)}
            placeholder="w"
            className="w-14 text-sm border border-gray-300 rounded px-2 py-1 bg-white text-center"
          />
          <span className="text-gray-400">×</span>
          <input
            type="number"
            value={displayHeight}
            onChange={(e) => handleHeightChange(Number(e.target.value) || 0)}
            placeholder="h"
            className="w-14 text-sm border border-gray-300 rounded px-2 py-1 bg-white text-center"
          />
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-300" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoom <= MIN_ZOOM}
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-40 disabled:cursor-not-allowed"
            title="Zoom out"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>

          <select
            value={zoom}
            onChange={(e) => onZoomChange(Number(e.target.value))}
            className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 border-0 rounded cursor-pointer hover:bg-gray-200"
          >
            {ZOOM_PRESETS.map((z) => (
              <option key={z} value={z}>
                {z}%
              </option>
            ))}
            {!ZOOM_PRESETS.includes(zoom) && <option value={zoom}>{zoom}%</option>}
          </select>

          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoom >= MAX_ZOOM}
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-40 disabled:cursor-not-allowed"
            title="Zoom in"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>

          <button
            type="button"
            onClick={handleZoomReset}
            className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
            title="Reset to 100%"
          >
            1:1
          </button>

          <div className="w-px h-4 bg-gray-300 mx-1" />

          <button
            type="button"
            onClick={handleExport}
            disabled={exportStatus === 'exporting'}
            className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {exportStatus === 'exporting'
              ? 'Exporting...'
              : exportStatus === 'success'
                ? 'Exported!'
                : exportStatus === 'error'
                  ? 'Failed'
                  : 'Export PNG'}
          </button>
        </div>
      </div>
    </div>
  );
}
