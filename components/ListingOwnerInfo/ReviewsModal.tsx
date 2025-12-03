'use client';

import React from 'react';
import { Star } from 'lucide-react';
import { Modal, Text } from '@/components/slices';
import { ReviewsModalProps } from './types';
import styles from './ReviewsModal.module.scss';

export const ReviewsModal: React.FC<ReviewsModalProps> = ({
  isVisible,
  onClose,
  owner,
}) => {
  if (!isVisible) return null;

  const displayName = owner.accountType !== 'INDIVIDUAL' && owner.companyName
    ? owner.companyName
    : owner.name || 'مستخدم';

  const hasReviews = (owner.reviewCount || 0) > 0;

  return (
    <Modal isVisible={isVisible} onClose={onClose} maxWidth="md">
      <div className={styles.header}>
        <Text variant="h3">التقييمات</Text>
        <Text variant="h2">{displayName}</Text>

        {hasReviews && (
          <div className={styles.ratingOverview}>
            <div className={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={24}
                  fill={star <= Math.round(owner.averageRating || 0) ? '#fbbf24' : 'none'}
                  color="#fbbf24"
                />
              ))}
            </div>
            <Text variant="paragraph">{owner.reviewCount} تقييم</Text>
          </div>
        )}
      </div>

      <div className={styles.body}>
        {hasReviews ? (
          <div className={styles.placeholder}>
            <Text variant="paragraph" color="secondary">
              نظام التقييمات قيد التطوير
            </Text>
            <Text variant="small" color="secondary">
              سيتم عرض {owner.reviewCount} تقييم هنا قريباً
            </Text>
          </div>
        ) : (
          <div className={styles.noReviews}>
            <Text variant="paragraph" color="secondary">
              لا توجد تقييمات بعد
            </Text>
          </div>
        )}
      </div>
    </Modal>
  );
};
