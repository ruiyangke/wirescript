import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig, defineDocs, frontmatterSchema, metaSchema } from 'fumadocs-mdx/config';
import { remarkWirePreview } from './src/lib/remark-wire-preview';

// Load WireScript TextMate grammar
const wireScriptGrammar = {
  ...JSON.parse(readFileSync(join(process.cwd(), 'wirescript.tmLanguage.json'), 'utf-8')),
  name: 'wire', // Override to match code fence identifier
};

// You can customise Zod schemas for frontmatter and `meta.json` here
// see https://fumadocs.dev/docs/mdx/collections
export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: frontmatterSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

export default defineConfig({
  mdxOptions: {
    remarkPlugins: [remarkWirePreview],
    rehypeCodeOptions: {
      themes: {
        light: 'catppuccin-latte',
        dark: 'dracula',
      },
      langs: [wireScriptGrammar],
    },
  },
});
