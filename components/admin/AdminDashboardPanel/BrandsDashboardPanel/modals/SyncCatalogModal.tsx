'use client';

import React from 'react';
import { Modal, Button, Text } from '@/components/slices';
import { Zap, AlertCircle, CheckCircle, Clock } from 'lucide-react';
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
  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (error) {
      // Error is handled by parent component
    }
  };

  return (
    <Modal
      isVisible={isVisible}
      onClose={onClose}
      title="مزامنة كتالوج العلامات التجارية"
      maxWidth="md"
    >
      <div className={styles.syncModal}>
        {/* Icon */}
        <div className={styles.syncIcon}>
          <Zap size={48} color="var(--primary)" />
        </div>

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
                <CheckCircle size={16} color="var(--success)" />
                <span>جلب العلامات التجارية الجديدة من APIs الخارجية</span>
              </div>
              <div className={styles.processItem}>
                <CheckCircle size={16} color="var(--success)" />
                <span>تحديث الموديلات الموجودة بآخر البيانات</span>
              </div>
              <div className={styles.processItem}>
                <CheckCircle size={16} color="var(--success)" />
                <span>إضافة أسماء بديلة جديدة للعلامات</span>
              </div>
              <div className={styles.processItem}>
                <CheckCircle size={16} color="var(--success)" />
                <span>معالجة التكرارات تلقائياً</span>
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div className={styles.importantNotes}>
            <div className={styles.noteItem}>
              <AlertCircle size={16} color="var(--info)" />
              <Text variant="small">
                <strong>ملاحظة:</strong> العلامات التجارية المضافة يدوياً لن تتأثر بهذه العملية
              </Text>
            </div>
            <div className={styles.noteItem}>
              <Clock size={16} color="var(--warning)" />
              <Text variant="small">
                <strong>الوقت المتوقع:</strong> قد تستغرق العملية من 2-5 دقائق حسب كمية البيانات
              </Text>
            </div>
            <div className={styles.noteItem}>
              <Zap size={16} color="var(--primary)" />
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
              ⚠️ تأكد من وجود اتصال مستقر بالإنترنت قبل البدء
            </Text>
            <Text variant="small" color="secondary" className={styles.warningText}>
              💡 يمكنك متابعة استخدام النظام أثناء المزامنة، وستظهر النتائج عند الانتهاء
            </Text>
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
            variant="primary"
            loading={isLoading}
            disabled={isLoading}
            icon={<Zap size={16} />}
          >
            {isLoading ? 'جاري المزامنة...' : 'بدء المزامنة'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};