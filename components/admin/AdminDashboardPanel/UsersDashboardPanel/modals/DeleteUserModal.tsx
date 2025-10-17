'use client';

import React, { useState } from 'react';
import { Button, Modal, Text, Form } from '@/components/slices';
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
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء حذف المستخدم');
    }
  };

  return (
    <Modal
      isVisible={isVisible}
      onClose={onClose}
      title="حذف المستخدم"
      maxWidth="md"
    >
      <Form onSubmit={(e) => { e.preventDefault(); handleConfirm(); }} error={error || undefined}>
        <div className={styles.deleteModalContent}>
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
            <Text variant="small" weight="bold" color="error">تحذير مهم:</Text>
            <Text variant="small" color="secondary">لا يمكن التراجع عن هذا الإجراء. سيتم حذف جميع بيانات المستخدم نهائياً من النظام.</Text>
          </div>

          <div className={styles.deleteActions}>
            <Button
              onClick={onClose}
              variant="outline"
              disabled={isLoading}
              type="button"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              variant="danger"
              disabled={isLoading}
            >
              {isLoading ? 'جاري الحذف...' : 'تأكيد الحذف'}
            </Button>
          </div>
        </div>
      </Form>
    </Modal>
  );
}

export default DeleteUserModal;