import { describe, expect, it } from 'vitest';
import { compile } from './index.js';

describe('compile', () => {
  it('should compile a valid document', () => {
    const result = compile(`
      (wire
        (meta :title "My App")
        (screen home "Home" :desktop
          (box :col :gap 16 :padding 24
            (text "Welcome" :high)
            (button "Get Started" :primary))))
    `);

    expect(result.success).toBe(true);
    expect(result.document).toBeDefined();
    expect(result.errors).toHaveLength(0);
  });

  it('should handle unrecognized properties gracefully', () => {
    const result = compile(`
      (wire
        (screen home "Home"
          (box :col)))
    `);

    expect(result.success).toBe(true);
    expect(result.document).toBeDefined();
  });

  it('should return parse errors for invalid structure', () => {
    const result = compile('(wire)'); // No screens
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should compile components correctly', () => {
    const result = compile(`
      (wire
        (define stat-card (label value)
          (card :padding 16
            (text $label :low)
            (text $value :high)))
        (screen dashboard "Dashboard"
          (box :row :gap 16
            (stat-card :label "Users" :value "1,234")
            (stat-card :label "Revenue" :value "$10K"))))
    `);

    expect(result.success).toBe(true);
    expect(result.document?.components).toHaveLength(1);
  });

  it('should compile layouts correctly', () => {
    const result = compile(`
      (wire
        (layout app-layout
          (box :col :full
            (header :padding 16
              (text "My App" :high))
            (box :fill
              (slot))
            (footer :padding 16
              (text "© 2024" :low))))
        (screen home "Home" :layout app-layout
          (text "Welcome!")))
    `);

    expect(result.success).toBe(true);
    expect(result.document?.layouts).toHaveLength(1);
    expect(result.document?.screens[0].layout).toBe('app-layout');
  });

  it('should compile overlays correctly', () => {
    const result = compile(`
      (wire
        (screen home "Home"
          (box :col
            (button "Show Modal" :to "#confirm"))
          (modal :id "confirm"
            (text "Are you sure?")
            (box :row :gap 8
              (button "Cancel" :ghost :to :close)
              (button "Confirm" :primary :to :close)))))
    `);

    expect(result.success).toBe(true);
    expect(result.document?.screens[0].overlays).toHaveLength(1);
    expect(result.document?.screens[0].overlays[0].id).toBe('confirm');
  });

  it('should compile repeat blocks correctly', () => {
    const result = compile(`
      (wire
        (screen home "Home"
          (box :col :gap 8
            (repeat :count 5 :as n
              (card :padding 12
                (text "Item \${n}"))))))
    `);

    expect(result.success).toBe(true);
    const root = result.document?.screens[0].root;
    expect(root?.children[0].type).toBe('repeat');
  });

  it('should handle multiple screens', () => {
    const result = compile(`
      (wire
        (screen home "Home" :desktop
          (box (text "Home")))
        (screen about "About" :desktop
          (box (text "About")))
        (screen contact "Contact" :mobile
          (box (text "Contact"))))
    `);

    expect(result.success).toBe(true);
    expect(result.document?.screens).toHaveLength(3);
    expect(result.document?.screens[2].viewport).toBe('mobile');
  });

  it('should compile all element types', () => {
    const result = compile(`
      (wire
        (screen home "Home"
          (box :col :gap 16
            ; Containers
            (card (text "Card"))
            (section (text "Section"))
            (header (text "Header"))
            (footer (text "Footer"))
            (nav (button "Link"))
            (form (input "Name"))
            (list (text "Item"))
            (scroll (text "Scrollable"))
            (group (text "Group"))

            ; Content
            (text "Text" :high)
            (button "Button" :primary)
            (input "Input" :placeholder "Enter text")
            (image :src "photo.jpg" :alt "Photo")
            (icon "star")
            (divider)
            (avatar :src "user.jpg")
            (badge "New" :primary)
            (datepicker "Date")

            ; Data
            (metric "Sales" :value "$1000")
            (chart :type bar)
            (progress :value 50)
            (skeleton)

            ; Navigation
            (tabs
              (tab "Tab 1" (text "Content")))
            (breadcrumb
              (crumb "Home" :to home))

            ; Utility
            (tooltip "Hint" (button "?"))
            (toast "Success!" :success)
            (empty "No data"))))
    `);

    expect(result.success).toBe(true);
  });
});
