"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Container, Text, Button, Loading, MobileBackButton } from "@/components/slices";
import { useUserAuthStore } from "@/stores/userAuthStore";
import { useCurrencyStore } from "@/stores/currencyStore";
import { formatPrice } from "@/utils/formatPrice";
import { formatDate } from "@/utils/formatDate";
import { Check, X, AlertTriangle, CreditCard } from "lucide-react";
import { AccountType } from "@/common/enums";
import sharedStyles from "@/components/dashboard/SharedDashboardPanel.module.scss";
import styles from "./Subscription.module.scss";

interface SubscriptionFeature {
  name: string;
  included: boolean;
}

interface SubscriptionPlan {
  name: string;
  title: string;
  monthlyPrice: number;
  yearlyPrice: number | null;
  maxListings: number;
  maxImagesPerListing: number;
  videoAllowed: boolean;
  priorityPlacement: boolean;
  analyticsAccess: boolean;
  customBranding: boolean;
  featuredListings: boolean;
}

export default function SubscriptionPage() {
  const router = useRouter();
  const { user, userPackage } = useUserAuthStore();
  // Subscribe to preferredCurrency to trigger re-render when currency changes
  const preferredCurrency = useCurrencyStore((state) => state.preferredCurrency);

  if (!user) {
    return (
      <div className={sharedStyles.loadingState}>
        <Loading type="svg" />
      </div>
    );
  }

  const subscription = userPackage?.userSubscription as SubscriptionPlan | null;
  const currentListingsCount = userPackage?.currentListings || 0;

  const features: SubscriptionFeature[] = [
    {
      name: `${subscription?.maxListings === 0 ? "إعلانات غير محدودة" : `${subscription?.maxListings} إعلانات`}`,
      included: true,
    },
    {
      name: `${subscription?.maxImagesPerListing} صور لكل إعلان`,
      included: true,
    },
    {
      name: "دعم الفيديو",
      included: subscription?.videoAllowed || false,
    },
    {
      name: "أولوية في البحث",
      included: subscription?.priorityPlacement || false,
    },
    {
      name: "تحليلات متقدمة",
      included: subscription?.analyticsAccess || false,
    },
    {
      name: "علامة تجارية مخصصة",
      included: subscription?.customBranding || false,
    },
    {
      name: "إعلانات مميزة",
      included: subscription?.featuredListings || false,
    },
  ];

  const handleUpgradeSubscription = () => {
    router.push("/user-subscriptions");
  };

  const handleExtendSubscription = () => {
    router.push("/user-subscriptions");
  };

  const isFree = subscription?.monthlyPrice === 0;
  // Check if user can upgrade - hide upgrade button if user has "business" account type (top tier)
  const isBusinessAccount = user.accountType === AccountType.BUSINESS;
  const canUpgrade = !isBusinessAccount;
  // Show extend button for paid (non-free) subscriptions
  const canExtend = !isFree;

  // Expiry date and warning calculations
  const endDate = userPackage?.endDate ? new Date(userPackage.endDate) : null;
  const now = new Date();
  const daysRemaining = endDate ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
  const isExpiringSoon = daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0;
  const isExpired = daysRemaining !== null && daysRemaining <= 0;

  // Over-limit calculations (for soft-block on downgrade)
  const maxListings = subscription?.maxListings || 0;
  const isOverLimit = maxListings > 0 && currentListingsCount > maxListings;
  const overLimitCount = isOverLimit ? currentListingsCount - maxListings : 0;

  return (
    <>
      <MobileBackButton
        onClick={() => router.push('/dashboard')}
        title="الاشتراك"
      />
      <div className={sharedStyles.panel}>
        {/* Header Section */}
        <Container paddingX="none" paddingY="none" background="bg" innerPadding="lg" innerBorder>
          <div className={sharedStyles.sectionHeader}>
            <div className={styles.titleRow}>
              <CreditCard size={28} />
              <Text variant="h2">الاشتراك الحالي</Text>
            </div>
            {subscription && (
              <Text variant="small" color="secondary">
                {subscription.title}
              </Text>
            )}
          </div>
        </Container>

        {/* Warning Banners */}
        {!isFree && isExpiringSoon && (
          <Container paddingX="none" paddingY="none" background="bg" innerPadding="lg" innerBorder>
            <div className={sharedStyles.warningCard}>
              <div className={sharedStyles.warningContent}>
                <AlertTriangle size={20} />
                <Text variant="paragraph">
                  اشتراكك سينتهي خلال {daysRemaining} {daysRemaining === 1 ? "يوم" : "أيام"}! قم بتجديد اشتراكك للاستمرار في الاستفادة من جميع الميزات.
                </Text>
              </div>
              <Button variant="primary" onClick={handleExtendSubscription}>
                تجديد الاشتراك
              </Button>
            </div>
          </Container>
        )}

        {!isFree && isExpired && (
          <Container paddingX="none" paddingY="none" background="bg" innerPadding="lg" innerBorder>
            <div className={styles.errorBanner}>
              <AlertTriangle size={20} />
              <Text variant="paragraph">
                انتهى اشتراكك! قم بتجديد اشتراكك للاستمرار في الاستفادة من جميع الميزات.
              </Text>
            </div>
          </Container>
        )}

        {isOverLimit && (
          <Container paddingX="none" paddingY="none" background="bg" innerPadding="lg" innerBorder>
            <div className={styles.errorBanner}>
              <AlertTriangle size={20} />
              <div>
                <Text variant="paragraph" style={{ fontWeight: 600 }}>
                  لقد تجاوزت الحد المسموح للإعلانات!
                </Text>
                <Text variant="paragraph">
                  لديك {currentListingsCount} إعلانات نشطة، بينما خطتك الحالية تسمح بـ {maxListings} إعلانات فقط.
                  لن تتمكن من إضافة إعلانات جديدة حتى تقوم بأرشفة {overLimitCount} إعلانات أو ترقية اشتراكك.
                </Text>
              </div>
            </div>
          </Container>
        )}

        {/* Subscription Card */}
        <Container paddingX="none" paddingY="none" background="bg" innerPadding="lg" innerBorder>
          {/* Plan Header with Price */}
          <div className={styles.planHeader}>
            <div>
              <Text variant="h3">{subscription?.title || "لا يوجد اشتراك"}</Text>
              <Text variant="paragraph" color="secondary">
                {user.accountType === AccountType.INDIVIDUAL && "خطة فردية"}
                {user.accountType === AccountType.DEALER && "خطة تاجر"}
                {user.accountType === AccountType.BUSINESS && "خطة أعمال"}
              </Text>
            </div>
            <div className={styles.price}>
              <Text variant="h1">{formatPrice(subscription?.monthlyPrice || 0)}</Text>
              <Text variant="small" color="secondary">
                {subscription?.monthlyPrice === 0 ? "مجاناً" : "/ شهرياً"}
              </Text>
            </div>
          </div>

          {/* Features Grid */}
          <div className={styles.featuresSection}>
            <Text variant="h4">الميزات المتاحة</Text>
            <div className={styles.featuresGrid}>
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`${styles.featureItem} ${feature.included ? styles.included : styles.notIncluded}`}
                >
                  {feature.included ? (
                    <Check size={18} className={styles.checkIcon} />
                  ) : (
                    <X size={18} className={styles.xIcon} />
                  )}
                  <Text variant="small">{feature.name}</Text>
                </div>
              ))}
            </div>
          </div>

          {/* Footer: Expiration + Actions */}
          <div className={styles.footer}>
            <div className={styles.footerInfo}>
              {!isFree && endDate && (
                <Text variant="paragraph" color="secondary">
                  ينتهي الاشتراك في {formatDate(endDate)}
                </Text>
              )}
              {isFree && !isBusinessAccount && (
                <Text variant="small" color="secondary">
                  يمكنك ترقية اشتراكك للحصول على ميزات إضافية
                </Text>
              )}
              {isBusinessAccount && (
                <Text variant="small" color="secondary">
                  أنت مشترك في أعلى خطة متاحة
                </Text>
              )}
            </div>
            <div className={styles.footerActions}>
              {canExtend && (
                <Button variant="secondary" onClick={handleExtendSubscription}>
                  تجديد الاشتراك
                </Button>
              )}
              {canUpgrade && (
                <Button variant="primary" onClick={handleUpgradeSubscription}>
                  ترقية الاشتراك
                </Button>
              )}
            </div>
          </div>
        </Container>
      </div>
    </>
  );
}
