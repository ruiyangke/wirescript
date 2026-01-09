import { render, screen } from '@testing-library/react';
import type { ElementNode } from '@wirescript/dsl';
import { describe, expect, it } from 'vitest';
import { Text } from './Text.js';

function makeElement(overrides: Partial<ElementNode> = {}): ElementNode {
  return {
    type: 'element',
    elementType: 'text',
    props: {},
    children: [],
    ...overrides,
  };
}

describe('Text', () => {
  it('should render text content', () => {
    const element = makeElement({ content: 'Hello World' });
    render(<Text element={element} />);
    expect(screen.getByText('Hello World')).toBeDefined();
  });

  it('should render as h2 for :high emphasis', () => {
    const element = makeElement({ content: 'Title', props: { high: true } });
    const { container } = render(<Text element={element} />);
    expect(container.querySelector('h2')).not.toBeNull();
    expect(container.querySelector('h2')?.textContent).toBe('Title');
  });

  it('should render as p for :medium emphasis (default)', () => {
    const element = makeElement({ content: 'Paragraph' });
    const { container } = render(<Text element={element} />);
    expect(container.querySelector('p')).not.toBeNull();
  });

  it('should render as p for :low emphasis', () => {
    const element = makeElement({ content: 'Small text', props: { low: true } });
    const { container } = render(<Text element={element} />);
    expect(container.querySelector('p')).not.toBeNull();
  });

  it('should apply variant classes', () => {
    const element = makeElement({ content: 'Error', props: { danger: true } });
    const { container } = render(<Text element={element} />);
    const p = container.querySelector('p');
    expect(p?.className).toContain('text-destructive');
  });

  it('should be clickable when :to is set', () => {
    const element = makeElement({
      content: 'Link',
      props: { to: 'other-screen' },
    });
    const { container } = render(<Text element={element} />);
    const p = container.querySelector('p');
    expect(p?.className).toContain('cursor-pointer');
  });
});
