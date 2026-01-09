import type { ElementNode } from '@wirescript/dsl';
import { describe, expect, it } from 'vitest';
import { getEmphasis, getLayoutStyles, getVariant, hasFlag } from './layout.js';

function makeElement(overrides: Partial<ElementNode> = {}): ElementNode {
  return {
    type: 'element',
    elementType: 'box',
    props: {},
    children: [],
    ...overrides,
  };
}

describe('getLayoutStyles', () => {
  describe('layout direction', () => {
    it('should set flex column for :col flag', () => {
      const element = makeElement({ props: { col: true } });
      const styles = getLayoutStyles(element);
      expect(styles.display).toBe('flex');
      expect(styles.flexDirection).toBe('column');
    });

    it('should set flex row for :row flag', () => {
      const element = makeElement({ props: { row: true } });
      const styles = getLayoutStyles(element);
      expect(styles.display).toBe('flex');
      expect(styles.flexDirection).toBe('row');
    });

    it('should set grid for :grid flag', () => {
      const element = makeElement({ props: { grid: true } });
      const styles = getLayoutStyles(element);
      expect(styles.display).toBe('grid');
    });

    it('should default to flex column for elements with children', () => {
      const element = makeElement({
        children: [makeElement({ elementType: 'text' })],
      });
      const styles = getLayoutStyles(element);
      expect(styles.display).toBe('flex');
      expect(styles.flexDirection).toBe('column');
    });
  });

  describe('alignment', () => {
    it('should center for :center flag', () => {
      const element = makeElement({ props: { center: true } });
      const styles = getLayoutStyles(element);
      expect(styles.justifyContent).toBe('center');
      expect(styles.alignItems).toBe('center');
    });

    it('should align start for :start flag', () => {
      const element = makeElement({ props: { start: true } });
      const styles = getLayoutStyles(element);
      expect(styles.alignItems).toBe('flex-start');
    });

    it('should align end for :end flag', () => {
      const element = makeElement({ props: { end: true } });
      const styles = getLayoutStyles(element);
      expect(styles.alignItems).toBe('flex-end');
      expect(styles.justifyContent).toBe('flex-end');
    });

    it('should space between for :between flag', () => {
      const element = makeElement({ props: { between: true } });
      const styles = getLayoutStyles(element);
      expect(styles.justifyContent).toBe('space-between');
    });

    it('should space around for :around flag', () => {
      const element = makeElement({ props: { around: true } });
      const styles = getLayoutStyles(element);
      expect(styles.justifyContent).toBe('space-around');
    });

    it('should stretch for :stretch flag', () => {
      const element = makeElement({ props: { stretch: true } });
      const styles = getLayoutStyles(element);
      expect(styles.alignItems).toBe('stretch');
    });
  });

  describe('wrap', () => {
    it('should enable wrap for :wrap flag', () => {
      const element = makeElement({ props: { wrap: true } });
      const styles = getLayoutStyles(element);
      expect(styles.flexWrap).toBe('wrap');
    });
  });

  describe('sizing', () => {
    it('should set full width/height for :full flag', () => {
      const element = makeElement({ props: { full: true } });
      const styles = getLayoutStyles(element);
      expect(styles.width).toBe('100%');
      expect(styles.height).toBe('100%');
      expect(styles.flex).toBe(1);
    });

    it('should set fit-content for :fit flag', () => {
      const element = makeElement({ props: { fit: true } });
      const styles = getLayoutStyles(element);
      expect(styles.width).toBe('fit-content');
    });

    it('should set flex: 1 for :fill flag', () => {
      const element = makeElement({ props: { fill: true } });
      const styles = getLayoutStyles(element);
      expect(styles.flex).toBe(1);
    });
  });

  describe('gap and padding', () => {
    it('should set gap from props', () => {
      const element = makeElement({ props: { gap: 16 } });
      const styles = getLayoutStyles(element);
      expect(styles.gap).toBe(16);
    });

    it('should set padding from props', () => {
      const element = makeElement({ props: { padding: 24 } });
      const styles = getLayoutStyles(element);
      expect(styles.padding).toBe(24);
    });
  });

  describe('grid columns and rows', () => {
    it('should set grid columns', () => {
      const element = makeElement({ props: { grid: true, cols: 3 } });
      const styles = getLayoutStyles(element);
      expect(styles.gridTemplateColumns).toBe('repeat(3, 1fr)');
    });

    it('should set grid rows', () => {
      const element = makeElement({ props: { grid: true, rows: 2 } });
      const styles = getLayoutStyles(element);
      expect(styles.gridTemplateRows).toBe('repeat(2, 1fr)');
    });
  });

  describe('explicit dimensions', () => {
    it('should set width as percentage by default', () => {
      const element = makeElement({ props: { width: 50 } });
      const styles = getLayoutStyles(element);
      expect(styles.width).toBe('50%');
    });

    it('should preserve width with % suffix', () => {
      const element = makeElement({ props: { width: '75%' } });
      const styles = getLayoutStyles(element);
      expect(styles.width).toBe('75%');
    });

    it('should preserve width with px suffix', () => {
      const element = makeElement({ props: { width: '200px' } });
      const styles = getLayoutStyles(element);
      expect(styles.width).toBe('200px');
    });

    it('should set height as pixels by default', () => {
      const element = makeElement({ props: { height: 100 } });
      const styles = getLayoutStyles(element);
      expect(styles.height).toBe('100px');
    });
  });

  describe('positioning', () => {
    it('should set sticky position', () => {
      const element = makeElement({ props: { sticky: true } });
      const styles = getLayoutStyles(element);
      expect(styles.position).toBe('sticky');
    });

    it('should set fixed position', () => {
      const element = makeElement({ props: { fixed: true } });
      const styles = getLayoutStyles(element);
      expect(styles.position).toBe('fixed');
    });

    it('should set absolute position', () => {
      const element = makeElement({ props: { absolute: true } });
      const styles = getLayoutStyles(element);
      expect(styles.position).toBe('absolute');
    });

    it('should set position values from props', () => {
      const element = makeElement({ props: { top: 0, left: 10, right: 20, bottom: 30 } });
      const styles = getLayoutStyles(element);
      expect(styles.top).toBe(0);
      expect(styles.left).toBe(10);
      expect(styles.right).toBe(20);
      expect(styles.bottom).toBe(30);
    });
  });
});

describe('getEmphasis', () => {
  it('should return high for :high flag', () => {
    expect(getEmphasis({ high: true })).toBe('high');
  });

  it('should return low for :low flag', () => {
    expect(getEmphasis({ low: true })).toBe('low');
  });

  it('should return medium by default', () => {
    expect(getEmphasis({})).toBe('medium');
    expect(getEmphasis({ primary: true })).toBe('medium');
  });
});

describe('getVariant', () => {
  it('should return primary variant', () => {
    expect(getVariant({ primary: true })).toBe('primary');
  });

  it('should return secondary variant', () => {
    expect(getVariant({ secondary: true })).toBe('secondary');
  });

  it('should return ghost variant', () => {
    expect(getVariant({ ghost: true })).toBe('ghost');
  });

  it('should return danger variant', () => {
    expect(getVariant({ danger: true })).toBe('danger');
  });

  it('should return success variant', () => {
    expect(getVariant({ success: true })).toBe('success');
  });

  it('should return warning variant', () => {
    expect(getVariant({ warning: true })).toBe('warning');
  });

  it('should return info variant', () => {
    expect(getVariant({ info: true })).toBe('info');
  });

  it('should return undefined for no variant', () => {
    expect(getVariant({})).toBeUndefined();
    expect(getVariant({ col: true, center: true })).toBeUndefined();
  });
});

describe('hasFlag', () => {
  it('should return true when flag is present', () => {
    expect(hasFlag({ disabled: true, primary: true }, 'disabled')).toBe(true);
  });

  it('should return false when flag is not present', () => {
    expect(hasFlag({ primary: true }, 'disabled')).toBe(false);
  });
});
