import React, { useState } from 'react';
import { Modal, Button, Text, Form } from '@/components/slices';
import styles from './DashboardModals.module.scss';

interface DeactivateAccountModalProps {
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const DeactivateAccountModal: React.FC<DeactivateAccountModalProps> = ({
  onClose,
  onConfirm,
}) => {
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    setIsDeactivating(true);

    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تعطيل الحساب');
      setIsDeactivating(false);
    }
  };

  return (
    <Modal isVisible={true} onClose={onClose} maxWidth="md" title="تعطيل الحساب">
      <Form onSubmit={(e) => { e.preventDefault(); handleConfirm(); }} error={error || undefined}>
        <div className={styles.content}>
          <Text variant="paragraph">
            عند تعطيل حسابك:
          </Text>

          <ul className={styles.list}>
            <li>سيتم إخفاء جميع إعلاناتك من البحث</li>
            <li>لن يتمكن الآخرون من مشاهدة ملفك الشخصي</li>
            <li>سيتم إيقاف اشتراكاتك المدفوعة مؤقتاً</li>
            <li>يمكنك إعادة التفعيل في أي وقت بتسجيل الدخول مرة أخرى</li>
          </ul>

          <div className={styles.infoBox}>
            <Text variant="small">
              ملاحظة: يمكنك إعادة تفعيل حسابك في أي وقت عن طريق تسجيل الدخول مرة أخرى
            </Text>
          </div>
        </div>

        <div className={styles.formActions}>
          <Button variant="outline" onClick={onClose} disabled={isDeactivating} type="button">
            إلغاء
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={isDeactivating}
          >
            {isDeactivating ? 'جاري التعطيل...' : 'تأكيد التعطيل'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
