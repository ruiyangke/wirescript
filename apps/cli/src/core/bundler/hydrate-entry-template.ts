/**
 * React Hydration Entry Point Template
 *
 * Generates the client-side entry point that hydrates the server-rendered
 * HTML with React, making all components fully interactive.
 */

/**
 * Generate the hydration entry point code
 *
 * This creates a JavaScript module that:
 * 1. Imports React and the WireRenderer
 * 2. Reads the embedded document data from window.__WIRESCRIPT_DATA__
 * 3. Hydrates the root element with React
 *
 * @returns Entry point TypeScript/JSX code (to be bundled by Vite)
 */
export function generateHydrateEntry(): string {
  return `
import { hydrateRoot } from 'react-dom/client';
import { WireRenderer } from '@wirescript/renderer';

// Get embedded document data
const data = window.__WIRESCRIPT_DATA__;
if (!data) {
  console.error('[WireScript] No document data found');
} else {
  // Find the root element
  const root = document.getElementById('wirescript-root');
  if (!root) {
    console.error('[WireScript] Root element #wirescript-root not found');
  } else {
    // Hydrate the React app
    hydrateRoot(
      root,
      <WireRenderer
        document={data.document}
        screenId={data.screenId}
        viewport={data.viewport}
      />
    );
    console.log('[WireScript] Hydration complete');
  }
}
`.trim();
}

/**
 * Generate the page data script that embeds document data in the HTML
 *
 * This script sets window.__WIRESCRIPT_DATA__ with the serialized document
 * and current screen information.
 */
export function generateHydratePageData(options: {
  document: unknown;
  screenId: string;
  viewport: { width: number; height: number };
}): string {
  const data = {
    document: options.document,
    screenId: options.screenId,
    viewport: options.viewport,
  };

  return `window.__WIRESCRIPT_DATA__ = ${JSON.stringify(data)};`;
}
