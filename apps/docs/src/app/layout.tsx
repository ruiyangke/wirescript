import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Provider } from '@/components/provider';
import './global.css';

const inter = Inter({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://wirescript.org'),
  alternates: {
    canonical: '/',
  },
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
    url: 'https://wirescript.org',
    siteName: 'WireScript',
    title: 'WireScript - Wireframes that live with your docs',
    description:
      'A Lisp dialect for creating wireframes that embed directly into Markdown. Pure text, AI-native, perfect for documentation.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'WireScript - Wireframes that live with your docs',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WireScript - Wireframes that live with your docs',
    description:
      'A Lisp dialect for creating wireframes that embed directly into Markdown. Pure text, AI-native, perfect for documentation.',
    images: ['/og-image.png'],
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

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://wirescript.org/#website',
      url: 'https://wirescript.org',
      name: 'WireScript',
      description:
        'A Lisp dialect for creating wireframes that embed directly into Markdown. Pure text, AI-native, perfect for documentation.',
      publisher: {
        '@type': 'Person',
        name: 'Ruiyang Ke',
      },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://wirescript.org/#software',
      name: 'WireScript',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Cross-platform',
      description:
        'A Lisp dialect for creating wireframes that embed directly into Markdown. Pure text, AI-native, perfect for documentation.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      author: {
        '@type': 'Person',
        name: 'Ruiyang Ke',
      },
    },
  ],
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="flex flex-col min-h-screen">
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
