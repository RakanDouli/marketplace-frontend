'use client';

import React from 'react';
import { Button } from '@/components/slices';
import { Modal } from '@/components/slices';
import { Trash2, AlertTriangle, User } from 'lucide-react';
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
      title="تأكيد حذف المستخدم"
      maxWidth="sm"
    >
      <div className={styles.deleteModalContent}>
        <div className={styles.warningIcon}>
          <AlertTriangle size={48} />
        </div>

        <div className={styles.deleteMessage}>
          <h3>هل أنت متأكد من حذف هذا المستخدم؟</h3>

          {user && (
            <div className={styles.userInfo}>
              <div className={styles.userDetail}>
                <User size={16} />
                <span><strong>الاسم:</strong> {user.name}</span>
              </div>
              <div className={styles.userDetail}>
                <span><strong>البريد الإلكتروني:</strong> {user.email}</span>
              </div>
              <div className={styles.userDetail}>
                <span><strong>الدور:</strong> {user.role}</span>
              </div>
            </div>
          )}

          <div className={styles.warningBox}>
            <AlertTriangle size={16} />
            <div>
              <p><strong>تحذير:</strong> لا يمكن التراجع عن هذا الإجراء</p>
              <p>سيتم حذف جميع بيانات المستخدم نهائياً من النظام</p>
            </div>
          </div>
        </div>

        <div className={styles.deleteActions}>
          <Button
            onClick={onClose}
            variant="secondary"
            disabled={isLoading}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleConfirm}
            variant="danger"
            disabled={isLoading}
          >
            <Trash2 size={16} />
            {isLoading ? 'جاري الحذف...' : 'تأكيد الحذف'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default DeleteUserModal;