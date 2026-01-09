import type { ElementNode } from '@wirescript/dsl';
import { ElementRenderer, generateElementKey } from '../ElementRenderer.js';
import { getLayoutStyles } from '../layout.js';
import { cn } from '../lib/utils.js';

interface NavProps {
  element: ElementNode;
}

/**
 * Nav element with proper styling for mobile bottom navigation
 * and desktop sidebar navigation
 * Adds background and appropriate border for visual separation
 */
export function Nav({ element }: NavProps) {
  const layoutStyles = getLayoutStyles(element);
  const { props } = element;

  // Check positioning and orientation
  const isSticky = props.sticky === true;
  const isRow = props.row === true;
  const isBottom = props.bottom !== undefined;
  const isRight = props.right !== undefined;

  // Determine border based on position
  // Bottom nav: border-top
  // Side nav: border-right (default) or border-left (if right-side)
  const borderClass = isRow ? (isBottom ? 'border-t' : '') : isRight ? 'border-l' : 'border-r';

  return (
    <nav
      className={cn('box-border bg-background border-border', borderClass, isSticky && 'z-10')}
      style={layoutStyles}
    >
      {element.children.map((child, index) => (
        <ElementRenderer key={generateElementKey(child, index)} node={child} />
      ))}
    </nav>
  );
}
