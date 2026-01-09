import type { ElementNode } from '@wirescript/dsl';
import { useIsAutoActive } from '../AutoActiveContext.js';
import { ElementRenderer, generateElementKey } from '../ElementRenderer.js';
import { useInteraction } from '../InteractionContext.js';
import { getIcon } from '../icons.js';
import { getVariant, hasFlag } from '../layout.js';
import { cn } from '../lib/utils.js';
import { Button as ShadcnButton } from '../ui/button.js';

interface ButtonProps {
  element: ElementNode;
}

export function Button({ element }: ButtonProps) {
  const { handleAction } = useInteraction();
  const isAutoActive = useIsAutoActive(element);
  const { props, content } = element;

  const variant = getVariant(props) || 'secondary';
  const isDisabled = hasFlag(props, 'disabled');
  const isLoading = hasFlag(props, 'loading');
  const isGhost = hasFlag(props, 'ghost');
  const isFull = hasFlag(props, 'full');
  const isActive = hasFlag(props, 'active') || isAutoActive;
  const isIconOnly = hasFlag(props, 'icon');

  // Get icon from props
  const iconName = typeof props.icon === 'string' ? props.icon : undefined;

  // Get the 'to' property for navigation/actions
  const toValue = props.to;

  // Handle click - resolve navigation target
  const handleClick = () => {
    if (isDisabled || isLoading) return;
    if (!toValue) return;

    // Handle different navigation target types
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
      // Legacy string format
      handleAction(toValue);
    }
  };

  // Map wireframe variants to shadcn variants
  const getButtonVariant = () => {
    if (isGhost) return 'ghost';
    switch (variant) {
      case 'primary':
        return 'default';
      case 'danger':
        return 'destructive';
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  // Determine button size
  const getButtonSize = () => {
    if (isIconOnly && !content) return 'icon';
    return 'default';
  };

  // Render content: children > (icon + content) > content
  const renderContent = () => {
    // If has children, render them (allows custom content)
    if (element.children && element.children.length > 0) {
      return element.children.map((child, index) => (
        <ElementRenderer key={generateElementKey(child, index)} node={child} />
      ));
    }

    // Get content as string
    const textContent = typeof content === 'string' ? content : undefined;

    // Get icon component from static registry
    const IconComponent = iconName ? getIcon(iconName) : undefined;

    // Otherwise render icon + text
    return (
      <>
        {isLoading && <span className="mr-1 animate-spin">⟳</span>}
        {IconComponent && !isLoading && (
          <IconComponent size={16} className={cn(textContent && 'mr-2')} />
        )}
        {textContent}
      </>
    );
  };

  return (
    <ShadcnButton
      variant={getButtonVariant()}
      size={getButtonSize()}
      disabled={isDisabled}
      onClick={handleClick}
      className={cn(isFull && 'w-full', isActive && 'bg-accent text-accent-foreground')}
    >
      {renderContent()}
    </ShadcnButton>
  );
}
