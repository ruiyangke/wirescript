import type { ElementNode } from '@wirescript/dsl';
import { Separator } from '../ui/separator.js';

interface DividerProps {
  element: ElementNode;
}

export function Divider({ element }: DividerProps) {
  const { props } = element;
  const isVertical = props.vertical === true;

  return <Separator orientation={isVertical ? 'vertical' : 'horizontal'} className="my-2" />;
}
