/**
 * Theme registry and loading
 */

import { readFileSync } from 'node:fs';
import { FileError } from '../../utils/errors.js';
import { blueprint } from './blueprint.js';
import { brutalism } from './brutalism.js';
import { clean } from './clean.js';
import { sketch } from './sketch.js';
import type {
  SketchSettings,
  Theme,
  ThemeColors,
  ThemeFonts,
  ThemeName,
  ThemeRadius,
  ThemeSpacing,
} from './types.js';

export type {
  SketchSettings,
  Theme,
  ThemeColors,
  ThemeFonts,
  ThemeName,
  ThemeRadius,
  ThemeSpacing,
} from './types.js';
export { THEME_NAMES } from './types.js';

const themes: Record<ThemeName, Theme> = {
  brutalism,
  sketch,
  clean,
  blueprint,
};

/**
 * Get a built-in theme by name
 */
export function getTheme(name: ThemeName): Theme {
  return themes[name];
}

/**
 * Check if a string is a valid theme name
 */
export function isThemeName(name: string): name is ThemeName {
  return name in themes;
}

/**
 * Load theme from name or file path
 */
export function loadTheme(nameOrPath: string): Theme {
  // Check if it's a built-in theme
  if (isThemeName(nameOrPath)) {
    return getTheme(nameOrPath);
  }

  // Security: validate custom theme file path
  if (!nameOrPath.endsWith('.json')) {
    throw new FileError('Custom theme files must have .json extension', nameOrPath);
  }

  // Try to load from file
  try {
    const content = readFileSync(nameOrPath, 'utf-8');
    const parsed = JSON.parse(content);
    return validateTheme(parsed, nameOrPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new FileError(
        `Unknown theme: "${nameOrPath}". Valid themes: brutalism, sketch, clean, blueprint`,
        nameOrPath
      );
    }
    if (error instanceof SyntaxError) {
      throw new FileError(`Invalid JSON in theme file: ${nameOrPath}`, nameOrPath);
    }
    if (error instanceof FileError) {
      throw error;
    }
    throw new FileError(`Failed to load theme: ${(error as Error).message}`, nameOrPath);
  }
}

/**
 * Validate that a value is a non-empty string
 */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Validate that a value is a number
 */
function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

/**
 * Validate that a value is a boolean
 */
function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Validate theme colors structure
 */
function validateColors(colors: unknown, source: string): ThemeColors {
  if (!colors || typeof colors !== 'object') {
    throw new FileError('Theme colors must be an object', source);
  }

  const c = colors as Record<string, unknown>;
  const required = [
    'bg',
    'surface',
    'border',
    'primary',
    'secondary',
    'danger',
    'success',
    'warning',
    'info',
  ];

  for (const prop of required) {
    if (!isNonEmptyString(c[prop])) {
      throw new FileError(`Theme colors.${prop} must be a non-empty string`, source);
    }
  }

  // Validate nested text object
  if (!c.text || typeof c.text !== 'object') {
    throw new FileError('Theme colors.text must be an object', source);
  }

  const text = c.text as Record<string, unknown>;
  const textRequired = ['high', 'medium', 'low'];

  for (const prop of textRequired) {
    if (!isNonEmptyString(text[prop])) {
      throw new FileError(`Theme colors.text.${prop} must be a non-empty string`, source);
    }
  }

  return colors as ThemeColors;
}

/**
 * Validate theme fonts structure
 */
function validateFonts(fonts: unknown, source: string): ThemeFonts {
  if (!fonts || typeof fonts !== 'object') {
    throw new FileError('Theme fonts must be an object', source);
  }

  const f = fonts as Record<string, unknown>;
  const required = ['heading', 'body', 'mono'];

  for (const prop of required) {
    if (!isNonEmptyString(f[prop])) {
      throw new FileError(`Theme fonts.${prop} must be a non-empty string`, source);
    }
  }

  return fonts as ThemeFonts;
}

/**
 * Validate theme spacing structure
 */
function validateSpacing(spacing: unknown, source: string): ThemeSpacing {
  if (!spacing || typeof spacing !== 'object') {
    throw new FileError('Theme spacing must be an object', source);
  }

  const s = spacing as Record<string, unknown>;
  const required = ['xs', 'sm', 'md', 'lg', 'xl'];

  for (const prop of required) {
    if (!isNumber(s[prop])) {
      throw new FileError(`Theme spacing.${prop} must be a number`, source);
    }
  }

  return spacing as ThemeSpacing;
}

/**
 * Validate theme radius structure
 */
function validateRadius(radius: unknown, source: string): ThemeRadius {
  if (!radius || typeof radius !== 'object') {
    throw new FileError('Theme radius must be an object', source);
  }

  const r = radius as Record<string, unknown>;
  const required = ['none', 'sm', 'md', 'lg', 'full'];

  for (const prop of required) {
    if (typeof r[prop] !== 'number') {
      throw new FileError(`Theme radius.${prop} must be a number`, source);
    }
  }

  return radius as ThemeRadius;
}

/**
 * Validate theme sketch settings structure
 */
function validateSketch(sketch: unknown, source: string): SketchSettings {
  if (!sketch || typeof sketch !== 'object') {
    throw new FileError('Theme sketch must be an object', source);
  }

  const sk = sketch as Record<string, unknown>;

  if (!isBoolean(sk.enabled)) {
    throw new FileError('Theme sketch.enabled must be a boolean', source);
  }
  if (!isNumber(sk.roughness)) {
    throw new FileError('Theme sketch.roughness must be a number', source);
  }
  if (!isNumber(sk.bowing)) {
    throw new FileError('Theme sketch.bowing must be a number', source);
  }
  if (!isNumber(sk.strokeWidth)) {
    throw new FileError('Theme sketch.strokeWidth must be a number', source);
  }

  return sketch as SketchSettings;
}

/**
 * Validate a custom theme object with deep validation
 */
function validateTheme(obj: unknown, source: string): Theme {
  if (!obj || typeof obj !== 'object') {
    throw new FileError('Theme must be an object', source);
  }

  const theme = obj as Record<string, unknown>;

  // Validate name
  if (!isNonEmptyString(theme.name)) {
    throw new FileError('Theme name must be a non-empty string', source);
  }

  // Validate nested structures
  const colors = validateColors(theme.colors, source);
  const fonts = validateFonts(theme.fonts, source);
  const spacing = validateSpacing(theme.spacing, source);
  const radius = validateRadius(theme.radius, source);

  // Sketch is optional - provide defaults if missing
  let sketchSettings: SketchSettings;
  if (theme.sketch === undefined) {
    sketchSettings = {
      enabled: false,
      roughness: 0,
      bowing: 0,
      strokeWidth: 2,
    };
  } else {
    sketchSettings = validateSketch(theme.sketch, source);
  }

  return {
    name: theme.name as string,
    colors,
    fonts,
    spacing,
    radius,
    sketch: sketchSettings,
  };
}

/**
 * Get Google Fonts URL for a theme
 */
export function getGoogleFontsUrl(theme: Theme): string {
  const fonts = new Set<string>();

  // Extract font family names from theme
  const fontProps = [theme.fonts.heading, theme.fonts.body, theme.fonts.mono];
  for (const font of fontProps) {
    // Extract the first font family (before the comma)
    const match = font.match(/"([^"]+)"/);
    if (match) {
      const fontName = match[1];
      // Skip system fonts
      if (
        !fontName.includes('system') &&
        !fontName.includes('sans-serif') &&
        !fontName.includes('monospace')
      ) {
        fonts.add(fontName);
      }
    }
  }

  if (fonts.size === 0) {
    return '';
  }

  // Build Google Fonts URL with standard weights
  const families = Array.from(fonts)
    .map((f) => {
      const encoded = f.replace(/ /g, '+');
      // Add common weights for variable fonts
      return `family=${encoded}:wght@400;500;600;700`;
    })
    .join('&');

  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}
