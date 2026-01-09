import type { ElementNode } from '@wirescript/dsl';
import { useIsAutoActive } from '../AutoActiveContext.js';
import { useInteraction } from '../InteractionContext.js';
import { getEmphasis, getVariant, hasFlag } from '../layout.js';
import { cn } from '../lib/utils.js';

interface TextProps {
  element: ElementNode;
}

export function Text({ element }: TextProps) {
  const { handleAction } = useInteraction();
  const isAutoActive = useIsAutoActive(element);
  const { props, content } = element;

  const emphasis = getEmphasis(props);
  const variant = getVariant(props);
  const isActive = hasFlag(props, 'active') || isAutoActive;

  // Get content as string
  const textContent = typeof content === 'string' ? content : '';

  // Get the 'to' property for navigation
  const toValue = props.to;
  const isClickable = !!toValue;

  // Handle click for navigable text
  const handleClick = () => {
    if (!toValue) return;

    if (typeof toValue === 'object' && 'type' in toValue) {
      switch (toValue.type) {
        case 'screen':
          handleAction(toValue.id);
          break;
        case 'overlay':
          handleAction(`#${toValue.id}`);
          break;
        case 'action':
          handleAction(`:${toValue.action}`);
          break;
        case 'url':
          window.open(toValue.url, '_blank');
          break;
      }
    } else if (typeof toValue === 'string') {
      handleAction(toValue);
    }
  };


  // Map emphasis to text style classes
  const emphasisClasses = {
    high: 'text-2xl font-semibold text-foreground',
    medium: 'text-base text-foreground',
    low: 'text-sm text-muted-foreground',
  };

  // Map variant to color classes
  const variantClasses = {
    primary: 'text-primary',
    danger: 'text-destructive',
    success: 'text-success',
    warning: 'text-warning',
    info: 'text-primary',
  };

  const className = cn(
    'leading-normal m-0',
    emphasisClasses[emphasis],
    variant && variantClasses[variant as keyof typeof variantClasses],
    isClickable && 'cursor-pointer hover:underline',
    isActive && 'text-primary font-medium'
  );

  // Render as heading for high emphasis
  if (emphasis === 'high') {
    return (
      <h2 className={className} onClick={isClickable ? handleClick : undefined}>
        {textContent}
      </h2>
    );
  }

  return (
    <p className={className} onClick={isClickable ? handleClick : undefined}>
      {textContent}
    </p>
  );
}
