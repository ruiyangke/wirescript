import type { ElementNode, PropValue } from '@wirescript/dsl';
import { ElementRenderer, generateElementKey } from '../ElementRenderer.js';
import { getLayoutStyles, hasFlag } from '../layout.js';
import { cn } from '../lib/utils.js';
import { Skeleton as ShadcnSkeleton } from '../ui/skeleton.js';

interface SkeletonProps {
  element: ElementNode;
}

/** Default size for circle variant when no dimensions specified */
const DEFAULT_CIRCLE_SIZE = 40;

/**
 * Convert a dimension prop to a valid CSS value.
 * - Numbers become pixels (e.g., 200 → "200px")
 * - Strings with units pass through (e.g., "200px", "50%")
 * - Strings without units get px appended
 */
function toCssDimension(value: PropValue | undefined): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value === 'number') return `${value}px`;
  if (typeof value === 'string') {
    // If already has a unit, pass through
    if (value.includes('%') || value.includes('px') || value.includes('em') || value.includes('rem')) {
      return value;
    }
    // Try to parse as number and add px
    const num = parseFloat(value);
    if (!isNaN(num)) return `${num}px`;
    return value;
  }
  return undefined;
}

/**
 * Skeleton - Loading placeholder element
 *
 * Supports two modes:
 * 1. Leaf skeleton - single animated placeholder (default)
 * 2. Container skeleton - wraps children with layout props (when children present)
 *
 * Variants:
 * - :circle - circular placeholder (for avatars)
 * - :text - text line placeholder (default when no dimensions)
 *
 * Container props (when has children):
 * - :row, :col - layout direction
 * - :gap - spacing between children
 * - :padding - internal padding
 * - :full, :fit, :fill - sizing
 */
export function Skeleton({ element }: SkeletonProps) {
  const { props, children } = element;

  const isCircle = hasFlag(props, 'circle');
  const isText = hasFlag(props, 'text');
  const hasChildren = children && children.length > 0;

  // Get explicit dimensions from props
  const explicitWidth = toCssDimension(props.width);
  const explicitHeight = toCssDimension(props.height);

  // If skeleton has children, render as a container with skeleton styling
  if (hasChildren) {
    const layoutStyles = getLayoutStyles(element);

    return (
      <div className="box-border" style={layoutStyles}>
        {children.map((child, index) => (
          <ElementRenderer key={generateElementKey(child, index)} node={child} />
        ))}
      </div>
    );
  }

  // Leaf skeleton - determine variant and dimensions
  // Default to text variant if no explicit dimensions and not circle
  const useTextVariant = isText || (!isCircle && !explicitWidth && !explicitHeight);

  // Calculate final dimensions
  let width: string | undefined;
  let height: string | undefined;

  if (isCircle) {
    // Circle: use explicit dimensions or default
    width = explicitWidth ?? `${DEFAULT_CIRCLE_SIZE}px`;
    height = explicitHeight ?? `${DEFAULT_CIRCLE_SIZE}px`;
  } else if (useTextVariant) {
    // Text variant: full width, fixed height (can be overridden)
    width = explicitWidth ?? '100%';
    height = explicitHeight ?? '1rem'; // h-4 equivalent
  } else {
    // Custom dimensions
    width = explicitWidth;
    height = explicitHeight;
  }

  return (
    <ShadcnSkeleton
      className={cn(isCircle && 'rounded-full')}
      style={{
        width,
        height,
        // Ensure minimum dimensions for visibility
        minWidth: width ? undefined : '1rem',
        minHeight: height ? undefined : '1rem',
      }}
    />
  );
}
