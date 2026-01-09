import type { Theme, ThemeName } from '../types.js';
import { brutalism } from './brutalism.js';

export { brutalism } from './brutalism.js';

/**
 * All available themes
 */
export const themes: Record<ThemeName, Theme> = {
  brutalism,
  // TODO: Add more themes
  clean: brutalism, // Placeholder
  sketch: brutalism, // Placeholder
  blueprint: brutalism, // Placeholder
};

/**
 * Get a theme by name
 */
export function getTheme(name: ThemeName): Theme {
  const theme = themes[name];
  if (!theme) {
    throw new Error(`Unknown theme: ${name}`);
  }
  return theme;
}

/**
 * List all available theme names
 */
export function getThemeNames(): ThemeName[] {
  return Object.keys(themes) as ThemeName[];
}
