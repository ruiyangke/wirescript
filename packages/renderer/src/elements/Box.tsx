import type { ElementNode } from '@wirescript/dsl';
import { ElementRenderer, generateElementKey } from '../ElementRenderer.js';
import { getLayoutStyles } from '../layout.js';

interface BoxProps {
  element: ElementNode;
}

export function Box({ element }: BoxProps) {
  const layoutStyles = getLayoutStyles(element);

  return (
    <div className="box-border" style={layoutStyles}>
      {element.children.map((child, index) => (
        <ElementRenderer key={generateElementKey(child, index)} node={child} />
      ))}
    </div>
  );
}
