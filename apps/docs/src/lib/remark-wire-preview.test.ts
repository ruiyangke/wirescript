import type { Code, Root } from 'mdast';
import { describe, expect, it } from 'vitest';
import { remarkWirePreview } from './remark-wire-preview';

// Helper to create a code block node
function createCodeBlock(lang: string, value: string, meta?: string): Code {
  return {
    type: 'code',
    lang,
    meta: meta || null,
    value,
  };
}

// Helper to create a root with children
function createRoot(children: unknown[]): Root {
  return {
    type: 'root',
    children: children as Root['children'],
  };
}

describe('remarkWirePreview', () => {
  const plugin = remarkWirePreview();

  describe('wire-preview syntax (hyphenated)', () => {
    it('transforms wire-preview code blocks', () => {
      const tree = createRoot([createCodeBlock('wire-preview', '(text "Hello")')]);

      plugin(tree);

      const result = tree.children[0] as unknown as { type: string; name: string };
      expect(result.type).toBe('mdxJsxFlowElement');
      expect(result.name).toBe('WirePreview');
    });

    it('passes code as attribute', () => {
      const code = '(button "Click me" :primary)';
      const tree = createRoot([createCodeBlock('wire-preview', code)]);

      plugin(tree);

      const result = tree.children[0] as unknown as {
        attributes: Array<{ name: string; value: string }>;
      };
      const codeAttr = result.attributes.find((a) => a.name === 'code');
      expect(codeAttr?.value).toBe(code);
    });

    it('extracts height from wire-preview:300 syntax', () => {
      const tree = createRoot([createCodeBlock('wire-preview:300', '(text "Hello")')]);

      plugin(tree);

      const result = tree.children[0] as unknown as {
        attributes: Array<{ name: string; value: unknown }>;
      };
      const heightAttr = result.attributes.find((a) => a.name === 'previewHeight');
      expect(heightAttr).toBeDefined();
      expect((heightAttr?.value as { value: string }).value).toBe('300');
    });

    it('uses no height when not specified', () => {
      const tree = createRoot([createCodeBlock('wire-preview', '(text "Hello")')]);

      plugin(tree);

      const result = tree.children[0] as unknown as {
        attributes: Array<{ name: string }>;
      };
      const heightAttr = result.attributes.find((a) => a.name === 'previewHeight');
      expect(heightAttr).toBeUndefined();
    });
  });

  describe('wire preview syntax (space-separated)', () => {
    it('transforms wire blocks with preview meta', () => {
      const tree = createRoot([createCodeBlock('wire', '(text "Hello")', 'preview')]);

      plugin(tree);

      const result = tree.children[0] as unknown as { type: string; name: string };
      expect(result.type).toBe('mdxJsxFlowElement');
      expect(result.name).toBe('WirePreview');
    });

    it('extracts height from preview:400 meta', () => {
      const tree = createRoot([
        createCodeBlock('wire', '(card (text "Card content"))', 'preview:400'),
      ]);

      plugin(tree);

      const result = tree.children[0] as unknown as {
        attributes: Array<{ name: string; value: unknown }>;
      };
      const heightAttr = result.attributes.find((a) => a.name === 'previewHeight');
      expect(heightAttr).toBeDefined();
      expect((heightAttr?.value as { value: string }).value).toBe('400');
    });
  });

  describe('non-preview code blocks', () => {
    it('does not transform regular wire code blocks', () => {
      const tree = createRoot([createCodeBlock('wire', '(text "Hello")')]);

      plugin(tree);

      const result = tree.children[0] as Code;
      expect(result.type).toBe('code');
      expect(result.lang).toBe('wire');
    });

    it('does not transform other languages', () => {
      const tree = createRoot([createCodeBlock('javascript', 'console.log("hi")')]);

      plugin(tree);

      const result = tree.children[0] as Code;
      expect(result.type).toBe('code');
      expect(result.lang).toBe('javascript');
    });

    it('does not transform typescript code blocks', () => {
      const tree = createRoot([createCodeBlock('typescript', 'const x: number = 1')]);

      plugin(tree);

      const result = tree.children[0] as Code;
      expect(result.type).toBe('code');
    });
  });

  describe('multiple code blocks', () => {
    it('transforms only preview blocks in mixed content', () => {
      const tree = createRoot([
        createCodeBlock('wire-preview', '(text "Preview 1")'),
        createCodeBlock('wire', '(text "Regular code")'),
        createCodeBlock('wire-preview:250', '(text "Preview 2")'),
      ]);

      plugin(tree);

      // First should be transformed
      expect((tree.children[0] as unknown as { name: string }).name).toBe('WirePreview');
      // Second should remain as code
      expect((tree.children[1] as Code).type).toBe('code');
      // Third should be transformed
      expect((tree.children[2] as unknown as { name: string }).name).toBe('WirePreview');
    });
  });

  describe('edge cases', () => {
    it('handles empty code value', () => {
      const tree = createRoot([createCodeBlock('wire-preview', '')]);

      plugin(tree);

      const result = tree.children[0] as unknown as {
        attributes: Array<{ name: string; value: string }>;
      };
      const codeAttr = result.attributes.find((a) => a.name === 'code');
      expect(codeAttr?.value).toBe('');
    });

    it('handles code with special characters', () => {
      const code = '(text "Hello <World> & "Quotes"")';
      const tree = createRoot([createCodeBlock('wire-preview', code)]);

      plugin(tree);

      const result = tree.children[0] as unknown as {
        attributes: Array<{ name: string; value: string }>;
      };
      const codeAttr = result.attributes.find((a) => a.name === 'code');
      expect(codeAttr?.value).toBe(code);
    });

    it('handles multiline code', () => {
      const code = `(card :col :gap 16
  (text "Title" :high)
  (text "Description" :low)
  (button "Action" :primary))`;
      const tree = createRoot([createCodeBlock('wire-preview', code)]);

      plugin(tree);

      const result = tree.children[0] as unknown as {
        attributes: Array<{ name: string; value: string }>;
      };
      const codeAttr = result.attributes.find((a) => a.name === 'code');
      expect(codeAttr?.value).toBe(code);
    });

    it('handles height with leading zeros', () => {
      const tree = createRoot([createCodeBlock('wire-preview:0300', '(text "Test")')]);

      plugin(tree);

      // Should not match because pattern expects digits without leading zeros issue
      const result = tree.children[0] as unknown as {
        attributes: Array<{ name: string; value: unknown }>;
      };
      const heightAttr = result.attributes.find((a) => a.name === 'previewHeight');
      expect(heightAttr).toBeDefined();
      expect((heightAttr?.value as { value: string }).value).toBe('300');
    });
  });
});
