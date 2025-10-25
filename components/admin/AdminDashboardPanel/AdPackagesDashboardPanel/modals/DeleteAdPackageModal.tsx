'use client';

import React from 'react';
import { Modal } from '@/components/slices/Modal/Modal';
import { Button, Text } from '@/components/slices';
import { AlertTriangle } from 'lucide-react';
import styles from './AdPackageModals.module.scss';

interface DeleteAdPackageModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  adPackage: any | null;
  isLoading: boolean;
}

export const DeleteAdPackageModal: React.FC<DeleteAdPackageModalProps> = ({
  isVisible,
  onClose,
  onConfirm,
  adPackage,
  isLoading
}) => {
  if (!adPackage) return null;

  return (
    <Modal
      isVisible={isVisible}
      onClose={onClose}
      title="تأكيد حذف الحزمة"
      maxWidth="md"
    >
      <div className={styles.deleteModalContent}>
        <div className={styles.warningIcon}>
          <AlertTriangle size={48} />
        </div>

        <div className={styles.packageInfo}>
          <Text variant="h3" align="center">
            هل أنت متأكد من حذف حزمة الإعلان؟
          </Text>

          <div className={styles.packageDetail}>
            <Text variant="paragraph" weight="medium">اسم الحزمة:</Text>
            <Text variant="paragraph" color="secondary">{adPackage.packageName}</Text>
          </div>

          <div className={styles.warningBox}>
            <AlertTriangle size={20} />
            <div>
              <Text variant="paragraph" weight="medium">تحذير!</Text>
              <Text variant="small">
                سيتم حذف جميع البيانات المرتبطة بهذه الحزمة. هذا الإجراء لا يمكن التراجع عنه.
              </Text>
            </div>
          </div>
        </div>

        <div className={styles.deleteActions}>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            إلغاء
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={isLoading}>
            حذف الحزمة
          </Button>
        </div>
      </div>
    </Modal>
  );
};
