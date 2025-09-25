'use client';

import React, { useState } from 'react';
import { Button, Text, Modal } from '@/components/slices';
import { Input } from '@/components/slices/Input/Input';
import { Listing } from '@/types/listing';
import { AlertTriangle } from 'lucide-react';
import styles from './DeleteListingModal.module.scss';

interface DeleteListingModalProps {
  listing: Listing;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const DeleteListingModal: React.FC<DeleteListingModalProps> = ({
  listing,
  onClose,
  onConfirm,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle delete confirmation
  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Format price - using English numbers to match user-facing listings
  const formatPrice = (priceMinor: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(priceMinor / 100);
  };

  return (
    <Modal isVisible onClose={onClose} title="حذف الإعلان">
      {/* Warning Message */}
      <div className={styles.warningMessage}>
        <Text variant="paragraph" color="error" className={styles.warningText}>
          هل أنت متأكد من حذف هذا الإعلان؟ هذا الإجراء لا يمكن التراجع عنه.
        </Text>
      </div>

      {/* Listing Details */}
      <div className={styles.listingDetails}>
        <Text variant="h3" className={styles.listingTitle}>{listing.title}</Text>

        <div className={styles.listingMeta}>
          <Text as="span" className={styles.priceText}>
            {formatPrice(listing.priceMinor)}
          </Text>
          <Text as="span" color="secondary" className={styles.categoryBadge}>
            سيارات
          </Text>
          <Text as="span" color="secondary" className={styles.dateBadge}>
            {new Date(listing.createdAt).toLocaleDateString('en-US')}
          </Text>
        </div>

        {listing.description && (
          <Text variant="paragraph" color="secondary" className={styles.descriptionText}>
            {listing.description.length > 150
              ? `${listing.description.substring(0, 150)}...`
              : listing.description
            }
          </Text>
        )}
      </div>

      {/* Actions */}
      <div className={styles.formActions}>
        <Button
          onClick={onClose}
          variant="outline"
          disabled={isDeleting}
        >
          إلغاء
        </Button>
        <Button
          onClick={handleConfirm}
          variant="danger"
          disabled={isDeleting}
          loading={isDeleting}
        >
          {isDeleting ? 'جاري الحذف...' : 'تأكيد الحذف'}
        </Button>
      </div>
    </Modal>
  );
};