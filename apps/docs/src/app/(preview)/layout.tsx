import type { ReactNode } from 'react';

export default function PreviewRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning style={{ height: '100%' }}>
      <body style={{ margin: 0, padding: 0, overflow: 'hidden', height: '100%' }}>
        {children}
      </body>
    </html>
  );
}
