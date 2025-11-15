'use client';

import React, { useState } from 'react';
import { Modal, Button, Text, Form } from '@/components/slices';
import { formatPrice } from '@/utils/formatPrice';
import styles from './SubscriptionModals.module.scss';

interface Subscription {
  id: string;
  name: string;
  title: string;
  price: number;
  billingCycle: string;
}

interface DeleteSubscriptionModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  subscription: Subscription | null;
  isLoading: boolean;
}

export const DeleteSubscriptionModal: React.FC<DeleteSubscriptionModalProps> = ({
  isVisible,
  onClose,
  onConfirm,
  subscription,
  isLoading
}) => {
  const [error, setError] = useState<string | null>(null);

  if (!subscription) return null;

  const handleConfirm = async () => {
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء حذف الخطة');
    }
  };

  const displayPrice = (price: number) => {
    if (price === 0) return 'مجاني';
    return formatPrice(price);
  };

  const getBillingCycleLabel = (cycle: string) => {
    const labels: Record<string, string> = {
      'MONTHLY': 'شهري',
      'YEARLY': 'سنوي',
      'FREE': 'مجاني'
    };
    return labels[cycle] || cycle;
  };

  return (
    <Modal
      isVisible={isVisible}
      onClose={onClose}
      title="حذف خطة الاشتراك"
      maxWidth="md"
    >
      <Form onSubmit={(e) => { e.preventDefault(); handleConfirm(); }} error={error || undefined}>
        <div className={styles.deleteModalContent}>
          <Text variant="h3" align="center">
            هل أنت متأكد من حذف هذه الخطة؟
          </Text>

          <div className={styles.subscriptionInfo}>
            <Text variant="paragraph" weight="medium">الخطة المحددة للحذف:</Text>
            <div className={styles.subscriptionDetail}>
              <Text variant="small"><strong>العنوان:</strong> {subscription.title}</Text>
              <Text variant="small"><strong>المعرف:</strong> {subscription.name}</Text>
              <Text variant="small"><strong>السعر:</strong> {displayPrice(subscription.price)}</Text>
              <Text variant="small"><strong>دورة الفوترة:</strong> {getBillingCycleLabel(subscription.billingCycle)}</Text>
            </div>
          </div>

          <div className={styles.warningBox}>
            <Text variant="small" weight="bold" color="error">تحذير مهم:</Text>
            <Text variant="small" color="secondary">
              لا يمكن التراجع عن هذا الإجراء. سيتم حذف الخطة نهائيًا من النظام.
              المستخدمون الذين لديهم هذه الخطة حاليًا لن يتأثروا، لكن لن يمكن للمستخدمين الجدد الاشتراك فيها.
            </Text>
          </div>

          <div className={styles.deleteActions}>
            <Button onClick={onClose} variant="secondary" disabled={isLoading} type="button">
              إلغاء
            </Button>
            <Button type="submit" variant="danger" disabled={isLoading}>
              {isLoading ? 'جاري الحذف...' : 'تأكيد الحذف'}
            </Button>
          </div>
        </div>
      </Form>
    </Modal>
  );
};
