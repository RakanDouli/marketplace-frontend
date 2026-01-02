'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Slider, TextSection, Grid, FeatureCard, FAQ } from '@/components/slices';
import { PricingCard } from '@/components/pricing';
import type { FeatureItem } from '@/components/pricing';
import { useUserAuthStore } from '@/stores/userAuthStore';
import type { SubscriptionPlan } from '@/stores/subscriptionPlansStore/types';
import { Package, Image, Video, BarChart, Star, TrendingUp, Shield, Zap, Users, Clock } from 'lucide-react';
import styles from './UserSubscriptions.module.scss';

// Static FAQ items
const faqItems = [
  { question: 'هل يمكنني تغيير الباقة لاحقاً؟', answer: 'نعم، يمكنك ترقية أو تخفيض باقتك في أي وقت. سيتم احتساب الفرق تناسبياً.' },
  { question: 'ماذا يحدث عند انتهاء الاشتراك؟', answer: 'ستنتقل تلقائياً إلى الباقة المجانية وستبقى إعلاناتك الحالية منشورة حسب حدود الباقة المجانية.' },
  { question: 'هل الدفع آمن؟', answer: 'نعم، نستخدم أحدث تقنيات التشفير لحماية بياناتك. جميع المعاملات تتم عبر بوابات دفع موثوقة.' },
  { question: 'هل يمكنني استرداد المبلغ؟', answer: 'نعم، نوفر ضمان استرداد المبلغ خلال 7 أيام من الاشتراك إذا لم تكن راضياً عن الخدمة.' },
  { question: 'ما الفرق بين الباقات؟', answer: 'كل باقة تختلف في عدد الإعلانات المسموحة، عدد الصور، إمكانية رفع فيديو، والأولوية في نتائج البحث. اختر الباقة التي تناسب حجم نشاطك.' },
];

interface UserSubscriptionsClientProps {
  plans: SubscriptionPlan[];
}

export default function UserSubscriptionsClient({ plans }: UserSubscriptionsClientProps) {
  const router = useRouter();
  const { user, userPackage, openAuthModal } = useUserAuthStore();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // Filter plans to only show public ones, sorted by sortOrder
  const publicPlans = plans
    .filter((plan) => plan.isPublic)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Check if any plan has yearly pricing
  const hasYearlyPricing = plans.some(plan => plan.yearlyPrice && plan.yearlyPrice > 0);

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    // Check if user is logged in
    if (!user) {
      openAuthModal('login');
      return;
    }

    // If it's a free plan, just assign it directly
    if (plan.monthlyPrice === 0) {
      router.push('/dashboard/subscription');
      return;
    }

    // For paid plans, go to payment preview page with billing cycle
    router.push(`/payment/subscription/${plan.id}?cycle=${billingCycle}`);
  };

  // Get the user's current subscription name
  const currentSubscriptionName = userPackage?.userSubscription?.name;

  const getFeatureList = (plan: SubscriptionPlan): FeatureItem[] => {
    const features: FeatureItem[] = [];

    // Listings
    features.push({
      icon: <Package size={16} />,
      label: 'عدد الإعلانات',
      value: plan.maxListings === 0 ? 'غير محدود' : `${plan.maxListings} إعلانات`,
      included: true,
    });

    // Photos
    features.push({
      icon: <Image size={16} />,
      label: 'الصور لكل إعلان',
      value: `${plan.maxImagesPerListing} صورة`,
      included: true,
    });

    // Video
    features.push({
      icon: <Video size={16} />,
      label: 'رفع فيديو',
      included: plan.videoAllowed,
    });

    // Priority
    features.push({
      icon: <TrendingUp size={16} />,
      label: 'الأولوية في البحث',
      included: plan.priorityPlacement,
    });

    // Analytics
    features.push({
      icon: <BarChart size={16} />,
      label: 'لوحة التحليلات',
      included: plan.analyticsAccess,
    });

    // Branding
    features.push({
      icon: <Star size={16} />,
      label: 'شعار الشركة',
      included: plan.customBranding,
    });

    return features;
  };

  const getBadge = (plan: SubscriptionPlan): string | undefined => {
    const isCurrentPlan = currentSubscriptionName === plan.name;
    if (isCurrentPlan) {
      return 'خطتك الحالية';
    }
    if (plan.monthlyPrice === 0) {
      return 'مجاني';
    }
    // Highlight the middle/popular plan
    if (plan.sortOrder === 2) {
      return 'الأكثر شعبية';
    }
    return undefined;
  };

  const getBadgeColor = (plan: SubscriptionPlan): 'primary' | 'success' | 'warning' => {
    const isCurrentPlan = currentSubscriptionName === plan.name;
    if (isCurrentPlan) {
      return 'primary';
    }
    if (plan.monthlyPrice === 0) {
      return 'success';
    }
    return 'warning';
  };

  const getButtonText = (plan: SubscriptionPlan): string => {
    const isCurrentPlan = currentSubscriptionName === plan.name;
    if (isCurrentPlan) {
      return 'خطتك الحالية';
    }
    if (plan.monthlyPrice === 0) {
      return 'ابدأ مجاناً';
    }
    return 'اختيار الخطة';
  };

  // Calculate yearly savings percentage
  const getYearlySavings = (plan: SubscriptionPlan): number | null => {
    if (!plan.yearlyPrice || !plan.monthlyPrice || plan.monthlyPrice === 0) {
      return null;
    }
    const yearlyFromMonthly = plan.monthlyPrice * 12;
    const savings = ((yearlyFromMonthly - plan.yearlyPrice) / yearlyFromMonthly) * 100;
    return Math.round(savings);
  };

  return (
    <div className={styles.SubscriptionsPage}>
      <TextSection
        title="باقات الاشتراك - اختر ما يناسبك"
        subtitle="خطط مرنة تناسب جميع احتياجاتك مع ميزات متقدمة للبائعين المحترفين"
        align="center"
        nostyle
      />

      {/* Benefits Section */}
      <Grid title="لماذا تختارنا؟" columns={4} paddingY="lg">
        <FeatureCard
          icon={<Zap size={32} />}
          title="نشر سريع"
          description="انشر إعلاناتك بضغطة زر"
          variant="card"
        />
        <FeatureCard
          icon={<Shield size={32} />}
          title="حماية كاملة"
          description="تحقق من جميع الإعلانات"
          variant="card"
        />
        <FeatureCard
          icon={<Users size={32} />}
          title="وصول أوسع"
          description="آلاف المشترين المحتملين"
          variant="card"
        />
        <FeatureCard
          icon={<Clock size={32} />}
          title="دعم على مدار الساعة"
          description="فريق دعم متاح دائماً"
          variant="card"
        />
      </Grid>

      {/* Plans Slider */}
      {publicPlans.length > 0 && (
        <Slider
          title="الخطط المتاحة"
          action={hasYearlyPricing ? (
            <div className={styles.billingToggle}>
              <button
                className={`${styles.toggleOption} ${billingCycle === 'monthly' ? styles.active : ''}`}
                onClick={() => setBillingCycle('monthly')}
              >
                شهري
              </button>
              <button
                className={`${styles.toggleOption} ${billingCycle === 'yearly' ? styles.active : ''}`}
                onClick={() => setBillingCycle('yearly')}
              >
                سنوي
                <span className={styles.savingsBadge}>وفر أكثر</span>
              </button>
            </div>
          ) : undefined}
          slidesToShow={3}
          slidesToShowTablet={2}
          slidesToShowMobile={1}
          showArrows={true}
          showDots={true}
        >
          {publicPlans.map((plan) => {
            const isCurrentPlan = currentSubscriptionName === plan.name;

            return (
              <PricingCard
                key={plan.id}
                title={plan.title}
                description={plan.description}
                monthlyPrice={plan.monthlyPrice}
                yearlyPrice={plan.yearlyPrice}
                yearlySavingsPercent={getYearlySavings(plan)}
                billingCycle={billingCycle}
                features={getFeatureList(plan)}
                badge={getBadge(plan)}
                badgeColor={getBadgeColor(plan)}
                highlighted={plan.sortOrder === 2}
                buttonText={getButtonText(plan)}
                buttonVariant={isCurrentPlan ? 'outline' : 'primary'}
                onButtonClick={() => handleSelectPlan(plan)}
                disabled={isCurrentPlan}
              />
            );
          })}
        </Slider>
      )}

      {/* FAQ Section */}
      <FAQ title="الأسئلة الشائعة" items={faqItems} />
    </div>
  );
}
