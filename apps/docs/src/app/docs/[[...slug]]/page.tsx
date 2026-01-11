import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPageImage, source } from '@/lib/source';
import { getMDXComponents } from '@/mdx-components';

export default async function Page(props: PageProps<'/docs/[[...slug]]'>) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const pageUrl = `https://wirescript.org/docs/${page.slugs.join('/')}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: page.data.title,
    description: page.data.description,
    url: pageUrl,
    datePublished: '2025-01-01',
    dateModified: new Date().toISOString().split('T')[0],
    author: {
      '@type': 'Person',
      name: 'Ruiyang Ke',
    },
    publisher: {
      '@type': 'Organization',
      name: 'WireScript',
      url: 'https://wirescript.org',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': pageUrl,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DocsPage
        toc={page.data.toc}
        full={page.data.full}
        tableOfContent={{ style: 'clerk' }}
        tableOfContentPopover={{ style: 'clerk' }}
      >
        <DocsTitle>{page.data.title}</DocsTitle>
        <DocsDescription>{page.data.description}</DocsDescription>
        <DocsBody>
          <MDX components={getMDXComponents()} />
        </DocsBody>
      </DocsPage>
    </>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: PageProps<'/docs/[[...slug]]'>): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const ogImage = getPageImage(page).url;
  const pageUrl = `/docs/${page.slugs.join('/')}`;

  return {
    title: page.data.title,
    description: page.data.description,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      type: 'article',
      siteName: 'WireScript',
      title: page.data.title,
      description: page.data.description,
      url: pageUrl,
      images: ogImage,
    },
    twitter: {
      card: 'summary_large_image',
      title: page.data.title,
      description: page.data.description,
      images: ogImage,
    },
  };
}
