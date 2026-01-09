import type { ElementNode } from '@wirescript/dsl';
import { getVariant, toText } from '../layout.js';
import { Badge as ShadcnBadge } from '../ui/badge.js';

interface BadgeProps {
  element: ElementNode;
}

export function Badge({ element }: BadgeProps) {
  const { content, props } = element;
  const variant = getVariant(props);

  // Map wireframe variants to shadcn variants
  const getBadgeVariant = () => {
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

  return <ShadcnBadge variant={getBadgeVariant()}>{toText(content)}</ShadcnBadge>;
}
