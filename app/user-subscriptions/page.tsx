"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Container, Text, Loading } from "@/components/slices";
import { PricingCard } from "@/components/pricing";
import type { FeatureItem } from "@/components/pricing";
import { useUserAuthStore } from "@/stores/userAuthStore";
import { useSubscriptionPlansStore } from "@/stores/subscriptionPlansStore";
import type { SubscriptionPlan } from "@/stores/subscriptionPlansStore/types";
import { Package, Image, Video, BarChart, Star, TrendingUp } from "lucide-react";
import styles from "./UserSubscriptions.module.scss";

export default function UserSubscriptionsPage() {
  const router = useRouter();
  const { user, userPackage, openAuthModal } = useUserAuthStore();
  const { plans, isLoading, fetchPublicPlans } = useSubscriptionPlansStore();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // Fetch plans on mount
  useEffect(() => {
    fetchPublicPlans();
  }, [fetchPublicPlans]);

  // Filter plans to only show public ones, sorted by sortOrder
  const publicPlans = plans
    .filter((plan) => plan.isPublic)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Check if any plan has yearly pricing
  const hasYearlyPricing = plans.some(plan => plan.yearlyPrice && plan.yearlyPrice > 0);

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    // Check if user is logged in
    if (!user) {
      openAuthModal("login");
      return;
    }

    // If it's a free plan, just assign it directly
    if (plan.monthlyPrice === 0) {
      // For free plans, go directly to dashboard after assigning
      // TODO: Call assign subscription mutation for free plans
      router.push("/dashboard/subscription");
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

  if (isLoading) {
    return (
      <Container >
        <Loading type="svg" />
      </Container>
    );
  }

  return (
    <Container >
      <div className={styles.header}>
        <Text variant="h2">اختر خطتك</Text>
        <Text variant="paragraph" className={styles.subtitle}>
          اختر الخطة المناسبة لاحتياجاتك - جميع الخطط مجانية خلال فترة الإطلاق
        </Text>
      </div>

      {/* Billing Cycle Toggle */}
      {hasYearlyPricing && (
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
      )}

      <div className={styles.plansGrid}>
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
      </div>
    </Container>
  );
}
