import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ListingDetailClient } from './ListingDetailClient';
import { LISTING_BY_ID_QUERY } from '@/stores/listingsStore/listingsStore.gql';
import { urlSegmentToListingType } from '@/utils/categoryRouting';
import type { Listing } from '@/types/listing';

// Server-side fetch function (no browser APIs like localStorage)
async function fetchListingSSR(id: string): Promise<Listing | null> {
  const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: LISTING_BY_ID_QUERY,
        variables: { id },
      }),
      // Next.js 14+ caching options
      next: {
        revalidate: 60, // Cache for 60 seconds (ISR)
        tags: [`listing-${id}`], // For on-demand revalidation
      },
    });

    if (!response.ok) {
      console.error(`SSR Fetch Error: ${response.status} ${response.statusText}`);
      return null;
    }

    const result = await response.json();

    if (result.errors) {
      console.error('GraphQL Errors:', result.errors);
      return null;
    }

    const listing = result.data?.listing;
    if (!listing) return null;

    // Parse JSON fields that come as strings from GraphQL
    if (listing.specsDisplay && typeof listing.specsDisplay === 'string') {
      try {
        listing.specsDisplay = JSON.parse(listing.specsDisplay);
      } catch (e) {
        console.error('Failed to parse specsDisplay:', e);
        listing.specsDisplay = {};
      }
    }
    if (listing.specs && typeof listing.specs === 'string') {
      try {
        listing.specs = JSON.parse(listing.specs);
      } catch (e) {
        listing.specs = {};
      }
    }

    return listing;
  } catch (error) {
    console.error('SSR Fetch Exception:', error);
    return null;
  }
}

// Generate Cloudflare image URL for og:image
function getImageUrl(imageKey: string | undefined): string {
  if (!imageKey) {
    return 'https://shambay.com/og-default.jpg'; // Default OG image
  }

  const accountHash = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH;
  if (!accountHash) {
    return imageKey; // Fallback to raw key
  }

  return `https://imagedelivery.net/${accountHash}/${imageKey}/public`;
}

// Generate metadata for SEO (runs on server)
export async function generateMetadata({
  params
}: {
  params: Promise<{ listingId: string; category: string; listingType: string }>
}): Promise<Metadata> {
  const { listingId, listingType } = await params;

  // Validate listingType
  const parsedListingType = urlSegmentToListingType(listingType);
  if (!parsedListingType) {
    return {
      title: 'صفحة غير موجودة | السوق السوري',
    };
  }

  const listing = await fetchListingSSR(listingId);

  if (!listing) {
    return {
      title: 'الإعلان غير موجود | السوق السوري للسيارات',
      description: 'لم يتم العثور على الإعلان المطلوب',
    };
  }

  const title = `${listing.title} | السوق السوري للسيارات`;
  const description = listing.description?.slice(0, 160) ||
    `${listing.title} - اعثر على أفضل العروض في السوق السوري للسيارات`;
  const imageUrl = getImageUrl(listing.imageKeys?.[0]);
  const price = listing.priceMinor ? `$${listing.priceMinor.toLocaleString()}` : '';

  return {
    title,
    description,
    keywords: [
      listing.title,
      listing.category?.name || '',
      'سيارات سوريا',
      'سيارات للبيع',
      listing.location?.province || '',
      listing.location?.city || '',
    ].filter(Boolean),
    openGraph: {
      title,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: listing.title,
        },
      ],
      type: 'website',
      locale: 'ar_SY',
      siteName: 'السوق السوري للسيارات',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    other: {
      'product:price:amount': price,
      'product:price:currency': 'USD',
    },
  };
}

// Page params interface
interface PageProps {
  params: Promise<{ listingId: string; category: string; listingType: string }>;
}

// Main page component (Server Component)
export default async function ListingDetailPage({ params }: PageProps) {
  const { listingId, category, listingType } = await params;

  // Validate listingType (must be "sell" or "rent")
  const parsedListingType = urlSegmentToListingType(listingType);
  if (!parsedListingType) {
    notFound();
  }

  // Fetch listing data on server
  const listing = await fetchListingSSR(listingId);

  // If listing not found, trigger Next.js 404 page
  if (!listing) {
    notFound();
  }

  // Pass pre-fetched listing to client component
  return (
    <ListingDetailClient
      listing={listing}
      listingId={listingId}
      categorySlug={category}
      listingTypeSlug={listingType}
    />
  );
}
