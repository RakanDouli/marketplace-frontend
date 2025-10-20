'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, MultiStepForm, Text } from '@/components/slices';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { useCreateListingStore } from '@/stores/createListingStore';
import styles from './CreateListing.module.scss';

export default function CreateListingPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useUserAuthStore();
  const {
    formData,
    currentStep,
    steps,
    error,
    isSubmitting,
    nextStep,
    previousStep,
    submitListing,
    reset,
    fetchAttributes,
  } = useCreateListingStore();

  // Auth guard
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/');
    }
  }, [user, isAuthLoading, router]);

  // Fetch attributes when category is selected
  useEffect(() => {
    if (formData.categoryId) {
      fetchAttributes(formData.categoryId);
    }
  }, [formData.categoryId, fetchAttributes]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  if (isAuthLoading || !user) {
    return null;
  }

  // Render current step content
  const renderStepContent = () => {
    const step = steps[currentStep];
    if (!step) return null;

    switch (step.type) {
      case 'basic':
        return (
          <div className={styles.stepContent}>
            <Text variant="h2">المعلومات الأساسية</Text>
            <Text variant="paragraph" className={styles.stepDescription}>
              أدخل المعلومات الأساسية عن الإعلان
            </Text>
            <div className={styles.placeholder}>
              <Text variant="paragraph">📝 Step 1: Category & Basic Info (Coming soon)</Text>
              <Text variant="small">
                Fields: Category, Title, Description, Price, Bidding options
              </Text>
            </div>
          </div>
        );

      case 'images':
        return (
          <div className={styles.stepContent}>
            <Text variant="h2">الصور</Text>
            <Text variant="paragraph" className={styles.stepDescription}>
              أضف صور للإعلان (3 صور على الأقل)
            </Text>
            <div className={styles.placeholder}>
              <Text variant="paragraph">📷 Step 2: Images (Coming soon)</Text>
              <Text variant="small">ImageUploadGrid component will be here</Text>
            </div>
          </div>
        );

      case 'attribute_group':
        return (
          <div className={styles.stepContent}>
            <Text variant="h2">{step.title}</Text>
            <Text variant="paragraph" className={styles.stepDescription}>
              املأ المواصفات المطلوبة
            </Text>
            <div className={styles.placeholder}>
              <Text variant="paragraph">⚙️ Step: {step.title} (Coming soon)</Text>
              <Text variant="small">
                Dynamic attribute fields will be rendered here
              </Text>
            </div>
          </div>
        );

      case 'location_review':
        return (
          <div className={styles.stepContent}>
            <Text variant="h2">الموقع والمراجعة</Text>
            <Text variant="paragraph" className={styles.stepDescription}>
              حدد الموقع وراجع الإعلان قبل النشر
            </Text>
            <div className={styles.placeholder}>
              <Text variant="paragraph">📍 Step: Location & Review (Coming soon)</Text>
              <Text variant="small">
                Location fields + review summary will be here
              </Text>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Container className={styles.container}>
      <div className={styles.header}>
        <Text variant="h1">إنشاء إعلان جديد</Text>
        <Text variant="paragraph" className={styles.subtitle}>
          اتبع الخطوات لإنشاء إعلان احترافي
        </Text>
      </div>

      <div className={styles.formContainer}>
        <MultiStepForm
          steps={steps}
          currentStep={currentStep}
          onNext={nextStep}
          onPrevious={previousStep}
          onSubmit={submitListing}
          isSubmitting={isSubmitting}
          error={error}
        >
          {renderStepContent()}
        </MultiStepForm>
      </div>
    </Container>
  );
}
