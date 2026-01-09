import { fireEvent, render, screen } from '@testing-library/react';
import type { ElementNode } from '@wirescript/dsl';
import { describe, expect, it, vi } from 'vitest';
import { AutoActiveProvider } from '../AutoActiveContext.js';
import { InteractionProvider } from '../InteractionContext.js';
import { Button } from './Button.js';

function makeElement(overrides: Partial<ElementNode> = {}): ElementNode {
  return {
    type: 'element',
    elementType: 'button',
    props: {},
    children: [],
    ...overrides,
  };
}

function renderWithProviders(element: ElementNode, onScreenChange?: (id: string) => void) {
  return render(
    <InteractionProvider initialScreen="home" onScreenChange={onScreenChange}>
      <Button element={element} />
    </InteractionProvider>
  );
}

function renderWithAutoActive(element: ElementNode, currentScreenId: string) {
  return render(
    <InteractionProvider initialScreen={currentScreenId}>
      <AutoActiveProvider screenId={currentScreenId}>
        <Button element={element} />
      </AutoActiveProvider>
    </InteractionProvider>
  );
}

describe('Button', () => {
  it('should render button with content', () => {
    const element = makeElement({ content: 'Click Me' });
    renderWithProviders(element);
    expect(screen.getByRole('button')).toHaveTextContent('Click Me');
  });

  it('should apply primary variant', () => {
    const element = makeElement({ content: 'Submit', props: { primary: true } });
    renderWithProviders(element);
    const button = screen.getByRole('button');
    // Primary variant maps to 'default' in shadcn
    expect(button.className).toContain('bg-primary');
  });

  it('should apply ghost variant', () => {
    const element = makeElement({ content: 'Cancel', props: { ghost: true } });
    renderWithProviders(element);
    const button = screen.getByRole('button');
    expect(button.className).toContain('hover:bg-accent');
  });

  it('should apply danger variant', () => {
    const element = makeElement({ content: 'Delete', props: { danger: true } });
    renderWithProviders(element);
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-destructive');
  });

  it('should be disabled when :disabled flag is set', () => {
    const element = makeElement({ content: 'Submit', props: { disabled: true } });
    renderWithProviders(element);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should show loading indicator when :loading flag is set', () => {
    const element = makeElement({ content: 'Submit', props: { loading: true } });
    renderWithProviders(element);
    expect(screen.getByRole('button')).toHaveTextContent('⟳');
  });

  it('should apply full width for :full flag', () => {
    const element = makeElement({ content: 'Submit', props: { full: true } });
    renderWithProviders(element);
    const button = screen.getByRole('button');
    expect(button.className).toContain('w-full');
  });

  it('should trigger navigation on click with :to prop', () => {
    const onScreenChange = vi.fn();
    const element = makeElement({ content: 'Go', props: { to: 'other-screen' } });
    renderWithProviders(element, onScreenChange);

    fireEvent.click(screen.getByRole('button'));
    expect(onScreenChange).toHaveBeenCalledWith('other-screen');
  });

  it('should not trigger action when disabled', () => {
    const onScreenChange = vi.fn();
    const element = makeElement({
      content: 'Go',
      props: { disabled: true, to: 'other-screen' },
    });
    renderWithProviders(element, onScreenChange);

    fireEvent.click(screen.getByRole('button'));
    expect(onScreenChange).not.toHaveBeenCalled();
  });

  describe('auto-active', () => {
    // Helper to check for active class (without hover: prefix)
    const hasActiveClass = (className: string) => {
      const classes = className.split(' ');
      return classes.includes('bg-accent') && classes.includes('text-accent-foreground');
    };

    it('should apply active styling when :to matches current screen (structured format)', () => {
      const element = makeElement({
        content: 'Home',
        props: { ghost: true, to: { type: 'screen', id: 'home' } },
      });
      renderWithAutoActive(element, 'home');
      const button = screen.getByRole('button');
      expect(hasActiveClass(button.className)).toBe(true);
    });

    it('should NOT apply active styling when :to does not match current screen', () => {
      const element = makeElement({
        content: 'About',
        props: { ghost: true, to: { type: 'screen', id: 'about' } },
      });
      renderWithAutoActive(element, 'home');
      const button = screen.getByRole('button');
      expect(hasActiveClass(button.className)).toBe(false);
    });

    it('should apply active styling with legacy string format', () => {
      const element = makeElement({
        content: 'Home',
        props: { ghost: true, to: 'home' },
      });
      renderWithAutoActive(element, 'home');
      const button = screen.getByRole('button');
      expect(hasActiveClass(button.className)).toBe(true);
    });

    it('should NOT auto-activate for overlay refs (structured)', () => {
      const element = makeElement({
        content: 'Open Modal',
        props: { ghost: true, to: { type: 'overlay', id: 'my-modal' } },
      });
      renderWithAutoActive(element, 'home');
      const button = screen.getByRole('button');
      expect(hasActiveClass(button.className)).toBe(false);
    });

    it('should NOT auto-activate for overlay refs (string format)', () => {
      const element = makeElement({
        content: 'Open Modal',
        props: { ghost: true, to: '#my-modal' },
      });
      renderWithAutoActive(element, 'home');
      const button = screen.getByRole('button');
      expect(hasActiveClass(button.className)).toBe(false);
    });

    it('should NOT auto-activate for action refs', () => {
      const element = makeElement({
        content: 'Close',
        props: { ghost: true, to: { type: 'action', action: 'close' } },
      });
      renderWithAutoActive(element, 'home');
      const button = screen.getByRole('button');
      expect(hasActiveClass(button.className)).toBe(false);
    });
  });
});
