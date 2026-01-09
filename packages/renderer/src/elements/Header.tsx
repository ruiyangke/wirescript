import type { ElementNode } from '@wirescript/dsl';
import { ElementRenderer, generateElementKey } from '../ElementRenderer.js';
import { getLayoutStyles } from '../layout.js';
import { cn } from '../lib/utils.js';

interface HeaderProps {
  element: ElementNode;
}

/**
 * Header element with proper styling for mobile/desktop
 * Adds background and border-bottom for visual separation
 */
export function Header({ element }: HeaderProps) {
  const layoutStyles = getLayoutStyles(element);
  const { props } = element;

  // Check if sticky
  const isSticky = props.sticky === true;

  return (
    <header
      className={cn('box-border bg-background border-b border-border', isSticky && 'z-10')}
      style={layoutStyles}
    >
      {element.children.map((child, index) => (
        <ElementRenderer key={generateElementKey(child, index)} node={child} />
      ))}
    </header>
  );
}
