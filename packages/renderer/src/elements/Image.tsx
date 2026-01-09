import type { ElementNode } from '@wirescript/dsl';
import { toText } from '../layout.js';

interface ImageProps {
  element: ElementNode;
}

export function Image({ element }: ImageProps) {
  const { content, props } = element;
  const textContent = toText(content);

  const width = props.width ? String(props.width) : '100%';
  const height = props.height ? String(props.height) : '150px';

  return (
    <div
      className="bg-muted flex items-center justify-center relative rounded-md overflow-hidden border border-border"
      style={{ width, height }}
    >
      {/* Diagonal lines to indicate image placeholder */}
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        <line
          x1="0"
          y1="0"
          x2="100%"
          y2="100%"
          className="stroke-muted-foreground"
          strokeWidth={1}
        />
        <line
          x1="100%"
          y1="0"
          x2="0"
          y2="100%"
          className="stroke-muted-foreground"
          strokeWidth={1}
        />
      </svg>
      <span className="text-xs text-muted-foreground text-center p-2 relative z-10">
        {textContent || 'Image'}
      </span>
    </div>
  );
}
