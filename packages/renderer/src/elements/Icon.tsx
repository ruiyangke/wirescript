import type { ElementNode } from '@wirescript/dsl';
import { getIcon, IconFallback } from '../icons.js';
import { useInteraction } from '../InteractionContext.js';
import { getEmphasis, toText } from '../layout.js';
import { cn } from '../lib/utils.js';

interface IconProps {
  element: ElementNode;
}

export function Icon({ element }: IconProps) {
  const { handleAction } = useInteraction();
  const { content, props } = element;
  const emphasis = getEmphasis(props);
  const toValue = props.to;

  const iconName = toText(content) || 'plus';

  // Get size from props or emphasis
  const sizeFromProps = props?.size as number | undefined;

  const getSize = (): number => {
    if (sizeFromProps) return sizeFromProps;
    const sizes = { high: 28, medium: 20, low: 16 };
    return sizes[emphasis];
  };

  // Color classes
  const getColorClass = () => {
    if (props.primary === true) return 'text-primary';
    if (props.secondary === true) return 'text-secondary';
    if (props.success === true) return 'text-green-600';
    if (props.warning === true) return 'text-yellow-600';
    if (props.danger === true) return 'text-red-600';
    if (props.info === true) return 'text-blue-600';

    const colorClasses = {
      high: 'text-foreground',
      medium: 'text-foreground',
      low: 'text-muted-foreground',
    };
    return colorClasses[emphasis];
  };

  const IconComponent = getIcon(iconName);

  // Handle click for interactive icons
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

  if (!IconComponent) {
    return <IconFallback name={iconName} />;
  }

  const icon = (
    <IconComponent
      className={cn('inline-block shrink-0', getColorClass())}
      size={getSize()}
      strokeWidth={1.5}
    />
  );

  // Wrap in clickable button if interactive
  if (toValue) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center justify-center rounded-md p-1 hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        {icon}
      </button>
    );
  }

  return icon;
}
