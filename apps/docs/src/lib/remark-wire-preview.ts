import type { Root } from 'mdast';

interface Node {
  type: string;
  children?: Node[];
  lang?: string;
  value?: string;
}

/**
 * Recursively visit all nodes of a specific type
 */
function visitNodes(
  node: Node,
  type: string,
  callback: (node: Node, index: number, parent: Node) => void,
  parent?: Node,
  index?: number
) {
  if (node.type === type && parent && index !== undefined) {
    callback(node, index, parent);
  }
  if (node.children) {
    for (let i = node.children.length - 1; i >= 0; i--) {
      visitNodes(node.children[i], type, callback, node, i);
    }
  }
}

/**
 * Remark plugin that transforms wire preview code blocks into WirePreview JSX.
 * Supports two syntaxes:
 * - ```wire-preview (hyphenated)
 * - ```wire preview (space, uses meta)
 * - ```wire-preview:300 or ```wire preview:300 (custom height)
 */
export function remarkWirePreview() {
  return (tree: Root) => {
    visitNodes(tree as Node, 'code', (node, index, parent) => {
      const lang = node.lang || '';
      const meta = (node as unknown as { meta?: string }).meta || '';

      let isPreview = false;
      let height: number | undefined;

      // Format 1: wire-preview or wire-preview:300 (hyphenated)
      if (lang === 'wire-preview' || lang.startsWith('wire-preview:')) {
        isPreview = true;
        const heightMatch = lang.match(/^wire-preview:(\d+)$/);
        height = heightMatch ? parseInt(heightMatch[1], 10) : undefined;
      }
      // Format 2: wire with meta "preview" or "preview:300" (space-separated)
      else if (lang === 'wire' && (meta === 'preview' || meta.startsWith('preview:'))) {
        isPreview = true;
        const heightMatch = meta.match(/^preview:(\d+)$/);
        height = heightMatch ? parseInt(heightMatch[1], 10) : undefined;
      }

      if (isPreview) {

        const jsxNode = {
          type: 'mdxJsxFlowElement' as const,
          name: 'WirePreview',
          attributes: [
            {
              type: 'mdxJsxAttribute' as const,
              name: 'code',
              value: node.value,
            },
            ...(height
              ? [
                  {
                    type: 'mdxJsxAttribute' as const,
                    name: 'previewHeight',
                    value: {
                      type: 'mdxJsxAttributeValueExpression' as const,
                      value: String(height),
                      data: {
                        estree: {
                          type: 'Program' as const,
                          body: [
                            {
                              type: 'ExpressionStatement' as const,
                              expression: {
                                type: 'Literal' as const,
                                value: height,
                                raw: String(height),
                              },
                            },
                          ],
                          sourceType: 'module' as const,
                        },
                      },
                    },
                  },
                ]
              : []),
          ],
          children: [],
        };

        parent.children![index] = jsxNode as unknown as Node;
      }
    });
  };
}
