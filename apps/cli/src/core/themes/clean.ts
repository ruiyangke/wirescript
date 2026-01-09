import type { Theme } from './types.js';

export const clean: Theme = {
  name: 'clean',
  colors: {
    bg: '#FFFFFF',
    surface: '#F9FAFB',
    border: '#E5E7EB',
    text: {
      high: '#111827',
      medium: '#6B7280',
      low: '#9CA3AF',
    },
    primary: '#2563EB',
    secondary: '#F3F4F6',
    danger: '#DC2626',
    success: '#059669',
    warning: '#D97706',
    info: '#7C3AED',
  },
  fonts: {
    heading: '"Inter", system-ui, sans-serif',
    body: '"Inter", system-ui, sans-serif',
    mono: '"JetBrains Mono", monospace',
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
    enabled: false,
    roughness: 0,
    bowing: 0,
    strokeWidth: 1,
  },
};
