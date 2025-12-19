'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Button } from '@/components/slices';
import Text from '@/components/slices/Text/Text';
import { Input } from '@/components/slices/Input/Input';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { useCreateListingStore } from '@/stores/createListingStore';
import { useCategoriesStore } from '@/stores/categoriesStore';
import styles from './CreateListing.module.scss';

export default function CreateListingPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useUserAuthStore();
  const { formData, setFormField, fetchAttributes, reset } = useCreateListingStore();
  const { categories, isLoading: isLoadingCategories, initializeCategories } = useCategoriesStore();

  // Auth guard
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/');
    }
  }, [user, isAuthLoading, router]);

  // Initialize categories on mount (only fetches once if not already loaded)
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
    if (!categoryId) return;

    // Save category to store
    setFormField('categoryId', categoryId);

    // Fetch attributes in background (don't wait)
    fetchAttributes(categoryId);

    // Navigate to form page immediately
    router.push('/dashboard/listings/create/details');
  };

  return (
    <Container className={styles.container}>
      <div className={styles.categorySelectionPage}>
        <div className={styles.header}>
          <Text variant="h2">إنشاء إعلان جديد</Text>
          <Text variant="paragraph" className={styles.subtitle}>
            ما الذي تريد بيعه؟
          </Text>
        </div>

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
                label: cat.name,
              })),
            ]}
            disabled={isLoadingCategories}
          />
        </div>
      </div>
    </Container>
  );
}
