import type { WireDocument } from '@wirescript/dsl';
import { useTheme, type Viewport, WireRenderer } from '@wirescript/renderer';
import { toPng } from 'html-to-image';
import { Component, type ReactNode, useCallback, useEffect, useRef } from 'react';

// Error boundary for preview
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class PreviewErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

interface ViewerProps {
  wireDoc: WireDocument | null;
  screenId?: string;
  errors: string[];
  viewport: Viewport;
  onScreenChange?: (screenId: string) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  exportStatus: 'idle' | 'exporting' | 'success' | 'error';
  onExportStatusChange: (status: 'idle' | 'exporting' | 'success' | 'error') => void;
}

export function Viewer({
  wireDoc,
  screenId,
  errors,
  viewport,
  onScreenChange,
  zoom,
  onZoomChange: _onZoomChange,
  exportStatus: _exportStatus,
  onExportStatusChange,
}: ViewerProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  const handleExport = useCallback(async () => {
    if (!previewRef.current) return;

    onExportStatusChange('exporting');
    try {
      const dataUrl = await toPng(previewRef.current, {
        backgroundColor: theme.colors.bg,
        pixelRatio: 2,
      });

      // Create download link
      const link = window.document.createElement('a');
      link.download = `wireframe-${screenId || 'screen'}.png`;
      link.href = dataUrl;
      link.click();
      onExportStatusChange('success');
      setTimeout(() => onExportStatusChange('idle'), 2000);
    } catch (error) {
      console.error('Export failed:', error);
      onExportStatusChange('error');
      setTimeout(() => onExportStatusChange('idle'), 3000);
    }
  }, [screenId, theme.colors.bg, onExportStatusChange]);

  // Listen for export event from Toolbar
  useEffect(() => {
    const handleExportEvent = () => handleExport();
    window.addEventListener('wireframe-export', handleExportEvent);
    return () => window.removeEventListener('wireframe-export', handleExportEvent);
  }, [handleExport]);

  if (errors.length > 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-gray-500">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-red-400"
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
          <p className="text-sm">Fix the errors to see preview</p>
        </div>
      </div>
    );
  }

  if (!wireDoc) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-gray-500">
          <svg
            className="w-16 h-16 mx-auto mb-4"
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
          <p className="text-sm">Write some WireScript to see preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Preview Content - No header, just content */}
      <div ref={containerRef} className="flex-1 overflow-auto p-2 bg-gray-50 min-h-0">
        <div className="flex justify-center">
          <div
            ref={previewRef}
            className="shadow-lg"
            style={{
              zoom: zoom / 100,
            }}
          >
            <PreviewErrorBoundary
              key={wireDoc ? 'loaded' : 'empty'}
              fallback={
                <div
                  className="p-8 text-center"
                  style={{ backgroundColor: theme.colors.bg, minWidth: 300 }}
                >
                  <div className="text-red-500 mb-2">Render Error</div>
                  <p className="text-sm text-gray-500">
                    Something went wrong rendering this wireframe. Check the console for details.
                  </p>
                </div>
              }
            >
              <WireRenderer
                document={wireDoc}
                screenId={screenId}
                viewport={viewport}
                onScreenChange={onScreenChange}
              />
            </PreviewErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
}
