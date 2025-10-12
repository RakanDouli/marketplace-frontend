'use client';

import React from 'react';
import { Modal, Button, Text } from '@/components/slices';
import styles from './CategoryModals.module.scss';

interface DeleteCategoryModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  category: { id: string; name: string; nameAr?: string } | null;
  isLoading?: boolean;
}

export const DeleteCategoryModal: React.FC<DeleteCategoryModalProps> = ({
  isVisible,
  onClose,
  onConfirm,
  category,
  isLoading = false
}) => {
  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (error) {
      // Error is handled by the parent component
    }
  };

  if (!category) return null;

  return (
    <Modal
      isVisible={isVisible}
      onClose={onClose}
      title="تأكيد حذف التصنيف"
      maxWidth="sm"
    >
      <div className={styles.deleteContent}>
        <div className={styles.warningIcon}>⚠️</div>

        <Text variant="h4" className={styles.warningTitle}>
          هل أنت متأكد من حذف هذا التصنيف؟
        </Text>

        <div className={styles.categoryDetails}>
          <Text variant="paragraph" color="secondary">
            <strong>اسم التصنيف:</strong> {category.nameAr || category.name}
          </Text>
        </div>

        <div className={styles.warningMessage}>
          <Text variant="paragraph" color="error">
            <strong>تحذير:</strong> هذا الإجراء لا يمكن التراجع عنه!
          </Text>
          <Text variant="small" color="secondary">
            سيتم حذف جميع الخصائص المرتبطة بهذا التصنيف بشكل دائم.
          </Text>
        </div>

        {/* Form Actions */}
        <div className={styles.formActions}>
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            disabled={isLoading}
          >
            إلغاء
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            variant="danger"
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'جاري الحذف...' : 'حذف التصنيف'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
