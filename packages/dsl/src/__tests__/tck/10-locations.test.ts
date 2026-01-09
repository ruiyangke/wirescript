/**
 * TCK: Source Locations
 *
 * Specification for WireScript source location tracking.
 * Defines how AST nodes track their source positions.
 */

import { describe, expect, it } from 'vitest';
import { parse } from '../../schema/parser.js';

describe('TCK: Source Locations', () => {
  // ===========================================================================
  // 10.1 Element Locations
  // ===========================================================================

  describe('10.1 Element Locations', () => {
    it('elements have loc property', () => {
      const result = parse(`(wire (screen home "Home" (box)))`);
      expect(result.document?.screens[0].root.loc).toBeDefined();
    });

    it('loc includes start line', () => {
      const result = parse(`(wire
  (screen home "Home"
    (box :col)))`);
      const box = result.document?.screens[0].root;
      expect(box?.loc?.line).toBe(3);
    });

    it('loc includes start column', () => {
      const result = parse(`(wire (screen home "Home" (box :col)))`);
      const box = result.document?.screens[0].root;
      expect(box?.loc?.column).toBe(27);
    });

    it('loc includes end line', () => {
      const result = parse(`(wire (screen home "Home" (box :col :gap 16)))`);
      const box = result.document?.screens[0].root;
      expect(box?.loc?.endLine).toBe(1);
    });

    it('loc includes end column', () => {
      const result = parse(`(wire (screen home "Home" (box :col :gap 16)))`);
      const box = result.document?.screens[0].root;
      expect(box?.loc?.endColumn).toBe(45);
    });
  });

  // ===========================================================================
  // 10.2 Multiline Elements
  // ===========================================================================

  describe('10.2 Multiline Elements', () => {
    it('multiline elements span start to end line', () => {
      const result = parse(`(wire
  (screen home "Home"
    (box :col
      (text "Hello")
      (text "World"))))`);
      const box = result.document?.screens[0].root;
      expect(box?.loc?.line).toBe(3);
      expect(box?.loc?.endLine).toBe(5);
    });

    it('nested elements have their own locations', () => {
      const result = parse(`(wire
  (screen home "Home"
    (box
      (text "Child"))))`);
      const box = result.document?.screens[0].root;
      const text = box?.children[0];
      expect(text?.type === 'element' && text.loc?.line).toBe(4);
    });
  });

  // ===========================================================================
  // 10.3 Screen Locations
  // ===========================================================================

  describe('10.3 Screen Locations', () => {
    it('screens have source locations', () => {
      const result = parse(`(wire
  (screen home "Home"
    (box)))`);
      expect(result.document?.screens[0].loc).toBeDefined();
      expect(result.document?.screens[0].loc?.line).toBe(2);
    });
  });

  // ===========================================================================
  // 10.4 Component Locations
  // ===========================================================================

  describe('10.4 Component Locations', () => {
    it('component definitions have locations', () => {
      const result = parse(`(wire
  (define my-card (title)
    (card (text $title)))
  (screen home "Home" (box)))`);
      expect(result.document?.components[0].loc).toBeDefined();
      expect(result.document?.components[0].loc?.line).toBe(2);
    });

    it('component body has location', () => {
      const result = parse(`(wire
  (define my-card (title)
    (card (text $title)))
  (screen home "Home" (box)))`);
      expect(result.document?.components[0].body.loc?.line).toBe(3);
    });
  });

  // ===========================================================================
  // 10.5 Layout Locations
  // ===========================================================================

  describe('10.5 Layout Locations', () => {
    it('layout definitions have locations', () => {
      const result = parse(`(wire
  (layout main
    (box (slot)))
  (screen home "Home" (box)))`);
      expect(result.document?.layouts[0].loc).toBeDefined();
      expect(result.document?.layouts[0].loc?.line).toBe(2);
    });
  });

  // ===========================================================================
  // 10.6 Overlay Locations
  // ===========================================================================

  describe('10.6 Overlay Locations', () => {
    it('overlays have locations', () => {
      const result = parse(`(wire
  (screen home "Home"
    (box)
    (modal :id "dialog"
      (text "Content"))))`);
      expect(result.document?.screens[0].overlays[0].loc).toBeDefined();
      expect(result.document?.screens[0].overlays[0].loc?.line).toBe(4);
    });
  });

  // ===========================================================================
  // 10.7 Location Accuracy
  // ===========================================================================

  describe('10.7 Location Accuracy', () => {
    it('location points to opening paren', () => {
      const result = parse(`(wire (screen home "Home" (text "Hello")))`);
      const text = result.document?.screens[0].root;
      // Should point to the ( of (text
      expect(text?.loc?.column).toBe(27);
    });

    it('end location points past closing paren', () => {
      const result = parse(`(wire (screen home "Home" (text "Hello")))`);
      const text = result.document?.screens[0].root;
      // Should point past the ) of (text "Hello")
      expect(text?.loc?.endColumn).toBe(41);
    });

    it('whitespace before element does not affect location', () => {
      const result = parse(`(wire (screen home "Home"     (box)))`);
      const box = result.document?.screens[0].root;
      expect(box?.loc?.column).toBe(31);
    });
  });
});
