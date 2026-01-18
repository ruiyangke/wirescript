import * as vscode from 'vscode';
import { CompilationCache } from '../cache/CompilationCache.js';

/**
 * Provides document outline (symbols) for WireScript files.
 * Shows screens, components (define), and layouts in the outline view.
 */
export class DocumentSymbolProvider implements vscode.DocumentSymbolProvider {
  private cache = CompilationCache.getInstance();

  async provideDocumentSymbols(
    document: vscode.TextDocument
  ): Promise<vscode.DocumentSymbol[]> {
    const result = await this.cache.get(document);
    if (!result.success || !result.document) {
      return [];
    }

    const symbols: vscode.DocumentSymbol[] = [];
    const doc = result.document;

    // Add screens
    for (const screen of doc.screens) {
      const loc = screen.loc;
      if (!loc) continue;

      const range = new vscode.Range(
        loc.line - 1,
        loc.column - 1,
        loc.endLine ? loc.endLine - 1 : loc.line - 1,
        loc.endColumn ? loc.endColumn - 1 : loc.column
      );

      const symbol = new vscode.DocumentSymbol(
        screen.name || screen.id,
        `screen: ${screen.id}`,
        vscode.SymbolKind.Class,
        range,
        range
      );
      symbols.push(symbol);
    }

    // Add components (define)
    for (const component of doc.components) {
      const loc = component.loc;
      if (!loc) continue;

      const range = new vscode.Range(
        loc.line - 1,
        loc.column - 1,
        loc.endLine ? loc.endLine - 1 : loc.line - 1,
        loc.endColumn ? loc.endColumn - 1 : loc.column
      );

      const params = component.params.join(', ');
      const symbol = new vscode.DocumentSymbol(
        component.name,
        params ? `(${params})` : '',
        vscode.SymbolKind.Function,
        range,
        range
      );
      symbols.push(symbol);
    }

    // Add layouts
    for (const layout of doc.layouts) {
      const loc = layout.loc;
      if (!loc) continue;

      const range = new vscode.Range(
        loc.line - 1,
        loc.column - 1,
        loc.endLine ? loc.endLine - 1 : loc.line - 1,
        loc.endColumn ? loc.endColumn - 1 : loc.column
      );

      const symbol = new vscode.DocumentSymbol(
        layout.name,
        'layout',
        vscode.SymbolKind.Struct,
        range,
        range
      );
      symbols.push(symbol);
    }

    return symbols;
  }
}
