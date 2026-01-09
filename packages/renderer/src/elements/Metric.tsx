import type { ElementNode } from '@wirescript/dsl';
import { ElementRenderer, generateElementKey } from '../ElementRenderer.js';
import { getVariant, propToText, toText } from '../layout.js';
import { cn } from '../lib/utils.js';

interface MetricProps {
  element: ElementNode;
}

export function Metric({ element }: MetricProps) {
  const { content, props, children } = element;
  const variant = getVariant(props);

  // If metric has children, render them (custom layout)
  if (children && children.length > 0) {
    return (
      <div
        className="flex flex-col gap-1"
        style={{
          width: props.width ? String(props.width) : undefined,
          height: props.height ? String(props.height) : undefined,
        }}
      >
        {children.map((child, i) => (
          <ElementRenderer key={generateElementKey(child, i)} node={child} />
        ))}
      </div>
    );
  }

  // Otherwise, use props-based rendering
  const label = toText(content) || propToText(props.label);
  const value = propToText(props.value);
  const change = propToText(props.change);
  const trend = propToText(props.trend);

  // Determine trend color
  const getTrendColor = () => {
    if (trend === 'up') return 'text-success';
    if (trend === 'down') return 'text-destructive';
    return 'text-muted-foreground';
  };

  // Determine trend icon
  const getTrendIcon = () => {
    if (trend === 'up') return '↑';
    if (trend === 'down') return '↓';
    return '';
  };

  return (
    <div
      className="flex flex-col gap-1"
      style={{
        width: props.width ? String(props.width) : undefined,
        height: props.height ? String(props.height) : undefined,
      }}
    >
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
      {value && (
        <span
          className={cn(
            'text-2xl font-semibold',
            variant === 'success' && 'text-success',
            variant === 'warning' && 'text-warning',
            variant === 'danger' && 'text-destructive'
          )}
        >
          {value}
        </span>
      )}
      {change && (
        <span className={cn('text-sm flex items-center gap-1', getTrendColor())}>
          {getTrendIcon()}
          {change}
        </span>
      )}
    </div>
  );
}
