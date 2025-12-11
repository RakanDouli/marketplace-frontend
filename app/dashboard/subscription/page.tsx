"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Text, Button } from "@/components/slices";
import { useUserAuthStore } from "@/stores/userAuthStore";
import { formatPrice } from "@/utils/formatPrice";
import { formatDate } from "@/utils/formatDate";
import { Check, X, AlertTriangle } from "lucide-react";
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

  if (!user) {
    return (
      <div className={styles.container}>
        <Text variant="h2">جاري التحميل...</Text>
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

  const isFree = subscription?.monthlyPrice === 0;
  // Check if user can upgrade - hide upgrade button if user has "business" subscription (top tier)
  const isBusinessSubscription = subscription?.name?.toLowerCase() === "business";
  const canUpgrade = !isBusinessSubscription;

  // Expiry date and warning calculations
  const endDate = userPackage?.endDate ? new Date(userPackage.endDate) : null;
  const now = new Date();
  const daysRemaining = endDate ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
  const isExpiringSoon = daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0;
  const isExpired = daysRemaining !== null && daysRemaining <= 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text variant="h2">الاشتراك الحالي</Text>
      </div>

      {/* Expiry Warning Banner */}
      {!isFree && isExpiringSoon && (
        <div className={styles.warningBanner}>
          <AlertTriangle size={20} />
          <Text variant="paragraph">
            اشتراكك سينتهي خلال {daysRemaining} {daysRemaining === 1 ? "يوم" : "أيام"}! قم بتجديد اشتراكك للاستمرار في الاستفادة من جميع الميزات.
          </Text>
        </div>
      )}

      {!isFree && isExpired && (
        <div className={styles.errorBanner}>
          <AlertTriangle size={20} />
          <Text variant="paragraph">
            انتهى اشتراكك! قم بتجديد اشتراكك للاستمرار في الاستفادة من جميع الميزات.
          </Text>
        </div>
      )}

      <div className={styles.content}>
        {/* Current Plan */}
        <div className={styles.planCard}>
          <div className={styles.planHeader}>
            <div>
              <Text variant="h3">{subscription?.title || "لا يوجد اشتراك"}</Text>
              <Text variant="paragraph" className={styles.planDescription}>
                {user.accountType === "individual" && "خطة فردية"}
                {user.accountType === "dealer" && "خطة تاجر"}
                {user.accountType === "business" && "خطة أعمال"}
              </Text>
            </div>
            <div className={styles.price}>
              <Text variant="h1">{formatPrice(subscription?.monthlyPrice || 0)}</Text>
              <Text variant="paragraph" className={styles.billingCycle}>
                {subscription?.monthlyPrice === 0 ? "مجاناً" : "/ شهرياً"}
              </Text>
            </div>
          </div>

          {/* Usage Stats */}
          {subscription && subscription.maxListings > 0 && (
            <div className={styles.usageStats}>
              <div className={styles.usageStat}>
                <Text variant="paragraph">الإعلانات المستخدمة</Text>
                <Text variant="h4">
                  {currentListingsCount} / {subscription.maxListings}
                </Text>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progress}
                    style={{
                      width: `${(currentListingsCount / subscription.maxListings) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Features List */}
          <div className={styles.features}>
            <Text variant="h4" className={styles.featuresTitle}>
              الميزات المتاحة
            </Text>
            <ul className={styles.featuresList}>
              {features.map((feature, index) => (
                <li
                  key={index}
                  className={feature.included ? styles.included : styles.notIncluded}
                >
                  {feature.included ? (
                    <Check size={20} className={styles.checkIcon} />
                  ) : (
                    <X size={20} className={styles.xIcon} />
                  )}
                  <Text variant="paragraph">{feature.name}</Text>
                </li>
              ))}
            </ul>
          </div>

          {/* Billing Info */}
          {!isFree && endDate && (
            <div className={styles.billingInfo}>
              <Text variant="paragraph">ينتهي الاشتراك في</Text>
              <Text variant="paragraph">
                {formatDate(endDate)}
              </Text>
            </div>
          )}

          {/* Actions */}
          <div className={styles.actions}>
            {canUpgrade && (
              <Button
                variant="primary"
                onClick={handleUpgradeSubscription}
              >
                {isFree ? "ترقية الاشتراك" : "تجديد الاشتراك"}
              </Button>
            )}
          </div>
        </div>

        {/* Info Note */}
        {isBusinessSubscription ? (
          <div className={styles.infoCard}>
            <Text variant="paragraph">
              أنت مشترك في أعلى خطة متاحة! استمتع بجميع الميزات المتقدمة.
            </Text>
          </div>
        ) : isFree && (
          <div className={styles.infoCard}>
            <Text variant="paragraph">
              {user.accountType === "individual" &&
                "استمتع بالخطة الفردية المجانية! يمكنك ترقية اشتراكك في أي وقت للحصول على ميزات إضافية."}
              {user.accountType === "dealer" &&
                "استمتع بخطة التاجر المجانية خلال فترة الإطلاق! ستكون متاحة بسعر 29$ شهرياً قريباً."}
              {user.accountType === "business" &&
                "استمتع بخطة الأعمال المجانية خلال فترة الإطلاق! ستكون متاحة بسعر 99$ شهرياً قريباً."}
            </Text>
          </div>
        )}
      </div>
    </div>
  );
}
