import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the WireRenderer to avoid complex dependency chain
vi.mock('@wirescript/renderer', () => ({
  WireRenderer: ({ document }: { document: unknown }) => (
    <div data-testid="wire-renderer">Rendered: {JSON.stringify(document)}</div>
  ),
}));

// Mock the CSS import
vi.mock('@wirescript/renderer/styles.css', () => ({}));

// Import after mocks
import PreviewPage from './page';

describe('PreviewPage', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    // Mock window.location with a proper Location-like object
    (window as { location?: Location }).location = undefined;
    window.location = {
      ...originalLocation,
      search: '',
      href: 'http://localhost:3000/preview',
    } as Location;
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  it('shows loading state initially', () => {
    render(<PreviewPage />);
    expect(screen.getByText('Loading preview...')).toBeInTheDocument();
  });

  it('shows "No code provided" when no code param', async () => {
    window.location.search = '';
    render(<PreviewPage />);

    await waitFor(() => {
      expect(screen.getByText('No code provided')).toBeInTheDocument();
    });
  });

  it('shows "No code provided" when code param is empty', async () => {
    window.location.search = '?code=';
    render(<PreviewPage />);

    await waitFor(() => {
      expect(screen.getByText('No code provided')).toBeInTheDocument();
    });
  });

  it('shows parse error for invalid WireScript code', async () => {
    const invalidCode = encodeURIComponent('(invalid syntax');
    window.location.search = `?code=${invalidCode}`;
    render(<PreviewPage />);

    await waitFor(() => {
      expect(screen.getByText(/Parse Error:/)).toBeInTheDocument();
    });
  });

  it('renders WireRenderer for valid WireScript code', async () => {
    const validCode = encodeURIComponent('(wire (screen main "Test" (text "Hello")))');
    window.location.search = `?code=${validCode}`;
    render(<PreviewPage />);

    await waitFor(() => {
      expect(screen.getByTestId('wire-renderer')).toBeInTheDocument();
    });
  });

  it('decodes URL-encoded code correctly', async () => {
    // Test with special characters that need encoding
    const codeWithSpecialChars = '(wire (screen main "Test" (text "Hello World")))';
    const encodedCode = encodeURIComponent(codeWithSpecialChars);
    window.location.search = `?code=${encodedCode}`;
    render(<PreviewPage />);

    await waitFor(() => {
      expect(screen.getByTestId('wire-renderer')).toBeInTheDocument();
    });
  });

  it('handles code with special WireScript syntax', async () => {
    const code = '(wire (screen main "Test" (box :col :gap 16 (text "Hello" :high))))';
    window.location.search = `?code=${encodeURIComponent(code)}`;
    render(<PreviewPage />);

    await waitFor(() => {
      expect(screen.getByTestId('wire-renderer')).toBeInTheDocument();
    });
  });
});
