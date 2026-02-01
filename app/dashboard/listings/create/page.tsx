'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container } from '@/components/slices';
import Text from '@/components/slices/Text/Text';
import { Input } from '@/components/slices/Input/Input';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { useCreateListingStore } from '@/stores/createListingStore';
import { useCategoriesStore } from '@/stores/categoriesStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { Loading } from '@/components/slices';
import styles from './CreateListing.module.scss';

export default function CreateListingPage() {
  const router = useRouter();
  const { user, userPackage, isLoading: isAuthLoading } = useUserAuthStore();
  const { addNotification } = useNotificationStore();
  const {
    setCategory,
    reset,
    error,
    isLoadingAttributes,
  } = useCreateListingStore();
  const { categories, isLoading: isLoadingCategories } = useCategoriesStore();

  const [isNavigating, setIsNavigating] = useState(false);

  // Listing limit check
  const maxListings = userPackage?.userSubscription?.maxListings || 0;
  const currentListingsCount = userPackage?.currentListings || 0;
  const isAtLimit = maxListings > 0 && currentListingsCount >= maxListings;

  // Auth guard
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/');
    }
  }, [user, isAuthLoading, router]);

  // Listing limit guard
  useEffect(() => {
    if (!isAuthLoading && user && isAtLimit) {
      addNotification({
        type: 'warning',
        title: 'لقد وصلت للحد الأقصى من الإعلانات',
        message: `لديك ${currentListingsCount} إعلان من أصل ${maxListings}. قم بأرشفة بعض الإعلانات أو ترقية اشتراكك.`,
        duration: 8000,
      });
      router.push('/dashboard/listings');
    }
  }, [user, isAuthLoading, isAtLimit, currentListingsCount, maxListings, router, addNotification]);

  // Categories are now hydrated from root layout - no need to fetch here

  // Reset form on mount
  useEffect(() => {
    reset();
  }, [reset]);

  if (isAuthLoading || !user || isAtLimit) {
    return null;
  }

  // Auto-navigate when category is selected
  const handleCategoryChange = async (categoryId: string) => {
    if (!categoryId || isNavigating) return;

    setIsNavigating(true);

    // Set category locally and fetch attributes (NO database draft yet!)
    // Draft will be created lazily on first image/video upload
    await setCategory(categoryId);

    // Navigate to wizard form
    router.push('/dashboard/listings/create/wizard');
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
            value=""
            onChange={(e) => handleCategoryChange(e.target.value)}
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
