'use client';

import React, { useState } from 'react';
import { Modal, Button, Text, Form } from '@/components/slices';
import { useNotificationStore } from '@/stores/notificationStore';
import { useBrandsStore } from '@/stores/admin/adminBrandsStore';
import styles from './BrandModals.module.scss';


interface Brand {
  id: string;
  name: string;
  source: 'manual' | 'sync';
  modelsCount?: number;
}

interface DeleteBrandModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  brand: Brand | null;
  isLoading?: boolean;
}

export const DeleteBrandModal: React.FC<DeleteBrandModalProps> = ({
  isVisible,
  onClose,
  onConfirm,
  brand,
  isLoading: propIsLoading = false
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addNotification } = useNotificationStore();
  const { deleteBrand } = useBrandsStore();

  const handleConfirm = async () => {
    if (!brand) return;

    setIsLoading(true);
    setError(null);
    try {
      // Call the store's delete function
      await deleteBrand(brand.id);

      addNotification({
        type: 'success',
        title: 'تم الحذف بنجاح',
        message: `تم حذف العلامة التجارية "${brand.name}" بنجاح.`,
        duration: 4000
      });

      onClose();
    } catch (err) {
      console.error('Error deleting brand:', err);
      setError(err instanceof Error ? err.message : 'فشل في حذف العلامة التجارية');
    } finally {
      setIsLoading(false);
    }
  };

  if (!brand) {
    return null;
  }

  const hasModels = brand.modelsCount && brand.modelsCount > 0;
  const isFromSync = brand.source?.toLowerCase() === 'sync';

  return (
    <Modal
      isVisible={isVisible}
      onClose={onClose}
      title="حذف العلامة التجارية"
      maxWidth="md"
    >
      <Form onSubmit={(e) => { e.preventDefault(); handleConfirm(); }} error={error || undefined}>
        <div className={styles.deleteModalContent}>
          <Text variant="h3" align="center">
            هل أنت متأكد من حذف هذه العلامة التجارية؟
          </Text>

          <div className={styles.userInfo}>
            <Text variant="paragraph" weight="medium">العلامة التجارية المحددة للحذف:</Text>
            <div className={styles.userDetail}>
              <Text variant="small"><strong>اسم العلامة:</strong> {brand.name}</Text>
              <Text variant="small"><strong>المصدر:</strong> {brand.source?.toLowerCase() === 'manual' ? 'يدوي' : 'مزامنة'}</Text>
              {hasModels && (
                <Text variant="small"><strong>عدد الموديلات:</strong> {brand.modelsCount}</Text>
              )}
            </div>
          </div>

          <div className={styles.warningBox}>
            <Text variant="small" weight="bold" color="error">تحذير مهم:</Text>
            <ul>
              <li>لا يمكن التراجع عن هذا الإجراء</li>
              {hasModels && <li>سيتم حذف جميع الموديلات ({brand.modelsCount}) المرتبطة بهذه العلامة</li>}
              <li>سيتم حذف جميع الإعلانات المرتبطة بهذه العلامة</li>
              {isFromSync && <li>قد تعود العلامة عند المزامنة التالية (مزامنة من API خارجي)</li>}
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