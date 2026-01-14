'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Button } from '@/components/slices';
import Text from '@/components/slices/Text/Text';
import { Input } from '@/components/slices/Input/Input';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { useCreateListingStore } from '@/stores/createListingStore';
import { useCategoriesStore } from '@/stores/categoriesStore';
import { Loading } from '@/components/slices';
import { Layers, ListChecks } from 'lucide-react';
import styles from './CreateListing.module.scss';

type FormMode = 'collapsible' | 'wizard';

export default function CreateListingPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useUserAuthStore();
  const {
    formData,
    setCategory,
    reset,
    error,
    isLoadingAttributes,
  } = useCreateListingStore();
  const { categories, isLoading: isLoadingCategories, initializeCategories } = useCategoriesStore();

  const [isNavigating, setIsNavigating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [formMode, setFormMode] = useState<FormMode>('wizard');

  // Auth guard
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/');
    }
  }, [user, isAuthLoading, router]);

  // Initialize categories on mount
  useEffect(() => {
    initializeCategories();
  }, [initializeCategories]);

  // Reset form on mount
  useEffect(() => {
    reset();
  }, [reset]);

  if (isAuthLoading || !user) {
    return null;
  }

  const handleContinue = async () => {
    if (!selectedCategory || isNavigating) return;

    setIsNavigating(true);

    // Set category locally and fetch attributes (NO database draft yet!)
    // Draft will be created lazily on first image/video upload
    await setCategory(selectedCategory);

    // Navigate to appropriate form page based on mode
    if (formMode === 'wizard') {
      router.push('/dashboard/listings/create/wizard');
    } else {
      router.push('/dashboard/listings/create/details');
    }
  };

  return (
    <Container background="bg" className={styles.container}>
      <div className={styles.categorySelectionPage}>
        <div className={styles.header}>
          <Text variant="h2">إنشاء إعلان جديد</Text>
          <Text variant="paragraph" className={styles.subtitle}>
            ما الذي تريد بيعه؟
          </Text>
        </div>

        {/* Show error if any */}
        {error && (
          <div className={styles.errorMessage}>
            <Text variant="paragraph" color="error">{error}</Text>
          </div>
        )}

        {/* Category Selection */}
        <div className={styles.categoryCard}>
          <Text variant="h3" className={styles.sectionTitle}>
            اختر الفئة
          </Text>

          <Input
            type="select"
            label="الفئة"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            options={[
              { value: '', label: '-- اختر الفئة --' },
              ...categories.map(cat => ({
                value: cat.id,
                label: cat.nameAr || cat.name,
              })),
            ]}
            disabled={isLoadingCategories || isNavigating || isLoadingAttributes}
          />
        </div>

        {/* Form Mode Selection */}
        {selectedCategory && (
          <div className={styles.categoryCard}>
            <Text variant="h3" className={styles.sectionTitle}>
              اختر طريقة التعبئة
            </Text>

            <div className={styles.modeSelector}>
              <button
                type="button"
                className={`${styles.modeOption} ${formMode === 'wizard' ? styles.selected : ''}`}
                onClick={() => setFormMode('wizard')}
              >
                <ListChecks size={32} />
                <Text variant="h4">خطوات متتالية</Text>
                <Text variant="small" color="secondary">
                  تعبئة الإعلان خطوة بخطوة مع معاينة قبل النشر
                </Text>
              </button>

              <button
                type="button"
                className={`${styles.modeOption} ${formMode === 'collapsible' ? styles.selected : ''}`}
                onClick={() => setFormMode('collapsible')}
              >
                <Layers size={32} />
                <Text variant="h4">أقسام قابلة للطي</Text>
                <Text variant="small" color="secondary">
                  جميع الحقول في صفحة واحدة مع أقسام قابلة للفتح والإغلاق
                </Text>
              </button>
            </div>
          </div>
        )}

        {/* Continue Button */}
        {selectedCategory && (
          <div className={styles.continueButton}>
            <Button
              variant="primary"
              size="lg"
              onClick={handleContinue}
              disabled={isNavigating || isLoadingAttributes}
              loading={isNavigating || isLoadingAttributes}
            >
              {isNavigating || isLoadingAttributes ? 'جاري التحميل...' : 'متابعة'}
            </Button>
          </div>
        )}

        {(isNavigating || isLoadingAttributes) && (
          <div className={styles.loadingIndicator}>
            <Text variant="small" color="secondary">جاري تحميل الخصائص</Text>
            <Loading />
          </div>
        )}
      </div>
    </Container>
  );
}
