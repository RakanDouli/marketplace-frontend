'use client';

import React from 'react';
import { Button, Modal, Text } from '@/components/slices';
import type { Role } from '@/stores/admin/adminRolesStore';
import { AlertTriangle } from 'lucide-react';
import styles from './RoleModal.module.scss';

interface DeleteRoleModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  role: Role | null;
  isLoading: boolean;
}

export const DeleteRoleModal: React.FC<DeleteRoleModalProps> = ({
  isVisible,
  onClose,
  onConfirm,
  role,
  isLoading
}) => {
  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (error) {
      console.error('Delete role error:', error);
    }
  };

  return (
    <Modal
      isVisible={isVisible && !!role}
      onClose={onClose}
      title="حذف الدور"
      maxWidth="md"
    >
      <div className={styles.deleteContent}>
        <div className={styles.warningIcon}>
          <AlertTriangle size={48} color="var(--error)" />
        </div>

        <Text variant="h3" align="center">
          هل أنت متأكد من حذف هذا الدور؟
        </Text>

        {role && (
          <div className={styles.roleInfo}>
            <Text variant="paragraph" weight="medium">الدور المحدد للحذف:</Text>
            <div className={styles.roleDetails}>
              <Text variant="small"><strong>الاسم:</strong> {role.name}</Text>
              <Text variant="small"><strong>الوصف:</strong> {role.description}</Text>
              <Text variant="small"><strong>مستوى الأولوية:</strong> {role.priority}</Text>
              <Text variant="small"><strong>الحالة:</strong> {role.isActive ? 'نشط' : 'غير نشط'}</Text>
            </div>
          </div>
        )}

        <div className={styles.warningBox}>
          <AlertTriangle size={20} />
          <div>
            <Text variant="small" weight="bold" color="error">تحذير مهم:</Text>
            <ul>
              <li>سيتم حذف الدور نهائياً ولا يمكن التراجع عن هذا الإجراء</li>
              <li>المستخدمون المرتبطون بهذا الدور قد يفقدون صلاحياتهم</li>
              <li>تأكد من أن هذا الدور غير مستخدم في النظام</li>
            </ul>
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
};
