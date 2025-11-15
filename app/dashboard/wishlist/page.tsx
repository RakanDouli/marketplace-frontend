'use client';

import React, { useEffect } from 'react';
import { formatPrice } from '@/utils/formatPrice';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import { useWishlistStore } from '@/stores/wishlistStore';
import { Container, ListingCard, Text, Button } from '@/components/slices';
import styles from './wishlist.module.scss';

export default function WishlistPage() {
  const router = useRouter();
  const { listings, isLoading, error, loadMyWishlist } = useWishlistStore();

  useEffect(() => {
    loadMyWishlist();
  }, [loadMyWishlist]);

  const handleViewListing = (id: string) => {
    router.push(`/listing/${id}`);
  };

  return (
    <Container>
      <div className={styles.wishlistPage}>
        {/* Header - Always visible */}
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <Heart size={28} />
            <Text variant="h2">المفضلة</Text>
          </div>
          {!isLoading && !error && listings.length > 0 && (
            <Text variant="small" color="secondary">
              {listings.length} {listings.length === 1 ? 'إعلان' : 'إعلانات'}
            </Text>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className={styles.grid}>
            {[1, 2, 3, 4].map((i) => (
              <ListingCard
                key={i}
                id={`skeleton-${i}`}
                title=""
                price=""
                currency=""
                location=""
                accountType="individual"
                isLoading={true}
                viewMode="grid"
              />
            ))}
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className={styles.emptyState}>
            <Text variant="paragraph" color="error">
              {error}
            </Text>
            <Button onClick={() => loadMyWishlist()}>إعادة المحاولة</Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && listings.length === 0 && (
          <div className={styles.emptyState}>
            <Heart size={64} className={styles.emptyIcon} />
            <Text variant="h3">لم تضف أي إعلانات إلى المفضلة بعد</Text>
            <Text variant="paragraph" color="secondary" className={styles.emptyDescription}>
              ابدأ بتصفح الإعلانات واضغط على أيقونة القلب لإضافتها إلى المفضلة
            </Text>
            <Button onClick={() => router.push('/')}>تصفح الإعلانات</Button>
          </div>
        )}

        {/* Success State - Grid of Listings */}
        {!isLoading && !error && listings.length > 0 && (
          <div className={styles.grid}>
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                id={listing.id}
                title={listing.title}
                price={formatPrice(listing.priceMinor)}
                currency="USD"
                location={listing.category?.nameAr || ''}
                accountType={(listing.user?.accountType as 'individual' | 'dealer' | 'business') || 'individual'}
                images={listing.imageKeys}
                onClick={handleViewListing}
                specs={{}}
                viewMode="grid"
              />
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
