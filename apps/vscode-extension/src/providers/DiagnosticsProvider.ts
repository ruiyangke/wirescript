import * as vscode from 'vscode';
import { CompilationCache } from '../cache/CompilationCache.js';

/**
 * Provides diagnostics (error/warning squiggles) for WireScript files.
 */
export class DiagnosticsProvider implements vscode.Disposable {
  private diagnosticCollection: vscode.DiagnosticCollection;
  private cache = CompilationCache.getInstance();

  constructor() {
    this.diagnosticCollection =
      vscode.languages.createDiagnosticCollection('wirescript');
  }

  /**
   * Update diagnostics for a document.
   */
  async update(document: vscode.TextDocument): Promise<void> {
    const result = await this.cache.get(document);
    const diagnostics: vscode.Diagnostic[] = [];

    if (!result.success) {
      for (const error of result.errors) {
        const line = (error.line ?? 1) - 1;
        const column = (error.column ?? 1) - 1;

        const range = new vscode.Range(line, column, line, column + 10);
        const diagnostic = new vscode.Diagnostic(
          range,
          error.message,
          vscode.DiagnosticSeverity.Error
        );
        diagnostic.source = 'wirescript';
        diagnostics.push(diagnostic);
      }
    }

    this.diagnosticCollection.set(document.uri, diagnostics);
  }

  /**
   * Clear diagnostics for a document.
   */
  clear(document: vscode.TextDocument): void {
    this.diagnosticCollection.delete(document.uri);
  }

  dispose(): void {
    this.diagnosticCollection.dispose();
  }
}
