/**
 * Icon utilities for WireScript
 *
 * Uses lucide-react's built-in icons map for access to all 1600+ icons.
 * No manual whitelist needed.
 */

import { icons, type LucideIcon } from 'lucide-react';

/**
 * Common aliases for intuitive icon names.
 * Maps user-friendly names to actual Lucide icon names.
 */
const ICON_ALIASES: Record<string, string> = {
  // Navigation
  home: 'house',

  // Actions
  edit: 'pencil',
  delete: 'trash',
  remove: 'trash',
  close: 'x',
  add: 'plus',

  // Status (old circle-suffix → new circle-prefix)
  'alert-circle': 'circle-alert',
  'check-circle': 'circle-check',
  'x-circle': 'circle-x',
  'help-circle': 'circle-question-mark',
  'circle-help': 'circle-question-mark',

  // Text alignment
  'align-left': 'text-align-start',
  'align-center': 'text-align-center',
  'align-right': 'text-align-end',

  // Charts
  'bar-chart': 'chart-bar',
  'line-chart': 'chart-line',
  'pie-chart': 'chart-pie',

  // Misc
  'more-horizontal': 'ellipsis',
  'more-vertical': 'ellipsis-vertical',
  dots: 'ellipsis',
};

/**
 * Convert kebab-case to PascalCase
 * e.g., "arrow-left" → "ArrowLeft"
 */
function kebabToPascal(name: string): string {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

/**
 * Get an icon component by name (kebab-case)
 *
 * Supports all 1600+ lucide icons.
 * Names can be kebab-case (arrow-left) or PascalCase (ArrowLeft).
 * Also supports common aliases (e.g., "home" → "house", "edit" → "pencil").
 */
export function getIcon(name: string): LucideIcon | undefined {
  // Check aliases first
  const aliasedName = ICON_ALIASES[name] || name;

  // Try direct lookup first (PascalCase)
  if (aliasedName in icons) {
    return icons[aliasedName as keyof typeof icons];
  }

  // Convert kebab-case to PascalCase
  const pascalName = kebabToPascal(aliasedName);
  return icons[pascalName as keyof typeof icons];
}

/**
 * Fallback component for unknown icons
 */
export function IconFallback({ name }: { name: string }) {
  return (
    <span
      className="inline-flex items-center justify-center w-5 h-5 text-[10px] text-muted-foreground bg-muted rounded"
      title={`Unknown icon: ${name}`}
    >
      ?
    </span>
  );
}

/**
 * Check if an icon exists
 */
export function hasIcon(name: string): boolean {
  return getIcon(name) !== undefined;
}

// Re-export icons map for direct access if needed
export { icons };
