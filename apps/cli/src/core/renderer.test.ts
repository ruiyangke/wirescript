/**
 * Tests for the SSR renderer
 */

import { describe, expect, it } from 'vitest';
import { compile } from '@wirescript/dsl';
import { renderScreen } from './renderer.js';

// Helper to compile WireScript and get the document
function compileWire(source: string) {
  const result = compile(source);
  if (!result.success || !result.document) {
    throw new Error(`Compilation failed: ${result.errors.map((e) => e.message).join(', ')}`);
  }
  return result.document;
}

describe('renderScreen', () => {
  it('renders a simple screen with text', () => {
    const document = compileWire(`
      (wire
        (meta :title "Test")
        (screen home "Home"
          (text "Hello World")))
    `);

    const result = renderScreen(document, {});

    expect(result.screenId).toBe('home');
    expect(result.screenName).toBe('Home');
    expect(result.viewport).toBe('desktop');
    expect(result.width).toBe(1280);
    expect(result.height).toBe(800);
    expect(result.html).toContain('Hello World');
  });

  it('renders a button with primary variant', () => {
    const document = compileWire(`
      (wire
        (meta :title "Test")
        (screen buttons
          (button "Click me" :primary)))
    `);

    const result = renderScreen(document, {});

    expect(result.html).toContain('Click me');
    expect(result.html).toContain('bg-primary');
  });

  it('renders a card with children', () => {
    const document = compileWire(`
      (wire
        (meta :title "Test")
        (screen card-test
          (card
            (text "Card Title" :high)
            (text "Card description" :low))))
    `);

    const result = renderScreen(document, {});

    expect(result.html).toContain('Card Title');
    expect(result.html).toContain('Card description');
    expect(result.html).toContain('bg-card');
    // shadcn Card uses 'border' class (color from CSS variables)
    expect(result.html).toContain('border');
  });

  it('uses mobile dimensions for mobile viewport', () => {
    const document = compileWire(`
      (wire
        (meta :title "Test")
        (screen mobile :mobile
          (text "Mobile content")))
    `);

    const result = renderScreen(document, {});

    expect(result.width).toBe(375);
    expect(result.height).toBe(667);
  });

  it('throws RenderError when screen not found', () => {
    const document = compileWire(`
      (wire
        (meta :title "Test")
        (screen home
          (text "Home")))
    `);

    expect(() => renderScreen(document, { screenId: 'nonexistent' })).toThrow(
      'Screen not found'
    );
  });

  it('renders input with placeholder', () => {
    const document = compileWire(`
      (wire
        (meta :title "Test")
        (screen form
          (input "Enter your name")))
    `);

    const result = renderScreen(document, {});

    expect(result.html).toContain('Enter your name');
    expect(result.html).toContain('<input');
  });

  it('renders badge with variant', () => {
    const document = compileWire(`
      (wire
        (meta :title "Test")
        (screen badges
          (badge "New" :success)))
    `);

    const result = renderScreen(document, {});

    expect(result.html).toContain('New');
    expect(result.html).toContain('bg-success');
  });
});
