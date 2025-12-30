'use client';

import React, { useState } from 'react';
import { Modal, Button, Text } from '@/components/slices';
import { Listing } from '@/types/listing';
import styles from './DeleteListingModal.module.scss';

interface DeleteListingModalProps {
  listing: Listing;
  onClose: () => void;
  onConfirm: (reason: 'sold_via_platform' | 'sold_externally' | 'no_longer_for_sale') => Promise<void>;
}

const OPTIONS = [
  { value: 'sold_via_platform', label: 'تم البيع عبر المنصة' },
  { value: 'sold_externally', label: 'تم البيع بطريقة أخرى' },
  { value: 'no_longer_for_sale', label: 'لم يعد للبيع' },
] as const;

export const DeleteListingModal: React.FC<DeleteListingModalProps> = ({
  listing,
  onClose,
  onConfirm
}) => {
  const [reason, setReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showError, setShowError] = useState(false);

  const handleDelete = async () => {
    if (!reason) {
      setShowError(true);
      return;
    }
    setIsDeleting(true);
    try {
      await onConfirm(reason as 'sold_via_platform' | 'sold_externally' | 'no_longer_for_sale');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal isVisible onClose={onClose} title="حذف الإعلان" maxWidth="lg">
      <div className={styles.content}>
        <Text variant="paragraph">
          هل أنت متأكد من حذف <strong>{listing.title}</strong>؟
        </Text>

        <div className={styles.reasonSection}>
          <Text variant="small" weight="medium" className={styles.reasonLabel}>
            سبب الحذف
          </Text>
          <div className={styles.radioGroup}>
            {OPTIONS.map((option) => (
              <div
                key={option.value}
                className={`${styles.radioOption} ${reason === option.value ? styles.selected : ''}`}
                onClick={() => {
                  setReason(option.value);
                  setShowError(false);
                }}
              >
                <div className={styles.radio}>
                  {reason === option.value && <div className={styles.radioDot} />}
                </div>
                <span>{option.label}</span>
              </div>
            ))}
          </div>
          {showError && !reason && (
            <Text variant="small" color="error">
              يرجى اختيار سبب الحذف
            </Text>
          )}
        </div>

        <div className={styles.actions}>
          <Button onClick={onClose} variant="outline" disabled={isDeleting}>
            إلغاء
          </Button>
          <Button
            onClick={handleDelete}
            variant="danger"
            loading={isDeleting}
          >
            حذف
          </Button>
        </div>
      </div>
    </Modal>
  );
};
