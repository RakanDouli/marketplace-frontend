"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Text, Button } from "@/components/slices";
import { useUserAuthStore } from "@/stores/userAuthStore";
import { Check, X } from "lucide-react";
import styles from "./Subscription.module.scss";

interface SubscriptionFeature {
  name: string;
  included: boolean;
}

interface SubscriptionPlan {
  name: string;
  title: string;
  price: number;
  billingCycle: string;
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
  const { user } = useUserAuthStore();

  if (!user) {
    return (
      <div className={styles.container}>
        <Text variant="h2">جاري التحميل...</Text>
      </div>
    );
  }

  const subscription = (user as any).subscription as SubscriptionPlan | null;
  const currentListingsCount = 3; // TODO: Get from API

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

  const handleCancelSubscription = async () => {
    if (!confirm("هل أنت متأكد من إلغاء اشتراكك؟")) {
      return;
    }
    // TODO: Call cancel subscription API
    console.log("Cancel subscription");
  };

  const handleUpgradeSubscription = () => {
    router.push("/user-subscriptions");
  };

  const isFree = subscription?.price === 0;
  const canUpgrade = user.accountType === "individual" || user.accountType === "dealer";

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text variant="h2">الاشتراك الحالي</Text>
      </div>

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
              <Text variant="h1">${subscription?.price || 0}</Text>
              <Text variant="paragraph" className={styles.billingCycle}>
                {subscription?.billingCycle === "monthly" ? "/ شهرياً" : "مجاناً"}
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
          {!isFree && (
            <div className={styles.billingInfo}>
              <Text variant="paragraph">التجديد التالي</Text>
              <Text variant="paragraph">
                {new Date(
                  Date.now() + 30 * 24 * 60 * 60 * 1000
                ).toLocaleDateString("ar-SY", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
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
                ترقية الاشتراك
              </Button>
            )}
            {!isFree && (
              <Button
                variant="secondary"
                onClick={handleCancelSubscription}
              >
                إلغاء الاشتراك
              </Button>
            )}
          </div>
        </div>

        {/* Info Note */}
        {isFree && (
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
