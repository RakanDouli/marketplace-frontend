'use client';

import React, { useEffect, useState } from 'react';
import { Star, Building2, Calendar, Globe, Mail, Phone, BadgeCheck } from 'lucide-react';
import { useListingOwnerStore } from '@/stores/listingOwnerStore';
import { Button, Loading, Text } from '@/components/slices';
import { AccountType } from '@/common/enums';
import { getInitials, getAvatarColor } from '@/utils/avatar-utils';
import { optimizeListingImage } from '@/utils/cloudflare-images';
import { ACCOUNT_TYPE_LABELS } from '@/constants/metadata-labels';
import { ReviewsModal } from './ReviewsModal';
import { ListingOwnerInfoProps } from './types';
import styles from './OwnerInfoSection.module.scss';
import { CgProfile } from 'react-icons/cg';

export const OwnerInfoSection: React.FC<ListingOwnerInfoProps> = ({ userId, listingId }) => {
  const { fetchOwnerData, getOwner, loading, errors } = useListingOwnerStore();
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchOwnerData(userId);
  }, [userId, fetchOwnerData]);

  const owner = getOwner(userId);
  const isLoading = loading[userId];
  const error = errors[userId];

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <Loading />
      </div>
    );
  }

  if (error || !owner) {
    return (
      <Text variant='small'>
        {error || 'فشل في تحميل معلومات البائع'}
      </Text>
    );
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

  // Calculate member duration
  const getMemberDuration = () => {
    const joinDate = new Date(owner.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - joinDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) return `${diffDays} يوم`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} شهر`;
    return `${Math.floor(diffDays / 365)} سنة`;
  };
  return (
    <>
      <div className={styles.section}>
        {/* Profile */}
        <div className={styles.profile}>
          {/* Avatar */}
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className={styles.avatar} />
          ) : (
            <div className={styles.initials} style={{ backgroundColor: avatarBgColor }}>
              {initials}
            </div>
          )}

          {/* Info */}
          <div className={styles.info}>
            {/* Name with badge */}
            <div className={styles.name}>
              {owner.businessVerified && (
                <span className={styles.badge}>
                  <BadgeCheck size={16} />
                </span>
              )}
              {displayName}
            </div>
            {/* Account Type */}

            <div className={styles.row}>
              {owner.accountType !== AccountType.INDIVIDUAL ? <Building2 size={16} /> : <CgProfile size={16} />}
              <span>{ACCOUNT_TYPE_LABELS[owner.accountType.toLowerCase()] || ''}</span>
            </div>


          </div>
        </div>

        {/* Contact */}
        <div className={styles.contact}>
          {owner.companyRegistrationNumber && (
            <div className={styles.item}>
              <Building2 size={16} />
              {owner.companyRegistrationNumber}
              السجل التجاري
            </div>
          )}

          {/* Member Since */}
          <div className={styles.item}>
            <Calendar size={16} />
            <span>عضو منذ {getMemberDuration()}</span>
          </div>
          {/* Email */}
          {owner.email && (
            <div className={styles.item}>
              <Mail size={16} />
              <span>{owner.email}</span>
            </div>
          )}

          {/* Phone */}
          {owner.showPhone && owner.phone && (
            <div className={styles.item}>
              <Phone size={16} />
              <span>{owner.phone}</span>
            </div>
          )}

          {/* Website */}
          {owner.website && (
            <div className={styles.item}>
              <Globe size={16} />
              <a href={owner.website} target="_blank" rel="noopener noreferrer">
                زيارة الموقع
              </a>
            </div>
          )}
        </div>

        {/* Reviews Section */}
        <div className={styles.reviews}>
          {hasReviews ? (
            <div className={styles.reviewRow}>
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
      </div>

      <ReviewsModal
        isVisible={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        owner={owner}
      />
    </>
  );
};
