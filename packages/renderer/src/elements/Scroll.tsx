import type { ElementNode } from '@wirescript/dsl';
import { ElementRenderer, generateElementKey } from '../ElementRenderer.js';
import { getLayoutStyles } from '../layout.js';
import { cn } from '../lib/utils.js';
import { ScrollArea, ScrollBar } from '../ui/scroll-area.js';

interface ScrollProps {
  element: ElementNode;
}

/**
 * Scroll container element using shadcn/ui ScrollArea
 * Adds styled scrollbars based on direction:
 * - :row → horizontal scroll
 * - :col → vertical scroll (default)
 *
 * Also includes native overflow fallback for SSG
 */
export function Scroll({ element }: ScrollProps) {
  const layoutStyles = getLayoutStyles(element);
  const { props } = element;

  const isHorizontal = props.row === true;

  // Merge native overflow styles for SSG fallback
  const scrollStyles = {
    ...layoutStyles,
    overflow: 'auto' as const,
    overflowX: isHorizontal ? ('auto' as const) : ('hidden' as const),
    overflowY: isHorizontal ? ('hidden' as const) : ('auto' as const),
  };

  return (
    <ScrollArea className={cn('box-border')} style={scrollStyles}>
      <div
        className={cn(isHorizontal ? 'flex flex-row' : 'flex flex-col')}
        style={{
          gap: layoutStyles.gap,
        }}
      >
        {element.children.map((child, index) => (
          <ElementRenderer key={generateElementKey(child, index)} node={child} />
        ))}
      </div>
      {isHorizontal && <ScrollBar orientation="horizontal" />}
    </ScrollArea>
  );
}
