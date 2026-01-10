import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const __dirname = dirname(fileURLToPath(import.meta.url));
const prod = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

// Get renderer CSS for embedding in preview
function getRendererCSS() {
  const cssPath = join(__dirname, '../../packages/renderer/dist/styles.css');
  if (!existsSync(cssPath)) {
    console.error('Renderer CSS not found. Build @wirescript/renderer first.');
    console.error('Run: pnpm --filter @wirescript/renderer build');
    process.exit(1);
  }
  return readFileSync(cssPath, 'utf-8');
}

// Ensure dist exists
const distDir = join(__dirname, 'dist');
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

const rendererCSS = getRendererCSS();

// Shared esbuild options
const commonOptions = {
  bundle: true,
  sourcemap: !prod,
  minify: prod,
  logLevel: 'info',
};

// 1. Extension bundle (Node.js, runs in extension host)
const extensionContext = await esbuild.context({
  ...commonOptions,
  entryPoints: [join(__dirname, 'src/extension.ts')],
  outfile: join(distDir, 'extension.js'),
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  target: 'node18',
});

// 2. Webview bundle (Browser, runs in webview)
const webviewContext = await esbuild.context({
  ...commonOptions,
  entryPoints: [join(__dirname, 'src/webview/main.tsx')],
  outfile: join(distDir, 'webview.js'),
  format: 'iife',
  platform: 'browser',
  target: 'es2020',
  define: {
    'process.env.NODE_ENV': prod ? '"production"' : '"development"',
  },
});

// Write CSS file
function writeCSS() {
  const webviewCSS = `${rendererCSS}

/* Webview-specific styles */
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: hidden;
  background: var(--vscode-editor-background, #1e1e1e);
}

#root {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.wirescript-wrapper {
  flex: 1;
}

.wirescript-error {
  padding: 20px;
  color: var(--vscode-errorForeground, #f14c4c);
  background: var(--vscode-inputValidation-errorBackground, rgba(255, 0, 0, 0.1));
  border: 1px solid var(--vscode-inputValidation-errorBorder, #f14c4c);
  border-radius: 4px;
  margin: 20px;
}

.wirescript-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--vscode-foreground, #ccc);
}

.wirescript-preview-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.wirescript-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  background: var(--vscode-editor-background, #1e1e1e);
  border-bottom: 1px solid var(--vscode-panel-border, #444);
  flex-shrink: 0;
}

.wirescript-toolbar-group {
  display: flex;
  align-items: center;
  gap: 2px;
}

.wirescript-toolbar-divider {
  width: 1px;
  height: 16px;
  background: var(--vscode-panel-border, #444);
}

.wirescript-toolbar-spacer {
  flex: 1;
}

.wirescript-toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--vscode-foreground, #ccc);
  cursor: pointer;
  opacity: 0.7;
}

.wirescript-toolbar-btn:hover {
  background: var(--vscode-toolbar-hoverBackground, rgba(255, 255, 255, 0.1));
  opacity: 1;
}

.wirescript-toolbar-btn.active {
  background: var(--vscode-toolbar-activeBackground, rgba(255, 255, 255, 0.15));
  opacity: 1;
}

.wirescript-toolbar-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.wirescript-toolbar-btn-text {
  padding: 2px 6px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--vscode-foreground, #ccc);
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  opacity: 0.7;
}

.wirescript-toolbar-btn-text:hover {
  background: var(--vscode-toolbar-hoverBackground, rgba(255, 255, 255, 0.1));
  opacity: 1;
}

.wirescript-viewport-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--vscode-foreground, #ccc);
  cursor: pointer;
  opacity: 0.6;
}

.wirescript-viewport-btn:hover {
  background: var(--vscode-toolbar-hoverBackground, rgba(255, 255, 255, 0.1));
  opacity: 1;
}

.wirescript-viewport-btn.active {
  background: var(--vscode-button-background, #0e639c);
  color: var(--vscode-button-foreground, #fff);
  opacity: 1;
}

.wirescript-zoom-select {
  padding: 2px 4px;
  border: 1px solid var(--vscode-input-border, #444);
  border-radius: 4px;
  background: var(--vscode-input-background, #3c3c3c);
  color: var(--vscode-foreground, #ccc);
  font-size: 11px;
  cursor: pointer;
  min-width: 54px;
}

.wirescript-zoom-select:hover {
  background: var(--vscode-list-hoverBackground, #2a2d2e);
}

.wirescript-screen-dropdown {
  position: relative;
}

.wirescript-screen-dropdown-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 6px;
  border: 1px solid var(--vscode-input-border, #444);
  border-radius: 4px;
  background: var(--vscode-input-background, #3c3c3c);
  color: var(--vscode-foreground, #ccc);
  font-size: 11px;
  cursor: pointer;
  min-width: 160px;
  max-width: 220px;
}

.wirescript-screen-dropdown-btn:hover {
  background: var(--vscode-list-hoverBackground, #2a2d2e);
}

.wirescript-screen-dropdown-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
}

.wirescript-screen-dropdown-chevron {
  flex-shrink: 0;
  transition: transform 0.15s ease;
}

.wirescript-screen-dropdown-chevron.open {
  transform: rotate(180deg);
}

.wirescript-screen-dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 2px;
  min-width: 160px;
  max-width: 220px;
  max-height: 300px;
  overflow-y: auto;
  background: var(--vscode-dropdown-background, #3c3c3c);
  border: 1px solid var(--vscode-dropdown-border, #444);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  z-index: 100;
}

.wirescript-screen-dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 8px;
  border: none;
  background: transparent;
  color: var(--vscode-dropdown-foreground, #ccc);
  font-size: 11px;
  cursor: pointer;
  text-align: left;
}

.wirescript-screen-dropdown-item:hover {
  background: var(--vscode-list-hoverBackground, #2a2d2e);
}

.wirescript-screen-dropdown-item.active {
  background: var(--vscode-list-activeSelectionBackground, #094771);
  color: var(--vscode-list-activeSelectionForeground, #fff);
}

.wirescript-toolbar-btn-text.active {
  color: var(--vscode-textLink-foreground, #3794ff);
}

.wirescript-preview-canvas {
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: var(--vscode-editor-background, #1e1e1e);
}

.wirescript-preview-inner {
  display: flex;
  min-height: 100%;
  align-items: flex-start;
  justify-content: center;
  padding: 32px;
}

.wirescript-preview-frame {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

`;
  writeFileSync(join(distDir, 'webview.css'), webviewCSS);
}

// Copy static assets
function copyAssets() {
  // Copy TextMate grammar
  const grammarSrc = join(__dirname, '../docs/wirescript.tmLanguage.json');
  const grammarDest = join(distDir, 'syntaxes');
  if (!existsSync(grammarDest)) {
    mkdirSync(grammarDest, { recursive: true });
  }
  if (existsSync(grammarSrc)) {
    cpSync(grammarSrc, join(grammarDest, 'wirescript.tmLanguage.json'));
  } else {
    // Try alternate location
    const altSrc = join(__dirname, 'syntaxes/wirescript.tmLanguage.json');
    if (existsSync(altSrc)) {
      cpSync(altSrc, join(grammarDest, 'wirescript.tmLanguage.json'));
    }
  }

  // Copy media if exists
  const mediaSrc = join(__dirname, 'media');
  const mediaDest = join(distDir, 'media');
  if (existsSync(mediaSrc)) {
    if (!existsSync(mediaDest)) {
      mkdirSync(mediaDest, { recursive: true });
    }
    cpSync(mediaSrc, mediaDest, { recursive: true });
  }
}

// Build
async function build() {
  await Promise.all([extensionContext.rebuild(), webviewContext.rebuild()]);
  writeCSS();
  copyAssets();
  console.log('Build complete');
}

if (watch) {
  await build();
  await Promise.all([extensionContext.watch(), webviewContext.watch()]);
  console.log('Watching for changes...');
} else {
  await build();
  await extensionContext.dispose();
  await webviewContext.dispose();
}
