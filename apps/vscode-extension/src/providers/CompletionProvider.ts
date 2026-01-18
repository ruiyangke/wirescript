import * as vscode from 'vscode';
import { CompilationCache } from '../cache/CompilationCache.js';
import {
  ELEMENT_TYPES,
  VALID_FLAGS,
  VIEWPORTS,
  type WireDocument,
} from '@wirescript/dsl';

/**
 * Provides code completion for WireScript files.
 */
export class CompletionProvider implements vscode.CompletionItemProvider {
  private cache = CompilationCache.getInstance();

  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): Promise<vscode.CompletionItem[]> {
    const line = document.lineAt(position.line).text;
    const textBeforeCursor = line.substring(0, position.character);

    // After : suggest props/flags
    if (context.triggerCharacter === ':' || textBeforeCursor.match(/:\w*$/)) {
      return this.getPropertyCompletions();
    }

    // After ( suggest elements/keywords
    if (context.triggerCharacter === '(' || textBeforeCursor.match(/\(\s*$/)) {
      return await this.getElementCompletions(document);
    }

    // After $ suggest parameter names from current component scope
    if (context.triggerCharacter === '$' || textBeforeCursor.match(/\$\w*$/)) {
      return await this.getParameterCompletions(document, position);
    }

    // After # suggest screen ids
    if (textBeforeCursor.match(/#\w*$/)) {
      return await this.getScreenCompletions(document);
    }

    // Default: show all completions
    return [
      ...(await this.getElementCompletions(document)),
      ...this.getPropertyCompletions(),
    ];
  }

  private async getElementCompletions(
    document: vscode.TextDocument
  ): Promise<vscode.CompletionItem[]> {
    const items: vscode.CompletionItem[] = [];

    // Built-in elements
    for (const element of ELEMENT_TYPES) {
      const item = new vscode.CompletionItem(
        element,
        vscode.CompletionItemKind.Class
      );
      item.detail = 'element';
      items.push(item);
    }

    // Top-level keywords
    const keywords = ['wire', 'screen', 'define', 'layout', 'meta', 'include', 'repeat'];
    for (const keyword of keywords) {
      const item = new vscode.CompletionItem(
        keyword,
        vscode.CompletionItemKind.Keyword
      );
      item.detail = 'keyword';
      items.push(item);
    }

    // Overlay types
    const overlayTypes = ['modal', 'drawer', 'popover'];
    for (const overlay of overlayTypes) {
      const item = new vscode.CompletionItem(
        overlay,
        vscode.CompletionItemKind.Class
      );
      item.detail = 'overlay';
      items.push(item);
    }

    // User-defined components
    const result = await this.cache.get(document);
    if (result.success && result.document) {
      for (const component of result.document.components) {
        const item = new vscode.CompletionItem(
          component.name,
          vscode.CompletionItemKind.Function
        );
        item.detail = 'component';
        if (component.params.length > 0) {
          item.documentation = `Parameters: ${component.params.join(', ')}`;
        }
        items.push(item);
      }
    }

    return items;
  }

  private getPropertyCompletions(): vscode.CompletionItem[] {
    const items: vscode.CompletionItem[] = [];

    // Boolean flags
    for (const flag of VALID_FLAGS) {
      const item = new vscode.CompletionItem(
        flag,
        vscode.CompletionItemKind.EnumMember
      );
      item.detail = 'flag';
      items.push(item);
    }

    // Common props with values
    const valueProps = [
      { name: 'to', detail: 'navigation target', type: 'reference' },
      { name: 'gap', detail: 'spacing value', type: 'number' },
      { name: 'padding', detail: 'padding value', type: 'number' },
      { name: 'cols', detail: 'grid columns', type: 'number' },
      { name: 'rows', detail: 'grid rows', type: 'number' },
      { name: 'size', detail: 'size value', type: 'number' },
      { name: 'width', detail: 'width value', type: 'number/string' },
      { name: 'height', detail: 'height value', type: 'number/string' },
      { name: 'count', detail: 'repeat count', type: 'number' },
      { name: 'as', detail: 'repeat variable', type: 'string' },
      { name: 'layout', detail: 'layout name', type: 'string' },
      { name: 'title', detail: 'title text', type: 'string' },
      { name: 'src', detail: 'image source', type: 'string' },
      { name: 'icon', detail: 'icon name', type: 'string' },
      { name: 'placeholder', detail: 'placeholder text', type: 'string' },
      { name: 'label', detail: 'label text', type: 'string' },
      { name: 'value', detail: 'value', type: 'string/number' },
      { name: 'min', detail: 'minimum value', type: 'number' },
      { name: 'max', detail: 'maximum value', type: 'number' },
    ];

    for (const prop of valueProps) {
      const item = new vscode.CompletionItem(
        prop.name,
        vscode.CompletionItemKind.Property
      );
      item.detail = prop.detail;
      item.documentation = `Type: ${prop.type}`;
      items.push(item);
    }

    // Viewports
    for (const viewport of VIEWPORTS) {
      const item = new vscode.CompletionItem(
        viewport,
        vscode.CompletionItemKind.EnumMember
      );
      item.detail = 'viewport';
      items.push(item);
    }

    return items;
  }

  private async getParameterCompletions(
    document: vscode.TextDocument,
    position: vscode.Position
  ): Promise<vscode.CompletionItem[]> {
    const result = await this.cache.get(document);
    if (!result.success || !result.document) {
      return [];
    }

    // Find which component scope we're in
    const componentScope = this.findComponentScope(
      result.document,
      position.line + 1
    );
    if (!componentScope) {
      return [];
    }

    return componentScope.params.map((param) => {
      const item = new vscode.CompletionItem(
        param,
        vscode.CompletionItemKind.Variable
      );
      item.detail = 'parameter';
      return item;
    });
  }

  private async getScreenCompletions(
    document: vscode.TextDocument
  ): Promise<vscode.CompletionItem[]> {
    const result = await this.cache.get(document);
    if (!result.success || !result.document) {
      return [];
    }

    return result.document.screens.map((screen) => {
      const item = new vscode.CompletionItem(
        screen.id,
        vscode.CompletionItemKind.Reference
      );
      item.detail = 'screen';
      if (screen.name) {
        item.documentation = screen.name;
      }
      return item;
    });
  }

  private findComponentScope(
    doc: WireDocument,
    line: number
  ): { params: string[] } | null {
    for (const component of doc.components) {
      if (!component.loc) continue;
      const startLine = component.loc.line;
      const endLine = component.loc.endLine ?? startLine;
      if (line >= startLine && line <= endLine) {
        return { params: component.params };
      }
    }
    return null;
  }
}
