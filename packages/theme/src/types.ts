/**
 * Theme type definitions for WireScript
 *
 * These types define the structure of a theme that can be used
 * by both the renderer (Tailwind CSS) and CLI (SSG output).
 */

export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  success: string;
  successForeground: string;
  warning: string;
  warningForeground: string;
  border: string;
  input: string;
  ring: string;
  // Chart colors
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
  // Sidebar colors
  sidebar: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarRing: string;
}

export interface ThemeShadows {
  '2xs': string;
  xs: string;
  sm: string;
  DEFAULT: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

export interface ThemeFonts {
  sans: string;
  serif: string;
  mono: string;
}

export interface ThemeRadius {
  DEFAULT: string;
}

export interface ThemeSpacing {
  DEFAULT: string;
}

export interface Theme {
  name: string;
  colors: ThemeColors;
  shadows: ThemeShadows;
  fonts: ThemeFonts;
  radius: ThemeRadius;
  spacing: ThemeSpacing;
  tracking: string;
}

export type ThemeName = 'brutalism' | 'clean' | 'sketch' | 'blueprint';
