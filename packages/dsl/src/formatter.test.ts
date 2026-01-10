import { describe, expect, it } from 'vitest';
import { format } from './formatter.js';

describe('Formatter', () => {
  describe('basic formatting', () => {
    it('should format a simple document', () => {
      const input = '(wire (screen home "Home" (text "Hello")))';
      const result = format(input);
      expect(result).toContain('(wire');
      expect(result).toContain('(screen home "Home"');
      expect(result).toContain('(text "Hello")');
    });

    it('should preserve strings with parens', () => {
      const input = '(wire (screen a "A" (text "Hello (world)")))';
      const result = format(input);
      expect(result).toContain('"Hello (world)"');
    });
  });

  describe('auto-balance', () => {
    it('should close missing parens at EOF', () => {
      const input = '(wire (screen a "A" (text "hi"';
      const result = format(input);
      // Should have all closing parens
      expect(result).toContain('(text "hi")');
      expect(result.match(/\)/g)?.length).toBe(3); // text, screen, wire
    });

    it('should close elements when new screen starts', () => {
      const input = '(wire (screen a "A" (box (screen b "B" (text "x"';
      const result = format(input);
      // box should be closed before screen b
      expect(result).toContain('(box)');
      expect(result).toContain('(screen b "B"');
    });

    it('should close leaf elements before children', () => {
      const input = '(wire (screen a "A" (text "hi" (box (text "nested"';
      const result = format(input);
      // text is a leaf, should be closed before box
      expect(result).toContain('(text "hi")');
    });

    it('should handle overlay elements correctly', () => {
      const input = '(wire (screen a "A" (modal :id "m" (text "modal content"';
      const result = format(input);
      // All should be closed
      expect(result.match(/\)/g)?.length).toBe(4); // text, modal, screen, wire
    });

    it('should close screen before new define', () => {
      const input = '(wire (screen a "A" (box (define comp () (text "x"';
      const result = format(input);
      // screen should be closed before define
      expect(result).toContain('(box))');
    });

    it('should ignore extra closing parens', () => {
      const input = '(wire (screen a "A" (text "hi"))))';
      // Should not throw
      const result = format(input);
      expect(result).toBeDefined();
    });

    it('should handle already balanced input', () => {
      const input = '(wire (screen a "A" (text "hi")))';
      const result = format(input);
      // Should still format correctly
      expect(result).toContain('(text "hi")');
    });

    it('should handle empty input', () => {
      const result = format('');
      expect(result).toBe('\n');
    });

    it('should preserve comments', () => {
      const input = `(wire
        ; This is a comment
        (screen a "A" (text "hi")))`;
      const result = format(input);
      expect(result).toContain('; This is a comment');
    });

    it('should handle user-defined components as containers', () => {
      const input = '(wire (define mycomp () (box (text "x"))) (screen a "A" (mycomp (text "nested"';
      const result = format(input);
      // User component should be treated as container
      expect(result).toContain('(mycomp');
    });

    // =========================================================================
    // Multiple screens
    // =========================================================================

    it('should handle multiple screens in sequence', () => {
      const input = '(wire (screen a "A" (text "1" (screen b "B" (text "2" (screen c "C" (text "3"';
      const result = format(input);
      // Each screen should force-close previous
      expect(result).toContain('(screen a "A"');
      expect(result).toContain('(screen b "B"');
      expect(result).toContain('(screen c "C"');
    });

    it('should close deeply nested containers before new screen', () => {
      const input = '(wire (screen a "A" (box (card (section "S" (group (screen b "B"';
      const result = format(input);
      // All nested containers should be closed
      expect(result).toContain('(group))))');
      expect(result).toContain('(screen b "B"');
    });

    // =========================================================================
    // Overlay types
    // =========================================================================

    it('should close to screen when drawer starts', () => {
      const input = '(wire (screen a "A" (box (drawer :id "d" (text "drawer"';
      const result = format(input);
      expect(result).toContain('(box)');
      expect(result).toContain('(drawer :id "d"');
    });

    it('should close to screen when popover starts', () => {
      const input = '(wire (screen a "A" (card (popover :id "p" (text "pop"';
      const result = format(input);
      expect(result).toContain('(card)');
      expect(result).toContain('(popover :id "p"');
    });

    it('should handle multiple overlays in same screen', () => {
      const input = '(wire (screen a "A" (modal :id "m1" (text "1" (modal :id "m2" (text "2"';
      const result = format(input);
      // Second modal should close first modal back to screen
      expect(result).toContain('(modal :id "m1"');
      expect(result).toContain('(modal :id "m2"');
    });

    it('should close overlay when new screen starts', () => {
      const input = '(wire (screen a "A" (modal :id "m" (box (screen b "B"';
      const result = format(input);
      // modal and its contents should close before screen b
      expect(result).toContain('(box)))');
      expect(result).toContain('(screen b "B"');
    });

    // =========================================================================
    // Define and Layout
    // =========================================================================

    it('should close screen before layout', () => {
      const input = '(wire (screen a "A" (box (layout main (slot';
      const result = format(input);
      expect(result).toContain('(box))');
      expect(result).toContain('(layout main');
    });

    it('should handle multiple defines', () => {
      const input = '(wire (define a () (text "a" (define b () (text "b" (define c () (text "c"';
      const result = format(input);
      // Each define should force-close previous
      expect(result).toContain('(define a');
      expect(result).toContain('(define b');
      expect(result).toContain('(define c');
    });

    it('should close define before screen', () => {
      const input = '(wire (define comp () (box (text "x" (screen a "A"';
      const result = format(input);
      // define's box and text should be closed before screen
      expect(result).toContain('(screen a "A"');
      // Verify screen is at top level (sibling to define, not inside it)
      expect(result).toMatch(/\(define comp[\s\S]*?\)\s*\(screen a "A"/);
    });

    // =========================================================================
    // Leaf elements
    // =========================================================================

    it('should close multiple leaf elements in sequence', () => {
      const input = '(wire (screen a "A" (box (text "1" (text "2" (text "3"';
      const result = format(input);
      // Each text should be closed before the next
      const textMatches = result.match(/\(text "[^"]+"\)/g);
      expect(textMatches?.length).toBe(3);
    });

    it('should close icon before next element', () => {
      const input = '(wire (screen a "A" (box (icon "star" (text "label"';
      const result = format(input);
      expect(result).toContain('(icon "star")');
      expect(result).toContain('(text "label")');
    });

    it('should close input before next element', () => {
      const input = '(wire (screen a "A" (form (input "Name" (input "Email" (button "Submit"';
      const result = format(input);
      expect(result).toContain('(input "Name")');
      expect(result).toContain('(input "Email")');
    });

    it('should close badge before next element', () => {
      const input = '(wire (screen a "A" (box (badge "New" (text "Item"';
      const result = format(input);
      expect(result).toContain('(badge "New")');
      expect(result).toContain('(text "Item")');
    });

    it('should close avatar before next element', () => {
      const input = '(wire (screen a "A" (box (avatar "John" (text "Profile"';
      const result = format(input);
      expect(result).toContain('(avatar "John")');
      expect(result).toContain('(text "Profile")');
    });

    it('should close image before next element', () => {
      const input = '(wire (screen a "A" (box (image "photo.jpg" (text "Caption"';
      const result = format(input);
      expect(result).toContain('(image "photo.jpg")');
      expect(result).toContain('(text "Caption")');
    });

    it('should close divider before next element', () => {
      const input = '(wire (screen a "A" (box (text "Above" (divider (text "Below"';
      const result = format(input);
      expect(result).toContain('(divider)');
    });

    it('should close progress before next element', () => {
      const input = '(wire (screen a "A" (box (progress "50%" (text "Loading"';
      const result = format(input);
      expect(result).toContain('(progress "50%")');
    });

    it('should close datepicker before next element', () => {
      const input = '(wire (screen a "A" (form (datepicker "Date" (button "Submit"';
      const result = format(input);
      expect(result).toContain('(datepicker "Date")');
    });

    it('should close slot before next element', () => {
      const input = '(wire (layout main (box (slot (text "after"';
      const result = format(input);
      expect(result).toContain('(slot)');
    });

    it('should close crumb before next crumb', () => {
      const input = '(wire (screen a "A" (breadcrumb (crumb "Home" (crumb "Products" (crumb "Item"';
      const result = format(input);
      expect(result).toContain('(crumb "Home")');
      expect(result).toContain('(crumb "Products")');
      expect(result).toContain('(crumb "Item")');
    });

    // =========================================================================
    // Container elements
    // =========================================================================

    it('should handle nested cards', () => {
      const input = '(wire (screen a "A" (card (card (card (text "deep"';
      const result = format(input);
      expect(result.match(/\)/g)?.length).toBe(6); // text + 3 cards + screen + wire
    });

    it('should handle section with title', () => {
      const input = '(wire (screen a "A" (section "Title" (text "content"';
      const result = format(input);
      expect(result).toContain('(section "Title"');
      expect(result).toContain('(text "content")');
    });

    it('should handle header and footer', () => {
      const input = '(wire (screen a "A" (header (text "Header" (footer (text "Footer"';
      const result = format(input);
      expect(result).toContain('(header');
      expect(result).toContain('(footer');
    });

    it('should handle nav element', () => {
      const input = '(wire (screen a "A" (nav (button "Home" (button "About"';
      const result = format(input);
      expect(result).toContain('(nav');
    });

    it('should handle scroll container', () => {
      const input = '(wire (screen a "A" (scroll (box (text "scrollable"';
      const result = format(input);
      expect(result).toContain('(scroll');
    });

    it('should handle group container', () => {
      const input = '(wire (screen a "A" (group (button "A" (button "B"';
      const result = format(input);
      expect(result).toContain('(group');
    });

    it('should handle list container', () => {
      const input = '(wire (screen a "A" (list (text "Item 1" (text "Item 2"';
      const result = format(input);
      expect(result).toContain('(list');
    });

    // =========================================================================
    // Special containers (button, dropdown, tabs, etc.)
    // =========================================================================

    it('should handle button with icon child', () => {
      const input = '(wire (screen a "A" (button "Click" (icon "arrow"';
      const result = format(input);
      // button can have children
      expect(result).toContain('(button "Click"');
    });

    it('should handle dropdown with items', () => {
      const input = '(wire (screen a "A" (dropdown "Menu" (text "Item 1" (text "Item 2"';
      const result = format(input);
      expect(result).toContain('(dropdown "Menu"');
    });

    it('should handle tabs with tab children', () => {
      const input = '(wire (screen a "A" (tabs (tab "Tab1" (text "Content1" (tab "Tab2" (text "Content2"';
      const result = format(input);
      expect(result).toContain('(tabs');
      expect(result).toContain('(tab "Tab1"');
      expect(result).toContain('(tab "Tab2"');
    });

    it('should handle metric with children', () => {
      const input = '(wire (screen a "A" (metric "Revenue" (icon "dollar"';
      const result = format(input);
      expect(result).toContain('(metric "Revenue"');
    });

    it('should handle chart with children', () => {
      const input = '(wire (screen a "A" (chart "Sales" (text "Legend"';
      const result = format(input);
      expect(result).toContain('(chart "Sales"');
    });

    it('should handle tooltip with children', () => {
      const input = '(wire (screen a "A" (tooltip "Help" (button "?"';
      const result = format(input);
      expect(result).toContain('(tooltip "Help"');
    });

    it('should handle toast with children', () => {
      const input = '(wire (screen a "A" (toast "Message" (button "Dismiss"';
      const result = format(input);
      expect(result).toContain('(toast "Message"');
    });

    it('should handle empty state with children', () => {
      const input = '(wire (screen a "A" (empty "No items" (button "Add"';
      const result = format(input);
      expect(result).toContain('(empty "No items"');
    });

    it('should handle skeleton with children', () => {
      const input = '(wire (screen a "A" (skeleton (box (text "Loading"';
      const result = format(input);
      expect(result).toContain('(skeleton');
    });

    // =========================================================================
    // Repeat blocks
    // =========================================================================

    it('should handle repeat block', () => {
      const input = '(wire (screen a "A" (repeat :count 3 (text "Item"';
      const result = format(input);
      expect(result).toContain('(repeat :count 3');
    });

    it('should close repeat before new screen', () => {
      const input = '(wire (screen a "A" (repeat :count 3 (box (screen b "B"';
      const result = format(input);
      expect(result).toContain('(box)))');
      expect(result).toContain('(screen b "B"');
    });

    // =========================================================================
    // Props and values
    // =========================================================================

    it('should preserve props on unbalanced elements', () => {
      const input = '(wire (screen a "A" :mobile (box :col :gap 8 (text "hi" :high';
      const result = format(input);
      expect(result).toContain(':mobile');
      expect(result).toContain(':col');
      expect(result).toContain(':gap 8');
      expect(result).toContain(':high');
    });

    it('should handle numeric values', () => {
      const input = '(wire (screen a "A" (box :padding 16 :gap 8 (text "hi"';
      const result = format(input);
      expect(result).toContain(':padding 16');
      expect(result).toContain(':gap 8');
    });

    it('should handle negative numbers', () => {
      const input = '(wire (screen a "A" (box :margin -4 (text "hi"';
      const result = format(input);
      expect(result).toContain(':margin -4');
    });

    it('should handle hash refs', () => {
      const input = '(wire (screen a "A" (button "Open" :open #modal (modal :id "modal" (text "content"';
      const result = format(input);
      expect(result).toContain('#modal');
    });

    it('should handle param refs in define', () => {
      const input = '(wire (define comp (label) (text $label';
      const result = format(input);
      expect(result).toContain('$label');
    });

    // =========================================================================
    // String edge cases
    // =========================================================================

    it('should handle escaped quotes in strings', () => {
      const input = '(wire (screen a "A" (text "He said \\"hello\\""';
      const result = format(input);
      expect(result).toContain('\\"hello\\"');
    });

    it('should handle newlines in strings', () => {
      const input = '(wire (screen a "A" (text "Line1\\nLine2"';
      const result = format(input);
      expect(result).toContain('\\n');
    });

    it('should handle empty strings', () => {
      const input = '(wire (screen a "A" (text ""';
      const result = format(input);
      expect(result).toContain('(text "")');
    });

    // =========================================================================
    // Complex scenarios
    // =========================================================================

    it('should handle complete dashboard layout', () => {
      const input = `(wire
        (layout main (box :col (header (text "App" (slot (footer (text "Footer"
        (screen dash "Dashboard" :layout main
          (box :col
            (metric "Users" :value 1000
            (chart "Revenue"
            (card (text "Recent"`;
      const result = format(input);
      // Should balance all elements
      expect(result).toContain('(wire');
      expect(result).toContain('(layout main');
      expect(result).toContain('(screen dash "Dashboard"');
      expect(result.match(/\)/g)?.length).toBeGreaterThan(10);
    });

    it('should handle form with multiple inputs and validation', () => {
      const input = '(wire (screen form "Form" (form :to submit (input "Name" :error (input "Email" (button "Submit" :primary';
      const result = format(input);
      // Props are preserved on inputs
      expect(result).toContain('(input "Name" :error)');
      expect(result).toContain('(input "Email")');
      expect(result).toContain('(button "Submit" :primary)');
    });

    it('should handle navigation with multiple button links', () => {
      const input = '(wire (screen a "A" (nav (button "Home" :to home (button "About" :to about (button "Contact" :to contact';
      const result = format(input);
      expect(result).toContain('(button "Home"');
      expect(result).toContain('(button "About"');
      expect(result).toContain('(button "Contact"');
    });

    it('should handle mixed overlay types in one screen', () => {
      const input = '(wire (screen a "A" (modal :id "m" (text "Modal" (drawer :id "d" (text "Drawer" (popover :id "p" (text "Pop"';
      const result = format(input);
      expect(result).toContain('(modal :id "m"');
      expect(result).toContain('(drawer :id "d"');
      expect(result).toContain('(popover :id "p"');
    });

    // =========================================================================
    // Error resilience
    // =========================================================================

    it('should handle many extra closing parens', () => {
      const input = '(wire (screen a "A" (text "hi")))))))))))';
      const result = format(input);
      expect(result).toBeDefined();
      expect(result).toContain('(text "hi")');
    });

    it('should handle unbalanced with only opening parens', () => {
      const input = '(wire (screen a "A" (box (box (box (box (box';
      const result = format(input);
      // Should close all boxes
      expect(result.match(/\)/g)?.length).toBe(7); // 5 boxes + screen + wire
    });

    it('should handle single unclosed element', () => {
      const input = '(wire';
      const result = format(input);
      expect(result).toContain('(wire)');
    });

    it('should handle meta block', () => {
      const input = '(wire (meta :title "App" :version "1.0" (screen a "A" (text "hi"';
      const result = format(input);
      expect(result).toContain('(meta');
    });

    // =========================================================================
    // Comments with auto-balance (regression tests for line:0 token bug)
    // =========================================================================

    it('should not duplicate header comments when auto-balancing', () => {
      const input = `; Header comment
; Another header
(wire
  (layout main
    (box
      (slot)
  ; Screen comment
  (screen a "A" (text "hi"`;
      const result = format(input);
      // Header comments should appear only once
      const headerMatches = result.match(/; Header comment/g);
      expect(headerMatches?.length).toBe(1);
    });

    it('should not duplicate comments when layout is auto-closed', () => {
      const input = `; Top comment
(wire
  (layout sidebar
    (nav
      (button "Home"
      (slot)
  ; Before screen
  (screen a "A" (text "content"`;
      const result = format(input);
      // Top comment should appear only once
      expect((result.match(/; Top comment/g) || []).length).toBe(1);
      // Before screen comment should appear only once
      expect((result.match(/; Before screen/g) || []).length).toBe(1);
    });

    it('should preserve comment positions after auto-balance', () => {
      const input = `(wire
  ; Define comment
  (define comp ()
    (box (text "x"
  ; Screen comment
  (screen a "A" (text "hi"`;
      const result = format(input);
      expect(result).toContain('; Define comment');
      expect(result).toContain('; Screen comment');
      // Each comment once
      expect((result.match(/; Define comment/g) || []).length).toBe(1);
      expect((result.match(/; Screen comment/g) || []).length).toBe(1);
    });

    it('should handle multiple auto-closes without duplicating comments', () => {
      const input = `; Comment 1
; Comment 2
(wire
  (layout a (box (nav (slot)
  (layout b (box (slot)
  (screen x "X" (text "x"`;
      const result = format(input);
      // Comments should appear only once even with multiple auto-closes
      expect((result.match(/; Comment 1/g) || []).length).toBe(1);
      expect((result.match(/; Comment 2/g) || []).length).toBe(1);
    });

    it('should handle standalone comments near auto-balanced elements', () => {
      // Note: inline comments (on same line as code) are not preserved
      // Only standalone comments (on their own line) are preserved
      const input = `(wire
  (screen a "A"
    ; standalone comment before box
    (box
      (text "x"
  (screen b "B" (text "y"`;
      const result = format(input);
      expect((result.match(/; standalone comment before box/g) || []).length).toBe(1);
    });

    it('should handle comments between screens with missing parens', () => {
      const input = `(wire
  (screen a "A" (box (card (text "1"
  ; Between screens
  (screen b "B" (text "2"
  ; After last screen
  (screen c "C" (text "3"`;
      const result = format(input);
      expect((result.match(/; Between screens/g) || []).length).toBe(1);
      expect((result.match(/; After last screen/g) || []).length).toBe(1);
    });

    it('should handle deeply nested auto-close with comments', () => {
      const input = `; File header
; Version 1.0
(wire
  (define wrapper ()
    (box :col
      (card
        (section
          (group
            (text "deep"
  ; Component separator
  (define another ()
    (text "simple"
  ; Screen section
  (screen main "Main" (text "content"`;
      const result = format(input);
      // All comments should appear exactly once
      expect((result.match(/; File header/g) || []).length).toBe(1);
      expect((result.match(/; Version 1.0/g) || []).length).toBe(1);
      expect((result.match(/; Component separator/g) || []).length).toBe(1);
      expect((result.match(/; Screen section/g) || []).length).toBe(1);
    });
  });
});
