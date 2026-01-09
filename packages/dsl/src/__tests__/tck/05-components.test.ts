/**
 * TCK: Components
 *
 * Specification for WireScript component definitions and calls.
 * Defines reusable component patterns with parameters.
 */

import { describe, expect, it } from 'vitest';
import { parse } from '../../schema/parser.js';

describe('TCK: Components', () => {
  // ===========================================================================
  // 5.1 Component Definition
  // ===========================================================================

  describe('5.1 Component Definition', () => {
    it('(define name (params) body) defines component', () => {
      const result = parse(`
        (wire
          (define my-card (title)
            (card (text $title)))
          (screen home "Home" (box)))
      `);
      expect(result.success).toBe(true);
      expect(result.document?.components).toHaveLength(1);
      expect(result.document?.components[0].name).toBe('my-card');
    });

    it('component has parameter list', () => {
      const result = parse(`
        (wire
          (define labeled-input (label placeholder)
            (box :col
              (text $label)
              (input :placeholder $placeholder)))
          (screen home "Home" (box)))
      `);
      expect(result.document?.components[0].params).toEqual(['label', 'placeholder']);
    });

    it('component with no params uses empty list', () => {
      const result = parse(`
        (wire
          (define divider ()
            (divider))
          (screen home "Home" (box)))
      `);
      expect(result.document?.components[0].params).toEqual([]);
    });

    it('component body is an element', () => {
      const result = parse(`
        (wire
          (define header-card (title)
            (card :padding 16
              (text $title :high)))
          (screen home "Home" (box)))
      `);
      const body = result.document?.components[0]?.body;
      expect(body?.elementType).toBe('card');
      expect(body?.props.padding).toBe(16);
    });
  });

  // ===========================================================================
  // 5.2 Component Calls
  // ===========================================================================

  describe('5.2 Component Calls', () => {
    it('(component-name :param value) calls component', () => {
      const result = parse(`
        (wire
          (define my-card (title)
            (card (text $title)))
          (screen home "Home"
            (my-card :title "Hello")))
      `);
      const root = result.document?.screens[0].root;
      expect(root?.elementType).toBe('my-card');
      expect(root?.isComponent).toBe(true);
      expect(root?.props.title).toBe('Hello');
    });

    it('component calls pass multiple params', () => {
      const result = parse(`
        (wire
          (define metric-card (label value trend)
            (card
              (text $label)
              (metric :value $value :trend $trend)))
          (screen home "Home"
            (metric-card :label "Revenue" :value "$10K" :trend up)))
      `);
      const root = result.document?.screens[0].root;
      expect(root?.props.label).toBe('Revenue');
      expect(root?.props.value).toBe('$10K');
      expect(root?.props.trend).toBe('up');
    });

    it('component calls may have children', () => {
      const result = parse(`
        (wire
          (define wrapper ()
            (card :padding 16
              (children)))
          (screen home "Home"
            (wrapper
              (text "Child 1")
              (text "Child 2"))))
      `);
      const root = result.document?.screens[0].root;
      expect(root?.children).toHaveLength(2);
    });
  });

  // ===========================================================================
  // 5.3 Parameter References
  // ===========================================================================

  describe('5.3 Parameter References', () => {
    it('$param in content references parameter', () => {
      const result = parse(`
        (wire
          (define title-text (title)
            (text $title :high))
          (screen home "Home" (box)))
      `);
      const body = result.document?.components[0]?.body;
      expect(body?.content).toEqual({ type: 'param', name: 'title' });
    });

    it('$param in props references parameter', () => {
      const result = parse(`
        (wire
          (define spaced-box (gap)
            (box :gap $gap))
          (screen home "Home" (box)))
      `);
      const body = result.document?.components[0]?.body;
      expect(body?.props.gap).toEqual({ type: 'param', name: 'gap' });
    });

    it('$param in nested elements works', () => {
      const result = parse(`
        (wire
          (define card-with-title (title)
            (card
              (box :col
                (text $title))))
          (screen home "Home" (box)))
      `);
      const body = result.document?.components[0]?.body;
      const innerText = body?.children[0]?.type === 'element'
        ? body.children[0].children[0]
        : null;
      expect(innerText?.type === 'element' && innerText.content).toEqual({ type: 'param', name: 'title' });
    });
  });

  // ===========================================================================
  // 5.4 Forward References
  // ===========================================================================

  describe('5.4 Forward References', () => {
    it('component can be used before definition', () => {
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

    it('components can reference each other', () => {
      const result = parse(`
        (wire
          (define wrapper ()
            (box :padding 16 (children)))
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

  // ===========================================================================
  // 5.5 Children Placeholder
  // ===========================================================================

  describe('5.5 Children Placeholder', () => {
    it('(children) placeholder injects call children', () => {
      const result = parse(`
        (wire
          (define container ()
            (box :col :gap 8
              (children)))
          (screen home "Home"
            (container
              (text "A")
              (text "B"))))
      `);
      expect(result.success).toBe(true);
      const root = result.document?.screens[0].root;
      expect(root?.children).toHaveLength(2);
    });

    it('multiple children placeholders work', () => {
      const result = parse(`
        (wire
          (define double ()
            (box :row
              (children)
              (children)))
          (screen home "Home" (box)))
      `);
      expect(result.success).toBe(true);
    });
  });

  // ===========================================================================
  // 5.6 Multiple Components
  // ===========================================================================

  describe('5.6 Multiple Components', () => {
    it('document can have multiple component definitions', () => {
      const result = parse(`
        (wire
          (define header (title)
            (header (text $title :high)))
          (define footer (text)
            (footer (text $text :low)))
          (define card (content)
            (card (text $content)))
          (screen home "Home" (box)))
      `);
      expect(result.document?.components).toHaveLength(3);
    });

    it('components can be nested in calls', () => {
      const result = parse(`
        (wire
          (define outer ()
            (box :padding 16 (children)))
          (define inner (text)
            (card (text $text)))
          (screen home "Home"
            (outer
              (inner :text "Nested"))))
      `);
      expect(result.success).toBe(true);
    });
  });
});
