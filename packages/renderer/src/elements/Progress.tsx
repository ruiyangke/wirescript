import type { ElementNode } from '@wirescript/dsl';
import { getVariant } from '../layout.js';
import { Progress as ShadcnProgress } from '../ui/progress.js';

interface ProgressProps {
  element: ElementNode;
}

export function Progress({ element }: ProgressProps) {
  const { props } = element;
  const variant = getVariant(props);

  // Get value and max from props
  const value = typeof props.value === 'number' ? props.value : 60; // Default to 60% for demo
  const max = typeof props.max === 'number' ? props.max : 100;

  // Check for size props
  const size = props.full === true ? 'lg' : props.fit === true ? 'sm' : 'default';

  // Map variant
  const getProgressVariant = (): 'default' | 'primary' | 'success' | 'warning' | 'danger' => {
    switch (variant) {
      case 'primary':
        return 'primary';
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'danger':
        return 'danger';
      default:
        return 'default';
    }
  };

  // Check if indeterminate (no value specified and no content)
  const indeterminate = props.value === undefined;

  return (
    <ShadcnProgress
      value={value}
      max={max}
      variant={getProgressVariant()}
      size={size}
      indeterminate={indeterminate}
      style={{
        width: props.width ? String(props.width) : '100%',
        height: props.height ? String(props.height) : undefined,
      }}
    />
  );
}
