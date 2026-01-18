import type { Metadata } from 'next';
import HomeClient from './HomeClient';

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

// Server Component - just renders the Client Component
// The homepage uses client-side data fetching via stores (categories, listings)
// which already have good caching. The main SSR benefit here is SEO metadata.
export default function HomePage() {
  return <HomeClient />;
}
