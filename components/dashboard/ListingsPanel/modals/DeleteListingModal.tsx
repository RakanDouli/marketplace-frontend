'use client';

import React, { useState } from 'react';
import { Modal, Button, Text } from '@/components/slices';
import { Listing } from '@/types/listing';
import styles from './DeleteListingModal.module.scss';

interface DeleteListingModalProps {
  listing: Listing;
  onClose: () => void;
  onConfirm: (action: 'sold_via_platform' | 'sold_externally' | 'delete' | null) => Promise<void>;
}

export const DeleteListingModal: React.FC<DeleteListingModalProps> = ({
  listing,
  onClose,
  onConfirm
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleAction = async (action: 'sold_via_platform' | 'sold_externally' | 'delete') => {
    setIsDeleting(true);
    try {
      await onConfirm(action);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal isVisible onClose={onClose} title="حذف الإعلان" maxWidth="md">
      <div className={styles.deleteModalContent}>
        <Text variant="paragraph" align="center" weight="medium">
          {listing.title}
        </Text>

        <div className={styles.actionButtons}>
          <Button
            onClick={() => handleAction('sold_via_platform')}
            variant="primary"
            disabled={isDeleting}
          >
            {isDeleting ? 'جاري المعالجة...' : 'تم البيع عبر المنصة'}
          </Button>

          <Button
            onClick={() => handleAction('sold_externally')}
            variant="primary"
            disabled={isDeleting}
          >
            تم البيع بطريقة أخرى
          </Button>

          <Button
            onClick={() => handleAction('delete')}
            variant="danger"
            disabled={isDeleting}
          >
            حذف الإعلان
          </Button>

          <Button
            onClick={onClose}
            variant="secondary"
            disabled={isDeleting}
          >
            إلغاء
          </Button>
        </div>
      </div>
    </Modal>
  );
};
