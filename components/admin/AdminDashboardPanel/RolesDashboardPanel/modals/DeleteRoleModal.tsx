'use client';

import React from 'react';
import { Button } from '@/components/slices/Button/Button';
import type { Role } from '@/stores/admin/adminRolesStore';
import { AlertTriangle, X } from 'lucide-react';
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
  if (!isVisible || !role) return null;

  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (error) {
      console.error('Delete role error:', error);
    }
  };

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <AlertTriangle size={24} className={styles.dangerIcon} />
            <div>
              <h2>حذف الدور</h2>
              <p>هل أنت متأكد من حذف هذا الدور؟</p>
            </div>
          </div>
          <Button variant="primary" onClick={onClose} icon={<X size={20} />} />
        </div>

        {/* Content */}
        <div className={styles.deleteContent}>
          <div className={styles.roleInfo}>
            <h3>الدور المحدد للحذف:</h3>
            <div className={styles.roleDetails}>
              <p><strong>الاسم:</strong> {role.name}</p>
              <p><strong>الوصف:</strong> {role.description}</p>
              <p><strong>مستوى الأولوية:</strong> {role.priority}</p>
              <p><strong>الحالة:</strong> {role.isActive ? 'نشط' : 'غير نشط'}</p>
            </div>
          </div>

          <div className={styles.warningBox}>
            <AlertTriangle size={20} />
            <div>
              <h4>تحذير مهم:</h4>
              <ul>
                <li>سيتم حذف الدور نهائياً ولا يمكن التراجع عن هذا الإجراء</li>
                <li>المستخدمون المرتبطون بهذا الدور قد يفقدون صلاحياتهم</li>
                <li>تأكد من أن هذا الدور غير مستخدم في النظام</li>
              </ul>
            </div>
          </div>

          {/* Actions */}
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
              icon={<AlertTriangle size={16} />}
            >
              {isLoading ? 'جاري الحذف...' : 'تأكيد الحذف'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};