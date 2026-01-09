import type { Theme } from './types.js';

export const sketch: Theme = {
  name: 'sketch',
  colors: {
    bg: '#FAFAFA',
    surface: '#FFFFFF',
    border: '#374151',
    text: {
      high: '#111827',
      medium: '#4B5563',
      low: '#9CA3AF',
    },
    primary: '#3B82F6',
    secondary: '#E5E7EB',
    danger: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#8B5CF6',
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
    sm: 4,
    md: 8,
    lg: 12,
    full: 9999,
  },
  sketch: {
    enabled: true,
    roughness: 1,
    bowing: 1,
    strokeWidth: 2,
  },
};
