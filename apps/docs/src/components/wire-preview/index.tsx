'use client';

import { Check, Clipboard, ExternalLink } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { codeToHtml } from 'shiki';

import wireGrammar from '../../../wirescript.tmLanguage.json';

interface WirePreviewProps {
  code: string;
  previewHeight?: number;
}

/** Wrap bare component code in a wire document structure */
function wrapInWireDocument(code: string): string {
  const trimmed = code.trim();
  if (trimmed.startsWith('(wire')) {
    return trimmed;
  }
  return `(wire
  (screen preview "Preview" :desktop
    (box :col :gap 16 :padding 16
      ${trimmed})))`;
}

export function WirePreview({ code, previewHeight = 200 }: WirePreviewProps) {
  const [highlightedCode, setHighlightedCode] = useState('');
  const [copied, setCopied] = useState(false);

  const sourceCode = wrapInWireDocument(code);

  const previewUrl = useMemo(() => {
    return `/preview?code=${encodeURIComponent(sourceCode)}&height=${previewHeight}`;
  }, [sourceCode, previewHeight]);

  useEffect(() => {
    codeToHtml(code, {
      lang: wireGrammar as never,
      themes: { light: 'catppuccin-latte', dark: 'dracula' },
    })
      .then(setHighlightedCode)
      .catch(() => setHighlightedCode(`<pre><code>${code}</code></pre>`));
  }, [code]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <figure className="wire-preview not-prose my-4 overflow-hidden rounded-xl border bg-fd-card text-sm shadow-sm">
      {/* Preview */}
      <div className="relative bg-fd-background" style={{ height: previewHeight }}>
        <a
          href={`https://playground.wirescript.org/?code=${encodeURIComponent(sourceCode)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={[
            'absolute right-2 top-2 z-10',
            'inline-flex items-center gap-1.5 rounded-md px-2 py-1',
            'text-xs font-medium text-fd-muted-foreground',
            'bg-fd-background/80 backdrop-blur-sm border border-fd-border',
            'transition-colors duration-100',
            'hover:text-fd-accent-foreground hover:bg-fd-accent',
          ].join(' ')}
        >
          Try it
          <ExternalLink className="size-3" />
        </a>
        <iframe
          src={previewUrl}
          title="WireScript Preview"
          className="block h-full w-full border-0"
        />
      </div>

      {/* Code */}
      <div
        className={[
          'relative max-h-[600px] overflow-auto border-t border-fd-border',
          'bg-fd-secondary/50 py-3.5 text-[0.8125rem] fd-scroll-container',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-fd-ring',
        ].join(' ')}
      >
        <button
          type="button"
          onClick={handleCopy}
          data-checked={copied || undefined}
          aria-label="Copy code"
          className={[
            'absolute right-2 top-2 z-10',
            'inline-flex items-center justify-center rounded-md p-1',
            'text-sm font-medium text-fd-muted-foreground',
            'transition-colors duration-100',
            'hover:text-fd-accent-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring',
            'disabled:pointer-events-none disabled:opacity-50',
            'data-[checked]:text-fd-accent-foreground',
            '[&_svg]:size-4',
          ].join(' ')}
        >
          {copied ? <Check /> : <Clipboard />}
        </button>
        <pre
          className={[
            'px-4 [&>pre]:!m-0 [&>pre]:!bg-transparent [&>pre]:!p-0',
            // Line numbers via CSS counters
            '[counter-reset:line]',
            '[&_.line]:before:content-[counter(line)] [&_.line]:before:[counter-increment:line]',
            '[&_.line]:before:inline-block [&_.line]:before:w-8 [&_.line]:before:mr-4',
            '[&_.line]:before:text-right [&_.line]:before:text-fd-muted-foreground/50',
          ].join(' ')}
          // biome-ignore lint/security/noDangerouslySetInnerHtml: Rendering syntax-highlighted code
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
        />
      </div>
    </figure>
  );
}
