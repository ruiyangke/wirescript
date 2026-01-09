import type { Theme } from './types.js';

export const brutalism: Theme = {
  name: 'brutalism',
  colors: {
    bg: '#FFFFFF',
    surface: '#FFFFFF',
    border: '#000000',
    text: {
      high: '#000000',
      medium: '#52525B',
      low: '#737373',
    },
    primary: '#E85D04',
    secondary: '#E9FF70',
    danger: '#DC2626',
    success: '#22C55E',
    warning: '#F97316',
    info: '#6366F1',
  },
  fonts: {
    heading: '"DM Sans", system-ui, sans-serif',
    body: '"DM Sans", system-ui, sans-serif',
    mono: '"Space Mono", monospace',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radius: {
    none: 0,
    sm: 0,
    md: 0,
    lg: 0,
    full: 9999,
  },
  sketch: {
    enabled: false,
    roughness: 0,
    bowing: 0,
    strokeWidth: 2,
  },
};
