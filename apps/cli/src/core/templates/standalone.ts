/**
 * Standalone HTML document template
 *
 * Uses pre-built CSS from @wirescript/renderer for consistent styling.
 */

import { getGoogleFontsUrl, getTheme } from '@wirescript/theme';
import { escapeHtml, sanitizeContent } from '../../utils/html.js';
import { getPageLayoutCSS, getRendererCSS } from '../css/index.js';

export interface StandaloneOptions {
  title: string;
  content: string;
  /** Theme name - currently only 'brutalism' is fully supported */
  themeName?: string;
  width: number;
  height: number;
  includeFonts?: boolean;
}

export function renderStandalone(options: StandaloneOptions): string {
  const { title, content, themeName = 'brutalism', includeFonts = true } = options;

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
    ${safeContent}
  </div>
</body>
</html>`;
}
