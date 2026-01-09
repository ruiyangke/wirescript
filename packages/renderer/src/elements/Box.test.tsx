import { render, screen } from '@testing-library/react';
import type { ElementNode } from '@wirescript/dsl';
import { describe, expect, it } from 'vitest';
import { Box } from './Box.js';

function makeElement(overrides: Partial<ElementNode> = {}): ElementNode {
  return {
    type: 'element',
    elementType: 'box',
    props: {},
    children: [],
    ...overrides,
  };
}

describe('Box', () => {
  it('should render an empty box', () => {
    const element = makeElement();
    const { container } = render(<Box element={element} />);
    expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
  });

  it('should apply flex column styles for :col flag', () => {
    const element = makeElement({ props: { col: true } });
    const { container } = render(<Box element={element} />);
    const div = container.firstChild as HTMLElement;
    expect(div.style.display).toBe('flex');
    expect(div.style.flexDirection).toBe('column');
  });

  it('should apply flex row styles for :row flag', () => {
    const element = makeElement({ props: { row: true } });
    const { container } = render(<Box element={element} />);
    const div = container.firstChild as HTMLElement;
    expect(div.style.display).toBe('flex');
    expect(div.style.flexDirection).toBe('row');
  });

  it('should apply gap from props', () => {
    const element = makeElement({ props: { gap: 16 } });
    const { container } = render(<Box element={element} />);
    const div = container.firstChild as HTMLElement;
    expect(div.style.gap).toBe('16px');
  });

  it('should apply padding from props', () => {
    const element = makeElement({ props: { padding: 24 } });
    const { container } = render(<Box element={element} />);
    const div = container.firstChild as HTMLElement;
    expect(div.style.padding).toBe('24px');
  });

  it('should render children', () => {
    const textElement = makeElement({
      elementType: 'text',
      content: 'Hello World',
    });
    const element = makeElement({
      children: [textElement],
    });
    render(<Box element={element} />);
    expect(screen.getByText('Hello World')).toBeDefined();
  });
});
