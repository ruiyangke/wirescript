/**
 * CSS module for SSG output
 *
 * Uses pre-built CSS from @wirescript/renderer instead of twind,
 * ensuring consistent styling between viewer (CSR) and CLI (SSG).
 */

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

// Use require.resolve to find the renderer's styles.css
const require = createRequire(import.meta.url);

let cachedRendererCSS: string | null = null;

/**
 * Get the pre-built renderer CSS
 *
 * This contains all Tailwind utility classes used by @wirescript/renderer components,
 * including the theme CSS variables.
 */
export function getRendererCSS(): string {
  if (cachedRendererCSS !== null) {
    return cachedRendererCSS;
  }

  try {
    const cssPath = require.resolve('@wirescript/renderer/styles.css');
    cachedRendererCSS = readFileSync(cssPath, 'utf-8');
    return cachedRendererCSS;
  } catch (error) {
    throw new Error(
      `Failed to load @wirescript/renderer/styles.css: ${(error as Error).message}. ` +
        'Make sure @wirescript/renderer is built (pnpm --filter @wirescript/renderer build)'
    );
  }
}

/**
 * Get page layout CSS for standalone HTML
 *
 * This provides the container styling for the wireframe preview.
 */
export function getPageLayoutCSS(borderStyle: string): string {
  return `
    body {
      font-family: var(--font-sans);
      background: #f5f5f5;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 24px;
    }
    .wireframe-container {
      ${borderStyle}
      background: var(--background);
    }
  `.trim();
}

/**
 * Reset the CSS cache (for testing)
 */
export function resetCSSCache(): void {
  cachedRendererCSS = null;
}
