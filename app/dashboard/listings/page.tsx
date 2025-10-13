'use client';

import React, { useEffect, useState } from 'react';
import { Text, Button, ListingCard } from '@/components/slices';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { Plus } from 'lucide-react';
import styles from './MyListings.module.scss';

export default function MyListingsPage() {
  const { user } = useUserAuthStore();
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // TODO: Fetch user's listings from API
  useEffect(() => {
    // Placeholder - replace with actual API call
    setIsLoading(false);
  }, [user]);

  return (
    <div className={styles.myListings}>
      <div className={styles.header}>
        <Text variant="h2">إعلاناتي</Text>
        <Button icon={<Plus size={20} />}>إضافة إعلان جديد</Button>
      </div>

      {isLoading ? (
        <div className={styles.loading}>
          <Text variant="paragraph">جاري التحميل...</Text>
        </div>
      ) : listings.length === 0 ? (
        <div className={styles.empty}>
          <Text variant="h3">لا توجد إعلانات</Text>
          <Text variant="paragraph" color="muted">
            ابدأ بإضافة إعلانك الأول للوصول إلى آلاف المشترين
          </Text>
          <Button icon={<Plus size={20} />}>إضافة إعلان جديد</Button>
        </div>
      ) : (
        <div className={styles.listingsGrid}>
          {/* TODO: Map over listings and render ListingCard */}
        </div>
      )}
    </div>
  );
}
