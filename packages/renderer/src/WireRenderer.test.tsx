import { fireEvent, render, screen } from '@testing-library/react';
import { compile } from '@wirescript/dsl';
import { describe, expect, it, vi } from 'vitest';
import { getScreenIds, getScreenInfo, WireRenderer } from './WireRenderer.js';

function compileAndRender(
  source: string,
  screenId?: string,
  onScreenChange?: (id: string) => void
) {
  const result = compile(source);
  if (!result.success || !result.document) {
    throw new Error(`Compile failed: ${result.errors.map((e) => e.message).join(', ')}`);
  }
  return render(
    <WireRenderer document={result.document} screenId={screenId} onScreenChange={onScreenChange} />
  );
}

describe('WireRenderer', () => {
  it('should render a simple screen', () => {
    compileAndRender(`
      (wire
        (screen home "Home"
          (box (text "Hello World"))))
    `);

    expect(screen.getByText('Hello World')).toBeDefined();
  });

  it('should render nested elements', () => {
    compileAndRender(`
      (wire
        (screen home "Home"
          (box :col
            (text "Title" :high)
            (text "Subtitle" :low)
            (button "Click Me" :primary))))
    `);

    expect(screen.getByText('Title')).toBeDefined();
    expect(screen.getByText('Subtitle')).toBeDefined();
    expect(screen.getByRole('button')).toHaveTextContent('Click Me');
  });

  it('should render the first screen by default', () => {
    compileAndRender(`
      (wire
        (screen first "First" (text "First Screen"))
        (screen second "Second" (text "Second Screen")))
    `);

    expect(screen.getByText('First Screen')).toBeDefined();
    expect(screen.queryByText('Second Screen')).toBeNull();
  });

  it('should render specific screen when screenId is provided', () => {
    compileAndRender(
      `
      (wire
        (screen first "First" (text "First Screen"))
        (screen second "Second" (text "Second Screen")))
    `,
      'second'
    );

    expect(screen.queryByText('First Screen')).toBeNull();
    expect(screen.getByText('Second Screen')).toBeDefined();
  });

  it('should fall back to first screen for non-existent screenId', () => {
    const result = compile(`
      (wire
        (screen home "Home" (text "Hello")))
    `);

    render(<WireRenderer document={result.document!} screenId="nonexistent" />);
    // Should gracefully fall back to first screen instead of showing error
    expect(screen.getByText('Hello')).toBeDefined();
  });

  it('should handle screen navigation', () => {
    const onScreenChange = vi.fn();
    compileAndRender(
      `
      (wire
        (screen home "Home"
          (button "Go to About" :to about))
        (screen about "About"
          (text "About Page")))
    `,
      'home',
      onScreenChange
    );

    fireEvent.click(screen.getByRole('button'));
    expect(onScreenChange).toHaveBeenCalledWith('about');
  });

  it('should render components', () => {
    compileAndRender(`
      (wire
        (define greeting (name)
          (card :padding 16
            (text $name :high)))
        (screen home "Home"
          (box :col
            (greeting :name "Hello")
            (greeting :name "World"))))
    `);

    expect(screen.getByText('Hello')).toBeDefined();
    expect(screen.getByText('World')).toBeDefined();
  });

  it('should render with layout', () => {
    compileAndRender(`
      (wire
        (layout main
          (box :col
            (text "Header" :high)
            (slot)
            (text "Footer" :low)))
        (screen home "Home" :layout main
          (text "Content")))
    `);

    expect(screen.getByText('Header')).toBeDefined();
    expect(screen.getByText('Content')).toBeDefined();
    expect(screen.getByText('Footer')).toBeDefined();
  });

  it('should render repeat blocks', () => {
    compileAndRender(`
      (wire
        (screen home "Home"
          (box :col
            (repeat :count 3
              (text "Item")))))
    `);

    const items = screen.getAllByText('Item');
    expect(items).toHaveLength(3);
  });

  it('should apply viewport dimensions', () => {
    const result = compile(`
      (wire
        (screen home "Home" :mobile
          (text "Mobile")))
    `);

    const { container } = render(<WireRenderer document={result.document!} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.width).toBe('375px');
  });

  it('should apply custom viewport', () => {
    const result = compile(`
      (wire
        (screen home "Home"
          (text "Custom")))
    `);

    const { container } = render(
      <WireRenderer document={result.document!} viewport={{ width: 800, height: 600 }} />
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.width).toBe('800px');
    expect(wrapper.style.height).toBe('600px');
  });
});

describe('getScreenIds', () => {
  it('should return all screen IDs', () => {
    const result = compile(`
      (wire
        (screen home "Home" (box))
        (screen about "About" (box))
        (screen contact "Contact" (box)))
    `);

    const ids = getScreenIds(result.document!);
    expect(ids).toEqual(['home', 'about', 'contact']);
  });
});

describe('getScreenInfo', () => {
  it('should return screen info', () => {
    const result = compile(`
      (wire
        (screen dashboard "Dashboard" :desktop
          (box)
          (modal :id "settings" (text "Settings"))))
    `);

    const info = getScreenInfo(result.document!, 'dashboard');
    expect(info).toEqual({
      id: 'dashboard',
      name: 'Dashboard',
      viewport: 'desktop',
      overlayCount: 1,
    });
  });

  it('should return null for non-existent screen', () => {
    const result = compile(`
      (wire
        (screen home "Home" (box)))
    `);

    const info = getScreenInfo(result.document!, 'nonexistent');
    expect(info).toBeNull();
  });
});
