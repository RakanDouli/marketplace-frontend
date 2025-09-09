'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useI18n } from '@/contexts/I18nContext';
import { formatCurrency, formatDate } from '@/utils/i18n';
import { Listing } from '@/types/listing';
import styles from './ListingCard.module.scss';

interface ListingCardProps {
  listing: Listing;
  className?: string;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  className = ''
}) => {
  const { t, language } = useI18n();
  
  const mainImage = listing.imageKeys?.[0] 
    ? `https://imagedelivery.net/YOUR_CLOUDFLARE_HASH/${listing.imageKeys[0]}/public`
    : '/images/placeholder-car.svg';
  
  // Get USD price for display
  const usdPrice = listing.prices.find(p => p.currency === 'USD');
  const displayPrice = usdPrice ? parseFloat(usdPrice.value) : 0;
  
  const getStatusLabel = (status: string) => {
    const statusMap = {
      'ACTIVE': language === 'ar' ? 'متاح' : 'Available',
      'SOLD': language === 'ar' ? 'تم البيع' : 'Sold',
      'EXPIRED': language === 'ar' ? 'منتهي الصلاحية' : 'Expired',
      'DRAFT': language === 'ar' ? 'مسودة' : 'Draft'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };
  
  const getLocationDisplay = () => {
    if (listing.city && listing.country) {
      return `${listing.city}, ${listing.country}`;
    }
    return listing.city || listing.country || 'Unknown Location';
  };


  return (
    <Link href={`/cars/${listing.id}`} className={`${styles.card} ${className}`}>
      <div className={styles.imageContainer}>
        <Image
          src={mainImage}
          alt={listing.title}
          fill
          className={styles.image}
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {listing.sellerBadge && (
          <div className={styles.badge}>
            <span className={styles.featuredBadge}>{listing.sellerBadge}</span>
          </div>
        )}
        {listing.allowBidding && (
          <div className={styles.promotedTag}>
            {language === 'ar' ? 'مزايدة' : 'Bidding'}
          </div>
        )}
      </div>

      <div className={styles.content}>
        <h3 className={styles.title}>{listing.title}</h3>
        
        <div className={styles.price}>
          {formatCurrency(displayPrice, 'USD', language)}
        </div>

        <div className={styles.details}>
          <span className={styles.condition}>
            {getStatusLabel(listing.status)}
          </span>
          <span className={styles.location}>
            📍 {getLocationDisplay()}
          </span>
        </div>

        <div className={styles.meta}>
          <span className={styles.date}>{formatDate(new Date(listing.createdAt), language)}</span>
        </div>
      </div>
    </Link>
  );
};

export default ListingCard;