// Main entry point for @wirescript/renderer

// Auto-active (for navigation elements)
export { AutoActiveProvider, useAutoActive, useIsAutoActive } from './AutoActiveContext.js';

// Components
export { ComponentsProvider, useComponentDef, useComponents } from './ComponentsContext.js';
export { ElementRenderer } from './ElementRenderer.js';
// Elements
export * from './elements/index.js';

// Interaction
export { InteractionProvider, useInteraction } from './InteractionContext.js';
// Layouts
export { LayoutsProvider, useLayoutDef, useLayouts } from './LayoutsContext.js';
// Zoom (for proper sizing of portaled content inside zoom containers)
export { ZoomProvider, useZoom } from './ZoomContext.js';
// Layout utilities
export { getEmphasis, getLayoutStyles, getVariant, hasFlag } from './layout.js';
// Utils
export { cn } from './lib/utils.js';
// Theme
export { ThemeProvider, useTheme } from './ThemeContext.js';
// UI Components (shadcn) - exported under ui namespace to avoid conflicts with elements
export * as ui from './ui/index.js';
export type { Viewport } from './WireRenderer.js';
// Rendering
export { getScreenIds, getScreenInfo, ScreenRenderer, WireRenderer } from './WireRenderer.js';
