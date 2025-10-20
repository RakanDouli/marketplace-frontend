'use client';

import React, { useState } from 'react';
import { Modal, Button, Text } from '@/components/slices';
import { AuditLog } from '@/stores/admin/adminAuditStore';
import styles from './AuditModals.module.scss';

interface DeleteAuditModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  audit?: AuditLog | null;
  isLoading?: boolean;
}

export const DeleteAuditModal: React.FC<DeleteAuditModalProps> = ({
  isVisible,
  onClose,
  onConfirm,
  audit,
  isLoading = false
}) => {
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الحذف');
    }
  };

  if (!audit) return null;

  return (
    <Modal isVisible={isVisible} onClose={onClose} title="حذف سجل التدقيق" maxWidth="md">
      <div className={styles.modalContent}>
        <Text variant="h3" align="center">هل أنت متأكد من حذف هذا السجل؟</Text>

        <div className={styles.auditInfo}>
          <Text variant="small"><strong>المستخدم:</strong> {audit.user?.name || '-'}</Text>
          <Text variant="small"><strong>الإجراء:</strong> {audit.action}</Text>
          <Text variant="small"><strong>الكيان:</strong> {audit.entity}</Text>
          <Text variant="small"><strong>معرّف الكيان:</strong> {audit.entityId}</Text>
        </div>

        <div className={styles.warningBox}>
          <Text variant="small" weight="bold" color="error">تحذير:</Text>
          <Text variant="small" color="secondary">
            لا يمكن التراجع عن هذا الإجراء. سيتم حذف سجل التدقيق نهائياً من النظام.
          </Text>
        </div>

        {error && <Text variant="small" color="error">{error}</Text>}

        <div className={styles.actions}>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>إلغاء</Button>
          <Button variant="danger" onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? 'جاري الحذف...' : 'تأكيد الحذف'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteAuditModal;
