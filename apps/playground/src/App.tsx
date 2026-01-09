import { compile } from '@wirescript/dsl';
import { WireScriptEditor } from '@wirescript/editor';
import { ThemeProvider, WireRenderer, type Viewport } from '@wirescript/renderer';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Code2,
  Copy,
  ExternalLink,
  Minus,
  Monitor,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Share2,
  Smartphone,
  Tablet,
} from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './components/ui/resizable';
import { EXAMPLES, type Example } from './examples';

/** Viewport presets */
const VIEWPORT_PRESETS = {
  mobile: { width: 375, height: 667, icon: Smartphone, label: 'Mobile' },
  tablet: { width: 768, height: 1024, icon: Tablet, label: 'Tablet' },
  desktop: { width: 1280, height: 800, icon: Monitor, label: 'Desktop' },
} as const;

type ViewportPreset = keyof typeof VIEWPORT_PRESETS;

const ZOOM_PRESETS = [50, 75, 100, 125, 150];
const MIN_ZOOM = 25;
const MAX_ZOOM = 200;
const MAX_URL_LENGTH = 2000; // Safe limit for most browsers

const DEFAULT_CODE = `; Welcome to WireScript Playground!
; Try editing this code or pick an example above.

(wire
  (screen main "Hello World" :desktop
    (box :col :center :full :gap 24 :padding 48
      (text "Hello, WireScript!" :high)
      (text "Edit the code on the left to see changes" :low)
      (box :row :gap 12
        (button "Get Started" :primary)
        (button "Learn More" :ghost)))))
`;

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export function App() {
  const [code, setCode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedCode = params.get('code'); // URLSearchParams.get already decodes
    if (sharedCode) {
      return sharedCode;
    }
    return DEFAULT_CODE;
  });

  const [selectedScreen, setSelectedScreen] = useState<string | undefined>();
  const [showExamples, setShowExamples] = useState(false);
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [shareError, setShareError] = useState(false);
  const [viewportPreset, setViewportPreset] = useState<ViewportPreset>('desktop');
  const [zoom, setZoom] = useState(100);
  const [autoFit, setAutoFit] = useState(true);
  const [editorCollapsed, setEditorCollapsed] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [clickEffect, setClickEffect] = useState(false);

  // Debounce code changes for smoother preview updates
  const debouncedCode = useDebounce(code, 150);

  // Compile the code
  const result = useMemo(() => {
    try {
      return compile(debouncedCode);
    } catch (e) {
      return {
        success: false as const,
        errors: [{ message: e instanceof Error ? e.message : 'Unknown error', line: 0, column: 0 }],
      };
    }
  }, [debouncedCode]);

  const wireDoc = result.success ? result.document : null;
  const errors = result.success ? [] : result.errors;

  // Get current screen info
  const currentScreen = wireDoc?.screens.find((s) => s.id === selectedScreen);
  const screenViewport = currentScreen?.viewport as ViewportPreset | undefined;

  // Auto-select first screen and sync viewport when document changes
  useEffect(() => {
    if (wireDoc?.screens.length) {
      const firstScreen = wireDoc.screens[0];
      setSelectedScreen(firstScreen.id);
      // Sync viewport to screen's defined viewport
      const screenVp = firstScreen.viewport as ViewportPreset | undefined;
      if (screenVp && screenVp in VIEWPORT_PRESETS) {
        setViewportPreset(screenVp);
      }
    }
  }, [wireDoc]);

  // Sync viewport when screen changes
  useEffect(() => {
    if (screenViewport && screenViewport in VIEWPORT_PRESETS) {
      setViewportPreset(screenViewport);
    }
  }, [screenViewport]);

  // Current viewport dimensions
  const viewport: Viewport = VIEWPORT_PRESETS[viewportPreset];

  // Track canvas container size for auto-fit
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateSize = () => {
      setCanvasSize({ width: canvas.clientWidth, height: canvas.clientHeight });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  // Calculate auto-fit zoom
  const autoFitZoom = useMemo(() => {
    if (canvasSize.width === 0 || canvasSize.height === 0) return 100;
    const padding = 64; // 32px padding on each side
    const availableWidth = canvasSize.width - padding;
    const availableHeight = canvasSize.height - padding;
    const scaleX = availableWidth / viewport.width;
    const scaleY = availableHeight / viewport.height;
    const scale = Math.min(scaleX, scaleY, 1); // Never zoom above 100%
    return Math.max(MIN_ZOOM, Math.floor(scale * 100));
  }, [canvasSize, viewport]);

  // Apply auto-fit zoom
  useEffect(() => {
    if (autoFit) {
      setZoom(autoFitZoom);
    }
  }, [autoFit, autoFitZoom]);

  // Re-enable auto-fit when viewport or editor collapsed state changes
  useEffect(() => {
    setAutoFit(true);
  }, [viewportPreset, editorCollapsed]);

  // Load example
  const loadExample = useCallback((example: Example) => {
    setCode(example.code);
    setShowExamples(false);
    window.history.replaceState({}, '', window.location.pathname);
  }, []);

  // Share functionality
  const handleShare = useCallback(async () => {
    const url = new URL(window.location.href);
    url.searchParams.set('code', code); // searchParams.set already encodes

    if (url.toString().length > MAX_URL_LENGTH) {
      setShareError(true);
      setTimeout(() => setShareError(false), 3000);
      return;
    }

    try {
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      window.history.replaceState({}, '', url.toString());
    } catch {
      window.history.replaceState({}, '', url.toString());
    }
  }, [code]);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setAutoFit(false);
    setZoom((z) => Math.min(MAX_ZOOM, z + 25));
  }, []);

  const handleZoomOut = useCallback(() => {
    setAutoFit(false);
    setZoom((z) => Math.max(MIN_ZOOM, z - 25));
  }, []);

  const handleZoomChange = useCallback((newZoom: number) => {
    setAutoFit(false);
    setZoom(newZoom);
  }, []);

  // Handle clicks in preview to show feedback
  const handlePreviewClick = useCallback(() => {
    setClickEffect(true);
    setTimeout(() => setClickEffect(false), 150);
  }, []);

  // Copy code to clipboard
  const handleCopyCode = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }, [code]);

  return (
    <ThemeProvider>
      <div className="flex h-full flex-col bg-gray-50">
        {/* Header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-gray-900">WireScript</h1>

            {/* Examples dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExamples(!showExamples)}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Examples
                <ChevronDown className="h-4 w-4" />
              </button>

              {showExamples && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowExamples(false)} />
                  <div className="absolute left-0 top-full z-20 mt-1 w-72 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                    {EXAMPLES.map((example) => (
                      <button
                        key={example.id}
                        onClick={() => loadExample(example)}
                        className="flex w-full flex-col gap-0.5 px-4 py-2 text-left hover:bg-gray-50"
                      >
                        <span className="font-medium text-gray-900">{example.name}</span>
                        <span className="text-xs text-gray-500">{example.description}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Screen selector */}
            {wireDoc && wireDoc.screens.length > 1 && (
              <select
                value={selectedScreen || ''}
                onChange={(e) => setSelectedScreen(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700"
              >
                {wireDoc.screens.map((screen) => (
                  <option key={screen.id} value={screen.id}>
                    {screen.name || screen.id}
                  </option>
                ))}
              </select>
            )}

            {/* Share button */}
            <button
              onClick={handleShare}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              {shareError ? (
                <>
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-amber-600">Code too large</span>
                </>
              ) : copied ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-green-600">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4" />
                  Share
                </>
              )}
            </button>

            {/* Docs link */}
            <a
              href="https://wirescript.org/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Docs
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </header>

        {/* Main content */}
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Editor panel */}
          {editorCollapsed ? (
            <div className="flex h-full w-12 shrink-0 flex-col items-center border-r border-gray-200 bg-white py-3">
              <button
                onClick={() => setEditorCollapsed(false)}
                className="rounded p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                title="Show editor"
              >
                <PanelLeftOpen className="h-5 w-5" />
              </button>
              <div className="mt-3 flex flex-1 items-center">
                <span
                  className="text-xs font-medium text-gray-400"
                  style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                >
                  Editor
                </span>
              </div>
            </div>
          ) : (
            <>
              <ResizablePanel defaultSize={40} minSize={20} maxSize={70}>
                <div className="flex h-full flex-col border-r border-gray-200 bg-white">
                  <div className="flex h-10 shrink-0 items-center justify-between border-b border-gray-100 px-4">
                    <div className="flex items-center gap-2">
                      <Code2 className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-500">Editor</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleCopyCode}
                        className={`rounded p-1 transition-colors ${codeCopied ? 'text-green-600' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
                        title={codeCopied ? 'Copied!' : 'Copy code'}
                      >
                        {codeCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => setEditorCollapsed(true)}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        title="Collapse editor"
                      >
                        <PanelLeftClose className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="min-h-0 flex-1">
                    <WireScriptEditor value={code} onChange={setCode} className="h-full" />
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />
            </>
          )}

          {/* Preview panel */}
          <ResizablePanel defaultSize={60} minSize={30}>
            <div className="flex h-full flex-col">
              {/* Preview toolbar */}
              <div className="flex h-10 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-500">Preview</span>

                  {/* Viewport selector */}
                  <div className="ml-4 flex items-center rounded-lg border border-gray-200 p-0.5">
                    {(Object.entries(VIEWPORT_PRESETS) as [ViewportPreset, (typeof VIEWPORT_PRESETS)[ViewportPreset]][]).map(
                      ([key, preset]) => {
                        const Icon = preset.icon;
                        const isActive = viewportPreset === key;
                        return (
                          <button
                            key={key}
                            onClick={() => setViewportPreset(key)}
                            className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                              isActive
                                ? 'text-blue-600'
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                            title={`${preset.label} (${preset.width}×${preset.height})`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">{preset.label}</span>
                          </button>
                        );
                      }
                    )}
                  </div>

                  <span className="ml-2 text-xs text-gray-400">
                    {viewport.width}×{viewport.height}
                  </span>
                </div>

                {/* Zoom controls */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setAutoFit(true)}
                    className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                      autoFit
                        ? 'text-blue-600'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                    title="Fit to view"
                  >
                    Fit
                  </button>

                  <div className="mx-1 h-4 w-px bg-gray-200" />

                  <button
                    onClick={handleZoomOut}
                    disabled={zoom <= MIN_ZOOM}
                    className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-40"
                    title="Zoom out"
                  >
                    <Minus className="h-4 w-4" />
                  </button>

                  <select
                    value={zoom}
                    onChange={(e) => handleZoomChange(Number(e.target.value))}
                    className="w-16 rounded border-0 bg-gray-100 px-2 py-1 text-center text-xs font-medium text-gray-600"
                  >
                    {ZOOM_PRESETS.map((z) => (
                      <option key={z} value={z}>
                        {z}%
                      </option>
                    ))}
                    {!ZOOM_PRESETS.includes(zoom) && <option value={zoom}>{zoom}%</option>}
                  </select>

                  <button
                    onClick={handleZoomIn}
                    disabled={zoom >= MAX_ZOOM}
                    className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-40"
                    title="Zoom in"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Preview canvas */}
              <div
                ref={canvasRef}
                className="min-h-0 flex-1 overflow-auto"
                style={{
                  backgroundColor: '#f8f8f8',
                  backgroundImage:
                    'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
                  backgroundSize: '16px 16px',
                }}
              >
                <div className="flex min-h-full items-start justify-center p-8">
                  {errors.length > 0 ? (
                    <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-4">
                      <h3 className="mb-2 font-medium text-red-800">Parse Error</h3>
                      {errors.map((error, i) => (
                        <p key={i} className="text-sm text-red-600">
                          {error.line > 0 && `Line ${error.line}: `}
                          {error.message}
                        </p>
                      ))}
                    </div>
                  ) : wireDoc ? (
                    <div
                      className={`shadow-xl transition-all duration-150 ${clickEffect ? 'ring-2 ring-blue-400 ring-offset-2' : ''}`}
                      style={{
                        zoom: zoom / 100,
                      }}
                      onClick={handlePreviewClick}
                    >
                      <WireRenderer
                        document={wireDoc}
                        screenId={selectedScreen}
                        onScreenChange={setSelectedScreen}
                        viewport={viewport}
                      />
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-400">
                      Start typing to see preview
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </ThemeProvider>
  );
}
