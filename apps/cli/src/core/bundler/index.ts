/**
 * Bundler for interactive WireScript pages
 *
 * Uses Vite to bundle React hydration code for full client-side interactivity.
 * Supports icon tree-shaking to reduce bundle size.
 */

export { bundleWithVite, formatBytes } from './vite-bundler.js';
export { generateHydratePageData } from './hydrate-entry-template.js';
export { extractUsedIcons } from './icon-analyzer.js';
