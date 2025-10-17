'use client';

import React, { useState } from 'react';
import { Modal, Button, Text, Form } from '@/components/slices';
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
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!attribute) return;

    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء حذف الخاصية');
    }
  };

  if (!attribute) return null;

  return (
    <Modal
      isVisible={isVisible}
      onClose={onClose}
      title="حذف الخاصية"
      maxWidth="md"
    >
      <Form onSubmit={(e) => { e.preventDefault(); handleConfirm(); }} error={error || undefined}>
        <div className={styles.deleteModalContent}>
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

          <div className={styles.warningBox}>
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
};