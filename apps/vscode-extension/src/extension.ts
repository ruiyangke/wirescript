import * as vscode from 'vscode';
import { PreviewPanel } from './preview/index.js';
import { CompilationCache } from './cache/CompilationCache.js';
import {
  DiagnosticsProvider,
  DocumentSymbolProvider,
  DefinitionProvider,
  FormattingProvider,
  CompletionProvider,
  HoverProvider,
} from './providers/index.js';

const WIRE_SELECTOR: vscode.DocumentSelector = { language: 'wire', scheme: 'file' };

export function activate(context: vscode.ExtensionContext) {
  console.log('WireScript extension activated');

  const cache = CompilationCache.getInstance();

  // Register preview commands
  context.subscriptions.push(
    vscode.commands.registerCommand('wirescript.openPreview', () => {
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document.languageId === 'wire') {
        PreviewPanel.createOrShow(context.extensionUri, editor.document);
      } else {
        vscode.window.showWarningMessage('Open a .wire file to preview');
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('wirescript.openPreviewToSide', () => {
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document.languageId === 'wire') {
        PreviewPanel.createOrShow(
          context.extensionUri,
          editor.document,
          vscode.ViewColumn.Beside
        );
      } else {
        vscode.window.showWarningMessage('Open a .wire file to preview');
      }
    })
  );

  // Register diagnostics provider
  const diagnosticsProvider = new DiagnosticsProvider();
  context.subscriptions.push(diagnosticsProvider);

  // Update diagnostics on document change
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.document.languageId === 'wire') {
        // Invalidate cache
        cache.invalidate(event.document.uri);

        // Update diagnostics
        diagnosticsProvider.update(event.document);

        // Update preview if open
        PreviewPanel.currentPanel?.update(event.document);
      }
    })
  );

  // Update diagnostics on document open
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((document) => {
      if (document.languageId === 'wire') {
        diagnosticsProvider.update(document);
      }
    })
  );

  // Clear diagnostics on document close
  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument((document) => {
      if (document.languageId === 'wire') {
        cache.invalidate(document.uri);
        diagnosticsProvider.clear(document);
      }
    })
  );

  // Register document symbol provider (outline)
  context.subscriptions.push(
    vscode.languages.registerDocumentSymbolProvider(
      WIRE_SELECTOR,
      new DocumentSymbolProvider()
    )
  );

  // Register definition provider (go to definition)
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(
      WIRE_SELECTOR,
      new DefinitionProvider()
    )
  );

  // Register formatting provider
  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider(
      WIRE_SELECTOR,
      new FormattingProvider()
    )
  );

  // Register completion provider
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      WIRE_SELECTOR,
      new CompletionProvider(),
      ':', '(', '$'
    )
  );

  // Register hover provider
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(WIRE_SELECTOR, new HoverProvider())
  );

  // Initial diagnostics for already open documents
  for (const document of vscode.workspace.textDocuments) {
    if (document.languageId === 'wire') {
      diagnosticsProvider.update(document);
    }
  }

  // Update preview when active editor changes to a wire file
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor && editor.document.languageId === 'wire') {
        PreviewPanel.currentPanel?.update(editor.document);
      }
    })
  );
}

export function deactivate() {
  CompilationCache.getInstance().clear();
}
