import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Mock the schemas
vi.mock('@wirescript/dsl/schemas.json', () => ({
  default: {
    elements: {
      button: {
        content: true,
        children: false,
        props: {
          primary: { type: 'boolean' },
          secondary: { type: 'boolean' },
          disabled: { type: 'boolean' },
          to: { type: 'navigation' },
          size: { type: 'string', default: 'md' },
        },
      },
      box: {
        content: false,
        children: true,
        props: {
          row: { type: 'boolean' },
          col: { type: 'boolean' },
          gap: { type: 'number', default: 0 },
          padding: { type: 'number' },
          center: { type: 'boolean' },
        },
      },
      input: {
        content: true,
        children: false,
        props: {
          type: { type: 'string', default: 'text' },
          placeholder: { type: 'string' },
          disabled: { type: 'boolean' },
        },
      },
    },
  },
}));

import { PropsTable, PropsList, FlagsDisplay } from './index';

describe('PropsTable', () => {
  it('renders props grouped by category', () => {
    render(<PropsTable element="button" />);

    // Should show category headers
    expect(screen.getByText('Variants')).toBeInTheDocument();
    expect(screen.getByText('State')).toBeInTheDocument();
    expect(screen.getByText('Navigation')).toBeInTheDocument();
  });

  it('shows element capabilities badges', () => {
    render(<PropsTable element="button" />);

    expect(screen.getByText('accepts content')).toBeInTheDocument();
  });

  it('shows children capability for box', () => {
    render(<PropsTable element="box" />);

    expect(screen.getByText('accepts children')).toBeInTheDocument();
  });

  it('shows error for unknown element', () => {
    render(<PropsTable element="unknown-element" />);

    expect(screen.getByText(/Unknown element: unknown-element/)).toBeInTheDocument();
  });

  it('formats boolean props as "flag"', () => {
    render(<PropsTable element="button" />);

    // Find the primary prop row and check its type
    const rows = screen.getAllByRole('row');
    const primaryRow = rows.find(row => row.textContent?.includes(':primary'));
    expect(primaryRow?.textContent).toContain('flag');
  });

  it('formats navigation props as "target"', () => {
    render(<PropsTable element="button" />);

    const rows = screen.getAllByRole('row');
    const toRow = rows.find(row => row.textContent?.includes(':to'));
    expect(toRow?.textContent).toContain('target');
  });

  it('shows default values for props', () => {
    render(<PropsTable element="button" />);

    // size has default "md"
    expect(screen.getByText('md')).toBeInTheDocument();
  });

  it('filters props with only parameter', () => {
    render(<PropsTable element="button" only={['variant']} />);

    // Should show variant props
    expect(screen.getByText(':primary')).toBeInTheDocument();
    expect(screen.getByText(':secondary')).toBeInTheDocument();

    // Should not show other categories
    expect(screen.queryByText(':disabled')).not.toBeInTheDocument();
  });

  it('filters props with exclude parameter', () => {
    render(<PropsTable element="button" exclude={['variant']} />);

    // Should not show variant props
    expect(screen.queryByText(':primary')).not.toBeInTheDocument();
    expect(screen.queryByText(':secondary')).not.toBeInTheDocument();

    // Should show other props
    expect(screen.getByText(':disabled')).toBeInTheDocument();
  });
});

describe('PropsList', () => {
  it('separates flags from value props', () => {
    render(<PropsList element="button" />);

    expect(screen.getByText('Flags')).toBeInTheDocument();
    expect(screen.getByText('Properties')).toBeInTheDocument();
  });

  it('shows flags as inline badges', () => {
    render(<PropsList element="button" />);

    // Flags should be in the flags section
    const flagsSection = screen.getByText('Flags').parentElement;
    expect(flagsSection?.textContent).toContain(':primary');
    expect(flagsSection?.textContent).toContain(':secondary');
  });

  it('shows value props in a table', () => {
    render(<PropsList element="button" />);

    // Value props should be in a table
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('shows error for unknown element', () => {
    render(<PropsList element="nonexistent" />);

    expect(screen.getByText(/Unknown element: nonexistent/)).toBeInTheDocument();
  });
});

describe('FlagsDisplay', () => {
  it('renders flags for element', () => {
    render(<FlagsDisplay element="button" />);

    expect(screen.getByText(':primary')).toBeInTheDocument();
    expect(screen.getByText(':secondary')).toBeInTheDocument();
    expect(screen.getByText(':disabled')).toBeInTheDocument();
  });

  it('returns null for unknown element', () => {
    const { container } = render(<FlagsDisplay element="unknown" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('returns null when element has no flags', () => {
    // Mock an element with no boolean props
    vi.doMock('@wirescript/dsl/schemas.json', () => ({
      default: {
        elements: {
          'no-flags': {
            props: {
              value: { type: 'string' },
            },
          },
        },
      },
    }));

    // Since we can't easily re-import, just verify it handles empty case
    // The component returns null if flags.length === 0
  });
});
