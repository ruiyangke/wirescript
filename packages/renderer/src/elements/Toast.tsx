import type { ElementNode } from '@wirescript/dsl';
import { ElementRenderer, generateElementKey } from '../ElementRenderer.js';
import { getVariant, propToText, toText } from '../layout.js';
import { cn } from '../lib/utils.js';

interface ToastProps {
  element: ElementNode;
}

export function Toast({ element }: ToastProps) {
  const { children, props, content } = element;
  const variant = getVariant(props);

  const title = propToText(props.title) || toText(content);
  const description = propToText(props.description);
  const icon = propToText(props.icon);

  // Variant styles
  const variantStyles = {
    default: 'bg-card border-border',
    success: 'bg-success/10 border-success text-success',
    warning: 'bg-warning/10 border-warning text-warning',
    danger: 'bg-destructive/10 border-destructive text-destructive',
    info: 'bg-accent/10 border-accent text-accent',
  };

  const variantIconColor = {
    default: 'text-foreground',
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-destructive',
    info: 'text-accent',
  };

  // Default icons per variant
  const defaultIcons: Record<string, string> = {
    success: '✓',
    warning: '⚠',
    danger: '✕',
    info: 'ℹ',
  };

  const displayIcon = icon || (variant && defaultIcons[variant]);
  const styleKey = (variant || 'default') as keyof typeof variantStyles;

  // If has children, render custom toast content
  if (children && children.length > 0) {
    return (
      <div
        className={cn(
          'flex items-start gap-3 p-4 border rounded-lg shadow-lg',
          'animate-in slide-in-from-top-2 fade-in-0',
          variantStyles[styleKey]
        )}
        role="alert"
        style={{
          width: props.width ? String(props.width) : undefined,
          maxWidth: '400px',
        }}
      >
        {children.map((child, i) => (
          <ElementRenderer key={generateElementKey(child, i)} node={child} />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 border rounded-lg shadow-lg',
        'animate-in slide-in-from-top-2 fade-in-0',
        variantStyles[styleKey]
      )}
      role="alert"
      style={{
        width: props.width ? String(props.width) : undefined,
        maxWidth: '400px',
      }}
    >
      {/* Icon */}
      {displayIcon && (
        <span className={cn('text-lg flex-shrink-0', variantIconColor[styleKey])}>
          {displayIcon}
        </span>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <div
            className={cn(
              'font-medium',
              variant ? variantIconColor[styleKey] : 'text-card-foreground'
            )}
          >
            {title}
          </div>
        )}
        {description && <div className="text-sm text-muted-foreground mt-1">{description}</div>}
      </div>
    </div>
  );
}
