"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Container, Text, Button } from "@/components/slices";
import { useUserAuthStore } from "@/stores/userAuthStore";
import { Check } from "lucide-react";
import styles from "./UserSubscriptions.module.scss";

interface SubscriptionPlan {
  id: string;
  name: string;
  title: string;
  description: string;
  price: number;
  billingCycle: string;
  maxListings: number;
  maxImagesPerListing: number;
  videoAllowed: boolean;
  priorityPlacement: boolean;
  analyticsAccess: boolean;
  customBranding: boolean;
  featuredListings: boolean;
  accountType: string;
}

export default function UserSubscriptionsPage() {
  const router = useRouter();
  const { user } = useUserAuthStore();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  useEffect(() => {
    // TODO: Fetch available plans from API
    // For now, using dummy data based on user accountType
    const dummyPlans: SubscriptionPlan[] = [
      {
        id: "1",
        name: "individual_free",
        title: "الخطة الفردية المجانية",
        description: "للأفراد - خطة مجانية مثالية لبيع سياراتك الشخصية",
        price: 0,
        billingCycle: "monthly",
        maxListings: 5,
        maxImagesPerListing: 5,
        videoAllowed: false,
        priorityPlacement: false,
        analyticsAccess: false,
        customBranding: false,
        featuredListings: false,
        accountType: "individual",
      },
      {
        id: "2",
        name: "dealer_free",
        title: "خطة التاجر",
        description: "للتجار والوكلاء - إعلانات غير محدودة مع ميزات احترافية",
        price: 0, // Will be 29
        billingCycle: "monthly",
        maxListings: 0,
        maxImagesPerListing: 20,
        videoAllowed: true,
        priorityPlacement: true,
        analyticsAccess: true,
        customBranding: true,
        featuredListings: false,
        accountType: "dealer",
      },
      {
        id: "3",
        name: "business_free",
        title: "خطة الأعمال",
        description: "للشركات - جميع الميزات + رابط الموقع + رقم التسجيل التجاري",
        price: 0, // Will be 99
        billingCycle: "monthly",
        maxListings: 0,
        maxImagesPerListing: 50,
        videoAllowed: true,
        priorityPlacement: true,
        analyticsAccess: true,
        customBranding: true,
        featuredListings: true,
        accountType: "business",
      },
    ];

    setPlans(dummyPlans);
    setLoading(false);
  }, []);

  const handleSelectPlan = async (planId: string) => {
    setSelectedPlanId(planId);
    // TODO: Call API to update user subscription
    console.log("Selected plan:", planId);

    // Simulate API call
    setTimeout(() => {
      router.push("/dashboard/subscription");
    }, 1000);
  };

  const getPlanFeatures = (plan: SubscriptionPlan) => [
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
        {plans.map((plan) => {
          const features = getPlanFeatures(plan);
          const isCurrentPlan = (user as any)?.subscription?.name === plan.name;

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
                <Text variant="h1">${plan.price}</Text>
                <Text variant="paragraph" className={styles.billingCycle}>
                  / شهرياً
                </Text>
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
