import type { ElementNode } from '@wirescript/dsl';
import { ElementRenderer, generateElementKey } from '../ElementRenderer.js';
import { propToText, toText } from '../layout.js';

interface EmptyProps {
  element: ElementNode;
}

export function Empty({ element }: EmptyProps) {
  const { children, props, content } = element;

  const title = propToText(props.title) || toText(content) || 'No data';
  const description = propToText(props.description);
  const icon = propToText(props.icon);

  // If has children, render custom empty state content
  if (children && children.length > 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-8 text-center"
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

  // Default empty state
  return (
    <div
      className="flex flex-col items-center justify-center py-8 text-center"
      style={{
        width: props.width ? String(props.width) : undefined,
        height: props.height ? String(props.height) : undefined,
        minHeight: props.height ? undefined : '200px',
      }}
    >
      {/* Icon */}
      {icon && <div className="text-4xl text-muted-foreground mb-4">{icon}</div>}

      {/* Default icon if none provided */}
      {!icon && (
        <div className="w-16 h-16 mb-4 text-muted-foreground">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-full h-full"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12h8" />
          </svg>
        </div>
      )}

      {/* Title */}
      {title && <h3 className="text-lg font-medium text-foreground mb-1">{title}</h3>}

      {/* Description */}
      {description && <p className="text-sm text-muted-foreground max-w-sm">{description}</p>}
    </div>
  );
}
