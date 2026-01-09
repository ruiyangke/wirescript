import type { ElementNode } from '@wirescript/dsl';
import { ElementRenderer, generateElementKey } from '../ElementRenderer.js';
import { propToText, toText } from '../layout.js';
import {
  Tooltip as ShadcnTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip.js';

interface TooltipProps {
  element: ElementNode;
}

export function Tooltip({ element }: TooltipProps) {
  const { children, props, content } = element;

  const tooltipText = toText(content) || propToText(props.text) || propToText(props.content) || '';
  const side = (props.position as 'top' | 'bottom' | 'left' | 'right') || 'top';
  const hasChildren = children && children.length > 0;

  // If no children, render as a static tooltip bubble (for showcase/demo)
  if (!hasChildren) {
    return (
      <div className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md">
        {tooltipText}
      </div>
    );
  }

  // With children: wrap them and show tooltip on hover
  return (
    <TooltipProvider>
      <ShadcnTooltip>
        <TooltipTrigger asChild>
          <span className="inline-block">
            {children.map((child, i) => (
              <ElementRenderer key={generateElementKey(child, i)} node={child} />
            ))}
          </span>
        </TooltipTrigger>
        {tooltipText && <TooltipContent side={side}>{tooltipText}</TooltipContent>}
      </ShadcnTooltip>
    </TooltipProvider>
  );
}
