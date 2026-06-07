import type { MetadataRoute } from 'next';
import { publicEnv } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/p/'],
      disallow: ['/dashboard', '/properties', '/marketing', '/landing-pages', '/search', '/api'],
    },
    sitemap: `${publicEnv.siteUrl}/sitemap.xml`,
  };
}
