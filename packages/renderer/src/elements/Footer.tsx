import type { ElementNode } from '@wirescript/dsl';
import { ElementRenderer, generateElementKey } from '../ElementRenderer.js';
import { getLayoutStyles } from '../layout.js';
import { cn } from '../lib/utils.js';

interface FooterProps {
  element: ElementNode;
}

/**
 * Footer element with proper styling
 * Adds background and border-top for visual separation
 */
export function Footer({ element }: FooterProps) {
  const layoutStyles = getLayoutStyles(element);
  const { props } = element;

  // Check if sticky
  const isSticky = props.sticky === true;

  return (
    <footer
      className={cn('box-border bg-background border-t border-border', isSticky && 'z-10')}
      style={layoutStyles}
    >
      {element.children.map((child, index) => (
        <ElementRenderer key={generateElementKey(child, index)} node={child} />
      ))}
    </footer>
  );
}
