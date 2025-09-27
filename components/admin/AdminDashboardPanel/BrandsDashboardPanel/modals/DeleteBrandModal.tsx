'use client';

import React, { useState } from 'react';
import { Modal, Button, Text } from '@/components/slices';
import { useNotificationStore } from '@/stores/notificationStore';
import { useBrandsStore } from '@/stores/admin/adminBrandsStore';
import { AlertTriangle } from 'lucide-react';
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
  const { addNotification } = useNotificationStore();
  const { deleteBrand } = useBrandsStore();
  const handleConfirm = async () => {
    if (!brand) return;

    setIsLoading(true);
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
    } catch (error) {
      console.error('Error deleting brand:', error);
      addNotification({
        type: 'error',
        title: 'خطأ في الحذف',
        message: 'فشل في حذف العلامة التجارية. يرجى المحاولة مرة أخرى.',
        duration: 5000
      });
    }
    setIsLoading(false);
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
      title="تأكيد حذف العلامة التجارية"
      maxWidth="sm"
    >
      <div className={styles.deleteModal}>
        {/* Warning Icon */}
        <div className={styles.warningIcon}>
          <AlertTriangle size={48} color="var(--error)" />
        </div>

        {/* Content */}
        <div className={styles.deleteContent}>
          <Text variant="h3" className={styles.title}>
            هل أنت متأكد من حذف هذه العلامة التجارية؟
          </Text>

          <div className={styles.brandInfo}>
            <Text variant="paragraph">
              <strong>اسم العلامة:</strong> {brand.name}
            </Text>
            <Text variant="paragraph">
              <strong>المصدر:</strong> {brand.source?.toLowerCase() === 'manual' ? 'يدوي' : 'مزامنة'}
            </Text>
            {hasModels && (
              <Text variant="paragraph">
                <strong>عدد الموديلات:</strong> {brand.modelsCount}
              </Text>
            )}
          </div>

          {/* Warnings */}
          <div className={styles.warningSection}>
            <Text variant="small" color="error" className={styles.warningText}>
              ⚠️ تحذير: هذا الإجراء لا يمكن التراجع عنه
            </Text>

            {hasModels && (
              <Text variant="small" color="error" className={styles.warningText}>
                ⚠️ سيتم حذف جميع الموديلات ({brand.modelsCount}) المرتبطة بهذه العلامة التجارية
              </Text>
            )}

            {isFromSync && (
              <Text variant="small" color="warning" className={styles.warningText}>
                💡 ملاحظة: هذه العلامة التجارية مزامنة من API خارجي، قد تعود عند المزامنة التالية
              </Text>
            )}

            <Text variant="small" color="error" className={styles.warningText}>
              ⚠️ سيتم حذف جميع الإعلانات المرتبطة بهذه العلامة التجارية أيضاً
            </Text>
          </div>

          {/* Consequences */}
          <div className={styles.consequencesSection}>
            <Text variant="small" className={styles.consequencesTitle}>
              النتائج المترتبة على الحذف:
            </Text>
            <ul className={styles.consequencesList}>
              <li>حذف العلامة التجارية نهائياً</li>
              {hasModels && <li>حذف جميع الموديلات ({brand.modelsCount}) المرتبطة</li>}
              <li>حذف جميع الإعلانات التي تستخدم هذه العلامة</li>
              <li>فقدان إحصائيات هذه العلامة التجارية</li>
              <li>عدم إمكانية استرداد البيانات المحذوفة</li>
            </ul>
          </div>

          {/* Alternative actions */}
          <div className={styles.alternativeSection}>
            <Text variant="small" color="secondary" className={styles.alternativeTitle}>
              بديل آمن: بدلاً من الحذف، يمكنك:
            </Text>
            <ul className={styles.alternativesList}>
              <li>تغيير حالة العلامة إلى "مؤرشف" لإخفائها دون حذفها</li>
              <li>تعطيل العلامة مؤقتاً حتى تقرر لاحقاً</li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.formActions}>
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
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'جاري الحذف...' : 'نعم، احذف العلامة التجارية'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};