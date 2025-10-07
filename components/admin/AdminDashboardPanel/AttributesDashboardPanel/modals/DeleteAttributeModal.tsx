'use client';

import React from 'react';
import { Modal, Button, Text } from '@/components/slices';
import { AlertTriangle } from 'lucide-react';
import type { Attribute } from '@/stores/admin/adminAttributesStore';
import styles from './CategoryModals.module.scss';

interface DeleteAttributeModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  attribute: Attribute | null;
  isLoading?: boolean;
}

export const DeleteAttributeModal: React.FC<DeleteAttributeModalProps> = ({
  isVisible,
  onClose,
  onConfirm,
  attribute,
  isLoading = false
}) => {
  const handleConfirm = async () => {
    if (!attribute) return;

    try {
      await onConfirm();
    } catch (error) {
      // Error is handled by the parent component
    }
  };

  if (!attribute) return null;

  const canDelete = attribute.canBeDeleted && !attribute.isSystemCore;

  return (
    <Modal
      isVisible={isVisible}
      onClose={onClose}
      title="حذف الخاصية"
      maxWidth="md"
    >
      <div className={styles.deleteModalContent}>
        <div className={styles.warningIcon}>
          <AlertTriangle size={48} color="var(--error)" />
        </div>

        <Text variant="h3" align="center">
          هل أنت متأكد من حذف هذه الخاصية؟
        </Text>

        <div className={styles.userInfo}>
          <Text variant="paragraph" weight="medium">الخاصية المحددة للحذف:</Text>
          <div className={styles.userDetail}>
            <Text variant="small"><strong>اسم الخاصية:</strong> {attribute.name}</Text>
            <Text variant="small"><strong>المفتاح:</strong> {attribute.key}</Text>
            <Text variant="small"><strong>النوع:</strong> {attribute.type}</Text>
            {attribute.group && (
              <Text variant="small"><strong>المجموعة:</strong> {attribute.group}</Text>
            )}
          </div>
        </div>

        {!canDelete ? (
          <div className={styles.warningBox}>
            <AlertTriangle size={20} />
            <div>
              <Text variant="small" weight="bold" color="error">لا يمكن الحذف:</Text>
              <Text variant="small" color="secondary">
                هذه الخاصية من الخصائص الأساسية في النظام ولا يمكن حذفها.
              </Text>
            </div>
          </div>
        ) : (
          <div className={styles.warningBox}>
            <AlertTriangle size={20} />
            <div>
              <Text variant="small" weight="bold" color="error">تحذير مهم:</Text>
              <ul>
                <li>ستفقد جميع البيانات المرتبطة بهذه الخاصية في جميع الإعلانات</li>
                <li>لن تظهر هذه الخاصية في الفلاتر أو نتائج البحث</li>
                <li>لا يمكن التراجع عن هذا الإجراء</li>
                {attribute.options.length > 0 && (
                  <li>سيتم حذف جميع الخيارات المرتبطة ({attribute.options.length} خيار)</li>
                )}
              </ul>
            </div>
          </div>
        )}

        <div className={styles.deleteActions}>
          <Button
            onClick={onClose}
            variant="outline"
            disabled={isLoading}
          >
            إلغاء
          </Button>
          {canDelete && (
            <Button
              onClick={handleConfirm}
              variant="danger"
              disabled={isLoading}
            >
              {isLoading ? 'جاري الحذف...' : 'تأكيد الحذف'}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};