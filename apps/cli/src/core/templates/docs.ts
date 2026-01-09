/**
 * Documentation site template with sidebar navigation
 *
 * Uses pre-built CSS from @wirescript/renderer for consistent styling.
 */

import { getGoogleFontsUrl, getTheme } from '@wirescript/theme';
import { escapeHtml, sanitizeContent } from '../../utils/html.js';
import { getRendererCSS } from '../css/index.js';

export interface ScreenInfo {
  id: string;
  name: string;
  href: string;
}

export interface DocsPageOptions {
  title: string;
  siteTitle: string;
  content: string;
  /** Theme name - currently only 'brutalism' is fully supported */
  themeName?: string;
  width: number;
  height: number;
  screens: ScreenInfo[];
  currentScreenId: string;
  basePath: string;
  includeFonts?: boolean;
}

export function renderDocsPage(options: DocsPageOptions): string {
  const {
    title,
    siteTitle,
    content,
    themeName = 'brutalism',
    width,
    height,
    screens,
    currentScreenId,
    includeFonts = true,
  } = options;

  // Sanitize user-provided content
  const safeContent = sanitizeContent(content);

  // Get theme for fonts URL
  const theme = getTheme(themeName as 'brutalism');

  // Get pre-built renderer CSS (contains all Tailwind utilities + theme variables)
  const rendererCSS = getRendererCSS();

  const fontsUrl = includeFonts ? getGoogleFontsUrl(theme) : '';
  const fontsLink = fontsUrl
    ? `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${fontsUrl}" rel="stylesheet">`
    : '';

  const sidebarItems = screens
    .map((screen) => {
      const isActive = screen.id === currentScreenId;
      const activeClass = isActive ? ' class="active"' : '';
      return `        <li><a href="${screen.href}"${activeClass}>${escapeHtml(screen.name || screen.id)}</a></li>`;
    })
    .join('\n');

  // Find prev/next screens for keyboard navigation
  const currentIndex = screens.findIndex((s) => s.id === currentScreenId);
  const prevScreen = currentIndex > 0 ? screens[currentIndex - 1] : null;
  const nextScreen = currentIndex < screens.length - 1 ? screens[currentIndex + 1] : null;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} - ${escapeHtml(siteTitle)}</title>${fontsLink}
  <style>
    /* Pre-built renderer CSS (Tailwind utilities + theme variables) */
    ${rendererCSS}

    /* Additional docs-specific variables */
    :root {
      --sidebar-width: 240px;
    }

    /* Docs page layout */
    body {
      font-family: var(--font-sans);
      background: #f0f0f0;
      min-height: 100vh;
      display: flex;
    }

    /* Skeleton animation for loading states */
    @keyframes skeleton-pulse {
      0% { opacity: 1; }
      50% { opacity: 0.4; }
      100% { opacity: 1; }
    }

    .skeleton {
      animation: skeleton-pulse 2s ease-in-out infinite;
    }

    /* Sidebar */
    .sidebar {
      width: var(--sidebar-width);
      background: var(--card);
      border-right: 1px solid var(--border);
      padding: 24px 0;
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      overflow-y: auto;
    }

    .sidebar-header {
      padding: 0 20px 20px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 16px;
    }

    .sidebar-header h1 {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--foreground);
    }

    .sidebar-nav ul {
      list-style: none;
    }

    .sidebar-nav a {
      display: block;
      padding: 8px 20px;
      color: var(--muted-foreground);
      text-decoration: none;
      font-size: 0.875rem;
      transition: background 0.15s, color 0.15s;
    }

    .sidebar-nav a:hover {
      background: rgba(0, 0, 0, 0.05);
      color: var(--foreground);
    }

    .sidebar-nav a.active {
      background: var(--primary);
      color: var(--primary-foreground);
      font-weight: 500;
    }

    /* Main content */
    .main {
      margin-left: var(--sidebar-width);
      flex: 1;
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .screen-header {
      width: 100%;
      max-width: ${width + 48}px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .screen-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--foreground);
    }

    .screen-meta {
      font-size: 0.75rem;
      color: var(--muted-foreground);
    }

    .wireframe-container {
      border: 1px solid var(--border);
      background: var(--background);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    /* Navigation hint */
    .nav-hint {
      margin-top: 16px;
      font-size: 0.75rem;
      color: var(--muted-foreground);
    }

    .nav-hint kbd {
      display: inline-block;
      padding: 2px 6px;
      font-family: var(--font-mono);
      font-size: 0.7rem;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 3px;
    }

    /* Responsive */
    @media (max-width: 900px) {
      .sidebar {
        width: 200px;
      }
      .main {
        margin-left: 200px;
      }
    }

    @media (max-width: 700px) {
      .sidebar {
        display: none;
      }
      .main {
        margin-left: 0;
      }
    }
  </style>
</head>
<body>
  <aside class="sidebar">
    <div class="sidebar-header">
      <h1>${escapeHtml(siteTitle)}</h1>
    </div>
    <nav class="sidebar-nav">
      <ul>
${sidebarItems}
      </ul>
    </nav>
  </aside>

  <main class="main">
    <header class="screen-header">
      <h2 class="screen-title">${escapeHtml(title)}</h2>
      <span class="screen-meta">${width} × ${height}</span>
    </header>

    <div class="wireframe-container">
      ${safeContent}
    </div>

    <p class="nav-hint">
      Use <kbd>←</kbd> <kbd>→</kbd> to navigate between screens
    </p>
  </main>

  <script>
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      ${prevScreen ? `if (e.key === 'ArrowLeft') window.location.href = ${JSON.stringify(prevScreen.href)};` : ''}
      ${nextScreen ? `if (e.key === 'ArrowRight') window.location.href = ${JSON.stringify(nextScreen.href)};` : ''}
    });
  </script>
</body>
</html>`;
}

export function renderIndexRedirect(firstScreenHref: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=${escapeHtml(firstScreenHref)}">
  <title>Redirecting...</title>
</head>
<body>
  <p>Redirecting to <a href="${escapeHtml(firstScreenHref)}">${escapeHtml(firstScreenHref)}</a></p>
</body>
</html>`;
}
