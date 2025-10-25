'use client';

import React from 'react';
import { Modal } from '@/components/slices/Modal/Modal';
import { Button, Text } from '@/components/slices';
import { AlertTriangle } from 'lucide-react';
import type { AdClient } from '@/stores/admin/adminAdClientsStore';
import styles from './AdClientModals.module.scss';

interface DeleteAdClientModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  adClient: AdClient | null;
  isLoading: boolean;
}

export const DeleteAdClientModal: React.FC<DeleteAdClientModalProps> = ({
  isVisible,
  onClose,
  onConfirm,
  adClient,
  isLoading
}) => {
  if (!adClient) return null;

  return (
    <Modal
      isVisible={isVisible}
      onClose={onClose}
      title="تأكيد حذف العميل"
    >
      <div className={styles.deleteModalContent}>
        <div className={styles.warningIcon}>
          <AlertTriangle size={48} />
        </div>

        <div className={styles.clientInfo}>
          <Text variant="h3" style={{ textAlign: 'center' }}>
            هل أنت متأكد من حذف العميل الإعلاني؟
          </Text>

          <div className={styles.clientDetail}>
            <Text variant="paragraph">
              <strong>اسم الشركة:</strong> {adClient.companyName}
            </Text>
            {adClient.industry && (
              <Text variant="small" color="secondary">
                <strong>الصناعة:</strong> {adClient.industry}
              </Text>
            )}
            <Text variant="small" color="secondary">
              <strong>جهة الاتصال:</strong> {adClient.contactName}
            </Text>
            <Text variant="small" color="secondary">
              <strong>البريد:</strong> {adClient.contactEmail}
            </Text>
          </div>
        </div>

        <div className={styles.warningBox}>
          <AlertTriangle size={20} />
          <div>
            <Text variant="paragraph" color="error">
              <strong>تحذير:</strong> لا يمكن التراجع عن هذا الإجراء
            </Text>
            <Text variant="small" color="secondary">
              سيتم حذف جميع بيانات العميل بشكل نهائي. تأكد من عدم وجود حملات إعلانية مرتبطة بهذا العميل قبل الحذف.
            </Text>
          </div>
        </div>

        <div className={styles.deleteActions}>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            إلغاء
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'جاري الحذف...' : 'تأكيد الحذف'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
