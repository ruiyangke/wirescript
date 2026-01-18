import * as vscode from 'vscode';
import { CompilationCache } from '../cache/CompilationCache.js';
import {
  ELEMENT_TYPES_SET,
  VALID_FLAGS_SET,
  type WireDocument,
} from '@wirescript/dsl';

/**
 * Element documentation for hover tooltips.
 */
const ELEMENT_DOCS: Record<string, { description: string; props?: string[] }> = {
  box: { description: 'Generic container element', props: ['col', 'row', 'grid', 'gap', 'padding'] },
  card: { description: 'Card container with border and shadow', props: ['padding'] },
  section: { description: 'Section container', props: [] },
  header: { description: 'Header section', props: ['sticky'] },
  footer: { description: 'Footer section', props: ['sticky'] },
  nav: { description: 'Navigation container', props: [] },
  form: { description: 'Form container', props: [] },
  list: { description: 'List container', props: [] },
  scroll: { description: 'Scrollable container', props: [] },
  group: { description: 'Grouping container', props: [] },
  text: { description: 'Text element', props: ['high', 'medium', 'low'] },
  icon: { description: 'Icon element', props: ['size'] },
  image: { description: 'Image element', props: ['src', 'width', 'height'] },
  avatar: { description: 'Avatar element', props: ['size', 'src'] },
  badge: { description: 'Badge/tag element', props: ['primary', 'secondary', 'danger'] },
  divider: { description: 'Horizontal divider', props: [] },
  button: { description: 'Button element', props: ['to', 'primary', 'secondary', 'ghost', 'disabled'] },
  dropdown: { description: 'Dropdown menu', props: [] },
  input: { description: 'Input field', props: ['placeholder', 'label', 'type', 'disabled'] },
  datepicker: { description: 'Date picker input', props: ['placeholder', 'label'] },
  metric: { description: 'Metric/stat display', props: ['value', 'label'] },
  progress: { description: 'Progress bar', props: ['value', 'max'] },
  chart: { description: 'Chart placeholder', props: ['type'] },
  skeleton: { description: 'Loading skeleton', props: ['width', 'height', 'circle', 'text'] },
  tabs: { description: 'Tab container', props: [] },
  tab: { description: 'Tab item', props: ['active', 'to'] },
  breadcrumb: { description: 'Breadcrumb navigation', props: [] },
  crumb: { description: 'Breadcrumb item', props: ['to'] },
  tooltip: { description: 'Tooltip wrapper', props: ['content'] },
  toast: { description: 'Toast notification', props: ['success', 'warning', 'danger', 'info'] },
  empty: { description: 'Empty state placeholder', props: [] },
  slot: { description: 'Layout slot placeholder', props: [] },
};

/**
 * Provides hover information for WireScript files.
 */
export class HoverProvider implements vscode.HoverProvider {
  private cache = CompilationCache.getInstance();

  async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position
  ): Promise<vscode.Hover | null> {
    const wordRange = document.getWordRangeAtPosition(
      position,
      /[a-zA-Z_][a-zA-Z0-9_-]*/
    );
    if (!wordRange) {
      return null;
    }

    const word = document.getText(wordRange);
    const line = document.lineAt(position.line).text;

    // Check if it's a built-in element
    if (ELEMENT_TYPES_SET.has(word)) {
      const docs = ELEMENT_DOCS[word];
      if (docs) {
        const markdown = new vscode.MarkdownString();
        markdown.appendMarkdown(`**${word}** (element)\n\n`);
        markdown.appendMarkdown(`${docs.description}\n\n`);
        if (docs.props && docs.props.length > 0) {
          markdown.appendMarkdown(`Props: \`${docs.props.join('`, `')}\``);
        }
        return new vscode.Hover(markdown, wordRange);
      }
    }

    // Check if it's a flag (preceded by :)
    const charBefore = position.character > 0 ? line[position.character - 1] : '';
    if (charBefore === ':' || line.substring(0, position.character).match(/:\w*$/)) {
      if (VALID_FLAGS_SET.has(word)) {
        return new vscode.Hover(
          new vscode.MarkdownString(`**:${word}** (flag)`),
          wordRange
        );
      }
    }

    // Check if it's a user-defined component
    const result = await this.cache.get(document);
    if (result.success && result.document) {
      const component = this.findComponent(result.document, word);
      if (component) {
        const markdown = new vscode.MarkdownString();
        markdown.appendMarkdown(`**${word}** (component)\n\n`);
        if (component.params.length > 0) {
          markdown.appendMarkdown(`Parameters: \`${component.params.join('`, `')}\``);
        } else {
          markdown.appendMarkdown('No parameters');
        }
        return new vscode.Hover(markdown, wordRange);
      }

      // Check if it's a screen reference
      if (line.includes('#' + word)) {
        const screen = this.findScreen(result.document, word);
        if (screen) {
          const markdown = new vscode.MarkdownString();
          markdown.appendMarkdown(`**#${word}** (screen)\n\n`);
          if (screen.name) {
            markdown.appendMarkdown(`Name: ${screen.name}`);
          }
          return new vscode.Hover(markdown, wordRange);
        }
      }

      // Check if it's a layout reference
      if (line.includes(':layout')) {
        const layout = this.findLayout(result.document, word);
        if (layout) {
          return new vscode.Hover(
            new vscode.MarkdownString(`**${word}** (layout)`),
            wordRange
          );
        }
      }
    }

    // Keywords
    const keywords: Record<string, string> = {
      wire: 'Root document element',
      screen: 'Screen definition',
      define: 'Component definition',
      layout: 'Layout definition',
      meta: 'Document metadata',
      include: 'Include external file',
      repeat: 'Repeat element N times',
      modal: 'Modal overlay',
      drawer: 'Drawer overlay',
      popover: 'Popover overlay',
    };

    if (keywords[word]) {
      return new vscode.Hover(
        new vscode.MarkdownString(`**${word}** (keyword)\n\n${keywords[word]}`),
        wordRange
      );
    }

    return null;
  }

  private findComponent(doc: WireDocument, name: string) {
    return doc.components.find((c) => c.name === name);
  }

  private findScreen(doc: WireDocument, id: string) {
    return doc.screens.find((s) => s.id === id);
  }

  private findLayout(doc: WireDocument, name: string) {
    return doc.layouts.find((l) => l.name === name);
  }
}
