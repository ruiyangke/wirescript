'use client';

import { compile } from '@wirescript/dsl';
import { WireRenderer } from '@wirescript/renderer';
import '@wirescript/renderer/styles.css';
import { useMemo, useState, useEffect } from 'react';

function PreviewContent() {
  const [code, setCode] = useState<string | null>(null);
  const [height, setHeight] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  // Read code and height from URL on client-side only
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code');
    const heightParam = params.get('height');
    if (codeParam) {
      setCode(codeParam);
    }
    if (heightParam) {
      const parsed = parseInt(heightParam, 10);
      if (!isNaN(parsed) && parsed > 0) {
        setHeight(parsed);
      }
    }
    setMounted(true);
  }, []);

  const result = useMemo(() => {
    if (!code) return null;
    try {
      return compile(code);
    } catch (e) {
      return {
        success: false,
        errors: [{ message: e instanceof Error ? e.message : 'Unknown error' }],
      };
    }
  }, [code]);

  // Show loading until mounted on client
  if (!mounted) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        Loading preview...
      </div>
    );
  }

  if (!code || !result) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        No code provided
      </div>
    );
  }

  if (!result.success || !('document' in result) || !result.document) {
    return (
      <div className="p-4 text-red-600">
        <strong>Parse Error:</strong> {result.errors[0]?.message}
      </div>
    );
  }

  const { document } = result;

  return (
    <div className="h-full w-full flex items-center justify-center">
      <WireRenderer
        document={document}
        viewport={{ width: 'auto', height: height || 'auto' }}
      />
    </div>
  );
}

export default function PreviewPage() {
  return <PreviewContent />;
}
