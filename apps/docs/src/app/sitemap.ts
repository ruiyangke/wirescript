import type { MetadataRoute } from 'next';
import { source } from '@/lib/source';

// Required for static export
export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://wirescript.org';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/preview`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ];

  // Dynamic doc pages from source
  const docPages: MetadataRoute.Sitemap = source.getPages().map((page) => {
    // Normalize URL: no trailing slash
    const slugPath = page.slugs.join('/');
    const url = slugPath ? `${baseUrl}/docs/${slugPath}` : `${baseUrl}/docs`;

    // Determine priority based on page type
    let priority = 0.6;
    let changeFrequency: 'weekly' | 'monthly' | 'yearly' = 'monthly';

    if (page.slugs.length === 0) {
      // /docs index
      priority = 0.9;
      changeFrequency = 'weekly';
    } else if (page.slugs[0] === 'getting-started' || page.slugs[0] === 'language') {
      priority = 0.9;
      changeFrequency = 'weekly';
    } else if (page.slugs[0] === 'components' && page.slugs.length === 1) {
      priority = 0.8;
      changeFrequency = 'weekly';
    } else if (page.slugs[0] === 'tools') {
      priority = 0.7;
      changeFrequency = 'weekly';
    } else if (page.slugs[0] === 'privacy') {
      priority = 0.3;
      changeFrequency = 'yearly';
    }

    return {
      url,
      lastModified: new Date(),
      changeFrequency,
      priority,
    };
  });

  return [...staticPages, ...docPages];
}
