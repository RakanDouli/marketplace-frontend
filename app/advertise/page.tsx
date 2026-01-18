import type { Metadata } from 'next';
import type { AdPackage } from '@/stores/adPackagesStore/types';
import { GET_ACTIVE_AD_PACKAGES_QUERY } from '@/stores/adPackagesStore/adPackagesStore.gql';
import AdvertiseClient from './AdvertiseClient';

// SEO Metadata
export const metadata: Metadata = {
  title: 'أعلن معنا | شام باي',
  description: 'أعلن على منصة شام باي. إعلانات احترافية بمعايير IAB العالمية مع تقارير شفافة وأسعار تنافسية. وصول إلى آلاف المستخدمين في سوريا.',
  keywords: ['إعلانات سوريا', 'تسويق رقمي', 'إعلانات مبوبة', 'حملات إعلانية', 'شام باي'],
  openGraph: {
    title: 'أعلن معنا | شام باي',
    description: 'إعلانات احترافية بمعايير IAB العالمية مع تقارير شفافة وأسعار تنافسية. وصول إلى آلاف المستخدمين في سوريا.',
    type: 'website',
    locale: 'ar_SY',
    siteName: 'شام باي',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'أعلن معنا | شام باي',
    description: 'إعلانات احترافية بمعايير IAB العالمية مع تقارير شفافة وأسعار تنافسية.',
  },
};

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
