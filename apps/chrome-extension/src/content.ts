// Renderer CSS injected at build time
declare const __RENDERER_CSS__: string;

// Types - WireDocument imported lazily
type WireDocument = import('@wirescript/dsl').WireDocument;

interface ParsedMeta {
  title: string;
  screens: number;
  viewport: string;
  document?: WireDocument;
  error?: string;
}

interface WireBlockState {
  source: string;
  meta: ParsedMeta | null; // null until compiled
  container: HTMLElement;
  originalElement: HTMLElement;
  renderState: 'placeholder' | 'loading' | 'active' | 'error' | 'code';
  iframe?: HTMLIFrameElement;
  cleanupFns: Array<() => void>;
}

// Constants
const VIEWPORT_WIDTHS: Record<string, number> = {
  mobile: 375,
  tablet: 768,
  desktop: 1280,
};

const DEACTIVATION_DELAY_MS = 2000;
const MAX_CACHE_SIZE = 20;
const MAX_CACHE_AGE_MS = 30 * 60 * 1000; // 30 minutes

// LRU Cache with size limit
class LRUCache<K, V> {
  private cache = new Map<K, { value: V; timestamp: number }>();
  private maxSize: number;
  private maxAge: number;

  constructor(maxSize: number, maxAge: number) {
    this.maxSize = maxSize;
    this.maxAge = maxAge;
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Check age
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      return undefined;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  set(key: K, value: V): void {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, { value, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }
}

// Better hash function (FNV-1a)
function hashSource(source: string): string {
  let hash = 2166136261;
  for (let i = 0; i < source.length; i++) {
    hash ^= source.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

// State management
const blockStates = new Map<HTMLElement, WireBlockState>();
const deactivationTimers = new Map<HTMLElement, number>();
const pngCache = new LRUCache<string, string>(MAX_CACHE_SIZE, MAX_CACHE_AGE_MS);
const pendingRenders = new Map<HTMLElement, AbortController>();

// Intersection observer for visibility-based activation/deactivation
let intersectionObserver: IntersectionObserver | null = null;

// Mutation observer for detecting new code blocks
let mutationObserver: MutationObserver | null = null;

// Debounce timer for processing
let processDebounceTimer: number | null = null;

// Track if navigation handlers are set up
let navigationHandlersSetup = false;

// Fullscreen state
let fullscreenOverlay: HTMLElement | null = null;
let fullscreenKeyHandler: ((e: KeyboardEvent) => void) | null = null;

// Lazy-loaded module types
type DslModule = { compile: typeof import('@wirescript/dsl').compile };
type RendererModule = {
  React: typeof import('react');
  render: (vnode: import('react').ReactNode, parent: Element) => void;
  WireScriptRenderer: typeof import('./WireScriptRenderer').WireScriptRenderer;
  html2canvas: typeof import('html2canvas-pro').default;
};

// Lazy-loaded modules
let dslModule: DslModule | null = null;
let rendererModule: RendererModule | null = null;

let dslLoadingPromise: Promise<DslModule> | null = null;
let rendererLoadingPromise: Promise<RendererModule> | null = null;

async function loadDSL(): Promise<DslModule> {
  if (dslModule) return dslModule;
  if (dslLoadingPromise) return dslLoadingPromise;

  dslLoadingPromise = (async () => {
    const mod = await import('@wirescript/dsl');
    dslModule = { compile: mod.compile };
    return dslModule;
  })();

  return dslLoadingPromise;
}

async function loadRenderer(): Promise<RendererModule> {
  if (rendererModule) return rendererModule;
  if (rendererLoadingPromise) return rendererLoadingPromise;

  rendererLoadingPromise = (async () => {
    const [reactMod, reactDomMod, rendererMod, html2canvasMod] = await Promise.all([
      import('react'),
      import('react-dom'),
      import('./WireScriptRenderer'),
      import('html2canvas-pro'),
    ]);

    rendererModule = {
      React: reactMod,
      render: reactDomMod.render,
      WireScriptRenderer: rendererMod.WireScriptRenderer,
      html2canvas: html2canvasMod.default,
    };

    return rendererModule;
  })();

  return rendererLoadingPromise;
}

function escapeHtml(str: string): string {
  return str.replace(
    /[<>&'"]/g,
    (c) =>
      ({
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        "'": '&#39;',
        '"': '&quot;',
      })[c] || c
  );
}

// Quick validation that content looks like WireScript (stricter check)
function looksLikeWireScript(source: string): boolean {
  const trimmed = source.trim();
  // Must start with WireScript-specific patterns at the BEGINNING of the content
  // NO /m flag - we only want to match at the actual start of the string
  return (
    /^@(screen|meta|define)\b/.test(trimmed) ||
    /^Layout\s*(\(|{|$)/.test(trimmed) ||
    /^Header\s*(\(|{|$)/.test(trimmed) ||
    /^Card\s*(\(|{|$)/.test(trimmed) ||
    /^Section\s*(\(|{|$)/.test(trimmed) ||
    /^Nav\s*(\(|{|$)/.test(trimmed) ||
    /^Box\s*(\(|{|$)/.test(trimmed)
  );
}

// Extract lightweight metadata without full compilation
function extractLightweightMeta(source: string): { title: string; viewport: string; screenCount: number } {
  let title = 'Wireframe';
  let viewport = 'desktop';
  let screenCount = 1;

  // Try to extract title from @meta or @screen
  const metaTitleMatch = source.match(/@meta[^}]*title\s*:\s*["']([^"']+)["']/);
  if (metaTitleMatch) {
    title = metaTitleMatch[1];
  } else {
    const screenNameMatch = source.match(/@screen\s+(\w+)/);
    if (screenNameMatch) {
      title = screenNameMatch[1];
    }
  }

  // Extract viewport
  const viewportMatch = source.match(/viewport\s*:\s*["']?(mobile|tablet|desktop)["']?/);
  if (viewportMatch) {
    viewport = viewportMatch[1];
  }

  // Count screens
  const screenMatches = source.match(/@screen\b/g);
  if (screenMatches) {
    screenCount = screenMatches.length;
  }

  return { title, viewport, screenCount };
}

// Full parse (called only when rendering)
async function parseSource(source: string): Promise<ParsedMeta> {
  try {
    const dsl = await loadDSL();
    const result = dsl.compile(source);

    if (!result.success || !result.document) {
      return {
        title: 'Error',
        screens: 0,
        viewport: 'desktop',
        error: result.errors[0]?.message || 'Parse error',
      };
    }

    const { document } = result;
    const screen = document.screens[0];
    const metaTitle = document.meta?.props?.title;

    return {
      title: metaTitle || screen?.name || screen?.id || 'Wireframe',
      screens: document.screens.length,
      viewport: screen?.viewport || 'desktop',
      document,
    };
  } catch (e) {
    return {
      title: 'Error',
      screens: 0,
      viewport: 'desktop',
      error: String(e),
    };
  }
}

// HTML generators
function generatePlaceholder(title: string, viewport: string): string {
  return `
    <div class="wirescript-placeholder" tabindex="0" role="button" aria-label="Click to render wireframe">
      <div class="wirescript-placeholder-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="3" y1="9" x2="21" y2="9"></line>
          <line x1="9" y1="21" x2="9" y2="9"></line>
        </svg>
      </div>
      <span class="wirescript-placeholder-title">${escapeHtml(title)}</span>
      <span class="wirescript-placeholder-meta">${escapeHtml(viewport)}</span>
      <span class="wirescript-placeholder-action">Click to render</span>
    </div>
  `;
}

function generateLoading(title: string): string {
  return `
    <div class="wirescript-loading">
      <div class="wirescript-loading-spinner"></div>
      <span class="wirescript-loading-text">Rendering ${escapeHtml(title)}...</span>
    </div>
  `;
}

function generateError(message: string, canRetry: boolean = true): string {
  const retryButton = canRetry
    ? `<button class="wirescript-error-retry" data-action="retry" aria-label="Retry">Retry</button>`
    : '';
  return `
    <div class="wirescript-error">
      <span class="wirescript-error-icon">!</span>
      <span class="wirescript-error-text">${escapeHtml(message)}</span>
      ${retryButton}
    </div>
  `;
}

function generatePngPreview(pngDataUrl: string, title: string): string {
  return `
    <div class="wirescript-preview" tabindex="0" role="button" aria-label="Click to interact with wireframe">
      <img src="${pngDataUrl}" alt="${escapeHtml(title)}" class="wirescript-preview-img" />
      <div class="wirescript-preview-overlay">
        <span class="wirescript-preview-action">Click to interact</span>
      </div>
    </div>
  `;
}

function generateHeader(title: string, viewport: string, showingCode: boolean): string {
  const toggleIcon = showingCode
    ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="3" y1="9" x2="21" y2="9"></line>
        <line x1="9" y1="21" x2="9" y2="9"></line>
      </svg>`
    : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="16 18 22 12 16 6"></polyline>
        <polyline points="8 6 2 12 8 18"></polyline>
      </svg>`;
  const toggleTitle = showingCode ? 'Show wireframe' : 'Show code';
  const fullscreenBtn = !showingCode
    ? `<button class="wirescript-header-btn" data-action="fullscreen" title="Fullscreen (F)" aria-label="View fullscreen">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
        </svg>
      </button>`
    : '';

  return `
    <div class="wirescript-header">
      <span class="wirescript-header-title">${escapeHtml(title)}</span>
      <span class="wirescript-header-meta">${escapeHtml(viewport)}</span>
      ${fullscreenBtn}
      <button class="wirescript-header-btn" data-action="toggle" title="${toggleTitle}" aria-label="${toggleTitle}">
        ${toggleIcon}
      </button>
    </div>
  `;
}

// Wait for iframe to be ready
function waitForIframe(iframe: HTMLIFrameElement): Promise<Document> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let rafId: number | null = null;

    const cleanup = () => {
      settled = true;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Iframe timeout'));
    }, 5000);

    const check = () => {
      if (settled) return; // Stop if already resolved/rejected

      const doc = iframe.contentDocument;
      if (doc && doc.readyState === 'complete') {
        clearTimeout(timeout);
        cleanup();
        resolve(doc);
      } else {
        rafId = requestAnimationFrame(check);
      }
    };

    if (iframe.contentDocument?.readyState === 'complete') {
      clearTimeout(timeout);
      cleanup();
      resolve(iframe.contentDocument);
    } else {
      iframe.onload = () => {
        if (settled) return;
        clearTimeout(timeout);
        cleanup();
        if (iframe.contentDocument) {
          resolve(iframe.contentDocument);
        } else {
          reject(new Error('No iframe document'));
        }
      };
      check();
    }
  });
}

// Inline box-shadows for html2canvas (it doesn't handle CSS variables well)
function inlineBoxShadows(element: HTMLElement): void {
  const win = element.ownerDocument.defaultView;
  if (!win) return;

  const processElement = (el: Element) => {
    const computed = win.getComputedStyle(el);
    const boxShadow = computed.boxShadow;
    if (boxShadow && boxShadow !== 'none') {
      (el as HTMLElement).style.boxShadow = boxShadow;
    }
  };

  element.querySelectorAll('*').forEach(processElement);
  processElement(element);
}

// Extract source code from GitHub code block
function extractSource(block: HTMLElement): string | null {
  // Try data attribute first (most reliable)
  const clipboardContent = block.getAttribute('data-snippet-clipboard-copy-content');
  if (clipboardContent) {
    return clipboardContent;
  }

  // Fallback to pre element text
  const pre = block.querySelector('pre');
  if (pre) {
    return pre.textContent || null;
  }

  return null;
}

// Check if element is a WireScript code block
function isWireScriptBlock(block: HTMLElement): boolean {
  const classList = block.className;

  // Check for GitHub's language-specific class (if linguist recognizes it)
  if (/\bhighlight-source-wire(script)?\b/.test(classList)) {
    return true;
  }

  // For unrecognized languages, check the code block's lang attribute or info string
  // GitHub renders ```wire as <div class="snippet-clipboard-content"><pre lang="wire">
  const pre = block.querySelector('pre') || (block.tagName === 'PRE' ? block : null);
  const code = pre?.querySelector('code');

  // Check lang attribute on pre (GitHub uses this for unrecognized languages)
  const lang = pre?.getAttribute('lang');
  if (lang?.match(/^wire(script)?$/i)) {
    return true;
  }

  // Check data-lang attribute on code
  const dataLang = code?.getAttribute('data-lang');
  if (dataLang?.match(/^wire(script)?$/i)) {
    return true;
  }

  return false;
}

// Clear any pending deactivation timer for a container
function clearDeactivationTimer(container: HTMLElement) {
  const timer = deactivationTimers.get(container);
  if (timer) {
    window.clearTimeout(timer);
    deactivationTimers.delete(container);
  }
}

// Run all cleanup functions safely
function runCleanup(state: WireBlockState) {
  // Clear any pending deactivation timer
  clearDeactivationTimer(state.container);

  for (const fn of state.cleanupFns) {
    try {
      fn();
    } catch (e) {
      // Silently ignore cleanup errors
    }
  }
  state.cleanupFns = [];
}

// Cleanup render resources
function cleanupRender(state: WireBlockState) {
  if (state.iframe && rendererModule) {
    const root = state.iframe.contentDocument?.getElementById('root');
    if (root) {
      try {
        rendererModule.render(null, root);
      } catch {}
    }
  }
  state.iframe = undefined;
}

// Render wireframe to PNG (for preview cache)
async function renderToPng(source: string, meta: ParsedMeta): Promise<string | null> {
  const cacheKey = hashSource(source);
  const cached = pngCache.get(cacheKey);
  if (cached) return cached;

  if (!meta.document) return null;

  try {
    const renderer = await loadRenderer();
    const { React, render, WireScriptRenderer, html2canvas } = renderer;

    const viewportWidth = VIEWPORT_WIDTHS[meta.viewport] || VIEWPORT_WIDTHS.desktop;

    // Create hidden iframe for rendering
    const iframe = document.createElement('iframe');
    iframe.style.cssText = `position:fixed;left:0;top:0;width:${viewportWidth}px;height:2000px;z-index:-9999;opacity:0;pointer-events:none;`;
    document.body.appendChild(iframe);

    try {
      const iframeDoc = await waitForIframe(iframe);

      iframeDoc.open();
      iframeDoc.write(`<!DOCTYPE html>
<html>
<head><style>${__RENDERER_CSS__}</style></head>
<body style="margin:0;padding:0;background:#fff;">
  <div id="root" style="width:100%;"></div>
</body>
</html>`);
      iframeDoc.close();

      const container = iframeDoc.getElementById('root');
      if (!container) return null;

      render(
        React.createElement(WireScriptRenderer, {
          document: meta.document,
          initialScreen: undefined,
        }),
        container
      );

      // Wait for render
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

      const preview = iframeDoc.querySelector('.wirescript-wireframe') as HTMLElement;
      if (!preview) return null;

      inlineBoxShadows(preview);

      const canvas = await html2canvas(preview, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      const dataUrl = canvas.toDataURL('image/png');
      pngCache.set(cacheKey, dataUrl);

      render(null, container);
      return dataUrl;
    } finally {
      document.body.removeChild(iframe);
    }
  } catch {
    return null;
  }
}

// Start background PNG render
function startBackgroundRender(state: WireBlockState) {
  const { container, source } = state;
  const lightMeta = extractLightweightMeta(source);

  // Cancel any existing background render for this container
  pendingRenders.get(container)?.abort();

  const controller = new AbortController();
  pendingRenders.set(container, controller);

  const scheduleRender = window.requestIdleCallback || ((cb: () => void) => setTimeout(cb, 100));

  scheduleRender(async () => {
    if (controller.signal.aborted) return;

    try {
      // First we need to parse the source to get the document
      const meta = await parseSource(source);
      if (controller.signal.aborted || meta.error || !meta.document) return;

      const pngDataUrl = await renderToPng(source, meta);
      if (controller.signal.aborted || !pngDataUrl) return;

      // Update placeholder if still showing skeleton (not already activated)
      if (container.isConnected && state.renderState === 'placeholder' && container.querySelector('.wirescript-placeholder')) {
        container.innerHTML = generatePngPreview(pngDataUrl, lightMeta.title);
        // Re-attach click handlers since we replaced innerHTML
        attachPlaceholderHandlers(state);
      }
    } catch {
      // Silently fail - skeleton remains
    }

    pendingRenders.delete(container);
  });
}

// Attach click/keyboard handlers to placeholder or preview
function attachPlaceholderHandlers(state: WireBlockState) {
  const { container } = state;

  const clickHandler = (e: MouseEvent) => {
    if (state.renderState !== 'placeholder') return;
    e.stopPropagation();
    activateWireframe(state);
  };

  const keyHandler = (e: KeyboardEvent) => {
    if (state.renderState !== 'placeholder') return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      activateWireframe(state);
    }
  };

  container.addEventListener('click', clickHandler);
  container.addEventListener('keydown', keyHandler);

  state.cleanupFns.push(() => {
    container.removeEventListener('click', clickHandler);
    container.removeEventListener('keydown', keyHandler);
  });
}

// Fullscreen functions
function openFullscreen(state: WireBlockState) {
  if (fullscreenOverlay || !state.meta?.document) return;

  const { meta, source } = state;
  const viewportWidth = VIEWPORT_WIDTHS[meta.viewport] || VIEWPORT_WIDTHS.desktop;

  const overlay = document.createElement('div');
  overlay.className = 'wirescript-fullscreen';
  overlay.innerHTML = `
    <div class="wirescript-fullscreen-header">
      <span class="wirescript-fullscreen-title">${escapeHtml(meta.title)}</span>
      <span class="wirescript-fullscreen-meta">${escapeHtml(meta.viewport)}</span>
      <button class="wirescript-fullscreen-close" title="Close (Esc)" aria-label="Close fullscreen">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
    <div class="wirescript-fullscreen-content">
      <iframe class="wirescript-fullscreen-iframe"></iframe>
    </div>
  `;

  document.body.appendChild(overlay);
  fullscreenOverlay = overlay;

  // Setup iframe
  const iframe = overlay.querySelector('iframe') as HTMLIFrameElement;

  void waitForIframe(iframe).then(async (iframeDoc) => {
    const renderer = await loadRenderer();
    const { React, render, WireScriptRenderer } = renderer;

    iframeDoc.open();
    iframeDoc.write(`<!DOCTYPE html>
<html>
<head>
  <style>
    ${__RENDERER_CSS__}
    html, body { margin: 0; padding: 0; background: var(--background, #fff); min-height: 100%; }
    .wirescript-root { width: ${viewportWidth}px; margin: 0 auto; }
  </style>
</head>
<body>
  <div id="root" class="wirescript-root"></div>
</body>
</html>`);
    iframeDoc.close();

    const container = iframeDoc.getElementById('root');
    if (container && meta.document) {
      render(
        React.createElement(WireScriptRenderer, {
          document: meta.document,
          initialScreen: undefined,
        }),
        container
      );
    }
  });

  // Close handlers
  overlay
    .querySelector('.wirescript-fullscreen-close')
    ?.addEventListener('click', () => closeFullscreen());
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeFullscreen();
  });

  // Keyboard handler
  fullscreenKeyHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') closeFullscreen();
  };
  document.addEventListener('keydown', fullscreenKeyHandler);

  document.body.style.overflow = 'hidden';
}

function closeFullscreen() {
  if (!fullscreenOverlay) return;

  if (fullscreenKeyHandler) {
    document.removeEventListener('keydown', fullscreenKeyHandler);
    fullscreenKeyHandler = null;
  }

  // Cleanup iframe
  const iframe = fullscreenOverlay.querySelector('iframe');
  if (iframe && rendererModule) {
    const container = iframe.contentDocument?.getElementById('root');
    if (container) {
      try {
        rendererModule.render(null, container);
      } catch {}
    }
  }

  fullscreenOverlay.remove();
  fullscreenOverlay = null;
  document.body.style.overflow = '';
}

// Stop observing container for visibility changes
function stopObservingVisibility(container: HTMLElement) {
  intersectionObserver?.unobserve(container);
}

// Show placeholder state
function showPlaceholder(state: WireBlockState, skipBackgroundRender: boolean = false) {
  const { container, originalElement, source } = state;

  // Stop observing visibility (in case coming from active state)
  stopObservingVisibility(container);

  // Cancel any pending background render
  pendingRenders.get(container)?.abort();
  pendingRenders.delete(container);

  // Run existing cleanup
  runCleanup(state);
  cleanupRender(state);

  // Clear cached meta to free memory
  state.meta = null;

  // Extract lightweight meta (no compilation)
  const lightMeta = extractLightweightMeta(source);
  const cacheKey = hashSource(source);
  const cachedPng = pngCache.get(cacheKey);

  state.renderState = 'placeholder';
  container.style.display = '';
  originalElement.style.display = 'none';

  // Show cached PNG preview or skeleton placeholder
  if (cachedPng) {
    container.innerHTML = generatePngPreview(cachedPng, lightMeta.title);
  } else {
    container.innerHTML = generatePlaceholder(lightMeta.title, lightMeta.viewport);
    // Start background render to generate PNG preview
    if (!skipBackgroundRender) {
      startBackgroundRender(state);
    }
  }

  // Attach event handlers
  attachPlaceholderHandlers(state);
}

// Show error state with retry capability
function showError(state: WireBlockState, message: string) {
  const { container } = state;

  // Stop observing visibility (in case coming from active state)
  stopObservingVisibility(container);

  runCleanup(state);
  cleanupRender(state);

  state.renderState = 'error';
  container.innerHTML = generateError(message, true);

  // Setup retry handler
  const retryHandler = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-action="retry"]')) {
      e.stopPropagation();
      state.renderState = 'placeholder'; // Reset state so activateWireframe can run
      activateWireframe(state);
    }
  };

  container.addEventListener('click', retryHandler);
  state.cleanupFns.push(() => {
    container.removeEventListener('click', retryHandler);
  });
}

// Show code view (with header for toggling back)
function showCodeView(state: WireBlockState) {
  const { container, originalElement, source } = state;

  // Stop observing visibility (coming from active state)
  stopObservingVisibility(container);

  // Run existing cleanup
  runCleanup(state);
  cleanupRender(state);

  const lightMeta = extractLightweightMeta(source);

  state.renderState = 'code';

  // Show header with toggle button, then the original code block
  container.innerHTML = generateHeader(lightMeta.title, lightMeta.viewport, true);
  container.style.display = '';

  // Clone and append the original code block content
  const codeWrapper = document.createElement('div');
  codeWrapper.className = 'wirescript-code-wrapper';
  const clonedPre = originalElement.querySelector('pre')?.cloneNode(true) as HTMLElement;
  if (clonedPre) {
    codeWrapper.appendChild(clonedPre);
  }
  container.appendChild(codeWrapper);

  // Keep original hidden
  originalElement.style.display = 'none';

  // Setup toggle handler
  const toggleHandler = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-action="toggle"]')) {
      e.stopPropagation();
      activateWireframe(state);
    }
  };

  container.addEventListener('click', toggleHandler);
  state.cleanupFns.push(() => {
    container.removeEventListener('click', toggleHandler);
  });
}

// Activate and render wireframe
async function activateWireframe(state: WireBlockState) {
  const { container, source } = state;

  // Prevent duplicate activation
  if (state.renderState === 'loading' || state.renderState === 'active') {
    return;
  }

  // Check if container is still in DOM
  if (!container.isConnected) {
    return;
  }

  // Run existing cleanup
  runCleanup(state);
  cleanupRender(state);

  const lightMeta = extractLightweightMeta(source);

  state.renderState = 'loading';
  container.innerHTML = generateLoading(lightMeta.title);

  try {
    // Load DSL and renderer in parallel, then parse
    const [, renderer] = await Promise.all([loadDSL(), loadRenderer()]);

    // Check if state changed during async load or container removed
    if (state.renderState !== 'loading' || !container.isConnected) {
      return;
    }

    const meta = await parseSource(source);

    // Check again after parsing
    if (state.renderState !== 'loading' || !container.isConnected) {
      return;
    }

    state.meta = meta;

    if (meta.error || !meta.document) {
      showError(state, meta.error || 'No document');
      return;
    }

    const { React, render, WireScriptRenderer } = renderer;

    // Build header with toggle button
    container.innerHTML = generateHeader(meta.title, meta.viewport, false);

    // Setup header button handlers
    const headerHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-action="toggle"]')) {
        e.stopPropagation();
        showCodeView(state);
      } else if (target.closest('[data-action="fullscreen"]')) {
        e.stopPropagation();
        openFullscreen(state);
      }
    };

    container.addEventListener('click', headerHandler);
    state.cleanupFns.push(() => {
      container.removeEventListener('click', headerHandler);
    });

    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'width:100%;border:none;display:block;overflow:hidden;';
    container.appendChild(iframe);
    state.iframe = iframe;

    const iframeDoc = await waitForIframe(iframe);

    // Check again after iframe ready
    if (state.renderState !== 'loading' || !container.isConnected) {
      return;
    }

    // Calculate scale AFTER iframe is in DOM and has layout
    const viewportWidth = VIEWPORT_WIDTHS[meta.viewport] || VIEWPORT_WIDTHS.desktop;

    // Use requestAnimationFrame to ensure layout is complete
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    // Final check (consistent with other async boundaries)
    if (state.renderState !== 'loading' || !container.isConnected) {
      return;
    }

    // clientWidth excludes borders, so it's the actual content width
    const containerWidth = container.clientWidth || 800;
    const scale = Math.min(1, containerWidth / viewportWidth);

    // Write clean HTML
    iframeDoc.open();
    iframeDoc.write(`<!DOCTYPE html>
<html>
<head>
  <style>
    ${__RENDERER_CSS__}
    html, body { margin: 0; padding: 0; overflow: hidden; background: var(--background, #fff); }
    .wirescript-root { width: ${viewportWidth}px; transform-origin: top left; transform: scale(${scale}); }
  </style>
</head>
<body>
  <div id="root" class="wirescript-root"></div>
</body>
</html>`);
    iframeDoc.close();

    const root = iframeDoc.getElementById('root');
    if (!root) throw new Error('Container not found');

    // Render
    render(
      React.createElement(WireScriptRenderer, {
        document: meta.document,
        initialScreen: undefined,
      }),
      root
    );

    // Auto-resize iframe
    const updateHeight = () => {
      if (!state.iframe || !iframeDoc.documentElement) return;
      const contentHeight = iframeDoc.documentElement.scrollHeight * scale;
      iframe.style.height = `${Math.ceil(contentHeight)}px`;
    };

    // Wait for render and update height
    requestAnimationFrame(() => {
      requestAnimationFrame(updateHeight);
    });

    // Only observe if body exists
    if (iframeDoc.body) {
      const resizeObserver = new ResizeObserver(updateHeight);
      resizeObserver.observe(iframeDoc.body);
      state.cleanupFns.push(() => {
        resizeObserver.disconnect();
      });
    }

    state.renderState = 'active';

    // Start observing for visibility
    intersectionObserver?.observe(container);
  } catch (error) {
    // Only show error if container is still connected
    if (container.isConnected) {
      showError(state, `Failed to render: ${error}`);
    }
  }
}

// Deactivate wireframe (when scrolled out of view)
function deactivateWireframe(state: WireBlockState) {
  if (state.renderState !== 'active') return;

  // Return to placeholder (which also stops observing)
  showPlaceholder(state);
}

// Handle intersection changes
function handleIntersection(entries: IntersectionObserverEntry[]) {
  for (const entry of entries) {
    const container = entry.target as HTMLElement;
    const state = blockStates.get(container);
    if (!state || state.renderState !== 'active') continue;

    if (!entry.isIntersecting) {
      // Start deactivation timer
      if (!deactivationTimers.has(container)) {
        const timer = window.setTimeout(() => {
          deactivationTimers.delete(container);
          deactivateWireframe(state);
        }, DEACTIVATION_DELAY_MS);
        deactivationTimers.set(container, timer);
      }
    } else {
      // Cancel deactivation if back in view
      const timer = deactivationTimers.get(container);
      if (timer) {
        window.clearTimeout(timer);
        deactivationTimers.delete(container);
      }
    }
  }
}

// Process a single code block
function processCodeBlock(block: HTMLElement) {
  // Skip if already processed
  if (blockStates.has(block) || block.hasAttribute('data-wirescript-processed')) {
    return;
  }

  // Validate it's a WireScript block
  if (!isWireScriptBlock(block)) {
    return;
  }

  const source = extractSource(block);
  if (!source) return;

  // Mark as processed
  block.setAttribute('data-wirescript-processed', 'true');

  // Create container
  const container = document.createElement('div');
  container.className = 'wirescript-container';

  // Insert after original block
  block.insertAdjacentElement('afterend', container);

  // Create state
  const state: WireBlockState = {
    source,
    meta: null,
    container,
    originalElement: block,
    renderState: 'placeholder',
    cleanupFns: [],
  };

  // Store state keyed by BOTH container and original element
  blockStates.set(container, state);
  blockStates.set(block, state);

  // Show placeholder
  showPlaceholder(state);
}

// Find and process all code blocks
function processCodeBlocksIn(root: Element | Document) {
  // Look for all code block containers - GitHub uses various wrappers
  const blocks = root.querySelectorAll<HTMLElement>(
    'div.highlight-source-wire, div.highlight-source-wirescript, div.highlight, div.snippet-clipboard-content'
  );

  blocks.forEach((block) => processCodeBlock(block));
}

// Debounced processing
function scheduleProcessing() {
  if (processDebounceTimer) {
    window.clearTimeout(processDebounceTimer);
  }
  processDebounceTimer = window.setTimeout(() => {
    processDebounceTimer = null;
    processCodeBlocksIn(document);
  }, 150);
}

// Cleanup all state
function cleanupAll() {
  // Close fullscreen if open
  closeFullscreen();

  // Cancel all pending background renders
  for (const controller of pendingRenders.values()) {
    controller.abort();
  }
  pendingRenders.clear();

  // Cancel timers
  if (processDebounceTimer) {
    window.clearTimeout(processDebounceTimer);
    processDebounceTimer = null;
  }

  for (const timer of deactivationTimers.values()) {
    window.clearTimeout(timer);
  }
  deactivationTimers.clear();

  // Cleanup all states
  const seen = new Set<WireBlockState>();
  for (const state of blockStates.values()) {
    if (seen.has(state)) continue;
    seen.add(state);

    // Mark as not loading to abort any in-progress async operations
    if (state.renderState === 'loading') {
      state.renderState = 'placeholder';
    }

    runCleanup(state);
    cleanupRender(state);

    // Remove container
    state.container.remove();

    // Restore original element
    state.originalElement.style.display = '';
    state.originalElement.removeAttribute('data-wirescript-processed');
  }
  blockStates.clear();

  // Disconnect observers
  mutationObserver?.disconnect();
  mutationObserver = null;

  intersectionObserver?.disconnect();
  intersectionObserver = null;
}

// Setup mutation observer (scoped to markdown containers)
function setupMutationObserver() {
  // Cleanup existing observer first
  mutationObserver?.disconnect();

  mutationObserver = new MutationObserver((mutations) => {
    let shouldProcess = false;

    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLElement) {
            if (
              node.classList?.contains('markdown-body') ||
              node.querySelector?.('.markdown-body') ||
              node.classList?.contains('highlight-source-wire') ||
              node.classList?.contains('highlight-source-wirescript')
            ) {
              shouldProcess = true;
              break;
            }
          }
        }
      }
      if (shouldProcess) break;
    }

    if (shouldProcess) {
      scheduleProcessing();
    }
  });

  // Observe the main content area
  const targets = [
    document.querySelector('#repo-content-pjax-container'),
    document.querySelector('#js-repo-pjax-container'),
    document.querySelector('.repository-content'),
    document.querySelector('main'),
    document.body,
  ].filter(Boolean);

  const target = targets[0];
  if (target) {
    mutationObserver.observe(target, {
      childList: true,
      subtree: true,
    });
  }
}

// Setup intersection observer
function setupIntersectionObserver() {
  // Cleanup existing observer first
  intersectionObserver?.disconnect();

  intersectionObserver = new IntersectionObserver(handleIntersection, {
    threshold: 0,
    rootMargin: '100px',
  });
}

// Setup both observers
function setupObservers() {
  setupIntersectionObserver();
  setupMutationObserver();
}

// Handle GitHub SPA navigation
function setupNavigationHandlers() {
  if (navigationHandlersSetup) return;
  navigationHandlersSetup = true;

  // GitHub uses Turbo for navigation
  document.addEventListener('turbo:before-cache', cleanupAll);
  document.addEventListener('turbo:load', () => {
    setupObservers(); // Setup BOTH observers after navigation
    processCodeBlocksIn(document);
  });

  // Handle popstate for browser back/forward
  window.addEventListener('popstate', () => {
    setTimeout(() => {
      processCodeBlocksIn(document);
    }, 100);
  });

  // Handle pjax (older GitHub)
  document.addEventListener('pjax:end', () => {
    processCodeBlocksIn(document);
  });
}

// Initialize
function init() {
  setupObservers();
  setupNavigationHandlers();
  processCodeBlocksIn(document);
}

// Run immediately - script runs at document_idle so DOM is already ready
init();

// Cleanup on page hide (more reliable than unload)
window.addEventListener('pagehide', cleanupAll);
