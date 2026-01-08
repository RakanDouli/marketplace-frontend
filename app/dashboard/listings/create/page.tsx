'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container } from '@/components/slices';
import Text from '@/components/slices/Text/Text';
import { Input } from '@/components/slices/Input/Input';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { useCreateListingStore } from '@/stores/createListingStore';
import { useCategoriesStore } from '@/stores/categoriesStore';
import { Loading } from '@/components/slices';
import styles from './CreateListing.module.scss';

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

  const handleCategorySelect = async (categoryId: string) => {
    if (!categoryId || isNavigating) return;

    setIsNavigating(true);

    // Set category locally and fetch attributes (NO database draft yet!)
    // Draft will be created lazily on first image/video upload
    await setCategory(categoryId);

    // Navigate to form page
    router.push('/dashboard/listings/create/details');
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
            value={formData.categoryId || ''}
            onChange={(e) => handleCategorySelect(e.target.value)}
            options={[
              { value: '', label: '-- اختر الفئة --' },
              ...categories.map(cat => ({
                value: cat.id,
                label: cat.nameAr || cat.name,
              })),
            ]}
            disabled={isLoadingCategories || isNavigating || isLoadingAttributes}
          />

          {(isNavigating || isLoadingAttributes) && (
            <div className={styles.loadingIndicator}>
              <Text variant="small" color="secondary">جاري تحميل الخصائص</Text>
              <Loading />
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}
