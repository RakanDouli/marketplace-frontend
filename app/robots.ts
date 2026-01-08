import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shambay.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',      // User dashboard (private)
          '/api/',            // API routes
          '/messages/',       // Private messages
          '/mock-payment/',   // Payment pages
          '/auth/',           // Auth pages
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
