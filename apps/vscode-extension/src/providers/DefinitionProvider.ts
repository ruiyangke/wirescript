import * as vscode from 'vscode';
import { CompilationCache } from '../cache/CompilationCache.js';
import type { WireDocument, ComponentDef, LayoutNode, ScreenNode } from '@wirescript/dsl';

/**
 * Provides go-to-definition for WireScript files.
 * Supports:
 * - Component references (navigate to define)
 * - Layout references (navigate to layout)
 * - Screen references (navigate to screen)
 */
export class DefinitionProvider implements vscode.DefinitionProvider {
  private cache = CompilationCache.getInstance();

  provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.ProviderResult<vscode.Definition> {
    const result = this.cache.get(document);
    if (!result.success || !result.document) {
      return null;
    }

    // Get the word at position
    const wordRange = document.getWordRangeAtPosition(position, /[a-zA-Z_][a-zA-Z0-9_-]*/);
    if (!wordRange) {
      return null;
    }

    const word = document.getText(wordRange);
    const line = document.lineAt(position.line).text;
    const doc = result.document;

    // Check if this is a component call (just a symbol in parens)
    const component = this.findComponent(doc, word);
    if (component?.loc) {
      return new vscode.Location(
        document.uri,
        new vscode.Position(component.loc.line - 1, component.loc.column - 1)
      );
    }

    // Check if this is a layout reference (:layout "name")
    if (line.includes(':layout') && line.includes(`"${word}"`)) {
      const layout = this.findLayout(doc, word);
      if (layout?.loc) {
        return new vscode.Location(
          document.uri,
          new vscode.Position(layout.loc.line - 1, layout.loc.column - 1)
        );
      }
    }

    // Check if this is a screen reference (#screen-id)
    const hashMatch = line.match(/#([a-zA-Z_][a-zA-Z0-9_-]*)/);
    if (hashMatch && hashMatch[1] === word) {
      const screen = this.findScreen(doc, word);
      if (screen?.loc) {
        return new vscode.Location(
          document.uri,
          new vscode.Position(screen.loc.line - 1, screen.loc.column - 1)
        );
      }
    }

    return null;
  }

  private findComponent(doc: WireDocument, name: string): ComponentDef | undefined {
    return doc.components.find((c) => c.name === name);
  }

  private findLayout(doc: WireDocument, name: string): LayoutNode | undefined {
    return doc.layouts.find((l) => l.name === name);
  }

  private findScreen(doc: WireDocument, id: string): ScreenNode | undefined {
    return doc.screens.find((s) => s.id === id);
  }
}
