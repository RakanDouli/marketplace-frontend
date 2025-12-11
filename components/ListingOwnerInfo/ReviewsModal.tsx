'use client';

import React, { useEffect, useState } from 'react';
import { MinusIcon, Plus, PlusIcon, Star } from 'lucide-react';
import { Modal, Text } from '@/components/slices';
import { AccountType } from '@/common/enums';
import { useReviewsStore, type Review } from '@/stores/reviewsStore';
import { formatDate } from '@/utils/formatDate';
import { ReviewsModalProps } from './types';
import styles from './ReviewsModal.module.scss';

export const ReviewsModal: React.FC<ReviewsModalProps> = ({
  isVisible,
  onClose,
  owner,
}) => {
  const { fetchUserReviews, isLoading } = useReviewsStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [tagSummary, setTagSummary] = useState<{
    positiveTags: { tag: string; count: number }[];
    negativeTags: { tag: string; count: number }[];
  }>({ positiveTags: [], negativeTags: [] });

  useEffect(() => {
    if (isVisible && owner.id) {
      loadReviews();
    }
  }, [isVisible, owner.id]);

  const loadReviews = async () => {
    try {
      const fetchedReviews = await fetchUserReviews(owner.id);
      setReviews(fetchedReviews);
      calculateTagSummary(fetchedReviews);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
  };

  const calculateTagSummary = (reviews: Review[]) => {
    const positiveTagCounts: Record<string, number> = {};
    const negativeTagCounts: Record<string, number> = {};

    reviews.forEach((review) => {
      review.positiveTags.forEach((tag) => {
        positiveTagCounts[tag] = (positiveTagCounts[tag] || 0) + 1;
      });
      review.negativeTags.forEach((tag) => {
        negativeTagCounts[tag] = (negativeTagCounts[tag] || 0) + 1;
      });
    });

    const positiveTags = Object.entries(positiveTagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);

    const negativeTags = Object.entries(negativeTagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);

    setTagSummary({ positiveTags, negativeTags });
  };

  const displayName = owner.accountType !== AccountType.INDIVIDUAL && owner.companyName
    ? owner.companyName
    : owner.name || 'مستخدم';

  const hasReviews = reviews.length > 0;

  return (
    <Modal title="التقييمات" isVisible={isVisible} onClose={onClose} maxWidth="lg">
      <div className={styles.header}>

        {hasReviews && (
          <div className={styles.ratingOverview}>
            <div className={styles.ratingScore}>
              <div className={styles.stars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={20}
                    fill={star <= Math.round(owner.averageRating || 0) ? '#fbbf24' : 'none'}
                    color="#fbbf24"
                  />
                ))}
              </div>
              <Text variant="small" className={styles.averageRating}>
                {owner.averageRating?.toFixed(1)}
              </Text>
            </div>

            {/* Rating Distribution Bars */}
            <div className={styles.ratingBars}>
              {[5, 4, 3, 2, 1].map((starLevel) => {
                const count = reviews.filter(r => r.rating === starLevel).length;
                const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;

                return (
                  <div key={starLevel} className={styles.ratingBar}>
                    <Text variant="small" className={styles.starLabel}>
                      {starLevel} <Star size={14} fill="#fbbf24" color="#fbbf24" />
                    </Text>
                    <div className={styles.barContainer}>
                      <div
                        className={styles.barFill}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <Text variant="small" className={styles.countLabel}>
                      {count}
                    </Text>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className={styles.body}>
        {isLoading ? (
          <div className={styles.loading}>
            <Text variant="paragraph" color="secondary">
              جاري التحميل...
            </Text>
          </div>
        ) : hasReviews ? (
          <>
            {/* Tag Summary Section */}
            {(tagSummary.positiveTags.length > 0 || tagSummary.negativeTags.length > 0) && (
              <div className={styles.tagSummary}>
                <Text variant="h4" className={styles.tagSummaryTitle}>
                  الأشياء التي يبرز فيها {displayName}
                </Text>

                <div className={styles.tagGroups}>
                  {tagSummary.positiveTags.length > 0 && (
                    <div className={styles.tagGroup}>
                      <Text variant="small" color="success" className={styles.tagGroupTitle}>

                        <PlusIcon />
                      </Text>
                      <div className={styles.tagsContainer}>
                        {tagSummary.positiveTags.slice(0, 6).map(({ tag, count }) => (
                          <div key={tag} className={styles.tag}>
                            <Text variant="small">{tag}</Text>
                            <Text variant="small" className={styles.tagCount}>{count}</Text>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {tagSummary.negativeTags.length > 0 && (
                    <div className={styles.tagGroup}>
                      <Text variant="small" color="error" className={styles.tagGroupTitle}>
                        <MinusIcon />
                      </Text>
                      <div className={styles.tagsContainer}>
                        {tagSummary.negativeTags.slice(0, 6).map(({ tag, count }) => (
                          <div key={tag} className={styles.tag}>
                            <Text variant="small">{tag}</Text>
                            <Text variant="small" className={styles.tagCount}>{count}</Text>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reviews List */}
            <div className={styles.reviewsList}>
              {reviews.map((review) => (
                <div key={review.id} className={styles.reviewCard}>
                  <div className={styles.reviewHeader}>
                    <div className={styles.reviewerInfo}>
                      <Text variant="h4">{review.reviewerName || 'مستخدم محذوف'}</Text>
                      <div className={styles.reviewStars}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={16}
                            fill={star <= review.rating ? '#fbbf24' : 'none'}
                            color="#fbbf24"
                          />
                        ))}
                      </div>
                    </div>
                    <Text variant="small" color="secondary">
                      {formatDate(review.createdAt)}
                    </Text>
                  </div>

                  {(review.positiveTags.length > 0 || review.negativeTags.length > 0) && (
                    <div className={styles.reviewTags}>
                      {review.positiveTags.map((tag) => (
                        <div key={tag} className={styles.reviewTag}>
                          <Text variant="small" color="success">+</Text>
                          <Text variant="small">{tag}</Text>
                        </div>
                      ))}
                      {review.negativeTags.map((tag) => (
                        <div key={tag} className={styles.reviewTag}>
                          <Text variant="small" color="error">-</Text>
                          <Text variant="small">{tag}</Text>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
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
