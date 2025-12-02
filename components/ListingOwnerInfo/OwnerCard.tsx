'use client';

import React from 'react';
import { Star, Shield } from 'lucide-react';
import { Button, Text } from '@/components/slices';
import { getInitials, getAvatarColor } from '@/utils/avatar-utils';
import { optimizeListingImage } from '@/utils/cloudflare-images';
import { OwnerCardProps } from './types';
import styles from './ListingOwnerInfo.module.scss';

export const OwnerCard: React.FC<OwnerCardProps> = ({
  owner,
  onViewDetails,
}) => {
  // Display name: company name for business, otherwise user name
  const displayName = owner.accountType !== 'INDIVIDUAL' && owner.companyName
    ? owner.companyName
    : owner.name || 'مستخدم';

  // Avatar utilities (same as UserMenu in header)
  const initials = getInitials(owner.name || '', owner.email || '');
  const avatarBgColor = getAvatarColor(owner.name || '', owner.email || '');

  // Helper to get avatar URL with Cloudflare optimization
  const getAvatarUrl = (avatar: string | null) => {
    if (!avatar) return null;
    if (avatar.startsWith('http')) return avatar;
    return optimizeListingImage(avatar, 'small');
  };

  const avatarUrl = getAvatarUrl(owner.avatar);

  // Show verified badge if business verified or has badge
  const showVerifiedBadge = owner.businessVerified || owner.accountBadge === 'VERIFIED' || owner.accountBadge === 'PREMIUM';
  const isPremium = owner.accountBadge === 'PREMIUM';

  return (
    <div className={styles.ownerCard}>
      {/* Avatar */}
      <div className={styles.avatarWrapper}>
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName} className={styles.avatar} />
        ) : (
          <div className={styles.avatarFallback} style={{ backgroundColor: avatarBgColor }}>
            <Text variant="h4">{initials}</Text>
          </div>
        )}
        {showVerifiedBadge && (
          <div className={`${styles.badge} ${isPremium ? styles.premium : styles.verified}`}>
            <Shield size={14} />
          </div>
        )}
      </div>

      {/* Company/User Name */}
      <Text variant="h4" className={styles.ownerName}>
        {displayName}
      </Text>

      {/* Rating Display */}
      {(owner.reviewCount || 0) > 0 ? (
        <div className={styles.ratingSection}>
          <div className={styles.stars}>
            <Star size={16} fill="#fbbf24" color="#fbbf24" />
            <Text variant="paragraph" className={styles.ratingNumber}>
              {owner.averageRating?.toFixed(1)}
            </Text>
            <Text variant="small" color="secondary">
              ({owner.reviewCount} تقييم)
            </Text>
          </div>

          {/* View Reviews Button */}
          <Button
            variant="link"
            onClick={onViewDetails}
            className={styles.reviewButton}
          >
            عرض التقييمات
          </Button>
        </div>
      ) : (
        <Text variant="small" color="secondary">
          لا توجد تقييمات بعد
        </Text>
      )}
    </div>
  );
};
