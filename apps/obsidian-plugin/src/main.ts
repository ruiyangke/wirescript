import { compile, type WireDocument } from '@wirescript/dsl';
import { type MarkdownPostProcessorContext, MarkdownRenderChild, Plugin, TFile } from 'obsidian';

// Renderer CSS injected at build time
declare const __RENDERER_CSS__: string;

// Types
interface Metadata {
  title: string;
  screens: number;
  viewport: string;
  document?: WireDocument;
  error?: string;
}

interface ElementState {
  source: string;
  active: boolean;
  cleanup?: () => void;
}

// Constants
const MAX_CACHE_SIZE = 20;
const MAX_CACHE_AGE_MS = 30 * 60 * 1000; // 30 minutes
const DEACTIVATION_DELAY_MS = 2000; // Wait before deactivating
const VIEWPORT_WIDTHS: Record<string, number> = {
  mobile: 375,
  tablet: 768,
  desktop: 1280,
};

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

// Quick validation that content looks like WireScript
function looksLikeWireScript(source: string): boolean {
  const trimmed = source.trim();
  // Skip leading comments (; style in WireScript)
  const withoutComments = trimmed.replace(/^(;[^\n]*\n|\s)*/g, '');
  // WireScript must start with (wire ...
  return /^\(wire\b/.test(withoutComments);
}

// Parse source and extract metadata (with document)
async function parseSource(source: string, filePath: string, vfs: Map<string, string>): Promise<Metadata> {
  try {
    const result = await compile(source, { filePath, vfs });
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
function generateSkeleton(meta: Metadata): string {
  if (meta.error) {
    return `
      <div class="wirescript-error">
        <span class="wirescript-error-text">${escapeHtml(meta.error)}</span>
      </div>
    `;
  }

  const screenText = meta.screens === 1 ? '1 screen' : `${meta.screens} screens`;
  return `
    <div class="wirescript-placeholder" tabindex="0" role="button" aria-label="Click to activate wireframe">
      <div class="wirescript-placeholder-icon"></div>
      <span class="wirescript-placeholder-title">${escapeHtml(meta.title)}</span>
      <span class="wirescript-placeholder-meta">${escapeHtml(meta.viewport)} · ${screenText}</span>
      <span class="wirescript-placeholder-arrow">→</span>
    </div>
  `;
}

function generateLoading(meta: Metadata): string {
  return `
    <div class="wirescript-loading">
      <div class="wirescript-loading-spinner"></div>
      <span class="wirescript-loading-text">Loading ${escapeHtml(meta.title)}...</span>
    </div>
  `;
}

function generatePngPlaceholder(pngDataUrl: string, meta: Metadata): string {
  return `
    <div class="wirescript-preview" tabindex="0" role="button" aria-label="Click to interact with wireframe">
      <img src="${pngDataUrl}" alt="${escapeHtml(meta.title)}" class="wirescript-preview-img" />
      <div class="wirescript-preview-overlay">
        <span>Click to interact</span>
      </div>
    </div>
  `;
}

function generateActiveHeader(meta: Metadata): string {
  return `
    <div class="wirescript-header">
      <button class="wirescript-header-btn" data-action="fullscreen" title="Fullscreen (F)" aria-label="View fullscreen">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
        </svg>
      </button>
      <span class="wirescript-header-title">${escapeHtml(meta.title)}</span>
      <span class="wirescript-header-meta">${escapeHtml(meta.viewport)}</span>
    </div>
  `;
}

function generateError(message: string): string {
  return `
    <div class="wirescript-error">
      <span class="wirescript-error-text">${escapeHtml(message)}</span>
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

// Lazy-loaded renderer module type
type RendererModule = {
  React: typeof import('react');
  render: (vnode: import('react').ReactNode, parent: Element) => void;
  WireScriptRenderer: typeof import('./WireScriptRenderer').WireScriptRenderer;
  html2canvas: typeof import('html2canvas-pro').default;
};

let rendererModule: RendererModule | null = null;
let loadingPromise: Promise<RendererModule> | null = null;

async function loadRenderer(): Promise<RendererModule> {
  if (rendererModule) return rendererModule;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async (): Promise<RendererModule> => {
    const [reactMod, reactDomMod, rendererMod, html2canvasMod] = await Promise.all([
      import('react'),
      import('react-dom'),
      import('./WireScriptRenderer'),
      import('html2canvas-pro'),
    ]);

    const module: RendererModule = {
      React: reactMod,
      // @ts-ignore - Preact compat has render, but React 18+ types don't
      render: reactDomMod.render,
      WireScriptRenderer: rendererMod.WireScriptRenderer,
      html2canvas: html2canvasMod.default,
    };

    rendererModule = module;
    return module;
  })();

  return loadingPromise;
}

// Inline box-shadows for html2canvas
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

export default class WireScriptPlugin extends Plugin {
  // Caches (instance-level, not module-level)
  private pngCache = new LRUCache<string, string>(MAX_CACHE_SIZE, MAX_CACHE_AGE_MS);
  private metaCache = new Map<string, Metadata>();

  // Virtual File System for includes
  private vfs = new Map<string, string>();

  // Element tracking (replaces MutationObserver on body)
  private elements = new Map<HTMLElement, ElementState>();
  private pendingRenders = new Map<HTMLElement, AbortController>();

  // Shared IntersectionObserver
  private intersectionObserver: IntersectionObserver | null = null;
  private deactivationTimers = new Map<HTMLElement, number>();

  // Fullscreen state
  private fullscreenOverlay: HTMLElement | null = null;
  private fullscreenKeyHandler: ((e: KeyboardEvent) => void) | null = null;

  async onload() {
    // Build VFS from vault
    await this.rebuildVFS();

    // Watch for .wire file changes
    this.registerEvent(
      this.app.vault.on('modify', (file) => {
        if (file.path.endsWith('.wire') && file instanceof TFile) {
          this.updateVFSFile(file);
        }
      })
    );

    this.registerEvent(
      this.app.vault.on('delete', (file) => {
        if (file.path.endsWith('.wire')) {
          this.vfs.delete('/' + file.path);
        }
      })
    );

    this.registerEvent(
      this.app.vault.on('rename', (file, oldPath) => {
        if (oldPath.endsWith('.wire') && file instanceof TFile) {
          this.vfs.delete('/' + oldPath);
          this.updateVFSFile(file);
        }
      })
    );

    // Create shared IntersectionObserver
    this.intersectionObserver = new IntersectionObserver(
      (entries) => this.handleIntersection(entries),
      { threshold: 0, rootMargin: '100px' }
    );

    this.registerMarkdownCodeBlockProcessor('wire', (source, el, ctx) =>
      this.processWireBlock(source, el, ctx)
    );
    this.registerMarkdownCodeBlockProcessor('wirescript', (source, el, ctx) =>
      this.processWireBlock(source, el, ctx)
    );
  }

  private async rebuildVFS() {
    this.vfs.clear();

    const wireFiles = this.app.vault.getFiles().filter((f) => f.path.endsWith('.wire'));

    for (const file of wireFiles) {
      try {
        const content = await this.app.vault.read(file);
        this.vfs.set('/' + file.path, content);
      } catch (error) {
        console.error(`Failed to read ${file.path}:`, error);
      }
    }
  }

  private async updateVFSFile(file: TFile) {
    if (file.path.endsWith('.wire')) {
      try {
        const content = await this.app.vault.read(file);
        this.vfs.set('/' + file.path, content);
      } catch (error) {
        console.error(`Failed to update VFS for ${file.path}:`, error);
      }
    }
  }

  async onunload() {
    this.closeFullscreen();

    // Cancel pending renders
    for (const controller of this.pendingRenders.values()) {
      controller.abort();
    }
    this.pendingRenders.clear();

    // Clear deactivation timers
    for (const timer of this.deactivationTimers.values()) {
      window.clearTimeout(timer);
    }
    this.deactivationTimers.clear();

    // Cleanup all tracked elements
    for (const [_el, state] of this.elements) {
      state.cleanup?.();
    }
    this.elements.clear();

    // Disconnect observer
    this.intersectionObserver?.disconnect();
    this.intersectionObserver = null;

    // Clear caches
    this.pngCache.clear();
    this.metaCache.clear();

    // Clear module reference so it reloads fresh
    rendererModule = null;
    loadingPromise = null;
  }

  private clearDeactivationTimer(el: HTMLElement) {
    const timer = this.deactivationTimers.get(el);
    if (timer) {
      window.clearTimeout(timer);
      this.deactivationTimers.delete(el);
    }
  }

  private handleIntersection(entries: IntersectionObserverEntry[]) {
    for (const entry of entries) {
      const el = entry.target as HTMLElement;
      const state = this.elements.get(el);
      if (!state?.active) continue;

      if (!entry.isIntersecting) {
        // Start deactivation timer
        if (!this.deactivationTimers.has(el)) {
          const timer = window.setTimeout(() => {
            this.deactivationTimers.delete(el);
            this.deactivateElement(el);
          }, DEACTIVATION_DELAY_MS);
          this.deactivationTimers.set(el, timer);
        }
      } else {
        // Cancel deactivation if back in view
        this.clearDeactivationTimer(el);
      }
    }
  }

  private async getMetadata(source: string, filePath: string): Promise<Metadata> {
    const cacheKey = hashSource(source);
    let meta = this.metaCache.get(cacheKey);
    if (!meta) {
      meta = await parseSource(source, '/' + filePath, this.vfs);
      this.metaCache.set(cacheKey, meta);
    }
    return meta;
  }

  private async processWireBlock(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
    // Skip if content doesn't look like valid WireScript
    if (!looksLikeWireScript(source)) {
      // Show as plain code block
      const pre = document.createElement('pre');
      const code = document.createElement('code');
      code.textContent = source;
      pre.appendChild(code);
      el.appendChild(pre);
      return;
    }

    el.addClass('wirescript-container');

    const meta = await this.getMetadata(source, ctx.sourcePath);
    const cacheKey = hashSource(source);
    const cachedPng = this.pngCache.get(cacheKey);

    // Track element
    this.elements.set(el, { source, active: false });

    // Show cached PNG or skeleton
    if (cachedPng) {
      el.innerHTML = generatePngPlaceholder(cachedPng, meta);
    } else {
      el.innerHTML = generateSkeleton(meta);
      this.startBackgroundRender(source, el, meta);
    }

    // Attach activation handlers
    this.attachActivateHandler(el, source, meta);

    // Cleanup when element is removed from DOM
    const cleanup = new MarkdownRenderChild(el);
    cleanup.onunload = () => {
      const state = this.elements.get(el);
      state?.cleanup?.();
      this.elements.delete(el);
      this.pendingRenders.get(el)?.abort();
      this.pendingRenders.delete(el);
      this.intersectionObserver?.unobserve(el);
      this.clearDeactivationTimer(el);
    };
    ctx.addChild(cleanup);
  }

  private attachActivateHandler(el: HTMLElement, source: string, meta: Metadata) {
    const activate = () => this.activateElement(el, source, meta);

    const handleClick = (e: MouseEvent) => {
      e.preventDefault();
      void activate();
    };

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        void activate();
      }
    };

    el.addEventListener('click', handleClick);
    el.addEventListener('keydown', handleKeydown);

    // Store cleanup
    const state = this.elements.get(el);
    if (state) {
      const prevCleanup = state.cleanup;
      state.cleanup = () => {
        prevCleanup?.();
        el.removeEventListener('click', handleClick);
        el.removeEventListener('keydown', handleKeydown);
      };
    }
  }

  private async activateElement(el: HTMLElement, source: string, meta: Metadata) {
    const state = this.elements.get(el);
    if (!state || state.active || !meta.document) return;

    // Clear any pending deactivation timer
    this.clearDeactivationTimer(el);

    // Cancel pending background render
    this.pendingRenders.get(el)?.abort();
    this.pendingRenders.delete(el);

    // Show loading state
    const currentHeight = el.offsetHeight;
    el.style.minHeight = `${Math.max(currentHeight, 100)}px`;
    el.innerHTML = generateLoading(meta);
    state.active = true;

    try {
      const renderer = await loadRenderer();
      const { React, render, WireScriptRenderer } = renderer;

      // Re-check state (might have been cleaned up during load or element removed)
      if (!this.elements.has(el) || !el.isConnected) return;

      const viewportWidth = VIEWPORT_WIDTHS[meta.viewport] || VIEWPORT_WIDTHS.desktop;
      const containerWidth = el.clientWidth || 600;
      const scale = Math.min(1, containerWidth / viewportWidth);

      // Build UI
      el.innerHTML = generateActiveHeader(meta);

      // Wire up header actions
      const header = el.querySelector('.wirescript-header');
      const headerHandler = (e: Event) => {
        e.stopPropagation();
        const btn = (e.target as HTMLElement).closest('[data-action]');
        const action = btn?.getAttribute('data-action');
        if (action === 'fullscreen') {
          this.openFullscreen(source, meta);
        }
      };
      header?.addEventListener('click', headerHandler);

      // Keyboard shortcut for fullscreen
      const keyHandler = (e: KeyboardEvent) => {
        if (e.key === 'f' || e.key === 'F') {
          this.openFullscreen(source, meta);
        }
      };
      el.addEventListener('keydown', keyHandler);

      // Create iframe
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'width:100%;border:none;display:block;overflow:hidden;';
      el.appendChild(iframe);

      const iframeDoc = await waitForIframe(iframe);

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

      const container = iframeDoc.getElementById('root');
      if (!container) throw new Error('Container not found');

      // Render with pre-parsed document
      render(
        React.createElement(WireScriptRenderer, {
          document: meta.document,
          initialScreen: undefined,
        }),
        container
      );

      // Auto-resize iframe
      const updateHeight = () => {
        const contentHeight = iframeDoc.documentElement.scrollHeight * scale;
        iframe.style.height = `${Math.ceil(contentHeight)}px`;
        el.style.minHeight = '';
      };

      // Wait for render and update height
      requestAnimationFrame(() => {
        requestAnimationFrame(updateHeight);
      });

      const resizeObserver = new ResizeObserver(updateHeight);
      resizeObserver.observe(iframeDoc.body);

      // Observe for deactivation
      this.intersectionObserver?.observe(el);

      // Store cleanup
      state.cleanup = () => {
        resizeObserver.disconnect();
        header?.removeEventListener('click', headerHandler);
        el.removeEventListener('keydown', keyHandler);
        this.intersectionObserver?.unobserve(el);
        try {
          render(null, container);
        } catch {}
      };
    } catch (error) {
      el.innerHTML = generateError(`Failed to load: ${error}`);
      el.style.minHeight = '';
      state.active = false;
    }
  }

  private async deactivateElement(el: HTMLElement) {
    const state = this.elements.get(el);
    if (!state?.active) return;

    // Clear any pending deactivation timer (in case called directly)
    this.clearDeactivationTimer(el);

    // Run cleanup
    state.cleanup?.();
    state.cleanup = undefined;
    state.active = false;

    // Restore placeholder
    // Note: We don't have ctx.sourcePath here, so we'll use a fallback path
    const meta = await this.getMetadata(state.source, 'unknown.wire');
    const cacheKey = hashSource(state.source);
    const cachedPng = this.pngCache.get(cacheKey);

    if (cachedPng) {
      el.innerHTML = generatePngPlaceholder(cachedPng, meta);
    } else {
      el.innerHTML = generateSkeleton(meta);
    }

    // Re-attach activation handler
    this.attachActivateHandler(el, state.source, meta);
  }

  private startBackgroundRender(source: string, el: HTMLElement, meta: Metadata) {
    if (meta.error || !meta.document) return;

    const controller = new AbortController();
    this.pendingRenders.set(el, controller);

    const scheduleRender = window.requestIdleCallback || ((cb: () => void) => setTimeout(cb, 100));

    scheduleRender(async () => {
      if (controller.signal.aborted) return;

      try {
        const pngDataUrl = await this.renderToPng(source, meta);
        if (controller.signal.aborted || !pngDataUrl) return;

        // Update placeholder if still showing skeleton
        if (el.isConnected && el.querySelector('.wirescript-placeholder')) {
          el.innerHTML = generatePngPlaceholder(pngDataUrl, meta);
          this.attachActivateHandler(el, source, meta);
        }
      } catch {
        // Silently fail - skeleton remains
      }

      this.pendingRenders.delete(el);
    });
  }

  private async renderToPng(source: string, meta: Metadata): Promise<string | null> {
    const cacheKey = hashSource(source);
    const cached = this.pngCache.get(cacheKey);
    if (cached) return cached;

    if (!meta.document) return null;

    try {
      const renderer = await loadRenderer();
      const { React, render, WireScriptRenderer, html2canvas } = renderer;

      const viewportWidth = VIEWPORT_WIDTHS[meta.viewport] || VIEWPORT_WIDTHS.desktop;

      // Create hidden iframe
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
        this.pngCache.set(cacheKey, dataUrl);

        render(null, container);
        return dataUrl;
      } finally {
        document.body.removeChild(iframe);
      }
    } catch {
      return null;
    }
  }

  private openFullscreen(_source: string, meta: Metadata) {
    if (this.fullscreenOverlay || !meta.document) return;

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
    this.fullscreenOverlay = overlay;

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
      ?.addEventListener('click', () => this.closeFullscreen());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.closeFullscreen();
    });

    // Keyboard handler
    this.fullscreenKeyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') this.closeFullscreen();
    };
    document.addEventListener('keydown', this.fullscreenKeyHandler);

    document.body.style.overflow = 'hidden';
  }

  private closeFullscreen() {
    if (!this.fullscreenOverlay) return;

    if (this.fullscreenKeyHandler) {
      document.removeEventListener('keydown', this.fullscreenKeyHandler);
      this.fullscreenKeyHandler = null;
    }

    // Cleanup iframe
    const iframe = this.fullscreenOverlay.querySelector('iframe');
    if (iframe && rendererModule) {
      const container = iframe.contentDocument?.getElementById('root');
      if (container) {
        try {
          rendererModule.render(null, container);
        } catch {}
      }
    }

    this.fullscreenOverlay.remove();
    this.fullscreenOverlay = null;
    document.body.style.overflow = '';
  }
}
