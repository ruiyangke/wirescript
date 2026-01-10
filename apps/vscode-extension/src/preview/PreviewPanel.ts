import * as vscode from 'vscode';
import { compile } from '@wirescript/dsl';
import { getWebviewContent } from './getWebviewContent.js';

/**
 * Manages the WireScript preview webview panel.
 */
export class PreviewPanel {
  public static currentPanel: PreviewPanel | undefined;
  private static readonly viewType = 'wirescript.preview';

  private readonly panel: vscode.WebviewPanel;
  private readonly extensionUri: vscode.Uri;
  private document: vscode.TextDocument | undefined;
  private disposables: vscode.Disposable[] = [];

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    document?: vscode.TextDocument
  ) {
    this.panel = panel;
    this.extensionUri = extensionUri;
    this.document = document;

    this.panel.webview.html = getWebviewContent(
      this.panel.webview,
      this.extensionUri
    );

    // Handle panel disposal
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    // Handle visibility changes
    this.panel.onDidChangeViewState(
      () => {
        if (this.panel.visible && this.document) {
          this.update();
        }
      },
      null,
      this.disposables
    );

    // Handle messages from webview
    this.panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.type) {
          case 'ready':
            // Webview is ready, send initial content
            if (this.document) {
              this.update();
            }
            break;
          case 'viewMode':
            this.handleViewModeChange(message.mode);
            break;
          case 'navigate':
            vscode.window.showInformationMessage(
              `Navigate to: ${message.screenId}`
            );
            break;
          case 'error':
            vscode.window.showErrorMessage(`Preview error: ${message.message}`);
            break;
        }
      },
      null,
      this.disposables
    );
  }

  /**
   * Create or show the preview panel.
   */
  public static createOrShow(
    extensionUri: vscode.Uri,
    document?: vscode.TextDocument,
    viewColumn?: vscode.ViewColumn
  ): PreviewPanel {
    const column = viewColumn || vscode.ViewColumn.Beside;

    // If we already have a panel, show it
    if (PreviewPanel.currentPanel) {
      PreviewPanel.currentPanel.panel.reveal(column);
      if (document) {
        PreviewPanel.currentPanel.document = document;
        PreviewPanel.currentPanel.update();
      }
      return PreviewPanel.currentPanel;
    }

    // Create a new panel
    const panel = vscode.window.createWebviewPanel(
      PreviewPanel.viewType,
      'WireScript Preview',
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'dist')],
      }
    );

    PreviewPanel.currentPanel = new PreviewPanel(panel, extensionUri, document);
    return PreviewPanel.currentPanel;
  }

  /**
   * Update the preview with current document content.
   */
  public update(document?: vscode.TextDocument): void {
    if (document) {
      this.document = document;
    }

    if (!this.document) {
      return;
    }

    const source = this.document.getText();
    const result = compile(source);

    if (result.success && result.document) {
      this.panel.webview.postMessage({
        type: 'update',
        document: result.document,
      });
    } else {
      this.panel.webview.postMessage({
        type: 'error',
        errors: result.errors,
      });
    }
  }

  /**
   * Update the panel title based on document.
   */
  public updateTitle(title: string): void {
    this.panel.title = title;
  }

  /**
   * Handle view mode changes from the webview.
   */
  private handleViewModeChange(mode: 'side-by-side' | 'preview-only'): void {
    if (mode === 'preview-only') {
      // Move preview to take the whole editor area
      vscode.commands.executeCommand('workbench.action.closeEditorsInOtherGroups');
      this.panel.reveal(vscode.ViewColumn.One);
    } else {
      // Side by side - reopen the document if we have one
      if (this.document) {
        vscode.window.showTextDocument(this.document, vscode.ViewColumn.One);
        this.panel.reveal(vscode.ViewColumn.Two);
      }
    }
  }

  /**
   * Dispose of the panel.
   */
  public dispose(): void {
    PreviewPanel.currentPanel = undefined;
    this.panel.dispose();

    while (this.disposables.length) {
      const d = this.disposables.pop();
      if (d) {
        d.dispose();
      }
    }
  }
}
