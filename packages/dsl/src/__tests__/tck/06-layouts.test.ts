/**
 * TCK: Layouts
 *
 * Specification for WireScript layout definitions.
 * Defines reusable page layouts with slot placeholders.
 */

import { describe, expect, it } from 'vitest';
import { parse } from '../../schema/parser.js';

describe('TCK: Layouts', () => {
  // ===========================================================================
  // 6.1 Layout Definition
  // ===========================================================================

  describe('6.1 Layout Definition', () => {
    it('(layout name body) defines a layout', () => {
      const result = parse(`
        (wire
          (layout main
            (box :col (slot)))
          (screen home "Home" :layout main (box)))
      `);
      expect(result.success).toBe(true);
      expect(result.document?.layouts).toHaveLength(1);
      expect(result.document?.layouts[0].name).toBe('main');
    });

    it('layout body is an element tree', () => {
      const result = parse(`
        (wire
          (layout sidebar
            (box :row
              (nav :col :width 200
                (button "Home" :ghost))
              (slot)))
          (screen home "Home" :layout sidebar (box)))
      `);
      const layout = result.document?.layouts[0];
      expect(layout?.body.elementType).toBe('box');
      expect(layout?.body.props.row).toBe(true);
    });
  });

  // ===========================================================================
  // 6.2 Slot Placeholder
  // ===========================================================================

  describe('6.2 Slot Placeholder', () => {
    it('(slot) marks where screen content is injected', () => {
      const result = parse(`
        (wire
          (layout main
            (box :col
              (header (text "Header"))
              (slot)
              (footer (text "Footer"))))
          (screen home "Home" :layout main
            (text "Page Content")))
      `);
      expect(result.success).toBe(true);
      const layout = result.document?.layouts[0];
      expect(layout?.body.children[1].type === 'element' &&
             layout.body.children[1].elementType).toBe('slot');
    });

    it('slot can be nested in containers', () => {
      const result = parse(`
        (wire
          (layout main
            (box :row
              (nav (text "Nav"))
              (box :col :grow
                (slot))))
          (screen home "Home" :layout main (box)))
      `);
      expect(result.success).toBe(true);
    });
  });

  // ===========================================================================
  // 6.3 Screen Layout Reference
  // ===========================================================================

  describe('6.3 Screen Layout Reference', () => {
    it(':layout name assigns layout to screen', () => {
      const result = parse(`
        (wire
          (layout dashboard-layout
            (box (slot)))
          (screen home "Home" :layout dashboard-layout
            (box)))
      `);
      expect(result.document?.screens[0].layout).toBe('dashboard-layout');
    });

    it('screen without :layout has no layout', () => {
      const result = parse(`
        (wire
          (layout main (box (slot)))
          (screen home "Home" (box)))
      `);
      expect(result.document?.screens[0].layout).toBeUndefined();
    });

    it('multiple screens can share a layout', () => {
      const result = parse(`
        (wire
          (layout main (box (slot)))
          (screen home "Home" :layout main (box))
          (screen about "About" :layout main (box))
          (screen contact "Contact" :layout main (box)))
      `);
      expect(result.document?.screens[0].layout).toBe('main');
      expect(result.document?.screens[1].layout).toBe('main');
      expect(result.document?.screens[2].layout).toBe('main');
    });

    it('different screens can use different layouts', () => {
      const result = parse(`
        (wire
          (layout sidebar (box :row (nav) (slot)))
          (layout centered (box :center (slot)))
          (screen home "Home" :layout sidebar (box))
          (screen login "Login" :layout centered (box)))
      `);
      expect(result.document?.screens[0].layout).toBe('sidebar');
      expect(result.document?.screens[1].layout).toBe('centered');
    });
  });

  // ===========================================================================
  // 6.4 Multiple Layouts
  // ===========================================================================

  describe('6.4 Multiple Layouts', () => {
    it('document can define multiple layouts', () => {
      const result = parse(`
        (wire
          (layout main (box (slot)))
          (layout sidebar (box :row (nav) (slot)))
          (layout fullscreen (slot))
          (screen home "Home" (box)))
      `);
      expect(result.document?.layouts).toHaveLength(3);
    });
  });

  // ===========================================================================
  // 6.5 Layout with Navigation
  // ===========================================================================

  describe('6.5 Layout with Navigation', () => {
    it('layout can contain navigation elements', () => {
      const result = parse(`
        (wire
          (layout app
            (box :col :full
              (header
                (nav :row
                  (button "Home" :ghost :to home)
                  (button "About" :ghost :to about)))
              (box :grow (slot))
              (footer (text "© 2024"))))
          (screen home "Home" :layout app (box))
          (screen about "About" :layout app (box)))
      `);
      expect(result.success).toBe(true);
    });
  });
});
