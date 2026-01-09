import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Provider } from '@/components/provider';
import './global.css';

const inter = Inter({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'WireScript - Wireframes that live with your docs',
    template: '%s | WireScript',
  },
  description:
    'WireScript is a Lisp dialect for creating wireframes that embed directly into Markdown. Pure text, AI-native, perfect for documentation.',
  keywords: ['wireframe', 'prototyping', 'markdown', 'lisp', 'documentation', 'AI', 'design'],
  authors: [{ name: 'Ruiyang Ke' }],
  creator: 'Ruiyang Ke',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://wirescript.dev',
    siteName: 'WireScript',
    title: 'WireScript - Wireframes that live with your docs',
    description:
      'A Lisp dialect for creating wireframes that embed directly into Markdown. Pure text, AI-native, perfect for documentation.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WireScript - Wireframes that live with your docs',
    description:
      'A Lisp dialect for creating wireframes that embed directly into Markdown. Pure text, AI-native, perfect for documentation.',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
