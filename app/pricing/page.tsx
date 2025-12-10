'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Image, Video, BarChart, Star, Zap, TrendingUp } from 'lucide-react';
import { Text, Button, Container, Slider, Collapsible, TextSection } from '@/components/slices';
import { PricingCard } from '@/components/pricing';
import type { FeatureItem } from '@/components/pricing';
import { useSubscriptionPlansStore } from '@/stores/subscriptionPlansStore';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { useNotificationStore } from '@/stores/notificationStore';
import type { SubscriptionPlan } from '@/stores/subscriptionPlansStore/types';
import { AccountType } from '@/common/enums';
import styles from './Pricing.module.scss';

export default function PricingPage() {
  const router = useRouter();
  const { plans, isLoading, fetchPublicPlans } = useSubscriptionPlansStore();
  const { user, openAuthModal } = useUserAuthStore();
  const { addNotification } = useNotificationStore();

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // Check if any plan has yearly pricing
  const hasYearlyPricing = plans.some(plan => plan.yearlyPrice && plan.yearlyPrice > 0);

  useEffect(() => {
    fetchPublicPlans();
  }, [fetchPublicPlans]);

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
    if (plan.priorityPlacement) {
      features.push({
        icon: <TrendingUp size={16} />,
        label: 'الأولوية في البحث',
        included: true,
      });
    }

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

    // Featured
    if (plan.featuredListings) {
      features.push({
        icon: <Zap size={16} />,
        label: 'إعلانات مميزة',
        included: true,
      });
    }

    return features;
  };

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    // Check if user is logged in
    if (!user) {
      // Save selected plan and open auth modal
      setSelectedPlan(plan);
      openAuthModal('signup'); // Open signup tab by default
      return;
    }

    // Check if it's the same plan
    if (user.accountType === plan.accountType) {
      addNotification({
        type: 'info',
        title: 'خطتك الحالية',
        message: 'أنت مشترك بالفعل في هذه الخطة',
      });
      return;
    }

    // Navigate to payment page with billing cycle
    router.push(`/payment/subscription/${plan.id}?cycle=${billingCycle}`);
  };

  // Watch for user login - navigate to payment if plan was selected
  useEffect(() => {
    if (user && selectedPlan) {
      // User just logged in and we have a selected plan
      // Check if it's the same plan
      if (user.accountType === selectedPlan.accountType) {
        addNotification({
          type: 'info',
          title: 'خطتك الحالية',
          message: 'أنت مشترك بالفعل في هذه الخطة',
        });
        setSelectedPlan(null);
      } else {
        // Navigate to payment page with billing cycle
        router.push(`/payment/subscription/${selectedPlan.id}?cycle=${billingCycle}`);
      }
    }
  }, [user, selectedPlan, router]);

  const getButtonText = (plan: SubscriptionPlan): string => {
    if (!user) {
      return 'ابدأ الآن';
    }

    if (user.accountType === plan.accountType) {
      return 'خطتك الحالية';
    }

    return 'تغيير الخطة';
  };

  const getButtonVariant = (plan: SubscriptionPlan): 'primary' | 'outline' | 'secondary' => {
    if (!user || user.accountType !== plan.accountType) {
      return 'primary';
    }
    return 'outline';
  };

  const getBadge = (plan: SubscriptionPlan): string | undefined => {
    if (plan.monthlyPrice === 0) {
      return plan.accountType === AccountType.INDIVIDUAL ? 'مجاني دائماً' : 'مجاني حالياً';
    }
    return undefined;
  };

  const getBadgeColor = (plan: SubscriptionPlan): 'primary' | 'success' | 'warning' => {
    if (plan.accountType === AccountType.DEALER) {
      return 'primary';
    }
    return 'success';
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <Text>جاري التحميل...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.PricingPage} >
      <TextSection
        title="اختر الخطة المناسبة لك"
        subtitle="جميع الخطط مجانية حالياً - انضم الآن واستمتع بجميع الميزات"
        align="center"
        nostyle
      />

      <Container >

        {/* Billing Cycle Toggle - Only show if any plan has yearly pricing */}
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

        {/* Pricing Cards Slider */}
        {plans.length > 0 && (
          <Slider
            slidesToShow={3}
            slidesToShowTablet={2}
            slidesToShowMobile={1}
            showArrows={true}
            showDots={true}
          >
            {plans.map((plan) => (
              <PricingCard
                key={plan.id}
                title={plan.title}
                description={plan.description}
                monthlyPrice={plan.monthlyPrice}
                yearlyPrice={plan.yearlyPrice}
                yearlySavingsPercent={plan.yearlySavingsPercent}
                billingCycle={billingCycle}
                features={getFeatureList(plan)}
                badge={getBadge(plan)}
                badgeColor={getBadgeColor(plan)}
                highlighted={plan.accountType === AccountType.DEALER}
                buttonText={getButtonText(plan)}
                buttonVariant={getButtonVariant(plan)}
                disabled={user?.accountType === plan.accountType}
                onButtonClick={() => handleSelectPlan(plan)}
              />
            ))}
          </Slider>
        )}

        {/* FAQ Section */}
        <div className={styles.faq}>
          <Text variant="h2">الأسئلة الشائعة</Text>

          <div className={styles.faqList}>
            <Collapsible title="هل يمكنني تغيير خطتي لاحقاً؟" variant="bordered">
              <Text variant="paragraph" color="secondary">
                نعم، يمكنك الترقية أو التخفيض في أي وقت. التغييرات ستكون فعالة فوراً.
              </Text>
            </Collapsible>

            <Collapsible title="هل جميع الخطط مجانية فعلاً؟" variant="bordered">
              <Text variant="paragraph" color="secondary">
                نعم، جميع الخطط مجانية حالياً. في المستقبل، ستكون الخطة الفردية مجانية دائماً.
              </Text>
            </Collapsible>

            <Collapsible title="ماذا يحدث إذا تجاوزت الحد؟" variant="bordered">
              <Text variant="paragraph" color="secondary">
                لن تتمكن من إضافة إعلانات جديدة حتى تقوم بحذف إعلانات قديمة أو الترقية لخطة أعلى.
              </Text>
            </Collapsible>

            <Collapsible title="هل تتطلب بطاقة ائتمانية؟" variant="bordered">
              <Text variant="paragraph" color="secondary">
                لا، لا نطلب بطاقة ائتمانية حالياً. جميع الخطط مجانية تماماً.
              </Text>
            </Collapsible>
          </div>
        </div>
      </Container>
    </div>
  );
}
