import type { WireDocument } from '@wirescript/dsl';

/**
 * Represents a file or directory in the project tree
 */
export interface FileEntry {
  path: string;
  name: string;
  type: 'file' | 'directory';
  children?: FileEntry[];
}

/**
 * Represents an open file with its state
 */
export interface OpenFile {
  id: string; // Unique identifier (path)
  path: string; // Absolute file path
  name: string; // Display name (filename)
  source: string; // Current editor content
  savedSource: string; // Last saved content
  wireDoc: WireDocument | null;
  errors: string[];
  selectedScreen?: string;
}

/**
 * Tab display info
 */
export interface TabInfo {
  id: string;
  name: string;
  hasChanges: boolean;
}

/**
 * Screen info for navigator
 */
export interface ScreenInfo {
  id: string;
  name?: string;
  viewport?: 'mobile' | 'tablet' | 'desktop';
}

/**
 * Context menu item
 */
export interface MenuItem {
  label: string;
  onClick: () => void;
  icon?: string;
  disabled?: boolean;
  danger?: boolean;
  separator?: boolean;
}

/**
 * Context menu position
 */
export interface MenuPosition {
  x: number;
  y: number;
}

/**
 * Viewport configuration for preview
 * Use 'auto' for dimension to use screen default, or specify exact pixels
 */
export interface ViewportConfig {
  width: number | 'auto';
  height: number | 'auto';
}

/**
 * Viewport preset definitions
 */
export const VIEWPORT_PRESETS: Record<string, ViewportConfig> = {
  auto: { width: 'auto', height: 'auto' },
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 },
  'desktop-hd': { width: 1920, height: 1080 },
} as const;

export type ViewportPreset = keyof typeof VIEWPORT_PRESETS;
