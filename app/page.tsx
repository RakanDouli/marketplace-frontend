import type { Metadata } from 'next';
import HomeClient from './HomeClient';
import { Category } from '@/types/listing';
import { ListingType } from '@/common/enums';

// SEO Metadata - Homepage gets the most important metadata
export const metadata: Metadata = {
  title: 'شام باي | البيع والشراء في سوريا',
  description: 'أكبر سوق إلكتروني في سوريا. ابحث عن ما تريد، أعلن للبيع، وتواصل مع البائعين مباشرة. آلاف الإعلانات المحدثة يومياً.',
  keywords: [
    'إعلانات سوريا',
    'بيع وشراء',
    'سوق سوريا',
    'إعلانات مبوبة',
    'شام باي',
    'shambay',
    'سوريا',
    'دمشق',
    'حلب',
  ],
  openGraph: {
    title: 'شام باي | البيع والشراء في سوريا',
    description: 'أكبر سوق إلكتروني في سوريا. آلاف الإعلانات المحدثة يومياً.',
    type: 'website',
    locale: 'ar_SY',
    siteName: 'شام باي',
    url: 'https://shambay.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'شام باي | البيع والشراء في سوريا',
    description: 'أكبر سوق إلكتروني في سوريا. آلاف الإعلانات المحدثة يومياً.',
  },
  alternates: {
    canonical: 'https://shambay.com',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

// GraphQL query for categories
const CATEGORIES_QUERY = `
  query GetCategories {
    categories {
      id
      name
      nameAr
      slug
      isActive
      icon
      supportedListingTypes
    }
  }
`;

// Server-side fetch for categories
async function fetchCategories(): Promise<Category[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  try {
    const response = await fetch(`${apiUrl}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: CATEGORIES_QUERY,
      }),
      // Revalidate every 60 seconds (ISR-like behavior)
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      console.error('Failed to fetch categories:', response.status);
      return [];
    }

    const data = await response.json();

    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
      return [];
    }

    // Map to Category type
    return (data.data?.categories || []).map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      nameAr: cat.nameAr || cat.name,
      slug: cat.slug,
      isActive: cat.isActive,
      icon: cat.icon,
      supportedListingTypes: (cat.supportedListingTypes || [ListingType.SALE]) as ListingType[],
      level: 0,
      createdAt: '',
      updatedAt: '',
    }));
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

// Server Component - fetches categories server-side for instant display
export default async function HomePage() {
  const categories = await fetchCategories();

  return <HomeClient categories={categories} />;
}
