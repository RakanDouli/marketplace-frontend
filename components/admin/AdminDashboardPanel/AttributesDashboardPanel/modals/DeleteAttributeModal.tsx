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
      title="تأكيد حذف الخاصية"
      maxWidth="md"
    >
      <div className={styles.deleteModalContent}>
        <div className={styles.deleteWarning}>
          <AlertTriangle size={48} className={styles.warningIcon} />
          <Text variant="h3" className={styles.warningTitle}>
            هل أنت متأكد من حذف هذه الخاصية؟
          </Text>
        </div>

        <div className={styles.attributeInfo}>
          <Text variant="paragraph">
            <strong>اسم الخاصية:</strong> {attribute.name}
          </Text>
          <Text variant="paragraph">
            <strong>المفتاح:</strong> {attribute.key}
          </Text>
          <Text variant="paragraph">
            <strong>النوع:</strong> {attribute.type}
          </Text>
          {attribute.group && (
            <Text variant="paragraph">
              <strong>المجموعة:</strong> {attribute.group}
            </Text>
          )}
        </div>

        {!canDelete ? (
          <div className={styles.cannotDeleteNotice}>
            <AlertTriangle size={20} />
            <Text variant="paragraph">
              لا يمكن حذف هذه الخاصية لأنها من الخصائص الأساسية في النظام.
            </Text>
          </div>
        ) : (
          <div className={styles.deleteConsequences}>
            <Text variant="h4" className={styles.consequencesTitle}>
              عواقب الحذف:
            </Text>
            <ul className={styles.consequencesList}>
              <li>ستفقد جميع البيانات المرتبطة بهذه الخاصية في جميع الإعلانات</li>
              <li>لن تظهر هذه الخاصية في الفلاتر أو نتائج البحث</li>
              <li>لا يمكن التراجع عن هذا الإجراء</li>
              {attribute.options.length > 0 && (
                <li>سيتم حذف جميع الخيارات المرتبطة ({attribute.options.length} خيار)</li>
              )}
            </ul>
          </div>
        )}

        <div className={styles.formActions}>
          <Button
            type="button"
            onClick={onClose}
            variant="secondary"
            disabled={isLoading}
          >
            إلغاء
          </Button>
          {canDelete && (
            <Button
              type="button"
              onClick={handleConfirm}
              variant="danger"
              loading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? 'جاري الحذف...' : 'نعم، احذف الخاصية'}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};