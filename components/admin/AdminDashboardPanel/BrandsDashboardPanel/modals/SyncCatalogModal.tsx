'use client';

import React, { useState } from 'react';
import { Modal, Button, Text, Form } from '@/components/slices';
import styles from './BrandModals.module.scss';

interface SyncCatalogModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  categoryName?: string;
  isLoading?: boolean;
}

export const SyncCatalogModal: React.FC<SyncCatalogModalProps> = ({
  isVisible,
  onClose,
  onConfirm,
  categoryName,
  isLoading = false
}) => {
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في مزامنة الكتالوج');
    }
  };

  return (
    <Modal
      isVisible={isVisible}
      onClose={onClose}
      title="مزامنة كتالوج العلامات التجارية"
      maxWidth="md"
    >
      <Form onSubmit={(e) => { e.preventDefault(); handleConfirm(); }} error={error || undefined}>
        <div className={styles.syncModal}>
          {/* Content */}
          <div className={styles.syncContent}>
            <Text variant="h3" className={styles.title}>
              مزامنة البيانات مع APIs الخارجية
            </Text>

          <Text variant="paragraph" className={styles.description}>
            {categoryName ?
              `ستقوم هذه العملية بجلب أحدث العلامات التجارية والموديلات لفئة "${categoryName}" من مصادر البيانات الخارجية.` :
              'ستقوم هذه العملية بجلب أحدث العلامات التجارية والموديلات من مصادر البيانات الخارجية.'
            }
          </Text>

          {/* Sync Process Info */}
          <div className={styles.processInfo}>
            <Text variant="small" className={styles.processTitle}>
              ما الذي سيحدث أثناء المزامنة:
            </Text>

            <div className={styles.processList}>
              <div className={styles.processItem}>
                <span>جلب العلامات التجارية الجديدة من APIs الخارجية</span>
              </div>
              <div className={styles.processItem}>
                <span>تحديث الموديلات الموجودة بآخر البيانات</span>
              </div>
              <div className={styles.processItem}>
                <span>إضافة أسماء بديلة جديدة للعلامات</span>
              </div>
              <div className={styles.processItem}>
                <span>معالجة التكرارات تلقائياً</span>
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div className={styles.importantNotes}>
            <div className={styles.noteItem}>
              <Text variant="small">
                <strong>ملاحظة:</strong> العلامات التجارية المضافة يدوياً لن تتأثر بهذه العملية
              </Text>
            </div>
            <div className={styles.noteItem}>
              <Text variant="small">
                <strong>الوقت المتوقع:</strong> قد تستغرق العملية من 2-5 دقائق حسب كمية البيانات
              </Text>
            </div>
            <div className={styles.noteItem}>
              <Text variant="small">
                <strong>المصادر:</strong> RapidAPI Car Data، ومصادر أخرى معتمدة
              </Text>
            </div>
          </div>

          {/* Configuration Info */}
          <div className={styles.configInfo}>
            <Text variant="small" className={styles.configTitle}>
              إعدادات المزامنة الحالية:
            </Text>
            <div className={styles.configDetails}>
              <div className={styles.configItem}>
                <span>الحد الأقصى للعلامات:</span>
                <span>150 علامة تجارية</span>
              </div>
              <div className={styles.configItem}>
                <span>التأخير بين الطلبات:</span>
                <span>120 مللي ثانية</span>
              </div>
              <div className={styles.configItem}>
                <span>عدد المحاولات:</span>
                <span>3 محاولات لكل طلب</span>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className={styles.warningSection}>
            <Text variant="small" color="warning" className={styles.warningText}>
              تأكد من وجود اتصال مستقر بالإنترنت قبل البدء
            </Text>
            <Text variant="small" color="secondary" className={styles.warningText}>
              يمكنك متابعة استخدام النظام أثناء المزامنة، وستظهر النتائج عند الانتهاء
            </Text>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.formActions}>
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
            variant="primary"
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'جاري المزامنة...' : 'بدء المزامنة'}
          </Button>
        </div>
      </div>
      </Form>
    </Modal>
  );
};