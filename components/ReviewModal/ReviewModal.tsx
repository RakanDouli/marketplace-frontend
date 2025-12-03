'use client';

import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { Modal, Button, Text, Form } from '@/components/slices';
import { useNotificationStore } from '@/stores/notificationStore';
import { useReviewsStore } from '@/stores/reviewsStore';
import { POSITIVE_REVIEW_TAGS, NEGATIVE_REVIEW_TAGS } from '@/constants/review-tags';
import styles from './ReviewModal.module.scss';

interface ReviewModalProps {
  isVisible: boolean;
  onClose: () => void;
  reviewedUserId: string;
  reviewedUserName: string;
  listingId?: string;
  threadId?: string;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isVisible,
  onClose,
  reviewedUserId,
  reviewedUserName,
  listingId,
  threadId,
}) => {
  const { addNotification } = useNotificationStore();
  const { createReview, isLoading } = useReviewsStore();

  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [positiveTags, setPositiveTags] = useState<string[]>([]);
  const [negativeTags, setNegativeTags] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ rating?: string; tags?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setErrors({});

    // Validation
    const newErrors: { rating?: string; tags?: string } = {};

    if (rating === 0) {
      newErrors.rating = 'يرجى اختيار تقييم بالنجوم';
    }

    if (positiveTags.length === 0 && negativeTags.length === 0) {
      newErrors.tags = 'يرجى اختيار نقطة إيجابية أو سلبية على الأقل';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await createReview({
        reviewedUserId,
        listingId,
        threadId,
        rating,
        positiveTags,
        negativeTags,
      });

      addNotification({
        type: 'success',
        title: 'تم إرسال التقييم',
        message: 'شكراً لك على تقييمك',
        duration: 5000,
      });

      handleClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'حدث خطأ أثناء إرسال التقييم';

      addNotification({
        type: 'error',
        title: 'خطأ',
        message,
      });
    }
  };

  const handleClose = () => {
    setRating(0);
    setHoveredRating(0);
    setPositiveTags([]);
    setNegativeTags([]);
    setErrors({});
    onClose();
  };

  const togglePositiveTag = (tag: string) => {
    setPositiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
    setErrors((prev) => ({ ...prev, tags: undefined }));
  };

  const toggleNegativeTag = (tag: string) => {
    setNegativeTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
    setErrors((prev) => ({ ...prev, tags: undefined }));
  };

  return (
    <Modal isVisible={isVisible} maxWidth="md" onClose={handleClose}>
      <div className={styles.content}>
        <div className={styles.header}>
          <Text variant="h3">تقييم {reviewedUserName}</Text>
        </div>

        <Form onSubmit={handleSubmit}>
          {/* Star Rating */}
          <div className={styles.ratingSection}>
            <Text variant="small">التقييم بالنجوم</Text>
            <div className={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={styles.starButton}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => {
                    setRating(star);
                    setErrors((prev) => ({ ...prev, rating: undefined }));
                  }}
                >
                  <Star
                    size={32}
                    className={
                      star <= (hoveredRating || rating)
                        ? styles.starFilled
                        : styles.starEmpty
                    }
                    fill={star <= (hoveredRating || rating) ? 'currentColor' : 'none'}
                  />
                </button>
              ))}
            </div>
            {errors.rating && (
              <Text variant="small" className={styles.errorText}>
                {errors.rating}
              </Text>
            )}
            {rating > 0 && !errors.rating && (
              <Text variant="small" color="secondary">
                {rating} من 5 نجوم
              </Text>
            )}
          </div>

          {/* Positive Tags */}
          <div className={styles.tagsSection}>
            <Text variant="small">النقاط الإيجابية (اختياري)</Text>
            <div className={styles.tags}>
              {POSITIVE_REVIEW_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`${styles.tag} ${positiveTags.includes(tag) ? styles.tagSelected : ''
                    }`}
                  onClick={() => togglePositiveTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
            {positiveTags.length > 0 && (
              <Text variant="small" color="secondary">
                تم اختيار {positiveTags.length} نقطة إيجابية
              </Text>
            )}
          </div>

          {/* Negative Tags */}
          <div className={styles.tagsSection}>
            <Text variant="small">النقاط السلبية (اختياري)</Text>
            <div className={styles.tags}>
              {NEGATIVE_REVIEW_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`${styles.tag} ${styles.tagNegative} ${negativeTags.includes(tag) ? styles.tagSelected : ''
                    }`}
                  onClick={() => toggleNegativeTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
            {errors.tags && (
              <Text variant="small" className={styles.errorText}>
                {errors.tags}
              </Text>
            )}
            {negativeTags.length > 0 && !errors.tags && (
              <Text variant="small" color="secondary">
                تم اختيار {negativeTags.length} نقطة سلبية
              </Text>
            )}
          </div>

          <div className={styles.actions}>
            <Button variant="outline" onClick={handleClose} disabled={isLoading} type="button">
              إلغاء
            </Button>
            <Button variant="primary" type="submit" disabled={isLoading}>
              {isLoading ? 'جاري الإرسال...' : 'إرسال التقييم'}
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
};
