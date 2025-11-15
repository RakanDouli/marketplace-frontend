'use client';
import { formatDateTime } from '@/utils/formatDate';

import React from 'react';
import { Modal, Text } from '@/components/slices';
import { AuditLog } from '@/stores/admin/adminAuditStore';
import styles from './AuditModals.module.scss';

interface PreviewAuditModalProps {
  isVisible: boolean;
  onClose: () => void;
  audit?: AuditLog | null;
}

export const PreviewAuditModal: React.FC<PreviewAuditModalProps> = ({
  isVisible,
  onClose,
  audit
}) => {
  if (!audit) return null;

  return (
    <Modal isVisible={isVisible} onClose={onClose} title="عرض سجل التدقيق" maxWidth="lg">
      <div className={styles.auditPreviewContent}>
        {/* User and Action Info */}
        <div className={styles.auditInfoGrid}>
          <div className={styles.infoRow}>
            <Text variant="small" weight="bold" color="secondary">المستخدم:</Text>
            <Text variant="small">{audit.user?.name || '-'}</Text>
          </div>
          <div className={styles.infoRow}>
            <Text variant="small" weight="bold" color="secondary">البريد الإلكتروني:</Text>
            <Text variant="small">{audit.user?.email || '-'}</Text>
          </div>
          <div className={styles.infoRow}>
            <Text variant="small" weight="bold" color="secondary">الدور:</Text>
            <Text variant="small">{audit.user?.role || '-'}</Text>
          </div>
          <div className={styles.infoRow}>
            <Text variant="small" weight="bold" color="secondary">الإجراء:</Text>
            <Text variant="small">{audit.action}</Text>
          </div>
          <div className={styles.infoRow}>
            <Text variant="small" weight="bold" color="secondary">الكيان:</Text>
            <Text variant="small">{audit.entity}</Text>
          </div>
          <div className={styles.infoRow}>
            <Text variant="small" weight="bold" color="secondary">معرّف الكيان:</Text>
            <Text variant="small">{audit.entityId}</Text>
          </div>
          <div className={styles.infoRow}>
            <Text variant="small" weight="bold" color="secondary">تاريخ الإنشاء:</Text>
            <Text variant="small">{formatDateTime(audit.createdAt)}</Text>
          </div>
        </div>

        {/* Changes: Before and After as JSON */}
        <div className={styles.jsonContainer}>
          {audit.before && (
            <div className={styles.jsonSection}>
              <div className={styles.jsonHeader}>
                <Text variant="small" weight="bold">البيانات قبل التغيير</Text>
              </div>
              <div className={styles.jsonContent}>
                <pre className={styles.jsonBlock}>
                  {JSON.stringify(audit.before, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {audit.after && (
            <div className={styles.jsonSection}>
              <div className={styles.jsonHeader}>
                <Text variant="small" weight="bold">البيانات بعد التغيير</Text>
              </div>
              <div className={styles.jsonContent}>
                <pre className={styles.jsonBlock}>
                  {JSON.stringify(audit.after, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {!audit.before && !audit.after && (
            <div className={styles.emptyChanges}>
              <Text variant="paragraph" color="secondary">لا توجد بيانات مسجلة للتغييرات</Text>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default PreviewAuditModal;
