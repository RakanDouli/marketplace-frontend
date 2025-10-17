import React, { useState } from 'react';
import { Modal, Button, Text, Form } from '@/components/slices';
import styles from './DashboardModals.module.scss';

interface DeleteAccountModalProps {
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  onClose,
  onConfirm,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    setIsDeleting(true);

    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء حذف الحساب');
      setIsDeleting(false);
    }
  };

  return (
    <Modal isVisible={true} onClose={onClose} maxWidth="md" title="حذف الحساب نهائياً">
      <Form onSubmit={(e) => { e.preventDefault(); handleConfirm(); }} error={error || undefined}>
        <div className={styles.content}>
          <div className={styles.warningBox}>
            <Text variant="paragraph" style={{ fontWeight: 600 }}>
              تحذير: هذا الإجراء لا يمكن التراجع عنه!
            </Text>
          </div>

          <Text variant="paragraph">
            سيتم حذف حسابك بشكل نهائي، بما في ذلك:
          </Text>

          <ul className={styles.list}>
            <li>جميع إعلاناتك </li>
            <li>معلوماتك الشخصية </li>
            <li>سجل المعاملات </li>
            <li> الاشتراكات النشطة</li>
          </ul>
        </div>

        <div className={styles.formActions}>
          <Button variant="outline" onClick={onClose} disabled={isDeleting} type="button">
            إلغاء
          </Button>
          <Button
            variant="secondary"
            type="submit"
            disabled={isDeleting}
          >
            {isDeleting ? 'جاري الحذف...' : 'حذف الحساب نهائياً'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
