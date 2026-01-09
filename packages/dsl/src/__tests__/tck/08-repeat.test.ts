/**
 * TCK: Repeat
 *
 * Specification for WireScript repeat element.
 * Defines iteration patterns for generating multiple elements.
 */

import { describe, expect, it } from 'vitest';
import { parse } from '../../schema/parser.js';

describe('TCK: Repeat', () => {
  // ===========================================================================
  // 8.1 Basic Repeat
  // ===========================================================================

  describe('8.1 Basic Repeat', () => {
    it('(repeat :count N body) repeats N times', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (box :col
              (repeat :count 3
                (card (text "Item"))))))
      `);
      expect(result.success).toBe(true);
      const box = result.document?.screens[0].root;
      expect(box?.children[0].type).toBe('repeat');
      if (box?.children[0].type === 'repeat') {
        expect(box.children[0].count).toBe(3);
      }
    });

    it('repeat body is a single element', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (box :col
              (repeat :count 5
                (text "Line")))))
      `);
      const box = result.document?.screens[0].root;
      if (box?.children[0].type === 'repeat') {
        expect(box.children[0].body.elementType).toBe('text');
      }
    });

    it(':count 0 produces no elements', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (box :col
              (repeat :count 0
                (text "Never")))))
      `);
      expect(result.success).toBe(true);
    });
  });

  // ===========================================================================
  // 8.2 Repeat Variable
  // ===========================================================================

  describe('8.2 Repeat Variable', () => {
    it(':as "var" names the iteration variable', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (box :col
              (repeat :count 3 :as "i"
                (text "Item")))))
      `);
      const box = result.document?.screens[0].root;
      if (box?.children[0].type === 'repeat') {
        expect(box.children[0].as).toBe('i');
      }
    });

    it('variable can be used in content with ${var}', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (box :col
              (repeat :count 3 :as "n"
                (text "Item \${n}")))))
      `);
      expect(result.success).toBe(true);
    });
  });

  // ===========================================================================
  // 8.3 Param Ref Count
  // ===========================================================================

  describe('8.3 Param Ref Count', () => {
    it(':count $param allows dynamic count', () => {
      const result = parse(`
        (wire
          (define item-list (count)
            (box :col
              (repeat :count $count
                (text "Item"))))
          (screen home "Home"
            (item-list :count 5)))
      `);
      expect(result.success).toBe(true);
      const component = result.document?.components[0];
      const box = component?.body;
      if (box?.children[0].type === 'repeat') {
        expect(box.children[0].count).toEqual({ type: 'param', name: 'count' });
      }
    });
  });

  // ===========================================================================
  // 8.4 Nested Repeat
  // ===========================================================================

  describe('8.4 Nested Repeat', () => {
    it('repeats can be nested', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (box :col
              (repeat :count 3 :as "row"
                (box :row
                  (repeat :count 4 :as "col"
                    (text "Cell")))))))
      `);
      expect(result.success).toBe(true);
      const box = result.document?.screens[0].root;
      const outerRepeat = box?.children[0];
      expect(outerRepeat?.type).toBe('repeat');
      if (outerRepeat?.type === 'repeat') {
        const innerBox = outerRepeat.body;
        const innerRepeat = innerBox.children[0];
        expect(innerRepeat?.type).toBe('repeat');
      }
    });

    it('nested repeats have independent variables', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (box :col
              (repeat :count 2 :as "i"
                (box :row
                  (repeat :count 2 :as "j"
                    (text "(\${i},\${j})")))))))
      `);
      expect(result.success).toBe(true);
    });
  });

  // ===========================================================================
  // 8.5 Repeat as Root
  // ===========================================================================

  describe('8.5 Repeat as Root', () => {
    it('repeat as screen root wraps in repeat-container', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (repeat :count 3
              (card (text "Item")))))
      `);
      expect(result.success).toBe(true);
      const root = result.document?.screens[0].root;
      expect(root?.elementType).toBe('repeat-container');
      expect(root?.children[0].type).toBe('repeat');
    });
  });

  // ===========================================================================
  // 8.6 Complex Repeat Body
  // ===========================================================================

  describe('8.6 Complex Repeat Body', () => {
    it('repeat body can have nested elements', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (box :col
              (repeat :count 3 :as "i"
                (card :padding 16
                  (box :row :between
                    (text "Item \${i}" :high)
                    (badge "New"))
                  (text "Description" :low))))))
      `);
      expect(result.success).toBe(true);
    });

    it('repeat body can call components', () => {
      const result = parse(`
        (wire
          (define item-card (title)
            (card (text $title)))
          (screen home "Home"
            (box :col
              (repeat :count 3 :as "n"
                (item-card :title "Item \${n}")))))
      `);
      expect(result.success).toBe(true);
    });
  });
});
