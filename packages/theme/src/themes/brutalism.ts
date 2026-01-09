/**
 * Brutalism theme
 *
 * A bold, high-contrast theme with hard shadows and no border radius.
 * Inspired by brutalist design principles.
 */

import type { Theme } from '../types.js';

export const brutalism: Theme = {
  name: 'brutalism',

  colors: {
    // Core colors
    background: 'oklch(1 0 0)',
    foreground: 'oklch(0 0 0)',
    card: 'oklch(1 0 0)',
    cardForeground: 'oklch(0 0 0)',
    popover: 'oklch(1 0 0)',
    popoverForeground: 'oklch(0 0 0)',

    // Primary - Red
    primary: 'oklch(0.6489 0.237 26.9728)',
    primaryForeground: 'oklch(1 0 0)',

    // Secondary - Yellow
    secondary: 'oklch(0.968 0.211 109.7692)',
    secondaryForeground: 'oklch(0 0 0)',

    // Muted
    muted: 'oklch(0.9551 0 0)',
    mutedForeground: 'oklch(0.3211 0 0)',

    // Accent - Blue
    accent: 'oklch(0.5635 0.2408 260.8178)',
    accentForeground: 'oklch(1 0 0)',

    // Destructive
    destructive: 'oklch(0 0 0)',
    destructiveForeground: 'oklch(1 0 0)',

    // Success - Green
    success: 'oklch(0.7323 0.2492 142.4953)',
    successForeground: 'oklch(1 0 0)',

    // Warning - Orange
    warning: 'oklch(0.75 0.18 70)',
    warningForeground: 'oklch(0 0 0)',

    // Border & Input
    border: 'oklch(0 0 0)',
    input: 'oklch(0 0 0)',
    ring: 'oklch(0.6489 0.237 26.9728)',

    // Chart colors
    chart1: 'oklch(0.6489 0.237 26.9728)',
    chart2: 'oklch(0.968 0.211 109.7692)',
    chart3: 'oklch(0.5635 0.2408 260.8178)',
    chart4: 'oklch(0.7323 0.2492 142.4953)',
    chart5: 'oklch(0.5931 0.2726 328.3634)',

    // Sidebar
    sidebar: 'oklch(0.9551 0 0)',
    sidebarForeground: 'oklch(0 0 0)',
    sidebarPrimary: 'oklch(0.6489 0.237 26.9728)',
    sidebarPrimaryForeground: 'oklch(1 0 0)',
    sidebarAccent: 'oklch(0.5635 0.2408 260.8178)',
    sidebarAccentForeground: 'oklch(1 0 0)',
    sidebarBorder: 'oklch(0 0 0)',
    sidebarRing: 'oklch(0.6489 0.237 26.9728)',
  },

  shadows: {
    '2xs': '4px 4px 0px 0px hsl(0 0% 0% / 0.5)',
    xs: '4px 4px 0px 0px hsl(0 0% 0% / 0.5)',
    sm: '4px 4px 0px 0px hsl(0 0% 0% / 1), 4px 1px 2px -1px hsl(0 0% 0% / 1)',
    DEFAULT: '4px 4px 0px 0px hsl(0 0% 0% / 1), 4px 1px 2px -1px hsl(0 0% 0% / 1)',
    md: '4px 4px 0px 0px hsl(0 0% 0% / 1), 4px 2px 4px -1px hsl(0 0% 0% / 1)',
    lg: '4px 4px 0px 0px hsl(0 0% 0% / 1), 4px 4px 6px -1px hsl(0 0% 0% / 1)',
    xl: '4px 4px 0px 0px hsl(0 0% 0% / 1), 4px 8px 10px -1px hsl(0 0% 0% / 1)',
    '2xl': '4px 4px 0px 0px hsl(0 0% 0% / 2.5)',
  },

  fonts: {
    sans: 'DM Sans, sans-serif',
    serif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
    mono: 'Space Mono, monospace',
  },

  radius: {
    DEFAULT: '0px',
  },

  spacing: {
    DEFAULT: '0.25rem',
  },

  tracking: '0em',
};
