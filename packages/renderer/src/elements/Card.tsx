import type { ElementNode } from '@wirescript/dsl';
import { ElementRenderer, generateElementKey } from '../ElementRenderer.js';
import { getLayoutStyles } from '../layout.js';
import { cn } from '../lib/utils.js';
import { Card as ShadcnCard } from '../ui/card.js';

interface CardProps {
  element: ElementNode;
}

export function Card({ element }: CardProps) {
  const layoutStyles = getLayoutStyles(element);

  // Convert numeric styles to Tailwind-compatible inline styles
  const style: React.CSSProperties = {
    ...layoutStyles,
  };

  return (
    <ShadcnCard className={cn('bg-card')} style={style}>
      {element.children.map((child, index) => (
        <ElementRenderer key={generateElementKey(child, index)} node={child} />
      ))}
    </ShadcnCard>
  );
}
