'use client';

import React, { useEffect, useState } from 'react';
import { Star, BadgeCheck } from 'lucide-react';
import { Button, Image } from '@/components/slices';
import { AccountType } from '@/common/enums';
import { getInitials, getAvatarColor } from '@/utils/avatar-utils';
import { optimizeListingImage } from '@/utils/cloudflare-images';
import { useListingOwnerStore } from '@/stores/listingOwnerStore';
import { ReviewsModal } from './ReviewsModal';
import { OwnerCardProps } from './types';
import styles from './OwnerCard.module.scss';

export const OwnerCard: React.FC<OwnerCardProps> = ({
  userId,
  listingId,
}) => {
  const { fetchOwnerData, getOwner } = useListingOwnerStore();
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchOwnerData(userId);
  }, [userId, fetchOwnerData]);

  const owner = getOwner(userId);

  if (!owner) {
    return null;
  }
  const displayName = owner.accountType !== AccountType.INDIVIDUAL && owner.companyName
    ? owner.companyName
    : owner.name || 'مستخدم';

  const initials = getInitials(owner.name || '', owner.email || '');
  const avatarBgColor = getAvatarColor(owner.name || '', owner.email || '');

  const getAvatarUrl = (avatar: string | null) => {
    if (!avatar) return null;
    if (avatar.startsWith('http')) return avatar;
    return optimizeListingImage(avatar, 'small');
  };

  const avatarUrl = getAvatarUrl(owner.avatar);
  const hasReviews = (owner.reviewCount || 0) > 0;

  return (
    <div className={styles.card}>
      {/* Avatar */}
      {avatarUrl ? (
        <Image src={avatarUrl} alt={displayName} containerClassName={styles.avatar} aspectRatio="1/1" variant="small" />
      ) : (
        <div className={styles.initials} style={{ backgroundColor: avatarBgColor }}>
          {initials}
        </div>
      )}

      {/* Content */}
      <div className={styles.content}>
        {/* Name with Badge next to it */}
        <div className={styles.name}>

          {owner.businessVerified && (
            <span className={styles.badge}>
              <BadgeCheck size={16} />
            </span>
          )}
          {displayName}
        </div>

        {/* Rating + Review Button on same row */}
        {hasReviews ? (
          <div className={styles.ratingRow}>
            <div className={styles.rating}>
              <Star size={16} fill="#fbbf24" color="#fbbf24" />
              <span>{owner.averageRating?.toFixed(1)}</span>
            </div>
            <Button variant="link" onClick={() => setShowDetailsModal(true)}>
              عرض التقييمات
            </Button>
          </div>
        ) : (
          <span className={styles.noReviews}>لا توجد تقييمات بعد</span>
        )}
      </div>

      {/* Reviews Modal */}
      <ReviewsModal
        isVisible={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        owner={owner}
      />
    </div>
  );
};
