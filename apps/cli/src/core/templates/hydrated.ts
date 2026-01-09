/**
 * Hydrated HTML document template
 *
 * Creates HTML pages that are server-rendered and then hydrated with React.
 * Uses a shared hydrate.js bundle for all pages, with per-page data embedded.
 */

import { getTheme, getGoogleFontsUrl } from '@wirescript/theme';
import { getPageLayoutCSS, getRendererCSS } from '../css/index.js';
import { escapeHtml, sanitizeContent } from '../../utils/html.js';

export interface HydratedOptions {
  title: string;
  content: string;
  /** Theme name - currently only 'brutalism' is fully supported */
  themeName?: string;
  width: number;
  height: number;
  includeFonts?: boolean;
  /** Page data script (window.__WIRESCRIPT_DATA__) */
  pageDataScript: string;
  /** Path to the shared hydration bundle */
  hydrateBundlePath: string;
}

export function renderHydrated(options: HydratedOptions): string {
  const {
    title,
    content,
    themeName = 'brutalism',
    includeFonts = true,
    pageDataScript,
    hydrateBundlePath,
  } = options;

  // Sanitize user-provided content
  const safeContent = sanitizeContent(content);

  // Get theme for fonts URL
  const theme = getTheme(themeName as 'brutalism');

  // Get pre-built renderer CSS (contains all Tailwind utilities + theme variables)
  const rendererCSS = getRendererCSS();

  // Border style based on theme (brutalism has hard shadows)
  const borderStyle = 'box-shadow: 3px 3px 0 0 var(--border); border: 2px solid var(--border);';

  // Page layout CSS
  const pageLayoutCSS = getPageLayoutCSS(borderStyle);

  const fontsUrl = includeFonts ? getGoogleFontsUrl(theme) : '';
  const fontsLink = fontsUrl
    ? `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${fontsUrl}" rel="stylesheet">`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>${fontsLink}
  <style>
    /* Pre-built renderer CSS (Tailwind utilities + theme variables) */
    ${rendererCSS}

    /* Page layout */
    ${pageLayoutCSS}
  </style>
</head>
<body>
  <div class="wireframe-container">
    <div id="wirescript-root">${safeContent}</div>
  </div>
  <script>${pageDataScript}</script>
  <script src="${hydrateBundlePath}"></script>
</body>
</html>`;
}
