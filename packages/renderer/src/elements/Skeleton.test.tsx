import { render } from '@testing-library/react';
import type { ElementNode } from '@wirescript/dsl';
import { describe, expect, it } from 'vitest';
import { Skeleton } from './Skeleton.js';

function makeElement(overrides: Partial<ElementNode> = {}): ElementNode {
  return {
    type: 'element',
    elementType: 'skeleton',
    props: {},
    children: [],
    ...overrides,
  };
}

describe('Skeleton', () => {
  describe('default behavior', () => {
    it('should render with text variant by default (no dimensions)', () => {
      const element = makeElement();
      const { container } = render(<Skeleton element={element} />);
      const skeleton = container.firstChild as HTMLElement;

      // Default text variant: 100% width, 1rem height
      expect(skeleton.style.width).toBe('100%');
      expect(skeleton.style.height).toBe('1rem');
    });

    it('should have animate-pulse class from shadcn', () => {
      const element = makeElement();
      const { container } = render(<Skeleton element={element} />);
      const skeleton = container.firstChild as HTMLElement;

      expect(skeleton.className).toContain('animate-pulse');
    });
  });

  describe('dimensions', () => {
    it('should handle string dimensions with units', () => {
      const element = makeElement({
        props: { width: '200px', height: '20px' },
      });
      const { container } = render(<Skeleton element={element} />);
      const skeleton = container.firstChild as HTMLElement;

      expect(skeleton.style.width).toBe('200px');
      expect(skeleton.style.height).toBe('20px');
    });

    it('should handle percentage dimensions', () => {
      const element = makeElement({
        props: { width: '50%', height: '100%' },
      });
      const { container } = render(<Skeleton element={element} />);
      const skeleton = container.firstChild as HTMLElement;

      expect(skeleton.style.width).toBe('50%');
      expect(skeleton.style.height).toBe('100%');
    });

    it('should convert numeric dimensions to pixels', () => {
      const element = makeElement({
        props: { width: 200, height: 20 },
      });
      const { container } = render(<Skeleton element={element} />);
      const skeleton = container.firstChild as HTMLElement;

      expect(skeleton.style.width).toBe('200px');
      expect(skeleton.style.height).toBe('20px');
    });

    it('should handle string numbers by adding px', () => {
      const element = makeElement({
        props: { width: '200', height: '20' },
      });
      const { container } = render(<Skeleton element={element} />);
      const skeleton = container.firstChild as HTMLElement;

      expect(skeleton.style.width).toBe('200px');
      expect(skeleton.style.height).toBe('20px');
    });
  });

  describe(':circle variant', () => {
    it('should apply rounded-full class', () => {
      const element = makeElement({
        props: { circle: true },
      });
      const { container } = render(<Skeleton element={element} />);
      const skeleton = container.firstChild as HTMLElement;

      expect(skeleton.className).toContain('rounded-full');
    });

    it('should use default 40px size when no dimensions', () => {
      const element = makeElement({
        props: { circle: true },
      });
      const { container } = render(<Skeleton element={element} />);
      const skeleton = container.firstChild as HTMLElement;

      expect(skeleton.style.width).toBe('40px');
      expect(skeleton.style.height).toBe('40px');
    });

    it('should allow custom circle dimensions', () => {
      const element = makeElement({
        props: { circle: true, width: '60px', height: '60px' },
      });
      const { container } = render(<Skeleton element={element} />);
      const skeleton = container.firstChild as HTMLElement;

      expect(skeleton.style.width).toBe('60px');
      expect(skeleton.style.height).toBe('60px');
    });
  });

  describe(':text variant', () => {
    it('should use full width when :text flag is set', () => {
      const element = makeElement({
        props: { text: true },
      });
      const { container } = render(<Skeleton element={element} />);
      const skeleton = container.firstChild as HTMLElement;

      expect(skeleton.style.width).toBe('100%');
      expect(skeleton.style.height).toBe('1rem');
    });

    it('should allow custom width with :text flag', () => {
      const element = makeElement({
        props: { text: true, width: '60%' },
      });
      const { container } = render(<Skeleton element={element} />);
      const skeleton = container.firstChild as HTMLElement;

      expect(skeleton.style.width).toBe('60%');
      expect(skeleton.style.height).toBe('1rem');
    });
  });

  describe('container mode (with children)', () => {
    it('should render children when present', () => {
      const element = makeElement({
        props: { col: true, gap: 8 },
        children: [
          {
            type: 'element',
            elementType: 'skeleton',
            props: { height: '20px' },
            children: [],
          },
          {
            type: 'element',
            elementType: 'skeleton',
            props: { height: '16px' },
            children: [],
          },
        ],
      });
      const { container } = render(<Skeleton element={element} />);

      // Should render as a container div, not a skeleton
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.tagName).toBe('DIV');
      expect(wrapper.children.length).toBe(2);
    });

    it('should apply layout styles from container props', () => {
      const element = makeElement({
        props: { col: true, gap: 16, padding: 24 },
        children: [
          {
            type: 'element',
            elementType: 'skeleton',
            props: {},
            children: [],
          },
        ],
      });
      const { container } = render(<Skeleton element={element} />);
      const wrapper = container.firstChild as HTMLElement;

      expect(wrapper.style.display).toBe('flex');
      expect(wrapper.style.flexDirection).toBe('column');
      expect(wrapper.style.gap).toBe('16px');
      expect(wrapper.style.padding).toBe('24px');
    });

    it('should apply row layout', () => {
      const element = makeElement({
        props: { row: true, gap: 8 },
        children: [
          {
            type: 'element',
            elementType: 'skeleton',
            props: { width: '40px', height: '40px' },
            children: [],
          },
          {
            type: 'element',
            elementType: 'skeleton',
            props: { width: '40px', height: '40px' },
            children: [],
          },
        ],
      });
      const { container } = render(<Skeleton element={element} />);
      const wrapper = container.firstChild as HTMLElement;

      expect(wrapper.style.display).toBe('flex');
      expect(wrapper.style.flexDirection).toBe('row');
      expect(wrapper.style.gap).toBe('8px');
    });
  });

  describe('edge cases', () => {
    it('should handle only width specified', () => {
      const element = makeElement({
        props: { width: '200px' },
      });
      const { container } = render(<Skeleton element={element} />);
      const skeleton = container.firstChild as HTMLElement;

      expect(skeleton.style.width).toBe('200px');
      // Should have minHeight for visibility
      expect(skeleton.style.minHeight).toBe('1rem');
    });

    it('should handle only height specified', () => {
      const element = makeElement({
        props: { height: '100px' },
      });
      const { container } = render(<Skeleton element={element} />);
      const skeleton = container.firstChild as HTMLElement;

      expect(skeleton.style.height).toBe('100px');
      // Should have minWidth for visibility
      expect(skeleton.style.minWidth).toBe('1rem');
    });

    it('should handle em/rem units', () => {
      const element = makeElement({
        props: { width: '10em', height: '2rem' },
      });
      const { container } = render(<Skeleton element={element} />);
      const skeleton = container.firstChild as HTMLElement;

      expect(skeleton.style.width).toBe('10em');
      expect(skeleton.style.height).toBe('2rem');
    });
  });
});
