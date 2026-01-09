/**
 * Icon utilities for WireScript
 *
 * Uses lucide-react's built-in icons map for access to all 1600+ icons.
 * No manual whitelist needed.
 */

import { icons, type LucideIcon } from 'lucide-react';

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
 */
export function getIcon(name: string): LucideIcon | undefined {
  // Try direct lookup first (PascalCase)
  if (name in icons) {
    return icons[name as keyof typeof icons];
  }

  // Convert kebab-case to PascalCase
  const pascalName = kebabToPascal(name);
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
