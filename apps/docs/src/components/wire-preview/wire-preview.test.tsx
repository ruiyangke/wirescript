import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock shiki
vi.mock('shiki', () => ({
  codeToHtml: vi.fn().mockResolvedValue('<pre><code>mock code</code></pre>'),
}));

// Mock the grammar JSON
vi.mock('../../../wirescript.tmLanguage.json', () => ({ default: {} }));

import { WirePreview } from './index';

describe('WirePreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('renders preview iframe with correct src', async () => {
    const code = '(text "Hello")';
    render(<WirePreview code={code} />);

    const iframe = screen.getByTitle('WireScript Preview');
    expect(iframe).toBeInTheDocument();

    // Check that the iframe src contains the wrapped code
    const src = iframe.getAttribute('src');
    expect(src).toContain('/preview?code=');
    expect(src).toContain(encodeURIComponent('(wire'));
  });

  it('wraps bare component code in wire document', async () => {
    const code = '(button "Click me")';
    render(<WirePreview code={code} />);

    const iframe = screen.getByTitle('WireScript Preview');
    const src = iframe.getAttribute('src') || '';
    const decodedSrc = decodeURIComponent(src);

    // Should wrap in wire document with screen and box
    expect(decodedSrc).toContain('(wire');
    expect(decodedSrc).toContain('(screen preview');
    expect(decodedSrc).toContain('(box :col :gap 16 :padding 16');
    expect(decodedSrc).toContain('(button "Click me")');
  });

  it('does not wrap code that already starts with (wire', async () => {
    const code = '(wire (screen main "Test" (text "Hello")))';
    render(<WirePreview code={code} />);

    const iframe = screen.getByTitle('WireScript Preview');
    const src = iframe.getAttribute('src') || '';
    const decodedSrc = decodeURIComponent(src);

    // Should not double-wrap
    expect(decodedSrc).not.toContain('(wire\n  (screen preview');
    expect(decodedSrc).toContain('(wire (screen main');
  });

  it('uses default height of 200px', () => {
    render(<WirePreview code={'(text "Test")'} />);

    const previewContainer = screen.getByTitle('WireScript Preview').parentElement;
    expect(previewContainer).toHaveStyle({ height: '200px' });
  });

  it('uses custom previewHeight when provided', () => {
    render(<WirePreview code={'(text "Test")'} previewHeight={400} />);

    const previewContainer = screen.getByTitle('WireScript Preview').parentElement;
    expect(previewContainer).toHaveStyle({ height: '400px' });
  });

  it('renders copy button', async () => {
    render(<WirePreview code={'(text "Test")'} />);

    await waitFor(() => {
      const copyButton = screen.getByRole('button', { name: /copy code/i });
      expect(copyButton).toBeInTheDocument();
    });
  });

  it('copies code to clipboard when copy button is clicked', async () => {
    const code = '(text "Hello")';
    render(<WirePreview code={code} />);

    await waitFor(() => {
      const copyButton = screen.getByRole('button', { name: /copy code/i });
      fireEvent.click(copyButton);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(code);
  });

  it('shows syntax highlighted code', async () => {
    render(<WirePreview code={'(text "Test")'} />);

    await waitFor(() => {
      // The mocked codeToHtml returns mock HTML
      expect(screen.getByText('mock code')).toBeInTheDocument();
    });
  });
});
