"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Container, Text, Loading, Slider, Collapsible, TextSection } from "@/components/slices";
import { PricingCard } from "@/components/pricing";
import type { FeatureItem } from "@/components/pricing";
import { useUserAuthStore } from "@/stores/userAuthStore";
import { useSubscriptionPlansStore } from "@/stores/subscriptionPlansStore";
import type { SubscriptionPlan } from "@/stores/subscriptionPlansStore/types";
import { Package, Image, Video, BarChart, Star, TrendingUp, Shield, Zap, Users, Clock } from "lucide-react";
import styles from "./UserSubscriptions.module.scss";

export default function UserSubscriptionsPage() {
  const router = useRouter();
  const { user, userPackage, openAuthModal } = useUserAuthStore();
  const { plans, isLoading, fetchPublicPlans } = useSubscriptionPlansStore();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // Fetch plans on mount - always force refresh to get latest plans
  useEffect(() => {
    fetchPublicPlans(true); // Force refresh to bypass cache
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
      <div className={styles.SubscriptionsPage}>
        <Loading type="svg" />
      </div>
    );
  }

  return (
    <div className={styles.SubscriptionsPage}>
      <TextSection
        title="باقات الاشتراك - اختر ما يناسبك"
        subtitle="خطط مرنة تناسب جميع احتياجاتك مع ميزات متقدمة للبائعين المحترفين"
        align="center"
        nostyle
      />

      <Container>
        {/* Benefits Section */}
        <div className={styles.benefits}>
          <div className={styles.benefit}>
            <Zap size={32} />
            <Text variant="h4">نشر سريع</Text>
            <Text variant="small" color="secondary">
              انشر إعلاناتك بضغطة زر
            </Text>
          </div>
          <div className={styles.benefit}>
            <Shield size={32} />
            <Text variant="h4">حماية كاملة</Text>
            <Text variant="small" color="secondary">
              تحقق من جميع الإعلانات
            </Text>
          </div>
          <div className={styles.benefit}>
            <Users size={32} />
            <Text variant="h4">وصول أوسع</Text>
            <Text variant="small" color="secondary">
              آلاف المشترين المحتملين
            </Text>
          </div>
          <div className={styles.benefit}>
            <Clock size={32} />
            <Text variant="h4">دعم على مدار الساعة</Text>
            <Text variant="small" color="secondary">
              فريق دعم متاح دائماً
            </Text>
          </div>
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

        {/* Plans Section */}
        <div className={styles.plansSection}>
          <Text variant="h2">الخطط المتاحة</Text>
          {publicPlans.length > 0 && (
            <Slider
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
        </div>

        {/* FAQ Section */}
        <div className={styles.faq}>
          <Text variant="h2">الأسئلة الشائعة</Text>

          <div className={styles.faqList}>
            <Collapsible title="هل يمكنني تغيير الباقة لاحقاً؟" variant="bordered">
              <Text variant="paragraph" color="secondary">
                نعم، يمكنك ترقية أو تخفيض باقتك في أي وقت. سيتم احتساب الفرق تناسبياً.
              </Text>
            </Collapsible>

            <Collapsible title="ماذا يحدث عند انتهاء الاشتراك؟" variant="bordered">
              <Text variant="paragraph" color="secondary">
                ستنتقل تلقائياً إلى الباقة المجانية وستبقى إعلاناتك الحالية منشورة حسب حدود الباقة المجانية.
              </Text>
            </Collapsible>

            <Collapsible title="هل الدفع آمن؟" variant="bordered">
              <Text variant="paragraph" color="secondary">
                نعم، نستخدم أحدث تقنيات التشفير لحماية بياناتك. جميع المعاملات تتم عبر بوابات دفع موثوقة.
              </Text>
            </Collapsible>

            <Collapsible title="هل يمكنني استرداد المبلغ؟" variant="bordered">
              <Text variant="paragraph" color="secondary">
                نعم، نوفر ضمان استرداد المبلغ خلال 7 أيام من الاشتراك إذا لم تكن راضياً عن الخدمة.
              </Text>
            </Collapsible>

            <Collapsible title="ما الفرق بين الباقات؟" variant="bordered">
              <Text variant="paragraph" color="secondary">
                كل باقة تختلف في عدد الإعلانات المسموحة، عدد الصور، إمكانية رفع فيديو، والأولوية في نتائج البحث. اختر الباقة التي تناسب حجم نشاطك.
              </Text>
            </Collapsible>
          </div>
        </div>
      </Container>
    </div>
  );
}
