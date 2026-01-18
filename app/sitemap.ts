import { MetadataRoute } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shambay.com';
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// GraphQL query to fetch all active listings
const SITEMAP_LISTINGS_QUERY = `
  query SitemapListings {
    listingsSearch(filter: { status: ACTIVE }, limit: 10000) {
      id
      updatedAt
      category {
        slug
      }
    }
  }
`;

// GraphQL query to fetch all categories
const SITEMAP_CATEGORIES_QUERY = `
  query SitemapCategories {
    categories {
      id
      slug
      updatedAt
    }
  }
`;

async function fetchGraphQL(query: string) {
  try {
    const response = await fetch(`${apiUrl}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
      next: { revalidate: 3600 }, // Cache for 1 hour
    });
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Sitemap fetch error:', error);
    return null;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/advertise`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/user-subscriptions`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
  ];

  // Fetch dynamic content
  const [listingsData, categoriesData] = await Promise.all([
    fetchGraphQL(SITEMAP_LISTINGS_QUERY),
    fetchGraphQL(SITEMAP_CATEGORIES_QUERY),
  ]);

  // Category pages
  const categoryPages: MetadataRoute.Sitemap = (categoriesData?.categories || []).map(
    (category: { slug: string; updatedAt: string }) => ({
      url: `${baseUrl}/${category.slug}`,
      lastModified: new Date(category.updatedAt),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })
  );

  // Listing pages
  const listingPages: MetadataRoute.Sitemap = (listingsData?.listingsSearch || []).map(
    (listing: { id: string; updatedAt: string; category?: { slug: string } }) => ({
      url: `${baseUrl}/${listing.category?.slug || 'listings'}/${listing.id}`,
      lastModified: new Date(listing.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })
  );

  return [...staticPages, ...categoryPages, ...listingPages];
}
