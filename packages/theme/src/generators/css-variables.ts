/**
 * CSS Variable Generator
 *
 * Converts a Theme object to CSS variable declarations
 * that can be used in :root or any CSS scope.
 */

import type { Theme } from '../types.js';

/**
 * Convert camelCase to kebab-case
 */
function toKebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Generate CSS variable declarations from a Theme
 *
 * @param theme - The theme to convert
 * @returns CSS variable declarations as a string (without :root wrapper)
 */
export function generateCSSVariables(theme: Theme): string {
  const lines: string[] = [];

  // Colors
  lines.push('/* Colors */');
  lines.push(`--background: ${theme.colors.background};`);
  lines.push(`--foreground: ${theme.colors.foreground};`);
  lines.push(`--card: ${theme.colors.card};`);
  lines.push(`--card-foreground: ${theme.colors.cardForeground};`);
  lines.push(`--popover: ${theme.colors.popover};`);
  lines.push(`--popover-foreground: ${theme.colors.popoverForeground};`);
  lines.push(`--primary: ${theme.colors.primary};`);
  lines.push(`--primary-foreground: ${theme.colors.primaryForeground};`);
  lines.push(`--secondary: ${theme.colors.secondary};`);
  lines.push(`--secondary-foreground: ${theme.colors.secondaryForeground};`);
  lines.push(`--muted: ${theme.colors.muted};`);
  lines.push(`--muted-foreground: ${theme.colors.mutedForeground};`);
  lines.push(`--accent: ${theme.colors.accent};`);
  lines.push(`--accent-foreground: ${theme.colors.accentForeground};`);
  lines.push(`--destructive: ${theme.colors.destructive};`);
  lines.push(`--destructive-foreground: ${theme.colors.destructiveForeground};`);
  lines.push(`--success: ${theme.colors.success};`);
  lines.push(`--success-foreground: ${theme.colors.successForeground};`);
  lines.push(`--warning: ${theme.colors.warning};`);
  lines.push(`--warning-foreground: ${theme.colors.warningForeground};`);
  lines.push(`--border: ${theme.colors.border};`);
  lines.push(`--input: ${theme.colors.input};`);
  lines.push(`--ring: ${theme.colors.ring};`);

  // Chart colors
  lines.push('/* Chart colors */');
  lines.push(`--chart-1: ${theme.colors.chart1};`);
  lines.push(`--chart-2: ${theme.colors.chart2};`);
  lines.push(`--chart-3: ${theme.colors.chart3};`);
  lines.push(`--chart-4: ${theme.colors.chart4};`);
  lines.push(`--chart-5: ${theme.colors.chart5};`);

  // Sidebar
  lines.push('/* Sidebar */');
  lines.push(`--sidebar: ${theme.colors.sidebar};`);
  lines.push(`--sidebar-foreground: ${theme.colors.sidebarForeground};`);
  lines.push(`--sidebar-primary: ${theme.colors.sidebarPrimary};`);
  lines.push(`--sidebar-primary-foreground: ${theme.colors.sidebarPrimaryForeground};`);
  lines.push(`--sidebar-accent: ${theme.colors.sidebarAccent};`);
  lines.push(`--sidebar-accent-foreground: ${theme.colors.sidebarAccentForeground};`);
  lines.push(`--sidebar-border: ${theme.colors.sidebarBorder};`);
  lines.push(`--sidebar-ring: ${theme.colors.sidebarRing};`);

  // Typography
  lines.push('/* Typography */');
  lines.push(`--font-sans: ${theme.fonts.sans};`);
  lines.push(`--font-serif: ${theme.fonts.serif};`);
  lines.push(`--font-mono: ${theme.fonts.mono};`);

  // Radius
  lines.push('/* Radius */');
  lines.push(`--radius: ${theme.radius.DEFAULT};`);

  // Spacing
  lines.push('/* Spacing */');
  lines.push(`--spacing: ${theme.spacing.DEFAULT};`);

  // Shadows
  lines.push('/* Shadows */');
  lines.push(`--shadow-2xs: ${theme.shadows['2xs']};`);
  lines.push(`--shadow-xs: ${theme.shadows.xs};`);
  lines.push(`--shadow-sm: ${theme.shadows.sm};`);
  lines.push(`--shadow: ${theme.shadows.DEFAULT};`);
  lines.push(`--shadow-md: ${theme.shadows.md};`);
  lines.push(`--shadow-lg: ${theme.shadows.lg};`);
  lines.push(`--shadow-xl: ${theme.shadows.xl};`);
  lines.push(`--shadow-2xl: ${theme.shadows['2xl']};`);

  // Tracking
  lines.push('/* Tracking */');
  lines.push(`--tracking-normal: ${theme.tracking};`);

  return lines.map((line) => `  ${line}`).join('\n');
}

/**
 * Generate a complete :root block with CSS variables
 */
export function generateRootCSS(theme: Theme): string {
  return `:root {\n${generateCSSVariables(theme)}\n}`;
}

/**
 * Get Google Fonts URL for the theme
 */
export function getGoogleFontsUrl(theme: Theme): string {
  const fonts: string[] = [];

  // Parse font family to get the primary font name
  const extractFontName = (fontStack: string): string | null => {
    const first = fontStack.split(',')[0].trim();
    // Skip generic fonts and system fonts
    if (
      first.startsWith('ui-') ||
      first === 'sans-serif' ||
      first === 'serif' ||
      first === 'monospace'
    ) {
      return null;
    }
    return first.replace(/"/g, '');
  };

  const sansFont = extractFontName(theme.fonts.sans);
  const monoFont = extractFontName(theme.fonts.mono);

  if (sansFont) {
    fonts.push(`family=${encodeURIComponent(sansFont)}:wght@400;500;600;700`);
  }
  if (monoFont) {
    fonts.push(`family=${encodeURIComponent(monoFont)}:wght@400;500`);
  }

  if (fonts.length === 0) return '';

  return `https://fonts.googleapis.com/css2?${fonts.join('&')}&display=swap`;
}
