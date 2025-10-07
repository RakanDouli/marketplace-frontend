'use client';

import React from 'react';
import { Button, Modal, Text } from '@/components/slices';
import { AlertTriangle } from 'lucide-react';
import styles from './UserModals.module.scss';

interface User {
  id?: string;
  name: string;
  email: string;
  role: string;
}

interface DeleteUserModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  user?: User | null;
  isLoading?: boolean;
}

export function DeleteUserModal({
  isVisible,
  onClose,
  onConfirm,
  user,
  isLoading = false
}: DeleteUserModalProps) {
  const handleConfirm = async () => {
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  return (
    <Modal
      isVisible={isVisible}
      onClose={onClose}
      title="حذف المستخدم"
      maxWidth="md"
    >
      <div className={styles.deleteModalContent}>
        <div className={styles.warningIcon}>
          <AlertTriangle size={48} color="var(--error)" />
        </div>

        <Text variant="h3" align="center">
          هل أنت متأكد من حذف هذا المستخدم؟
        </Text>

        {user && (
          <div className={styles.userInfo}>
            <Text variant="paragraph" weight="medium">المستخدم المحدد للحذف:</Text>
            <div className={styles.userDetail}>
              <Text variant="small"><strong>الاسم:</strong> {user.name}</Text>
              <Text variant="small"><strong>البريد الإلكتروني:</strong> {user.email}</Text>
              <Text variant="small"><strong>الدور:</strong> {user.role}</Text>
            </div>
          </div>
        )}

        <div className={styles.warningBox}>
          <AlertTriangle size={20} />
          <div>
            <Text variant="small" weight="bold" color="error">تحذير مهم:</Text>
            <Text variant="small" color="secondary">لا يمكن التراجع عن هذا الإجراء. سيتم حذف جميع بيانات المستخدم نهائياً من النظام.</Text>
          </div>
        </div>

        <div className={styles.deleteActions}>
          <Button
            onClick={onClose}
            variant="outline"
            disabled={isLoading}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleConfirm}
            variant="danger"
            disabled={isLoading}
          >
            {isLoading ? 'جاري الحذف...' : 'تأكيد الحذف'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default DeleteUserModal;