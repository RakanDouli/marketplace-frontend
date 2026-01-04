import type { Metadata } from 'next';
import type { SubscriptionPlan } from '@/stores/subscriptionPlansStore/types';
import { GET_PUBLIC_SUBSCRIPTION_PLANS_QUERY } from '@/stores/subscriptionPlansStore/subscriptionPlansStore.gql';
import UserSubscriptionsClient from './UserSubscriptionsClient';

// SEO Metadata
export const metadata: Metadata = {
  title: 'باقات الاشتراك | السوق السوري للسيارات',
  description: 'اختر باقة الاشتراك المناسبة لك. خطط مرنة للأفراد والشركات مع ميزات متقدمة للبائعين المحترفين. ابدأ مجاناً أو اختر باقة مدفوعة للحصول على المزيد من المميزات.',
  keywords: ['باقات اشتراك', 'خطط اشتراك', 'بيع سيارات', 'إعلانات سيارات', 'اشتراك مجاني'],
  openGraph: {
    title: 'باقات الاشتراك | السوق السوري للسيارات',
    description: 'خطط مرنة تناسب جميع احتياجاتك مع ميزات متقدمة للبائعين المحترفين. ابدأ مجاناً أو اختر باقة مدفوعة.',
    type: 'website',
    locale: 'ar_SY',
    siteName: 'السوق السوري للسيارات',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'باقات الاشتراك | السوق السوري للسيارات',
    description: 'خطط مرنة تناسب جميع احتياجاتك مع ميزات متقدمة للبائعين المحترفين.',
  },
};

// Server-side data fetching
async function fetchSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  try {
    const response = await fetch(`${apiUrl}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: GET_PUBLIC_SUBSCRIPTION_PLANS_QUERY }),
      next: { revalidate: 3600 }, // Cache for 1 hour (ISR)
    });

    if (!response.ok) {
      console.error('Failed to fetch subscription plans:', response.status);
      return [];
    }

    const data = await response.json();
    return data.data?.userSubscriptions || [];
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return [];
  }
}

// Server Component
export default async function UserSubscriptionsPage() {
  const plans = await fetchSubscriptionPlans();

  return <UserSubscriptionsClient plans={plans} />;
}
