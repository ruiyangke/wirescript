/**
 * TCK: Navigation
 *
 * Specification for WireScript navigation targets.
 * Defines screen, overlay, URL, and action navigation.
 */

import { describe, expect, it } from 'vitest';
import { parse } from '../../schema/parser.js';
import type { NavigationTarget } from '../../schema/types.js';

describe('TCK: Navigation', () => {
  // ===========================================================================
  // 4.1 Screen Navigation
  // ===========================================================================

  describe('4.1 Screen Navigation', () => {
    it(':to screen-id navigates to screen', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (button "Go" :to dashboard))
          (screen dashboard "Dashboard" (box)))
      `);
      const button = result.document?.screens[0].root;
      const to = button?.props.to as NavigationTarget;
      expect(to.type).toBe('screen');
      expect(to.type === 'screen' && to.id).toBe('dashboard');
    });

    it(':to "screen-id" string also works', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (button "Go" :to "dashboard")))
      `);
      const button = result.document?.screens[0].root;
      const to = button?.props.to as NavigationTarget;
      expect(to.type).toBe('screen');
      expect(to.type === 'screen' && to.id).toBe('dashboard');
    });
  });

  // ===========================================================================
  // 4.2 Overlay Navigation
  // ===========================================================================

  describe('4.2 Overlay Navigation', () => {
    it(':to #overlay-id opens overlay', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (button "Open" :to #my-modal)
            (modal :id "my-modal" (text "Content"))))
      `);
      const button = result.document?.screens[0].root;
      const to = button?.props.to as NavigationTarget;
      expect(to.type).toBe('overlay');
      expect(to.type === 'overlay' && to.id).toBe('my-modal');
    });

    it('overlay reference works with drawer', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (button "Menu" :to #sidebar)
            (drawer :id "sidebar" (nav))))
      `);
      const button = result.document?.screens[0].root;
      const to = button?.props.to as NavigationTarget;
      expect(to.type).toBe('overlay');
    });
  });

  // ===========================================================================
  // 4.3 URL Navigation
  // ===========================================================================

  describe('4.3 URL Navigation', () => {
    it(':to "http://..." navigates to URL', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (button "Visit" :to "http://example.com")))
      `);
      const button = result.document?.screens[0].root;
      const to = button?.props.to as NavigationTarget;
      expect(to.type).toBe('url');
      expect(to.type === 'url' && to.url).toBe('http://example.com');
    });

    it(':to "https://..." navigates to secure URL', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (button "Visit" :to "https://example.com/path?q=1")))
      `);
      const button = result.document?.screens[0].root;
      const to = button?.props.to as NavigationTarget;
      expect(to.type).toBe('url');
      expect(to.type === 'url' && to.url).toBe('https://example.com/path?q=1');
    });

    it(':to "//..." protocol-relative URL', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (button "CDN" :to "//cdn.example.com/file.js")))
      `);
      const button = result.document?.screens[0].root;
      const to = button?.props.to as NavigationTarget;
      expect(to.type).toBe('url');
    });

    it(':to "mailto:..." email link', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (button "Email" :to "mailto:test@example.com")))
      `);
      const button = result.document?.screens[0].root;
      const to = button?.props.to as NavigationTarget;
      expect(to.type).toBe('url');
      expect(to.type === 'url' && to.url).toBe('mailto:test@example.com');
    });

    it(':to "tel:..." phone link', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (button "Call" :to "tel:+1234567890")))
      `);
      const button = result.document?.screens[0].root;
      const to = button?.props.to as NavigationTarget;
      expect(to.type).toBe('url');
      expect(to.type === 'url' && to.url).toBe('tel:+1234567890');
    });

    it(':to "ftp://..." FTP link', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (button "Download" :to "ftp://files.example.com/file.zip")))
      `);
      const button = result.document?.screens[0].root;
      const to = button?.props.to as NavigationTarget;
      expect(to.type).toBe('url');
    });

    it(':to "data:..." data URL', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (button "Data" :to "data:text/plain;base64,SGVsbG8=")))
      `);
      const button = result.document?.screens[0].root;
      const to = button?.props.to as NavigationTarget;
      expect(to.type).toBe('url');
    });
  });

  // ===========================================================================
  // 4.4 Action Navigation
  // ===========================================================================

  describe('4.4 Action Navigation', () => {
    it(':to :close closes current overlay', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (box)
            (modal :id "dialog"
              (box :col
                (text "Content")
                (button "Close" :to :close)))))
      `);
      const modal = result.document?.screens[0].overlays[0];
      // Overlay has children, not body
      const box = modal?.children[0];
      const button = box?.type === 'element' ? box.children[1] : undefined;
      const to = (button?.type === 'element' ? button.props.to : undefined) as NavigationTarget;
      expect(to?.type).toBe('action');
      expect(to?.type === 'action' && to.action).toBe('close');
    });

    it(':to :back goes back in history', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (button "Back" :to :back)))
      `);
      const button = result.document?.screens[0].root;
      const to = button?.props.to as NavigationTarget;
      expect(to.type).toBe('action');
      expect(to.type === 'action' && to.action).toBe('back');
    });

    it(':to :submit submits form', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (button "Submit" :to :submit)))
      `);
      const button = result.document?.screens[0].root;
      const to = button?.props.to as NavigationTarget;
      expect(to.type).toBe('action');
      expect(to.type === 'action' && to.action).toBe('submit');
    });

    it('unknown keyword is treated as symbol', () => {
      // :none is not a recognized action, so it becomes a string
      const result = parse(`
        (wire
          (screen home "Home"
            (button "Disabled" :to :unknown)))
      `);
      const button = result.document?.screens[0].root;
      // Unknown keywords become string values, not action refs
      expect(button?.props.to).toBe('unknown');
    });
  });

  // ===========================================================================
  // 4.5 Param Ref Navigation
  // ===========================================================================

  describe('4.5 Param Ref Navigation', () => {
    it(':to $param defers to runtime', () => {
      const result = parse(`
        (wire
          (define nav-button (target)
            (button "Go" :to $target))
          (screen home "Home"
            (nav-button :target dashboard)))
      `);
      const component = result.document?.components[0];
      const to = component?.body.props.to as NavigationTarget;
      expect(to.type).toBe('param');
      expect(to.type === 'param' && to.name).toBe('target');
    });
  });
});
