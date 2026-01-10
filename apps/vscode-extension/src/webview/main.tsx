import type { WireDocument, ParseError } from '@wirescript/dsl';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { WireScriptRenderer } from './WireScriptRenderer.js';

// VSCode webview API
declare function acquireVsCodeApi(): {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
};

const vscode = acquireVsCodeApi();

interface AppState {
  document: WireDocument | null;
  errors: ParseError[] | null;
  loading: boolean;
}

type ViewMode = 'side-by-side' | 'preview-only';
type ViewportType = 'mobile' | 'tablet' | 'desktop';

const VIEWPORT_PRESETS: Record<ViewportType, { width: number; height: number }> = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 },
};

const ZOOM_PRESETS = [50, 75, 100, 125, 150, 200];
const MIN_ZOOM = 25;
const MAX_ZOOM = 300;

// Viewport icons as inline SVG components
function MobileIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <line x1="12" y1="18" x2="12" y2="18" strokeLinecap="round" />
    </svg>
  );
}

function TabletIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <line x1="12" y1="17" x2="12" y2="17" strokeLinecap="round" />
    </svg>
  );
}

function DesktopIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

function ViewportIcon({ viewport }: { viewport?: string }) {
  switch (viewport) {
    case 'mobile':
      return <MobileIcon />;
    case 'tablet':
      return <TabletIcon />;
    case 'desktop':
    default:
      return <DesktopIcon />;
  }
}

function App() {
  const [state, setState] = React.useState<AppState>({
    document: null,
    errors: null,
    loading: true,
  });
  const [viewMode, setViewMode] = React.useState<ViewMode>('side-by-side');
  const [viewport, setViewport] = React.useState<ViewportType>('desktop');
  const [zoom, setZoom] = React.useState(100);
  const [autoFit, setAutoFit] = React.useState(true);
  const [selectedScreen, setSelectedScreen] = React.useState<string | undefined>();
  const [screenDropdownOpen, setScreenDropdownOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const screenDropdownRef = React.useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = React.useState({ width: 0, height: 0 });

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (screenDropdownRef.current && !screenDropdownRef.current.contains(e.target as Node)) {
        setScreenDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    vscode.postMessage({ type: 'viewMode', mode });
  };

  // Calculate auto-fit zoom (considers both width and height)
  const autoFitZoom = React.useMemo(() => {
    if (containerSize.width === 0 || containerSize.height === 0) return 100;
    const padding = 64; // 32px padding on each side
    const availableWidth = containerSize.width - padding;
    const availableHeight = containerSize.height - padding;
    const viewportDims = VIEWPORT_PRESETS[viewport];
    const scaleX = availableWidth / viewportDims.width;
    const scaleY = availableHeight / viewportDims.height;
    const scale = Math.min(scaleX, scaleY, 1); // Never zoom above 100%
    return Math.max(MIN_ZOOM, Math.floor(scale * 100));
  }, [containerSize, viewport]);

  // Track container size with ResizeObserver
  // Re-run when loading state changes (container only exists when document is loaded)
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    };

    // Use requestAnimationFrame to ensure layout is complete before first measurement
    const rafId = requestAnimationFrame(updateSize);

    const observer = new ResizeObserver(updateSize);
    observer.observe(container);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [state.loading]);

  // Apply auto-fit zoom when enabled
  React.useEffect(() => {
    if (autoFit) {
      setZoom(autoFitZoom);
    }
  }, [autoFit, autoFitZoom]);

  // Get current screen info
  const currentScreen = state.document?.screens.find((s) => s.id === selectedScreen);
  const screenViewport = currentScreen?.viewport as ViewportType | undefined;

  // Auto-select first screen and sync viewport when document changes
  React.useEffect(() => {
    if (state.document?.screens.length) {
      const firstScreen = state.document.screens[0];
      setSelectedScreen(firstScreen.id);
      // Sync viewport to screen's defined viewport
      const screenVp = firstScreen.viewport as ViewportType | undefined;
      if (screenVp && screenVp in VIEWPORT_PRESETS) {
        setViewport(screenVp);
      }
    }
  }, [state.document]);

  // Sync viewport when screen changes
  React.useEffect(() => {
    if (screenViewport && screenViewport in VIEWPORT_PRESETS) {
      setViewport(screenViewport);
    }
  }, [screenViewport]);

  const handleZoomIn = () => {
    setAutoFit(false);
    setZoom((z) => Math.min(MAX_ZOOM, z + 25));
  };

  const handleZoomOut = () => {
    setAutoFit(false);
    setZoom((z) => Math.max(MIN_ZOOM, z - 25));
  };

  const handleZoomChange = (newZoom: number) => {
    setAutoFit(false);
    setZoom(newZoom);
  };

  const handleZoomReset = () => {
    setAutoFit(false);
    setZoom(100);
  };

  const handleAutoFit = () => {
    setAutoFit(true);
  };

  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;

      switch (message.type) {
        case 'update':
          setState({
            document: message.document,
            errors: null,
            loading: false,
          });
          break;

        case 'error':
          setState({
            document: null,
            errors: message.errors,
            loading: false,
          });
          break;

        case 'clear':
          setState({
            document: null,
            errors: null,
            loading: true,
          });
          break;
      }
    };

    window.addEventListener('message', handleMessage);

    // Signal that webview is ready to receive content
    vscode.postMessage({ type: 'ready' });

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Loading state
  if (state.loading) {
    return (
      <div className="wirescript-loading">
        <span>Loading preview...</span>
      </div>
    );
  }

  // Error state
  if (state.errors && state.errors.length > 0) {
    return (
      <div className="wirescript-error">
        <h3>Compilation Errors</h3>
        <ul>
          {state.errors.map((error, index) => (
            <li key={index}>
              {error.line && (
                <span className="wirescript-error-location">
                  Line {error.line}:{error.column}:{' '}
                </span>
              )}
              <span className="wirescript-error-message">{error.message}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // No document
  if (!state.document) {
    return (
      <div className="wirescript-loading">
        <span>Open a .wire file to see the preview</span>
      </div>
    );
  }

  const screens = state.document?.screens || [];
  const activeScreen = screens.find((s) => s.id === selectedScreen);

  // Render the wireframe with toolbar
  return (
    <div className="wirescript-preview-container">
      <div className="wirescript-toolbar">
        {/* Screen Selector */}
        {screens.length > 1 && (
          <>
            <div className="wirescript-screen-dropdown" ref={screenDropdownRef}>
              <button
                type="button"
                className="wirescript-screen-dropdown-btn"
                onClick={() => setScreenDropdownOpen(!screenDropdownOpen)}
              >
                <ViewportIcon viewport={activeScreen?.viewport} />
                <span className="wirescript-screen-dropdown-text">
                  {activeScreen?.name || activeScreen?.id || 'Select'}
                </span>
                <svg
                  className={`wirescript-screen-dropdown-chevron ${screenDropdownOpen ? 'open' : ''}`}
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {screenDropdownOpen && (
                <div className="wirescript-screen-dropdown-menu">
                  {screens.map((screen) => (
                    <button
                      key={screen.id}
                      type="button"
                      className={`wirescript-screen-dropdown-item ${screen.id === selectedScreen ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedScreen(screen.id);
                        setScreenDropdownOpen(false);
                      }}
                    >
                      <ViewportIcon viewport={screen.viewport} />
                      <span>{screen.name || screen.id}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="wirescript-toolbar-divider" />
          </>
        )}

        {/* Viewport Controls */}
        <div className="wirescript-toolbar-group">
          <button
            type="button"
            className={`wirescript-viewport-btn ${viewport === 'mobile' ? 'active' : ''}`}
            onClick={() => setViewport('mobile')}
            title="Mobile (375px)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="5" y="2" width="14" height="20" rx="2" />
              <line x1="12" y1="18" x2="12" y2="18" strokeLinecap="round" />
            </svg>
          </button>
          <button
            type="button"
            className={`wirescript-viewport-btn ${viewport === 'tablet' ? 'active' : ''}`}
            onClick={() => setViewport('tablet')}
            title="Tablet (768px)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="3" width="16" height="18" rx="2" />
              <line x1="12" y1="17" x2="12" y2="17" strokeLinecap="round" />
            </svg>
          </button>
          <button
            type="button"
            className={`wirescript-viewport-btn ${viewport === 'desktop' ? 'active' : ''}`}
            onClick={() => setViewport('desktop')}
            title="Desktop (1280px)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </button>
        </div>

        <div className="wirescript-toolbar-divider" />

        {/* Zoom Controls */}
        <div className="wirescript-toolbar-group">
          <button
            type="button"
            className="wirescript-toolbar-btn"
            onClick={handleZoomOut}
            disabled={zoom <= MIN_ZOOM}
            title="Zoom Out"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <select
            className="wirescript-zoom-select"
            value={zoom}
            onChange={(e) => handleZoomChange(Number(e.target.value))}
          >
            {ZOOM_PRESETS.map((z) => (
              <option key={z} value={z}>{z}%</option>
            ))}
            {!ZOOM_PRESETS.includes(zoom) && <option value={zoom}>{zoom}%</option>}
          </select>
          <button
            type="button"
            className="wirescript-toolbar-btn"
            onClick={handleZoomIn}
            disabled={zoom >= MAX_ZOOM}
            title="Zoom In"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <button
            type="button"
            className="wirescript-toolbar-btn-text"
            onClick={handleZoomReset}
            title="Reset to 100%"
          >
            1:1
          </button>
          <button
            type="button"
            className={`wirescript-toolbar-btn-text ${autoFit ? 'active' : ''}`}
            onClick={handleAutoFit}
            title="Auto Fit"
          >
            Fit
          </button>
        </div>

        <div className="wirescript-toolbar-spacer" />

        {/* View Mode Controls */}
        <div className="wirescript-toolbar-group">
          <button
            type="button"
            className={`wirescript-toolbar-btn ${viewMode === 'side-by-side' ? 'active' : ''}`}
            onClick={() => handleViewModeChange('side-by-side')}
            title="Side by Side"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="12" y1="3" x2="12" y2="21" />
            </svg>
          </button>
          <button
            type="button"
            className={`wirescript-toolbar-btn ${viewMode === 'preview-only' ? 'active' : ''}`}
            onClick={() => handleViewModeChange('preview-only')}
            title="Preview Only"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
            </svg>
          </button>
        </div>
      </div>
      <div ref={containerRef} className="wirescript-preview-canvas">
        <div className="wirescript-preview-inner">
          <div className="wirescript-preview-frame">
            <WireScriptRenderer
              document={state.document}
              screenId={selectedScreen}
              viewport={VIEWPORT_PRESETS[viewport]}
              onScreenChange={setSelectedScreen}
              zoom={zoom / 100}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Mount the app
const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
