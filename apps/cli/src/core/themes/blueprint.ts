import type { Theme } from './types.js';

export const blueprint: Theme = {
  name: 'blueprint',
  colors: {
    bg: '#1E3A5F',
    surface: '#234B7A',
    border: '#60A5FA',
    text: {
      high: '#FFFFFF',
      medium: '#BFDBFE',
      low: '#93C5FD',
    },
    primary: '#60A5FA',
    secondary: '#2563EB',
    danger: '#F87171',
    success: '#4ADE80',
    warning: '#FBBF24',
    info: '#A78BFA',
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
    sm: 2,
    md: 4,
    lg: 8,
    full: 9999,
  },
  sketch: {
    enabled: false,
    roughness: 0,
    bowing: 0,
    strokeWidth: 1,
  },
};
