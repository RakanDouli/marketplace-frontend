import React, { useState } from 'react';
import { Modal, Button, Text, Form } from '@/components/slices';
import { useNotificationStore } from '@/stores/notificationStore';
import { useBrandsStore } from '@/stores/admin/adminBrandsStore';
import { AlertTriangle, Trash2 } from 'lucide-react';
import styles from './BrandModals.module.scss';

interface Model {
  id: string;
  brandId: string;
  name: string;
  slug: string;
  externalId?: string | null;
  source: 'manual' | 'sync';
  status: 'active' | 'archived';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Local state flags
  isNew?: boolean;
  isModified?: boolean;
  isDeleted?: boolean;
}

interface ConfirmDeleteModelModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: (model: Model) => void;
  model: Model | null;
}

export const ConfirmDeleteModelModal: React.FC<ConfirmDeleteModelModalProps> = ({
  isVisible,
  onClose,
  onConfirm,
  model,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addNotification } = useNotificationStore();
  const { deleteModel } = useBrandsStore();

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!model) return;

    setIsLoading(true);
    setError(null);
    try {
      // Call the store's delete function
      await deleteModel(model.id);

      addNotification({
        type: 'success',
        title: 'تم الحذف بنجاح',
        message: `تم حذف الموديل "${model.name}" بنجاح.`,
        duration: 4000
      });

      onClose();
    } catch (error) {
      console.error('Error deleting model:', error);
      setError(error instanceof Error ? error.message : 'فشل في حذف الموديل. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!model) return null;

  return (
    <Modal
      isVisible={isVisible}
      onClose={onClose}
      title="تأكيد حذف الموديل"
      maxWidth="md"
    >
      <Form onSubmit={handleConfirm} error={error || undefined}>
        <div className={styles.deleteModalContent}>
          <div className={styles.deleteMessage}>
            <Text variant="h3">
              هل أنت متأكد من حذف الموديل؟
            </Text>
          </div>

          <div className={styles.userInfo}>
            <div className={styles.userDetail}>
              <Text variant="paragraph">
                <strong>اسم الموديل:</strong> {model.name}
              </Text>
            </div>
            <div className={styles.userDetail}>
              <Text variant="paragraph">
                <strong>الحالة:</strong> {model.status === 'active' ? 'نشط' : 'مؤرشف'}
              </Text>
            </div>
          </div>

          <div className={styles.warningBox}>
            <AlertTriangle size={20} />
            <div>
              <Text variant="small"><strong>تنبيه:</strong> حذف الموديلات غير متوفر حالياً في النظام الخلفي.</Text>
              <Text variant="small">سيتم وضع علامة للحذف محلياً فقط، ولن يتم الحذف الفعلي من قاعدة البيانات.</Text>
            </div>
          </div>

          <div className={styles.deleteActions}>
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              disabled={isLoading}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              variant="danger"
              loading={isLoading}
              disabled={isLoading}
              icon={<Trash2 size={16} />}
            >
              {isLoading ? 'جاري الحذف...' : 'تأكيد الحذف'}
            </Button>
          </div>
        </div>
      </Form>
    </Modal>
  );
};