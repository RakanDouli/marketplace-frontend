'use client';

import React from 'react';
import { Star, Shield, Building2, Mail, Phone, Globe, Calendar } from 'lucide-react';
import { Modal, Text } from '@/components/slices';
import { getInitials, getAvatarColor } from '@/utils/avatar-utils';
import { optimizeListingImage } from '@/utils/cloudflare-images';
import { OwnerDetailsModalProps } from './types';
import styles from './OwnerDetailsModal.module.scss';

export const OwnerDetailsModal: React.FC<OwnerDetailsModalProps> = ({
  isVisible,
  onClose,
  owner,
}) => {
  if (!isVisible) return null;

  const displayName = owner.accountType !== 'INDIVIDUAL' && owner.companyName
    ? owner.companyName
    : owner.name || 'مستخدم';

  const initials = getInitials(owner.name || '', owner.email || '');
  const avatarBgColor = getAvatarColor(owner.name || '', owner.email || '');

  const getAvatarUrl = (avatar: string | null) => {
    if (!avatar) return null;
    if (avatar.startsWith('http')) return avatar;
    return optimizeListingImage(avatar, 'medium');
  };

  const avatarUrl = getAvatarUrl(owner.avatar);
  const showVerifiedBadge = owner.businessVerified || owner.accountBadge === 'VERIFIED' || owner.accountBadge === 'PREMIUM';
  const isPremium = owner.accountBadge === 'PREMIUM';

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
    <Modal isVisible={isVisible} onClose={onClose} maxWidth="md">
      <div className={styles.modalHeader}>
        <div className={styles.avatarSection}>
          <div className={styles.avatarWrapper}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className={styles.avatar} />
            ) : (
              <div className={styles.avatarFallback} style={{ backgroundColor: avatarBgColor }}>
                <Text variant="h2">{initials}</Text>
              </div>
            )}
            {showVerifiedBadge && (
              <div className={`${styles.badge} ${isPremium ? styles.premium : styles.verified}`}>
                <Shield size={20} />
              </div>
            )}
          </div>

          <div className={styles.ownerMainInfo}>
            <div className={styles.nameRow}>
              <Text variant="h3">{displayName}</Text>
              {owner.accountType !== 'INDIVIDUAL' && (
                <Building2 size={20} className={styles.businessIcon} />
              )}
            </div>

            {/* Rating */}
            {(owner.reviewCount || 0) > 0 && (
              <div className={styles.rating}>
                <div className={styles.stars}>
                  <Star size={20} fill="#fbbf24" color="#fbbf24" />
                  <Text variant="h4">{owner.averageRating?.toFixed(1)}</Text>
                </div>
                <Text variant="paragraph" color="secondary">
                  ({owner.reviewCount} تقييم)
                </Text>
              </div>
            )}

            {/* Member Duration */}
            <div className={styles.memberInfo}>
              <Calendar size={16} />
              <Text variant="small" color="secondary">
                عضو منذ {getMemberDuration()}
              </Text>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className={styles.modalBody}>
        <Text variant="h4" className={styles.sectionTitle}>معلومات الاتصال</Text>

        <div className={styles.contactGrid}>
          {owner.email && (
            <div className={styles.contactItem}>
              <Mail size={18} />
              <div>
                <Text variant="small" color="secondary">البريد الإلكتروني</Text>
                <Text variant="paragraph">{owner.email}</Text>
              </div>
            </div>
          )}

          {(owner.showPhone && owner.phone) && (
            <div className={styles.contactItem}>
              <Phone size={18} />
              <div>
                <Text variant="small" color="secondary">رقم الهاتف</Text>
                <Text variant="paragraph">{owner.phone}</Text>
              </div>
            </div>
          )}

          {owner.website && (
            <div className={styles.contactItem}>
              <Globe size={18} />
              <div>
                <Text variant="small" color="secondary">الموقع الإلكتروني</Text>
                <a href={owner.website} target="_blank" rel="noopener noreferrer" className={styles.link}>
                  <Text variant="paragraph" color="primary">{owner.website}</Text>
                </a>
              </div>
            </div>
          )}

          {owner.companyRegistrationNumber && (
            <div className={styles.contactItem}>
              <Building2 size={18} />
              <div>
                <Text variant="small" color="secondary">رقم التسجيل التجاري</Text>
                <Text variant="paragraph">{owner.companyRegistrationNumber}</Text>
              </div>
            </div>
          )}
        </div>

        {/* Reviews Section - Placeholder */}
        {(owner.reviewCount || 0) > 0 && (
          <div className={styles.reviewsSection}>
            <Text variant="h4" className={styles.sectionTitle}>التقييمات</Text>
            <div className={styles.placeholder}>
              <Text variant="paragraph" color="secondary">
                نظام التقييمات قيد التطوير
              </Text>
              <Text variant="small" color="secondary">
                سيتم عرض {owner.reviewCount} تقييم هنا قريباً
              </Text>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
