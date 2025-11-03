'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Heart } from 'lucide-react';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { ListingCard, Text, Button } from '@/components/slices';
import styles from './wishlist.module.scss';

export default function WishlistPage() {
  const router = useRouter();
  const { listings, isLoading, error, loadMyWishlist, removeFromWishlist } = useWishlistStore();
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    loadMyWishlist();
  }, [loadMyWishlist]);

  const handleRemove = async (listingId: string) => {
    try {
      await removeFromWishlist(listingId);
      addNotification({
        type: 'success',
        title: 'تم',
        message: 'تمت إزالة الإعلان من المفضلة',
        duration: 3000,
      });
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'خطأ',
        message: 'فشل إزالة الإعلان من المفضلة',
        duration: 5000,
      });
    }
  };

  const handleViewListing = (id: string) => {
    router.push(`/listing/${id}`);
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Heart size={24} />
          <Text variant="h2">المفضلة</Text>
        </div>
        <div className={styles.grid}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <ListingCard
              key={i}
              id={`skeleton-${i}`}
              title=""
              price=""
              currency=""
              location=""
              accountType="individual"
              isLoading={true}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Heart size={24} />
          <Text variant="h2">المفضلة</Text>
        </div>
        <div className={styles.empty}>
          <Text variant="body" className={styles.errorText}>
            {error}
          </Text>
          <Button onClick={() => loadMyWishlist()}>إعادة المحاولة</Button>
        </div>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Heart size={24} />
          <Text variant="h2">المفضلة</Text>
        </div>
        <div className={styles.empty}>
          <Heart size={64} className={styles.emptyIcon} />
          <Text variant="h3">لم تضف أي إعلانات إلى المفضلة بعد</Text>
          <Text variant="body" className={styles.emptyDescription}>
            ابدأ بتصفح الإعلانات واضغط على أيقونة القلب لإضافتها إلى المفضلة
          </Text>
          <Button onClick={() => router.push('/')}>تصفح الإعلانات</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Heart size={24} />
        <Text variant="h2">المفضلة</Text>
        <Text variant="body" className={styles.count}>
          {listings.length} {listings.length === 1 ? 'إعلان' : 'إعلانات'}
        </Text>
      </div>

      <div className={styles.grid}>
        {listings.map((listing) => (
          <div key={listing.id} className={styles.cardWrapper}>
            <ListingCard
              id={listing.id}
              title={listing.title}
              price={`${(listing.priceMinor / 100).toLocaleString()}`}
              currency="USD"
              location={listing.category?.nameAr || ''}
              accountType={listing.user?.accountType || 'individual'}
              images={listing.imageKeys}
              onClick={handleViewListing}
              specs={{}}
              viewMode="grid"
            />
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleRemove(listing.id)}
              className={styles.removeButton}
              aria-label="إزالة من المفضلة"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
