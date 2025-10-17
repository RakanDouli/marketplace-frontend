'use client';

import React, { useState } from 'react';
import { Button, Text, Modal, Form } from '@/components/slices';
import { Listing } from '@/types/listing';
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
  const [error, setError] = useState<string | null>(null);

  // Handle delete confirmation
  const handleConfirm = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء حذف الإعلان');
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
    <Modal isVisible onClose={onClose} title="حذف الإعلان" maxWidth="md">
      <Form onSubmit={(e) => { e.preventDefault(); handleConfirm(); }} error={error || undefined}>
        <div className={styles.deleteModalContent}>
          <Text variant="h3" align="center">
            هل أنت متأكد من حذف هذا الإعلان؟
          </Text>

          <div className={styles.userInfo}>
            <Text variant="paragraph" weight="medium">الإعلان المحدد للحذف:</Text>
            <div className={styles.userDetail}>
              <Text variant="small"><strong>العنوان:</strong> {listing.title}</Text>
              <Text variant="small"><strong>السعر:</strong> {formatPrice(listing.priceMinor)}</Text>
              <Text variant="small"><strong>التاريخ:</strong> {new Date(listing.createdAt).toLocaleDateString('ar-SY')}</Text>
              {listing.description && (
                <Text variant="small">
                  <strong>الوصف:</strong> {listing.description.length > 100 ? `${listing.description.substring(0, 100)}...` : listing.description}
                </Text>
              )}
            </div>
          </div>

          <div className={styles.warningBox}>
            <Text variant="small" weight="bold" color="error">تحذير مهم:</Text>
            <Text variant="small" color="secondary">
              لا يمكن التراجع عن هذا الإجراء. سيتم حذف الإعلان وجميع بياناته نهائياً من النظام.
            </Text>
          </div>

          <div className={styles.deleteActions}>
            <Button
              onClick={onClose}
              variant="secondary"
              disabled={isDeleting}
              type="button"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              variant="danger"
              disabled={isDeleting}
            >
              {isDeleting ? 'جاري الحذف...' : 'تأكيد الحذف'}
            </Button>
          </div>
        </div>
      </Form>
    </Modal>
  );
};