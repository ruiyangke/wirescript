import { describe, expect, it } from 'vitest';
import { parse } from './schema/parser.js';

describe('Parser', () => {
  describe('parse', () => {
    it('should parse a minimal document', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (box)))
      `);

      expect(result.success).toBe(true);
      expect(result.document).toBeDefined();
      expect(result.document?.screens).toHaveLength(1);
      expect(result.document?.screens[0].id).toBe('home');
    });

    it('should parse meta node', () => {
      const result = parse(`
        (wire
          (meta :title "My App" :context "saas")
          (screen home "Home"
            (box)))
      `);

      expect(result.success).toBe(true);
      expect(result.document?.meta.props.title).toBe('My App');
      expect(result.document?.meta.props.context).toBe('saas');
    });

    it('should parse screen with viewport', () => {
      const result = parse(`
        (wire
          (screen home "Home" :mobile
            (box)))
      `);

      expect(result.success).toBe(true);
      expect(result.document?.screens[0].viewport).toBe('mobile');
    });

    it('should parse screen with layout reference', () => {
      const result = parse(`
        (wire
          (layout main-layout
            (box :col
              (slot)))
          (screen home "Home" :layout main-layout
            (text "Hello")))
      `);

      expect(result.success).toBe(true);
      expect(result.document?.screens[0].layout).toBe('main-layout');
      expect(result.document?.layouts).toHaveLength(1);
    });

    it('should parse multiple screens', () => {
      const result = parse(`
        (wire
          (screen home "Home" (box))
          (screen about "About" (box))
          (screen contact "Contact" (box)))
      `);

      expect(result.success).toBe(true);
      expect(result.document?.screens).toHaveLength(3);
    });
  });

  describe('elements', () => {
    it('should parse box with props', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (box :col :center :gap 16)))
      `);

      expect(result.success).toBe(true);
      const box = result.document?.screens[0].root;
      expect(box?.elementType).toBe('box');
      expect(box?.props.col).toBe(true);
      expect(box?.props.center).toBe(true);
      expect(box?.props.gap).toBe(16);
    });

    it('should parse text with content and emphasis', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (text "Hello World" :high)))
      `);

      expect(result.success).toBe(true);
      const text = result.document?.screens[0].root;
      expect(text?.elementType).toBe('text');
      expect(text?.content).toBe('Hello World');
      expect(text?.props.high).toBe(true);
    });

    it('should parse button with screen navigation', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (button "Click Me" :primary :to dashboard)))
      `);

      expect(result.success).toBe(true);
      const button = result.document?.screens[0].root;
      expect(button?.elementType).toBe('button');
      expect(button?.content).toBe('Click Me');
      expect(button?.props.primary).toBe(true);
      const to = button?.props.to as { type: string; id: string };
      expect(to.type).toBe('screen');
      expect(to.id).toBe('dashboard');
    });

    it('should parse button with action navigation', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (button "Close" :ghost :to :close)))
      `);

      expect(result.success).toBe(true);
      const button = result.document?.screens[0].root;
      const to = button?.props.to as { type: string; action: string };
      expect(to.type).toBe('action');
      expect(to.action).toBe('close');
    });

    it('should parse button with overlay navigation (#id)', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (button "Open" :to #my-modal)
            (modal :id "my-modal"
              (text "Modal content"))))
      `);

      expect(result.success).toBe(true);
      const button = result.document?.screens[0].root;
      const to = button?.props.to as { type: string; id: string };
      expect(to.type).toBe('overlay');
      expect(to.id).toBe('my-modal');
    });

    it('should parse button with icon prop', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (button "Add Item" :primary :icon "plus")))
      `);

      expect(result.success).toBe(true);
      const button = result.document?.screens[0].root;
      expect(button?.props.icon).toBe('plus');
    });

    it('should parse input with type and placeholder', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (input "Email" :type email :placeholder "Enter email")))
      `);

      expect(result.success).toBe(true);
      const input = result.document?.screens[0].root;
      expect(input?.elementType).toBe('input');
      expect(input?.content).toBe('Email');
      expect(input?.props.type).toBe('email');
      expect(input?.props.placeholder).toBe('Enter email');
    });

    it('should parse nested elements', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (box :col
              (text "Title" :high)
              (box :row
                (button "OK")
                (button "Cancel")))))
      `);

      expect(result.success).toBe(true);
      const root = result.document?.screens[0].root;
      expect(root?.children).toHaveLength(2);
      expect(root?.children[0].type).toBe('element');
    });

    it('should parse card element', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (card :padding 16
              (text "Card content"))))
      `);

      expect(result.success).toBe(true);
      const card = result.document?.screens[0].root;
      expect(card?.elementType).toBe('card');
      expect(card?.props.padding).toBe(16);
    });

    it('should parse metric element', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (metric "Revenue" :value "$10,000" :trend up)))
      `);

      expect(result.success).toBe(true);
      const metric = result.document?.screens[0].root;
      expect(metric?.elementType).toBe('metric');
      expect(metric?.content).toBe('Revenue');
      expect(metric?.props.value).toBe('$10,000');
    });

    it('should parse tabs and tab elements', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (tabs
              (tab "Tab 1" :active (text "Content 1"))
              (tab "Tab 2" (text "Content 2")))))
      `);

      expect(result.success).toBe(true);
      const tabs = result.document?.screens[0].root;
      expect(tabs?.elementType).toBe('tabs');
      expect(tabs?.children).toHaveLength(2);
    });
  });

  describe('components', () => {
    it('should parse component definition', () => {
      const result = parse(`
        (wire
          (define my-card (title)
            (card :padding 16
              (text $title :high)))
          (screen home "Home"
            (box)))
      `);

      expect(result.success).toBe(true);
      expect(result.document?.components).toHaveLength(1);
      expect(result.document?.components[0].name).toBe('my-card');
      expect(result.document?.components[0].params).toEqual(['title']);
    });

    it('should parse component call', () => {
      const result = parse(`
        (wire
          (define my-card (title)
            (card (text $title)))
          (screen home "Home"
            (my-card :title "Hello")))
      `);

      expect(result.success).toBe(true);
      const root = result.document?.screens[0].root;
      expect(root?.elementType).toBe('my-card');
      expect(root?.isComponent).toBe(true);
      expect(root?.props.title).toBe('Hello');
    });
  });

  describe('layouts', () => {
    it('should parse layout definition', () => {
      const result = parse(`
        (wire
          (layout sidebar-layout
            (box :row :full
              (nav :col :width 200
                (button "Home" :ghost :to home))
              (slot)))
          (screen home "Home" :layout sidebar-layout
            (text "Welcome")))
      `);

      expect(result.success).toBe(true);
      expect(result.document?.layouts).toHaveLength(1);
      expect(result.document?.layouts[0].name).toBe('sidebar-layout');
    });
  });

  describe('repeat', () => {
    it('should parse repeat element', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (box :col
              (repeat :count 3
                (card (text "Item"))))))
      `);

      expect(result.success).toBe(true);
      const root = result.document?.screens[0].root;
      expect(root?.children[0].type).toBe('repeat');
      if (root?.children[0].type === 'repeat') {
        expect(root.children[0].count).toBe(3);
      }
    });

    it('should parse repeat with variable', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (box :col
              (repeat :count 5 :as "i"
                (text "Item")))))
      `);

      expect(result.success).toBe(true);
      const root = result.document?.screens[0].root;
      if (root?.children[0].type === 'repeat') {
        expect(root.children[0].as).toBe('i');
      }
    });
  });

  describe('overlays', () => {
    it('should parse modal overlay', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (box (button "Open" :to #my-modal))
            (modal :id "my-modal"
              (text "Are you sure?"))))
      `);

      expect(result.success).toBe(true);
      expect(result.document?.screens[0].overlays).toHaveLength(1);
      expect(result.document?.screens[0].overlays[0].overlayType).toBe('modal');
      expect(result.document?.screens[0].overlays[0].id).toBe('my-modal');
    });

    it('should parse drawer overlay', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (box (button "Menu" :to #sidebar))
            (drawer :id "sidebar" :left :width 300
              (nav :col
                (button "Home" :ghost)))))
      `);

      expect(result.success).toBe(true);
      expect(result.document?.screens[0].overlays[0].overlayType).toBe('drawer');
      expect(result.document?.screens[0].overlays[0].props.left).toBe(true);
    });

    it('should parse modal with :open flag', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (box)
            (modal :id "welcome" :open
              (text "Welcome!"))))
      `);

      expect(result.success).toBe(true);
      expect(result.document?.screens[0].overlays[0].props.open).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should fail on missing wire wrapper', () => {
      const result = parse('(screen home (box))');
      expect(result.success).toBe(false);
    });

    it('should fail on missing screen', () => {
      const result = parse('(wire (meta :title "Test"))');
      expect(result.success).toBe(false);
      expect(result.errors[0].message).toContain('at least one screen');
    });

    it('should fail on unbalanced parentheses', () => {
      const result = parse('(wire (screen home (box))');
      expect(result.success).toBe(false);
    });

    it('should fail on unknown form type', () => {
      const result = parse('(wire (unknown-form) (screen home (box)))');
      expect(result.success).toBe(false);
      expect(result.errors[0].message).toContain('Unknown form type');
    });
  });

  describe('source locations', () => {
    it('should track source locations for elements', () => {
      const result = parse(`(wire
  (screen home "Home"
    (box :col)))`);

      expect(result.success).toBe(true);
      const box = result.document?.screens[0].root;
      expect(box?.loc).toBeDefined();
      expect(box?.loc?.line).toBe(3);
    });

    it('should track end positions for source locations', () => {
      const result = parse(`(wire (screen home "Home" (box :col :gap 16)))`);

      expect(result.success).toBe(true);
      const box = result.document?.screens[0].root;
      expect(box?.loc).toBeDefined();
      expect(box?.loc?.line).toBe(1);
      expect(box?.loc?.column).toBe(27);
      expect(box?.loc?.endLine).toBe(1);
      expect(box?.loc?.endColumn).toBe(45);
    });

    it('should track multiline element spans', () => {
      const result = parse(`(wire
  (screen home "Home"
    (box :col
      (text "Hello")
      (text "World"))))`);

      expect(result.success).toBe(true);
      const box = result.document?.screens[0].root;
      expect(box?.loc?.line).toBe(3);
      expect(box?.loc?.endLine).toBe(5);
    });
  });

  describe('URL and navigation parsing', () => {
    it('should parse http URLs', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (button "Visit" :to "http://example.com")))
      `);

      expect(result.success).toBe(true);
      const button = result.document?.screens[0].root;
      const to = button?.props.to as { type: string; url: string };
      expect(to.type).toBe('url');
      expect(to.url).toBe('http://example.com');
    });

    it('should parse https URLs', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (button "Visit" :to "https://example.com/path?query=1")))
      `);

      expect(result.success).toBe(true);
      const button = result.document?.screens[0].root;
      const to = button?.props.to as { type: string; url: string };
      expect(to.type).toBe('url');
      expect(to.url).toBe('https://example.com/path?query=1');
    });

    it('should parse protocol-relative URLs', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (button "Visit" :to "//cdn.example.com/asset.js")))
      `);

      expect(result.success).toBe(true);
      const button = result.document?.screens[0].root;
      const to = button?.props.to as { type: string; url: string };
      expect(to.type).toBe('url');
      expect(to.url).toBe('//cdn.example.com/asset.js');
    });

    it('should parse mailto URLs', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (button "Email" :to "mailto:test@example.com")))
      `);

      expect(result.success).toBe(true);
      const button = result.document?.screens[0].root;
      const to = button?.props.to as { type: string; url: string };
      expect(to.type).toBe('url');
      expect(to.url).toBe('mailto:test@example.com');
    });

    it('should parse tel URLs', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (button "Call" :to "tel:+1234567890")))
      `);

      expect(result.success).toBe(true);
      const button = result.document?.screens[0].root;
      const to = button?.props.to as { type: string; url: string };
      expect(to.type).toBe('url');
      expect(to.url).toBe('tel:+1234567890');
    });

    it('should treat non-URL strings as screen references for :to', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (button "Go" :to "dashboard")))
      `);

      expect(result.success).toBe(true);
      const button = result.document?.screens[0].root;
      const to = button?.props.to as { type: string; id: string };
      expect(to.type).toBe('screen');
      expect(to.id).toBe('dashboard');
    });
  });

  describe('prop type validation', () => {
    it('should accept correct boolean props', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (box :col :center :grow)))
      `);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept correct number props', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (box :gap 16 :padding 8)))
      `);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept param refs for any prop type', () => {
      const result = parse(`
        (wire
          (define my-box (spacing)
            (box :gap $spacing))
          (screen home "Home"
            (my-box :spacing 16)))
      `);

      expect(result.success).toBe(true);
    });

    it('should parse true/false symbols as booleans', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (box
              (input :type checkbox :checked true)
              (input :type checkbox :disabled false))))
      `);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      const box = result.document?.screens[0].root;
      expect(box?.elementType).toBe('box');
      const input1 = box?.children[0];
      const input2 = box?.children[1];
      if (input1?.type === 'element') {
        expect(input1.props.checked).toBe(true);
      }
      if (input2?.type === 'element') {
        expect(input2.props.disabled).toBe(false);
      }
    });

    it('should parse t/nil as boolean literals (Lisp style)', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (box
              (input :type checkbox :checked t)
              (input :type checkbox :disabled nil))))
      `);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      const box = result.document?.screens[0].root;
      const input1 = box?.children[0];
      const input2 = box?.children[1];
      if (input1?.type === 'element') {
        expect(input1.props.checked).toBe(true);
      }
      if (input2?.type === 'element') {
        expect(input2.props.disabled).toBe(false);
      }
    });
  });

  describe('dynamic type coercion', () => {
    it('should coerce string to number for numeric props', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (box :gap "16" :padding "8")))
      `);

      expect(result.success).toBe(true);
      const box = result.document?.screens[0].root;
      expect(box?.props.gap).toBe(16);
      expect(box?.props.padding).toBe(8);
      expect(typeof box?.props.gap).toBe('number');
    });

    it('should coerce string to boolean for boolean props', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (input :type checkbox :checked "true" :disabled "false")))
      `);

      expect(result.success).toBe(true);
      const input = result.document?.screens[0].root;
      expect(input?.props.checked).toBe(true);
      expect(input?.props.disabled).toBe(false);
      expect(typeof input?.props.checked).toBe('boolean');
    });

    it('should coerce "1" and "0" to boolean', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (box
              (input :type checkbox :checked "1")
              (input :type checkbox :disabled "0"))))
      `);

      expect(result.success).toBe(true);
      const box = result.document?.screens[0].root;
      const input1 = box?.children[0];
      const input2 = box?.children[1];
      if (input1?.type === 'element') {
        expect(input1.props.checked).toBe(true);
      }
      if (input2?.type === 'element') {
        expect(input2.props.disabled).toBe(false);
      }
    });

    it('should coerce number to boolean (0 = false)', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (box
              (input :type checkbox :checked 1)
              (input :type checkbox :disabled 0))))
      `);

      expect(result.success).toBe(true);
      const box = result.document?.screens[0].root;
      const input1 = box?.children[0];
      const input2 = box?.children[1];
      if (input1?.type === 'element') {
        expect(input1.props.checked).toBe(true);
      }
      if (input2?.type === 'element') {
        expect(input2.props.disabled).toBe(false);
      }
    });

    it('should coerce float strings to numbers', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (box :gap "3.5")))
      `);

      expect(result.success).toBe(true);
      const box = result.document?.screens[0].root;
      expect(box?.props.gap).toBe(3.5);
    });

    it('should preserve string for string props', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (input :placeholder "Enter text")))
      `);

      expect(result.success).toBe(true);
      const input = result.document?.screens[0].root;
      expect(input?.props.placeholder).toBe('Enter text');
      expect(typeof input?.props.placeholder).toBe('string');
    });
  });

  describe('error recovery', () => {
    it('should recover from malformed elements and continue parsing', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (box :col
              (text "Before")
              (invalid-unclosed
              (text "After"))))
      `);

      // Should have errors but still parse what it can
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should report multiple errors', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (box
              (unknown-element1)
              (unknown-element2)
              (text "Valid"))))
      `);

      // Unknown elements are parsed as element nodes (could be components)
      // The parser should still produce a document
      expect(result.document?.screens[0].root).toBeDefined();
      expect(result.document?.screens[0].root?.children).toHaveLength(3);
    });
  });

  describe('repeat element handling', () => {
    it('should parse standalone repeat without parent', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (repeat :count 3
              (card (text "Item")))))
      `);

      expect(result.success).toBe(true);
      const root = result.document?.screens[0].root;
      // Standalone repeat should be wrapped in repeat-container
      expect(root?.elementType).toBe('repeat-container');
      expect(root?.children[0].type).toBe('repeat');
    });

    it('should parse repeat inside container normally', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (box :col
              (repeat :count 3
                (text "Item")))))
      `);

      expect(result.success).toBe(true);
      const box = result.document?.screens[0].root;
      expect(box?.elementType).toBe('box');
      expect(box?.children[0].type).toBe('repeat');
    });

    it('should parse nested repeats', () => {
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
        expect(outerRepeat.as).toBe('row');
        const innerBox = outerRepeat.body;
        const innerRepeat = innerBox.children[0];
        expect(innerRepeat?.type).toBe('repeat');
        if (innerRepeat?.type === 'repeat') {
          expect(innerRepeat.as).toBe('col');
        }
      }
    });

    it('should parse repeat with param ref count', () => {
      const result = parse(`
        (wire
          (define list-items (count)
            (box :col
              (repeat :count $count
                (text "Item"))))
          (screen home "Home"
            (list-items :count 5)))
      `);

      expect(result.success).toBe(true);
      const component = result.document?.components[0];
      const box = component?.body;
      const repeat = box?.children[0];
      expect(repeat?.type).toBe('repeat');
      if (repeat?.type === 'repeat') {
        expect(repeat.count).toEqual({ type: 'param', name: 'count' });
      }
    });
  });

  describe('component forward references', () => {
    it('should resolve forward-referenced components', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (my-card :title "Hello"))
          (define my-card (title)
            (card (text $title))))
      `);

      expect(result.success).toBe(true);
      const root = result.document?.screens[0].root;
      expect(root?.isComponent).toBe(true);
    });

    it('should handle mutually recursive component definitions', () => {
      const result = parse(`
        (wire
          (define wrapper (content)
            (box :padding 16
              (children)))
          (define card-wrapper (title)
            (wrapper
              (text $title)))
          (screen home "Home"
            (card-wrapper :title "Test")))
      `);

      expect(result.success).toBe(true);
      expect(result.document?.components).toHaveLength(2);
    });
  });

  describe('edge cases', () => {
    it('should handle empty screen', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (box)))
      `);

      expect(result.success).toBe(true);
      const box = result.document?.screens[0].root;
      expect(box?.children).toHaveLength(0);
    });

    it('should handle deeply nested elements', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (box (box (box (box (box (text "Deep"))))))))
      `);

      expect(result.success).toBe(true);
      let current = result.document?.screens[0].root;
      let depth = 0;
      while (current && current.children && current.children.length > 0 && current.children[0].type === 'element') {
        depth++;
        current = current.children[0];
      }
      expect(depth).toBe(5);
    });

    it('should handle special characters in strings', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (text "Hello\\nWorld\\twith\\ttabs")))
      `);

      expect(result.success).toBe(true);
      const text = result.document?.screens[0].root;
      expect(text?.content).toBe('Hello\nWorld\twith\ttabs');
    });

    it('should handle unicode in content', () => {
      const result = parse(`
        (wire
          (screen home "Home"
            (text "北京 • 日本語 • 한국어")))
      `);

      expect(result.success).toBe(true);
      const text = result.document?.screens[0].root;
      expect(text?.content).toBe('北京 • 日本語 • 한국어');
    });

    it('should handle comments between elements', () => {
      const result = parse(`
        (wire
          ; This is the main screen
          (screen home "Home"
            ; Header section
            (box :col
              ; Title text
              (text "Title")
              ; Button row
              (box :row
                (button "OK")))))
      `);

      expect(result.success).toBe(true);
    });
  });
});
