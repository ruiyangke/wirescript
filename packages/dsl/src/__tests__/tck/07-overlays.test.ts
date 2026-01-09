/**
 * TCK: Overlays
 *
 * Specification for WireScript overlay elements.
 * Defines modals, drawers, tooltips, and other overlay types.
 */

import { describe, expect, it } from 'vitest';
import { parse } from '../../schema/parser.js';

describe('TCK: Overlays', () => {
  // ===========================================================================
  // 7.1 Modal
  // ===========================================================================

  describe('7.1 Modal', () => {
    it('(modal :id "id" body) defines a modal', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (box)
            (modal :id "confirm"
              (text "Are you sure?"))))
      `);
      expect(result.success).toBe(true);
      expect(result.document?.screens[0].overlays).toHaveLength(1);
      expect(result.document?.screens[0].overlays[0].overlayType).toBe('modal');
      expect(result.document?.screens[0].overlays[0].id).toBe('confirm');
    });

    it('modal can be opened with :to #id', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (button "Open" :to #my-modal)
            (modal :id "my-modal"
              (text "Modal content"))))
      `);
      expect(result.success).toBe(true);
    });

    it('modal supports :open flag', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (box)
            (modal :id "welcome" :open
              (text "Welcome!"))))
      `);
      expect(result.document?.screens[0].overlays[0].props.open).toBe(true);
    });

    it('modal can contain complex content', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (box)
            (modal :id "form"
              (box :col :gap 16
                (text "Form" :high)
                (input "Name" :placeholder "Enter name")
                (box :row :gap 8
                  (button "Cancel" :ghost :to :close)
                  (button "Submit" :primary :to :submit))))))
      `);
      expect(result.success).toBe(true);
    });
  });

  // ===========================================================================
  // 7.2 Drawer
  // ===========================================================================

  describe('7.2 Drawer', () => {
    it('(drawer :id "id" body) defines a drawer', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (box)
            (drawer :id "sidebar"
              (nav :col
                (button "Home" :ghost)
                (button "Settings" :ghost)))))
      `);
      expect(result.document?.screens[0].overlays[0].overlayType).toBe('drawer');
    });

    it('drawer supports :left position', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (box)
            (drawer :id "nav" :left :width 300
              (nav))))
      `);
      const drawer = result.document?.screens[0].overlays[0];
      expect(drawer?.props.left).toBe(true);
      expect(drawer?.props.width).toBe(300);
    });

    it('drawer supports :right position', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (box)
            (drawer :id "panel" :right :width 400
              (box))))
      `);
      expect(result.document?.screens[0].overlays[0].props.right).toBe(true);
    });

    it('drawer supports :bottom position', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (box)
            (drawer :id "sheet" :bottom :height 200
              (box))))
      `);
      expect(result.document?.screens[0].overlays[0].props.bottom).toBe(true);
    });
  });

  // ===========================================================================
  // 7.3 Tooltip
  // ===========================================================================

  describe('7.3 Tooltip', () => {
    it('tooltip element with content', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (tooltip "Helpful tip"
              (button "Hover me"))))
      `);
      expect(result.document?.screens[0].root.elementType).toBe('tooltip');
      expect(result.document?.screens[0].root.content).toBe('Helpful tip');
    });
  });

  // ===========================================================================
  // 7.4 Toast
  // ===========================================================================

  describe('7.4 Toast', () => {
    it('toast element for notifications', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (toast "Operation successful" :success)))
      `);
      expect(result.document?.screens[0].root.elementType).toBe('toast');
      expect(result.document?.screens[0].root.props.success).toBe(true);
    });
  });

  // ===========================================================================
  // 7.5 Multiple Overlays
  // ===========================================================================

  describe('7.5 Multiple Overlays', () => {
    it('screen can have multiple overlays', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (box
              (button "Modal" :to #modal1)
              (button "Drawer" :to #drawer1))
            (modal :id "modal1" (text "Modal"))
            (drawer :id "drawer1" :right (box))))
      `);
      expect(result.document?.screens[0].overlays).toHaveLength(2);
    });

    it('overlays are separate from main content', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (box :col
              (text "Main content")
              (button "Open" :to #dialog))
            (modal :id "dialog"
              (text "Overlay content"))))
      `);
      const screen = result.document?.screens[0];
      expect(screen?.root.elementType).toBe('box');
      expect(screen?.overlays[0].overlayType).toBe('modal');
    });
  });

  // ===========================================================================
  // 7.6 Overlay Actions
  // ===========================================================================

  describe('7.6 Overlay Actions', () => {
    it(':to :close closes the overlay', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (box)
            (modal :id "dialog"
              (box :col
                (text "Content")
                (button "Close" :to :close)))))
      `);
      expect(result.success).toBe(true);
    });
  });
});
