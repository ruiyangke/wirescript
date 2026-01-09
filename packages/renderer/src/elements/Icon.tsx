import type { ElementNode } from '@wirescript/dsl';
import { getIcon, IconFallback } from '../icons.js';
import { getEmphasis, toText } from '../layout.js';
import { cn } from '../lib/utils.js';

interface IconProps {
  element: ElementNode;
}

export function Icon({ element }: IconProps) {
  const { content, props } = element;
  const emphasis = getEmphasis(props);

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

  if (!IconComponent) {
    return <IconFallback name={iconName} />;
  }

  return (
    <IconComponent
      className={cn('inline-block shrink-0', getColorClass())}
      size={getSize()}
      strokeWidth={1.5}
    />
  );
}
