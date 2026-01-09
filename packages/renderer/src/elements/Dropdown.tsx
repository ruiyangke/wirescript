import type { ChildNode, ElementNode } from '@wirescript/dsl';
import { MoreHorizontal } from 'lucide-react';
import { useInteraction } from '../InteractionContext.js';
import { getIcon } from '../icons.js';
import { getVariant, hasFlag } from '../layout.js';
import { cn } from '../lib/utils.js';
import { Button } from '../ui/button.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu.js';

interface DropdownProps {
  element: ElementNode;
}

export function Dropdown({ element }: DropdownProps) {
  const { handleAction } = useInteraction();
  const { props, content, children } = element;

  const isDisabled = hasFlag(props, 'disabled');
  const isOpen = hasFlag(props, 'open');

  // Get trigger content
  const triggerContent = typeof content === 'string' ? content : undefined;

  // Render a menu item from a child element
  const renderMenuItem = (child: ChildNode, index: number) => {
    if (child.type !== 'element') return null;

    const childElement = child as ElementNode;

    // Handle divider
    if (childElement.elementType === 'divider') {
      return <DropdownMenuSeparator key={index} />;
    }

    // Handle button or other elements as menu items
    const itemContent = typeof childElement.content === 'string' ? childElement.content : '';
    const itemProps = childElement.props;
    const variant = getVariant(itemProps);
    const isDanger = variant === 'danger' || hasFlag(itemProps, 'danger');
    const isItemDisabled = hasFlag(itemProps, 'disabled');
    const toValue = itemProps.to;

    // Get icon if specified
    const iconName = typeof itemProps.icon === 'string' ? itemProps.icon : undefined;
    const IconComponent = iconName ? getIcon(iconName) : undefined;

    const handleClick = () => {
      if (isItemDisabled) return;
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

    return (
      <DropdownMenuItem
        key={index}
        disabled={isItemDisabled}
        onClick={handleClick}
        className={cn(isDanger && 'text-destructive focus:text-destructive')}
      >
        {IconComponent && <IconComponent size={16} className="mr-2" />}
        {itemContent}
      </DropdownMenuItem>
    );
  };

  return (
    <DropdownMenu defaultOpen={isOpen}>
      <DropdownMenuTrigger asChild disabled={isDisabled}>
        <Button variant="ghost" size={triggerContent ? 'default' : 'icon'} disabled={isDisabled}>
          {triggerContent || <MoreHorizontal size={16} />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {children.map((child, index) => renderMenuItem(child, index))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
