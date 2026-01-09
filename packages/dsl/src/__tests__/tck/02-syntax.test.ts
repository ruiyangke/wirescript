/**
 * TCK: Syntax
 *
 * Specification for WireScript document structure.
 * Defines valid document forms, elements, and nesting.
 */

import { describe, expect, it } from 'vitest';
import { parse } from '../../schema/parser.js';

describe('TCK: Syntax', () => {
  // ===========================================================================
  // 2.1 Document Structure
  // ===========================================================================

  describe('2.1 Document Structure', () => {
    describe('2.1.1 Wire Root', () => {
      it('document must be wrapped in (wire ...)', () => {
        const result = parse('(wire (screen home "Home" (box)))');
        expect(result.success).toBe(true);
      });

      it('missing wire wrapper is an error', () => {
        const result = parse('(screen home (box))');
        expect(result.success).toBe(false);
      });
    });

    describe('2.1.2 Meta Node', () => {
      it('(meta) defines document metadata', () => {
        const result = parse(`
          (wire
            (meta :title "My App")
            (screen home "Home" (box)))
        `);
        expect(result.success).toBe(true);
        expect(result.document?.meta.props.title).toBe('My App');
      });

      it('meta supports multiple properties', () => {
        const result = parse(`
          (wire
            (meta :title "App" :context "saas" :theme "light")
            (screen home "Home" (box)))
        `);
        expect(result.document?.meta.props.title).toBe('App');
        expect(result.document?.meta.props.context).toBe('saas');
        expect(result.document?.meta.props.theme).toBe('light');
      });
    });

    describe('2.1.3 Screen Node', () => {
      it('(screen id "Title" body) defines a screen', () => {
        const result = parse(`
          (wire
            (screen home "Home"
              (box)))
        `);
        expect(result.success).toBe(true);
        expect(result.document?.screens[0].id).toBe('home');
        expect(result.document?.screens[0].name).toBe('Home');
      });

      it('document must have at least one screen', () => {
        // Note: "at least one screen" is checked in compile(), not parse()
        // This allows library files with only define/layout to be included
        const result = parse('(wire (meta :title "Test"))');
        expect(result.success).toBe(true); // parse succeeds
        expect(result.document?.screens).toHaveLength(0);
      });

      it('document may have multiple screens', () => {
        const result = parse(`
          (wire
            (screen home "Home" (box))
            (screen about "About" (box))
            (screen contact "Contact" (box)))
        `);
        expect(result.document?.screens).toHaveLength(3);
      });

      it('screen supports :viewport prop', () => {
        const result = parse(`
          (wire
            (screen home "Home" :mobile (box)))
        `);
        expect(result.document?.screens[0].viewport).toBe('mobile');
      });

      it('screen supports :layout prop', () => {
        const result = parse(`
          (wire
            (layout main (box (slot)))
            (screen home "Home" :layout main (box)))
        `);
        expect(result.document?.screens[0].layout).toBe('main');
      });
    });
  });

  // ===========================================================================
  // 2.2 Elements
  // ===========================================================================

  describe('2.2 Elements', () => {
    describe('2.2.1 Basic Elements', () => {
      it('(element-type) creates an element', () => {
        const result = parse(`
          (wire (screen home "Home" (box)))
        `);
        expect(result.document?.screens[0].root.elementType).toBe('box');
      });

      it('elements may have content string', () => {
        const result = parse(`
          (wire (screen home "Home" (text "Hello")))
        `);
        expect(result.document?.screens[0].root.content).toBe('Hello');
      });

      it('elements may have props', () => {
        const result = parse(`
          (wire (screen home "Home" (box :col :gap 16)))
        `);
        const box = result.document?.screens[0].root;
        expect(box?.props.col).toBe(true);
        expect(box?.props.gap).toBe(16);
      });

      it('elements may have children', () => {
        const result = parse(`
          (wire (screen home "Home"
            (box
              (text "Child 1")
              (text "Child 2"))))
        `);
        expect(result.document?.screens[0].root.children).toHaveLength(2);
      });
    });

    describe('2.2.2 Element Nesting', () => {
      it('elements may nest arbitrarily deep', () => {
        const result = parse(`
          (wire (screen home "Home"
            (box (box (box (box (text "Deep")))))))
        `);
        expect(result.success).toBe(true);
        let node = result.document?.screens[0].root;
        let depth = 0;
        while (node?.children?.[0]?.type === 'element') {
          depth++;
          node = node.children[0];
        }
        expect(depth).toBe(4);
      });

      it('sibling elements are ordered', () => {
        const result = parse(`
          (wire (screen home "Home"
            (box
              (text "First")
              (text "Second")
              (text "Third"))))
        `);
        const children = result.document?.screens[0].root.children;
        expect(children?.[0].type === 'element' && children[0].content).toBe('First');
        expect(children?.[1].type === 'element' && children[1].content).toBe('Second');
        expect(children?.[2].type === 'element' && children[2].content).toBe('Third');
      });
    });

    describe('2.2.3 Container Elements', () => {
      it('box: generic container', () => {
        const result = parse(`(wire (screen home "Home" (box :col :gap 8)))`);
        expect(result.document?.screens[0].root.elementType).toBe('box');
      });

      it('card: styled container with padding', () => {
        const result = parse(`(wire (screen home "Home" (card :padding 16 (text "Content"))))`);
        expect(result.document?.screens[0].root.elementType).toBe('card');
      });

      it('header: page header section', () => {
        const result = parse(`(wire (screen home "Home" (header (text "Title"))))`);
        expect(result.document?.screens[0].root.elementType).toBe('header');
      });

      it('footer: page footer section', () => {
        const result = parse(`(wire (screen home "Home" (footer (text "© 2024"))))`);
        expect(result.document?.screens[0].root.elementType).toBe('footer');
      });

      it('nav: navigation container', () => {
        const result = parse(`(wire (screen home "Home" (nav (button "Link"))))`);
        expect(result.document?.screens[0].root.elementType).toBe('nav');
      });
    });

    describe('2.2.4 Content Elements', () => {
      it('text: text content with emphasis', () => {
        const result = parse(`(wire (screen home "Home" (text "Hello" :high)))`);
        const text = result.document?.screens[0].root;
        expect(text?.elementType).toBe('text');
        expect(text?.content).toBe('Hello');
        expect(text?.props.high).toBe(true);
      });

      it('button: clickable button', () => {
        const result = parse(`(wire (screen home "Home" (button "Click" :primary)))`);
        const btn = result.document?.screens[0].root;
        expect(btn?.elementType).toBe('button');
        expect(btn?.content).toBe('Click');
      });

      it('dropdown: inline dropdown menu', () => {
        const result = parse(`
          (wire (screen home "Home"
            (dropdown "Options"
              (button "Edit" :ghost)
              (button "Delete" :danger))))
        `);
        const dropdown = result.document?.screens[0].root;
        expect(dropdown?.elementType).toBe('dropdown');
        expect(dropdown?.content).toBe('Options');
        expect(dropdown?.children).toHaveLength(2);
      });

      it('input: form input field', () => {
        const result = parse(`(wire (screen home "Home" (input "Email" :type email)))`);
        const input = result.document?.screens[0].root;
        expect(input?.elementType).toBe('input');
        expect(input?.props.type).toBe('email');
      });

      it('image: image element', () => {
        const result = parse(`(wire (screen home "Home" (image :src "photo.jpg")))`);
        expect(result.document?.screens[0].root.elementType).toBe('image');
      });

      it('icon: icon element', () => {
        const result = parse(`(wire (screen home "Home" (icon "star")))`);
        expect(result.document?.screens[0].root.elementType).toBe('icon');
      });

      it('avatar: avatar element', () => {
        const result = parse(`(wire (screen home "Home" (avatar :src "user.jpg")))`);
        expect(result.document?.screens[0].root.elementType).toBe('avatar');
      });

      it('badge: badge element', () => {
        const result = parse(`(wire (screen home "Home" (badge "New" :primary)))`);
        expect(result.document?.screens[0].root.elementType).toBe('badge');
      });
    });

    describe('2.2.5 Data Elements', () => {
      it('metric: data metric display', () => {
        const result = parse(`(wire (screen home "Home" (metric "Revenue" :value "$10K")))`);
        const metric = result.document?.screens[0].root;
        expect(metric?.elementType).toBe('metric');
        expect(metric?.content).toBe('Revenue');
      });

      it('progress: progress bar', () => {
        const result = parse(`(wire (screen home "Home" (progress :value 75)))`);
        expect(result.document?.screens[0].root.elementType).toBe('progress');
      });

      it('skeleton: loading placeholder', () => {
        const result = parse(`(wire (screen home "Home" (skeleton :height 100)))`);
        expect(result.document?.screens[0].root.elementType).toBe('skeleton');
      });
    });

    describe('2.2.6 Navigation Elements', () => {
      it('tabs: tab container', () => {
        const result = parse(`
          (wire (screen home "Home"
            (tabs
              (tab "Tab 1" (text "Content 1"))
              (tab "Tab 2" (text "Content 2")))))
        `);
        expect(result.document?.screens[0].root.elementType).toBe('tabs');
        expect(result.document?.screens[0].root.children).toHaveLength(2);
      });

      it('breadcrumb: breadcrumb navigation', () => {
        const result = parse(`
          (wire (screen home "Home"
            (breadcrumb
              (crumb "Home" :to home)
              (crumb "Products"))))
        `);
        expect(result.document?.screens[0].root.elementType).toBe('breadcrumb');
      });
    });
  });

  // ===========================================================================
  // 2.3 Props
  // ===========================================================================

  describe('2.3 Props', () => {
    describe('2.3.1 Boolean Props', () => {
      it(':prop without value is true', () => {
        const result = parse(`(wire (screen home "Home" (box :col)))`);
        expect(result.document?.screens[0].root.props.col).toBe(true);
      });

      it(':prop true is true', () => {
        const result = parse(`(wire (screen home "Home" (box :col true)))`);
        expect(result.document?.screens[0].root.props.col).toBe(true);
      });

      it(':prop false is false', () => {
        const result = parse(`(wire (screen home "Home" (box :col false)))`);
        expect(result.document?.screens[0].root.props.col).toBe(false);
      });

      it(':prop t is true (Lisp style)', () => {
        const result = parse(`(wire (screen home "Home" (input :disabled t)))`);
        expect(result.document?.screens[0].root.props.disabled).toBe(true);
      });

      it(':prop nil is false (Lisp style)', () => {
        const result = parse(`(wire (screen home "Home" (input :disabled nil)))`);
        expect(result.document?.screens[0].root.props.disabled).toBe(false);
      });
    });

    describe('2.3.2 Number Props', () => {
      it(':prop number sets numeric value', () => {
        const result = parse(`(wire (screen home "Home" (box :gap 16)))`);
        expect(result.document?.screens[0].root.props.gap).toBe(16);
      });

      it(':prop negative-number works', () => {
        const result = parse(`(wire (screen home "Home" (box :gap -8)))`);
        expect(result.document?.screens[0].root.props.gap).toBe(-8);
      });

      it(':prop decimal works', () => {
        const result = parse(`(wire (screen home "Home" (box :gap 1.5)))`);
        expect(result.document?.screens[0].root.props.gap).toBe(1.5);
      });
    });

    describe('2.3.3 String Props', () => {
      it(':prop "string" sets string value', () => {
        const result = parse(`(wire (screen home "Home" (input :placeholder "Enter text")))`);
        expect(result.document?.screens[0].root.props.placeholder).toBe('Enter text');
      });

      it(':prop "string with spaces" works', () => {
        const result = parse(`(wire (screen home "Home" (input :placeholder "Hello World")))`);
        expect(result.document?.screens[0].root.props.placeholder).toBe('Hello World');
      });
    });

    describe('2.3.4 Symbol Props', () => {
      it(':prop symbol sets symbol value', () => {
        const result = parse(`(wire (screen home "Home" (input :type email)))`);
        expect(result.document?.screens[0].root.props.type).toBe('email');
      });
    });

    describe('2.3.5 Param Ref Props', () => {
      it(':prop $param creates param reference', () => {
        const result = parse(`
          (wire
            (define my-box (size)
              (box :gap $size))
            (screen home "Home" (my-box :size 16)))
        `);
        const component = result.document?.components[0];
        expect(component?.body.props.gap).toEqual({ type: 'param', name: 'size' });
      });
    });
  });

  // ===========================================================================
  // 2.4 Comments in Syntax
  // ===========================================================================

  describe('2.4 Comments in Syntax', () => {
    it('comments between elements are ignored', () => {
      const result = parse(`
        (wire
          ; Main screen
          (screen home "Home"
            ; Header section
            (box :col
              ; Title
              (text "Title")
              ; Buttons
              (button "OK"))))
      `);
      expect(result.success).toBe(true);
    });
  });
});
