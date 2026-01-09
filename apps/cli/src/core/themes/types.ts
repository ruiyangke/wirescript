/**
 * Theme type definitions
 */

export interface ThemeColors {
  bg: string;
  surface: string;
  border: string;
  text: {
    high: string;
    medium: string;
    low: string;
  };
  primary: string;
  secondary: string;
  danger: string;
  success: string;
  warning: string;
  info: string;
}

export interface ThemeFonts {
  heading: string;
  body: string;
  mono: string;
}

export interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

export interface ThemeRadius {
  none: number;
  sm: number;
  md: number;
  lg: number;
  full: number;
}

export interface SketchSettings {
  enabled: boolean;
  roughness: number;
  bowing: number;
  strokeWidth: number;
}

export interface Theme {
  name: string;
  colors: ThemeColors;
  fonts: ThemeFonts;
  spacing: ThemeSpacing;
  radius: ThemeRadius;
  sketch: SketchSettings;
}

export const THEME_NAMES = ['brutalism', 'sketch', 'clean', 'blueprint'] as const;
export type ThemeName = (typeof THEME_NAMES)[number];
