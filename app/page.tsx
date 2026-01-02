import type { Metadata } from 'next';
import HomeClient from './HomeClient';

// SEO Metadata - Homepage gets the most important metadata
export const metadata: Metadata = {
  title: 'السوق السوري للسيارات | بيع وشراء السيارات في سوريا',
  description: 'أكبر سوق إلكتروني للسيارات في سوريا. ابحث عن سيارتك المثالية، أعلن عن سيارتك للبيع، وتواصل مع البائعين مباشرة. آلاف الإعلانات المحدثة يومياً.',
  keywords: [
    'سيارات للبيع',
    'سيارات سوريا',
    'شراء سيارات',
    'بيع سيارات',
    'سوق السيارات',
    'سيارات مستعملة',
    'سيارات جديدة',
    'معرض سيارات',
    'اسعار السيارات',
    'دمشق سيارات',
    'حلب سيارات',
  ],
  openGraph: {
    title: 'السوق السوري للسيارات | بيع وشراء السيارات في سوريا',
    description: 'أكبر سوق إلكتروني للسيارات في سوريا. آلاف الإعلانات المحدثة يومياً.',
    type: 'website',
    locale: 'ar_SY',
    siteName: 'السوق السوري للسيارات',
    url: 'https://akarkar.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'السوق السوري للسيارات | بيع وشراء السيارات في سوريا',
    description: 'أكبر سوق إلكتروني للسيارات في سوريا. آلاف الإعلانات المحدثة يومياً.',
  },
  alternates: {
    canonical: 'https://akarkar.com',
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
