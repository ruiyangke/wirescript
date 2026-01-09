import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';

import { cn } from '../lib/utils.js';

const progressVariants = cva('relative h-2 w-full overflow-hidden rounded-full bg-secondary', {
  variants: {
    variant: {
      default: '',
      primary: '',
      success: '',
      warning: '',
      danger: '',
    },
    size: {
      sm: 'h-1',
      default: 'h-2',
      lg: 'h-3',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

const progressIndicatorVariants = cva('h-full w-full flex-1 transition-all', {
  variants: {
    variant: {
      default: 'bg-primary',
      primary: 'bg-primary',
      success: 'bg-success',
      warning: 'bg-warning',
      danger: 'bg-destructive',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface ProgressProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressVariants> {
  value?: number;
  max?: number;
  indeterminate?: boolean;
}

function Progress({
  className,
  variant,
  size,
  value = 0,
  max = 100,
  indeterminate = false,
  ...props
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn(progressVariants({ variant, size }), className)}
      {...props}
    >
      <div
        className={cn(
          progressIndicatorVariants({ variant }),
          indeterminate && 'animate-progress-indeterminate'
        )}
        style={{
          transform: indeterminate ? undefined : `translateX(-${100 - percentage}%)`,
        }}
      />
    </div>
  );
}

export { Progress, progressVariants };
