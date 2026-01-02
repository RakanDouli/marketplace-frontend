import type { Metadata } from 'next';
import type { AdPackage } from '@/stores/adPackagesStore/types';
import AdvertiseClient from './AdvertiseClient';

// SEO Metadata
export const metadata: Metadata = {
  title: 'أعلن معنا | السوق السوري للسيارات',
  description: 'أعلن على منصة السوق السوري للسيارات. إعلانات احترافية بمعايير IAB العالمية مع تقارير شفافة وأسعار تنافسية. وصول إلى آلاف المستخدمين المهتمين بالسيارات.',
  keywords: ['إعلانات سيارات', 'تسويق سيارات', 'إعلانات سورية', 'حملات إعلانية', 'تسويق رقمي'],
  openGraph: {
    title: 'أعلن معنا | السوق السوري للسيارات',
    description: 'إعلانات احترافية بمعايير IAB العالمية مع تقارير شفافة وأسعار تنافسية. وصول إلى آلاف المستخدمين المهتمين بالسيارات.',
    type: 'website',
    locale: 'ar_SY',
    siteName: 'السوق السوري للسيارات',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'أعلن معنا | السوق السوري للسيارات',
    description: 'إعلانات احترافية بمعايير IAB العالمية مع تقارير شفافة وأسعار تنافسية.',
  },
};

// GraphQL query for ad packages
const GET_ACTIVE_AD_PACKAGES_QUERY = `
  query GetActiveAdPackages {
    activeAdPackages {
      id
      packageName
      description
      adType
      placement
      format
      dimensions {
        desktop {
          width
          height
        }
        mobile {
          width
          height
        }
      }
      durationDays
      impressionLimit
      basePrice
      currency
      mediaRequirements
      isActive
    }
  }
`;

// Server-side data fetching
async function fetchAdPackages(): Promise<AdPackage[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  try {
    const response = await fetch(`${apiUrl}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: GET_ACTIVE_AD_PACKAGES_QUERY }),
      next: { revalidate: 3600 }, // Cache for 1 hour (ISR)
    });

    if (!response.ok) {
      console.error('Failed to fetch ad packages:', response.status);
      return [];
    }

    const data = await response.json();
    return data.data?.activeAdPackages || [];
  } catch (error) {
    console.error('Error fetching ad packages:', error);
    return [];
  }
}

// Server Component
export default async function AdvertisePage() {
  const packages = await fetchAdPackages();

  return <AdvertiseClient packages={packages} />;
}
