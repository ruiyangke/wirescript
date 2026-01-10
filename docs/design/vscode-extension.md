# VSCode Extension Design

## Overview

Build a VSCode extension for WireScript that provides:
1. Live preview panel with viewport simulation (mobile/tablet/desktop)
2. Syntax highlighting and error diagnostics
3. Language intelligence (completion, go-to-definition, outline)
4. Include file watching for multi-file projects

## Design Principles

1. **Reuse existing code** - Same renderer as Chrome/Obsidian plugins
2. **React in webview** - Full interactivity (dropdowns, tabs, modals)
3. **Bundle everything** - All icons included, no tree-shaking complexity
4. **LSP-ready architecture** - Structure for future extraction

## Architecture

Same pattern as Chrome extension:

```
Chrome Extension                    VSCode Extension
─────────────────                   ─────────────────
content.ts (detect blocks)          extension.ts (commands, providers)
     │                                   │
     ▼                                   ▼
iframe (sandboxed)                  webview (sandboxed)
     │                                   │
     ▼                                   ▼
React + WireScriptRenderer          React + WireScriptRenderer (SAME)
```

### File Structure

```
apps/vscode-extension/
├── package.json
├── tsconfig.json
├── esbuild.config.mjs              # Builds extension + webview bundles
├── syntaxes/
│   └── wirescript.tmLanguage.json  # Copy from docs
├── language-configuration.json     # Brackets, comments, word pattern
├── src/
│   ├── extension.ts                # Activation, commands, providers
│   ├── preview/
│   │   ├── PreviewPanel.ts         # Webview panel lifecycle
│   │   └── getWebviewContent.ts    # HTML template
│   ├── webview/
│   │   ├── main.tsx                # Webview entry point
│   │   ├── WireScriptRenderer.tsx  # COPY from chrome-extension
│   │   └── styles.css              # Webview styles
│   ├── providers/
│   │   ├── diagnostics.ts          # Parse errors → Problems panel
│   │   ├── symbols.ts              # Document outline
│   │   ├── completion.ts           # Autocomplete
│   │   ├── definition.ts           # Go-to-definition
│   │   ├── references.ts           # Find references
│   │   ├── hover.ts                # Element docs
│   │   └── formatting.ts           # Format document
│   ├── cache/
│   │   └── CompilationCache.ts     # Shared compile results
│   └── watchers/
│       └── IncludeWatcher.ts       # Watch included files
└── media/
    └── icon.png
```

## Webview Architecture

### Message Protocol

```
Extension Host                         Webview
      │                                   │
      ├─── { type: 'update',              │
      │      source: string,             ─►│  Compile & render
      │      screenId?: string }          │
      │                                   │
      │◄── { type: 'screenChange',       ─┤  User clicked tab
      │      screenId: string }           │
      │                                   │
      │◄── { type: 'elementClick',       ─┤  Click-to-source
      │      line: number, col: number }  │
      │                                   │
      │◄── { type: 'stateChange',        ─┤  Viewport, zoom, scroll
      │      state: PreviewState }        │
      │                                   │
      ├─── { type: 'restore',             │
      │      state: PreviewState }       ─►│  Restore after reopen
```

### Webview Entry Point

```tsx
// src/webview/main.tsx
import { createRoot } from 'react-dom/client';
import { WireScriptRenderer } from './WireScriptRenderer';
import { compile } from '@wirescript/dsl';

interface Message {
  type: 'update' | 'restore';
  source?: string;
  screenId?: string;
  state?: PreviewState;
}

const vscode = acquireVsCodeApi();
let root: Root | null = null;

function render(source: string, screenId?: string) {
  const result = compile(source);

  if (!result.success || !result.document) {
    // Show error state
    return;
  }

  if (!root) {
    root = createRoot(document.getElementById('root')!);
  }

  root.render(
    <WireScriptRenderer
      document={result.document}
      initialScreen={screenId}
      onScreenChange={(id) => vscode.postMessage({ type: 'screenChange', screenId: id })}
    />
  );
}

window.addEventListener('message', (event) => {
  const message: Message = event.data;

  switch (message.type) {
    case 'update':
      render(message.source!, message.screenId);
      break;
    case 'restore':
      // Restore viewport, zoom, scroll from state
      break;
  }
});

// Signal ready
vscode.postMessage({ type: 'ready' });
```

### WireScriptRenderer

Copy directly from `apps/chrome-extension/src/WireScriptRenderer.tsx`:

```tsx
// src/webview/WireScriptRenderer.tsx
// IDENTICAL to chrome-extension version

import type { WireDocument } from '@wirescript/dsl';
import { ThemeProvider, WireRenderer } from '@wirescript/renderer';
import { useState } from 'react';

interface WireScriptRendererProps {
  document: WireDocument;
  initialScreen?: string;
  onScreenChange?: (screenId: string) => void;
}

export function WireScriptRenderer({ document, initialScreen, onScreenChange }: WireScriptRendererProps) {
  // ... same implementation
}
```

## Build Configuration

**Two bundles:**

```javascript
// esbuild.config.mjs
import * as esbuild from 'esbuild';
import { readFileSync, cpSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const prod = process.argv.includes('--production');

// Get renderer CSS
const rendererCSS = readFileSync(
  join(__dirname, '../../packages/renderer/dist/styles.css'),
  'utf-8'
);

// Ensure dist exists
if (!existsSync('dist')) mkdirSync('dist');

// 1. Extension bundle (Node.js, runs in extension host)
await esbuild.build({
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  target: 'node18',
  sourcemap: !prod,
  minify: prod,
});

// 2. Webview bundle (Browser, runs in webview)
await esbuild.build({
  entryPoints: ['src/webview/main.tsx'],
  bundle: true,
  outfile: 'dist/webview.js',
  format: 'iife',
  platform: 'browser',
  target: 'es2020',
  sourcemap: !prod,
  minify: prod,
  define: {
    'process.env.NODE_ENV': prod ? '"production"' : '"development"',
  },
});

// 3. Write CSS
const webviewCSS = `
${rendererCSS}

/* Webview-specific styles */
body {
  margin: 0;
  padding: 0;
  background: var(--vscode-editor-background);
}

.viewport-frame {
  margin: 0 auto;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}
`;
writeFileSync('dist/webview.css', webviewCSS);

// 4. Copy static assets
cpSync('syntaxes', 'dist/syntaxes', { recursive: true });
cpSync('media', 'dist/media', { recursive: true });

console.log('Build complete');
```

**Bundle sizes (estimated):**
- Extension: ~100KB (DSL + providers)
- Webview: ~800KB (React + Renderer + all Lucide icons)
- CSS: ~50KB

Total: ~950KB (acceptable for VSCode extension)

## Preview Panel Implementation

```typescript
// src/preview/PreviewPanel.ts
import * as vscode from 'vscode';
import { CompilationCache } from '../cache/CompilationCache';

export class PreviewPanel {
  public static currentPanel: PreviewPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private readonly extensionUri: vscode.Uri;
  private document: vscode.TextDocument | undefined;
  private state: PreviewState = { viewport: 'desktop', zoom: 100 };
  private disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this.panel = panel;
    this.extensionUri = extensionUri;

    // Handle messages from webview
    this.panel.webview.onDidReceiveMessage(
      (message) => this.handleMessage(message),
      null,
      this.disposables
    );

    // Handle panel disposal
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
  }

  public static create(extensionUri: vscode.Uri, document: vscode.TextDocument) {
    const column = vscode.ViewColumn.Beside;

    // Reuse existing panel if available
    if (PreviewPanel.currentPanel) {
      PreviewPanel.currentPanel.panel.reveal(column);
      PreviewPanel.currentPanel.update(document);
      return PreviewPanel.currentPanel;
    }

    // Create new panel
    const panel = vscode.window.createWebviewPanel(
      'wirescript.preview',
      'WireScript Preview',
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true, // Keep state when hidden
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'dist')],
      }
    );

    PreviewPanel.currentPanel = new PreviewPanel(panel, extensionUri);
    PreviewPanel.currentPanel.update(document);
    return PreviewPanel.currentPanel;
  }

  public update(document: vscode.TextDocument) {
    this.document = document;
    this.panel.webview.html = this.getHtmlContent();
    this.sendUpdate();
  }

  private sendUpdate() {
    if (!this.document) return;

    this.panel.webview.postMessage({
      type: 'update',
      source: this.document.getText(),
    });
  }

  private handleMessage(message: any) {
    switch (message.type) {
      case 'ready':
        this.sendUpdate();
        break;
      case 'screenChange':
        // Could sync back to editor
        break;
      case 'elementClick':
        this.jumpToSource(message.line, message.col);
        break;
      case 'stateChange':
        this.state = message.state;
        break;
    }
  }

  private jumpToSource(line: number, col: number) {
    if (!this.document) return;

    const editor = vscode.window.visibleTextEditors.find(
      (e) => e.document === this.document
    );

    if (editor) {
      const position = new vscode.Position(line - 1, col - 1);
      editor.selection = new vscode.Selection(position, position);
      editor.revealRange(new vscode.Range(position, position));
    }
  }

  private getHtmlContent(): string {
    const webview = this.panel.webview;
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview.css')
    );

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'none';
    style-src ${webview.cspSource} 'unsafe-inline';
    script-src ${webview.cspSource};
    font-src ${webview.cspSource};
  ">
  <link href="${styleUri}" rel="stylesheet">
  <title>WireScript Preview</title>
</head>
<body>
  <div id="root"></div>
  <script src="${scriptUri}"></script>
</body>
</html>`;
  }

  private dispose() {
    PreviewPanel.currentPanel = undefined;
    this.panel.dispose();
    this.disposables.forEach((d) => d.dispose());
  }
}
```

## Compilation Cache

```typescript
// src/cache/CompilationCache.ts
import * as vscode from 'vscode';
import { compile, type CompileResult } from '@wirescript/dsl';

interface CacheEntry {
  version: number;
  result: CompileResult;
}

export class CompilationCache {
  private static instance: CompilationCache;
  private cache = new Map<string, CacheEntry>();

  static getInstance(): CompilationCache {
    if (!CompilationCache.instance) {
      CompilationCache.instance = new CompilationCache();
    }
    return CompilationCache.instance;
  }

  get(document: vscode.TextDocument): CompileResult {
    const key = document.uri.toString();
    const cached = this.cache.get(key);

    if (cached && cached.version === document.version) {
      return cached.result;
    }

    const result = compile(document.getText());
    this.cache.set(key, { version: document.version, result });
    return result;
  }

  invalidate(uri: vscode.Uri) {
    this.cache.delete(uri.toString());
  }

  clear() {
    this.cache.clear();
  }
}
```

## Language Providers

All providers use the shared CompilationCache:

```typescript
// src/providers/diagnostics.ts
import * as vscode from 'vscode';
import { CompilationCache } from '../cache/CompilationCache';

export function createDiagnosticsProvider() {
  const collection = vscode.languages.createDiagnosticCollection('wirescript');
  const cache = CompilationCache.getInstance();

  const update = (document: vscode.TextDocument) => {
    if (document.languageId !== 'wire') return;

    const result = cache.get(document);

    if (result.success) {
      collection.delete(document.uri);
      return;
    }

    const diagnostics = result.errors.map((error) => {
      const range = new vscode.Range(
        error.line - 1,
        error.column - 1,
        error.line - 1,
        error.column + 10
      );
      return new vscode.Diagnostic(range, error.message, vscode.DiagnosticSeverity.Error);
    });

    collection.set(document.uri, diagnostics);
  };

  return {
    collection,
    update,
  };
}
```

```typescript
// src/providers/symbols.ts
import * as vscode from 'vscode';
import { CompilationCache } from '../cache/CompilationCache';

export class DocumentSymbolProvider implements vscode.DocumentSymbolProvider {
  private cache = CompilationCache.getInstance();

  provideDocumentSymbols(document: vscode.TextDocument): vscode.DocumentSymbol[] {
    const result = this.cache.get(document);
    if (!result.document) return [];

    const symbols: vscode.DocumentSymbol[] = [];

    // Screens
    for (const screen of result.document.screens) {
      if (!screen.loc) continue;
      const range = this.locToRange(screen.loc);
      symbols.push(
        new vscode.DocumentSymbol(
          screen.name || screen.id,
          `screen · ${screen.viewport}`,
          vscode.SymbolKind.Class,
          range,
          range
        )
      );
    }

    // Components (defines)
    for (const [name, def] of Object.entries(result.document.components)) {
      if (!def.loc) continue;
      const range = this.locToRange(def.loc);
      symbols.push(
        new vscode.DocumentSymbol(
          name,
          'component',
          vscode.SymbolKind.Function,
          range,
          range
        )
      );
    }

    // Layouts
    for (const [name, layout] of Object.entries(result.document.layouts)) {
      if (!layout.loc) continue;
      const range = this.locToRange(layout.loc);
      symbols.push(
        new vscode.DocumentSymbol(
          name,
          'layout',
          vscode.SymbolKind.Struct,
          range,
          range
        )
      );
    }

    return symbols;
  }

  private locToRange(loc: { start: { line: number; column: number }; end: { line: number; column: number } }): vscode.Range {
    return new vscode.Range(
      loc.start.line - 1,
      loc.start.column - 1,
      loc.end.line - 1,
      loc.end.column - 1
    );
  }
}
```

```typescript
// src/providers/definition.ts
import * as vscode from 'vscode';
import { CompilationCache } from '../cache/CompilationCache';

export class DefinitionProvider implements vscode.DefinitionProvider {
  private cache = CompilationCache.getInstance();

  provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.Definition | null {
    const result = this.cache.get(document);
    if (!result.document) return null;

    const wordRange = document.getWordRangeAtPosition(position, /[a-zA-Z_][a-zA-Z0-9_-]*/);
    if (!wordRange) return null;

    const word = document.getText(wordRange);

    // Check components
    const component = result.document.components[word];
    if (component?.loc) {
      return new vscode.Location(
        document.uri,
        new vscode.Position(component.loc.start.line - 1, component.loc.start.column - 1)
      );
    }

    // Check layouts
    const layout = result.document.layouts[word];
    if (layout?.loc) {
      return new vscode.Location(
        document.uri,
        new vscode.Position(layout.loc.start.line - 1, layout.loc.start.column - 1)
      );
    }

    return null;
  }
}
```

## Extension Entry Point

```typescript
// src/extension.ts
import * as vscode from 'vscode';
import { PreviewPanel } from './preview/PreviewPanel';
import { CompilationCache } from './cache/CompilationCache';
import { createDiagnosticsProvider } from './providers/diagnostics';
import { DocumentSymbolProvider } from './providers/symbols';
import { DefinitionProvider } from './providers/definition';
import { FormattingProvider } from './providers/formatting';
import { CompletionProvider } from './providers/completion';
import { HoverProvider } from './providers/hover';

export function activate(context: vscode.ExtensionContext) {
  const cache = CompilationCache.getInstance();

  // Register preview command
  context.subscriptions.push(
    vscode.commands.registerCommand('wirescript.openPreview', () => {
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document.languageId === 'wire') {
        PreviewPanel.create(context.extensionUri, editor.document);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('wirescript.openPreviewToSide', () => {
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document.languageId === 'wire') {
        PreviewPanel.create(context.extensionUri, editor.document);
      }
    })
  );

  // Diagnostics
  const diagnostics = createDiagnosticsProvider();
  context.subscriptions.push(diagnostics.collection);

  // Update diagnostics on document change
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.languageId === 'wire') {
        diagnostics.update(e.document);
        // Update preview if open
        if (PreviewPanel.currentPanel) {
          PreviewPanel.currentPanel.update(e.document);
        }
      }
    })
  );

  // Update diagnostics on document open
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((document) => {
      if (document.languageId === 'wire') {
        diagnostics.update(document);
      }
    })
  );

  // Register language providers
  const selector: vscode.DocumentSelector = { language: 'wire' };

  context.subscriptions.push(
    vscode.languages.registerDocumentSymbolProvider(selector, new DocumentSymbolProvider())
  );

  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(selector, new DefinitionProvider())
  );

  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider(selector, new FormattingProvider())
  );

  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(selector, new CompletionProvider(), '(', ':')
  );

  context.subscriptions.push(
    vscode.languages.registerHoverProvider(selector, new HoverProvider())
  );

  // Initial diagnostics for open documents
  vscode.workspace.textDocuments.forEach((doc) => {
    if (doc.languageId === 'wire') {
      diagnostics.update(doc);
    }
  });
}

export function deactivate() {
  CompilationCache.getInstance().clear();
}
```

## Package.json

```json
{
  "name": "wirescript",
  "displayName": "WireScript",
  "description": "WireScript wireframe language support",
  "version": "0.0.1",
  "publisher": "wirescript",
  "engines": {
    "vscode": "^1.85.0"
  },
  "categories": ["Programming Languages", "Visualization"],
  "keywords": ["wireframe", "design", "lisp", "dsl"],
  "activationEvents": [],
  "main": "./dist/extension.js",
  "contributes": {
    "languages": [
      {
        "id": "wire",
        "aliases": ["WireScript", "wire", "wirescript"],
        "extensions": [".wire"],
        "configuration": "./language-configuration.json"
      }
    ],
    "grammars": [
      {
        "language": "wire",
        "scopeName": "source.wire",
        "path": "./dist/syntaxes/wirescript.tmLanguage.json"
      }
    ],
    "commands": [
      {
        "command": "wirescript.openPreview",
        "title": "Open Preview",
        "category": "WireScript",
        "icon": "$(open-preview)"
      },
      {
        "command": "wirescript.openPreviewToSide",
        "title": "Open Preview to Side",
        "category": "WireScript",
        "icon": "$(open-preview)"
      }
    ],
    "menus": {
      "editor/title": [
        {
          "command": "wirescript.openPreviewToSide",
          "when": "editorLangId == wire",
          "group": "navigation"
        }
      ],
      "commandPalette": [
        {
          "command": "wirescript.openPreview",
          "when": "editorLangId == wire"
        },
        {
          "command": "wirescript.openPreviewToSide",
          "when": "editorLangId == wire"
        }
      ]
    },
    "keybindings": [
      {
        "command": "wirescript.openPreviewToSide",
        "key": "ctrl+shift+v",
        "mac": "cmd+shift+v",
        "when": "editorLangId == wire"
      }
    ],
    "configuration": {
      "title": "WireScript",
      "properties": {
        "wirescript.preview.defaultViewport": {
          "type": "string",
          "enum": ["mobile", "tablet", "desktop"],
          "default": "desktop",
          "description": "Default viewport for preview"
        },
        "wirescript.format.onSave": {
          "type": "boolean",
          "default": false,
          "description": "Format .wire files on save"
        }
      }
    }
  },
  "scripts": {
    "build": "node esbuild.config.mjs",
    "build:prod": "node esbuild.config.mjs --production",
    "watch": "node esbuild.config.mjs --watch",
    "package": "vsce package",
    "publish": "vsce publish"
  },
  "dependencies": {
    "@wirescript/dsl": "workspace:*",
    "@wirescript/renderer": "workspace:*",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/vscode": "^1.85.0",
    "@vscode/vsce": "^2.22.0",
    "esbuild": "^0.20.0",
    "typescript": "^5.0.0"
  }
}
```

## Language Configuration

```json
// language-configuration.json
{
  "comments": {
    "lineComment": ";"
  },
  "brackets": [
    ["(", ")"]
  ],
  "autoClosingPairs": [
    { "open": "(", "close": ")" },
    { "open": "\"", "close": "\"" }
  ],
  "surroundingPairs": [
    ["(", ")"],
    ["\"", "\""]
  ],
  "wordPattern": "[a-zA-Z_][a-zA-Z0-9_-]*",
  "indentationRules": {
    "increaseIndentPattern": "^.*\\((?!.*\\)).*$",
    "decreaseIndentPattern": "^\\s*\\).*$"
  }
}
```

## Implementation Timeline

| Week | Tasks |
|------|-------|
| 1 | Scaffold, syntax highlighting, basic preview panel |
| 2 | Diagnostics, formatting, document symbols |
| 3 | Go-to-definition, completion, hover |
| 4 | Include file watching, bidirectional sync |
| 5 | State persistence, viewport controls, polish |
| 6 | Testing, documentation, publish |

## Success Metrics

- [ ] Preview shows within 200ms of opening
- [ ] Live update on keystroke (debounced)
- [ ] All 35 elements have completion/hover
- [ ] Go-to-definition works for components/layouts
- [ ] Format command works
- [ ] Works in VSCodium (Open VSX)
- [ ] Bundle size ~1MB (acceptable)
