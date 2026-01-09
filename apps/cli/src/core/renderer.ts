/**
 * Server-side renderer for WireScript documents
 *
 * Uses @wirescript/renderer components with renderToStaticMarkup
 * for consistent output between viewer and SSG.
 */

import type { WireDocument } from '@wirescript/dsl';
import { WireRenderer } from '@wirescript/renderer';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { RenderError } from '../utils/errors.js';

// Viewport default dimensions
const VIEWPORT_DEFAULTS: Record<string, { width: number; height: number }> = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 },
};

export interface RenderOptions {
  screenId?: string;
  width?: number;
  height?: number;
}

export interface RenderResult {
  html: string;
  screenId: string;
  screenName?: string;
  viewport: string;
  width: number;
  height: number;
}

/**
 * Render a WireDocument screen to HTML
 *
 * Uses the same WireRenderer component as the viewer app,
 * ensuring visual consistency between CSR and SSG output.
 */
export function renderScreen(document: WireDocument, options: RenderOptions): RenderResult {
  // Find screen
  const screen = options.screenId
    ? document.screens.find((s) => s.id === options.screenId)
    : document.screens[0];

  if (!screen) {
    throw new RenderError(`Screen not found: ${options.screenId || '(default)'}`);
  }

  // Determine dimensions
  const viewport = screen.viewport || 'desktop';
  const defaults = VIEWPORT_DEFAULTS[viewport] || VIEWPORT_DEFAULTS.desktop;
  const width = options.width || defaults.width;
  const height = options.height || defaults.height;

  // Render using WireRenderer (same component as viewer)
  const element = createElement(WireRenderer, {
    document,
    screenId: screen.id,
    viewport: { width, height },
  });

  const html = renderToStaticMarkup(element);

  return {
    html,
    screenId: screen.id,
    screenName: screen.name,
    viewport,
    width,
    height,
  };
}
