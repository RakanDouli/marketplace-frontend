"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Container, Text, Button } from "@/components/slices";
import { useUserAuthStore } from "@/stores/userAuthStore";
import { useSubscriptionPlansStore } from "@/stores/subscriptionPlansStore";
import { formatPrice } from "@/utils/formatPrice";
import { Check } from "lucide-react";
import styles from "./UserSubscriptions.module.scss";

export default function UserSubscriptionsPage() {
  const router = useRouter();
  const { user, userPackage, openAuthModal } = useUserAuthStore();
  const { plans, isLoading, error, fetchPublicPlans } = useSubscriptionPlansStore();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // Fetch plans on mount
  useEffect(() => {
    fetchPublicPlans();
  }, [fetchPublicPlans]);

  // Filter plans to only show public ones, sorted by sortOrder
  const publicPlans = plans
    .filter((plan) => plan.isPublic)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const handleSelectPlan = (planId: string) => {
    // Check if user is logged in
    if (!user) {
      openAuthModal("login");
      return;
    }

    const selectedPlan = plans.find((p) => p.id === planId);

    // If it's a free plan, just assign it directly
    if (selectedPlan && selectedPlan.monthlyPrice === 0) {
      setSelectedPlanId(planId);
      // For free plans, go directly to dashboard after assigning
      // TODO: Call assign subscription mutation for free plans
      router.push("/dashboard/subscription");
      return;
    }

    // For paid plans, go to payment preview page
    router.push(`/payment/subscription/${planId}`);
  };

  const loading = isLoading;

  // Get the user's current subscription name
  const currentSubscriptionName = userPackage?.userSubscription?.name;

  const getPlanFeatures = (plan: typeof plans[0]) => [
    {
      text: plan.maxListings === 0 ? "إعلانات غير محدودة" : `${plan.maxListings} إعلانات`,
      included: true,
    },
    {
      text: `${plan.maxImagesPerListing} صور لكل إعلان`,
      included: true,
    },
    {
      text: "دعم الفيديو",
      included: plan.videoAllowed,
    },
    {
      text: "أولوية في البحث",
      included: plan.priorityPlacement,
    },
    {
      text: "تحليلات متقدمة",
      included: plan.analyticsAccess,
    },
    {
      text: "علامة تجارية مخصصة",
      included: plan.customBranding,
    },
    {
      text: "إعلانات مميزة",
      included: plan.featuredListings,
    },
  ];

  if (loading) {
    return (
      <Container className={styles.container}>
        <Text variant="h2">جاري التحميل...</Text>
      </Container>
    );
  }

  return (
    <Container className={styles.container}>
      <div className={styles.header}>
        <Text variant="h2">اختر خطتك</Text>
        <Text variant="paragraph" className={styles.subtitle}>
          اختر الخطة المناسبة لاحتياجاتك - جميع الخطط مجانية خلال فترة الإطلاق
        </Text>
      </div>

      <div className={styles.plansGrid}>
        {publicPlans.map((plan) => {
          const features = getPlanFeatures(plan);
          const isCurrentPlan = currentSubscriptionName === plan.name;

          return (
            <div
              key={plan.id}
              className={`${styles.planCard} ${isCurrentPlan ? styles.current : ""}`}
            >
              <div className={styles.planHeader}>
                <Text variant="h3">{plan.title}</Text>
                <Text variant="paragraph" className={styles.description}>
                  {plan.description}
                </Text>
              </div>

              <div className={styles.price}>
                <Text variant="h1">{formatPrice(plan.monthlyPrice)}</Text>
                <Text variant="paragraph" className={styles.billingCycle}>
                  / شهرياً
                </Text>
                {/* Tax included label - shown for paid plans */}
                {plan.monthlyPrice > 0 && (
                  <Text variant="small" color="secondary" className={styles.taxLabel}>
                    شامل الضريبة
                  </Text>
                )}
              </div>

              <ul className={styles.features}>
                {features.map((feature, index) => (
                  <li
                    key={index}
                    className={feature.included ? styles.included : styles.notIncluded}
                  >
                    {feature.included && <Check size={18} className={styles.checkIcon} />}
                    <Text variant="paragraph">{feature.text}</Text>
                  </li>
                ))}
              </ul>

              <div className={styles.actions}>
                {isCurrentPlan ? (
                  <Button variant="outline" disabled>
                    الخطة الحالية
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={selectedPlanId === plan.id}
                  >
                    {selectedPlanId === plan.id ? "جاري التحديث..." : "اختيار الخطة"}
                  </Button>
                )}
              </div>

              {isCurrentPlan && (
                <div className={styles.currentBadge}>
                  <Text variant="paragraph">خطتك الحالية</Text>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Container>
  );
}
