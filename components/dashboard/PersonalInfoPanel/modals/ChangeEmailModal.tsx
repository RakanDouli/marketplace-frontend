import React, { useState } from 'react';
import { Modal, Input, Button, Text, Form } from '@/components/slices';
import styles from './DashboardModals.module.scss';

interface ChangeEmailModalProps {
  currentEmail: string;
  onClose: () => void;
  onConfirm: (newEmail: string, password: string) => Promise<void>;
}

export const ChangeEmailModal: React.FC<ChangeEmailModalProps> = ({
  currentEmail,
  onClose,
  onConfirm,
}) => {
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isChanging, setIsChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (newEmail === currentEmail) {
      setError('البريد الإلكتروني الجديد يجب أن يكون مختلفاً عن الحالي');
      return;
    }

    if (!newEmail.includes('@')) {
      setError('يرجى إدخال بريد إلكتروني صحيح');
      return;
    }

    if (!password) {
      setError('يرجى إدخال كلمة المرور للتأكيد');
      return;
    }

    setIsChanging(true);

    try {
      await onConfirm(newEmail, password);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تغيير البريد الإلكتروني');
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <Modal isVisible={true} onClose={onClose} maxWidth="md" title="تغيير البريد الإلكتروني">
      <Form onSubmit={handleSubmit} error={error || undefined}>
        <div className={styles.content}>
          <Input
            type="email"
            label="البريد الإلكتروني الحالي"
            value={currentEmail}
            disabled
          />

          <Input
            type="email"
            label="البريد الإلكتروني الجديد *"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="example@email.com"
          />

          <Input
            type="password"
            label="كلمة المرور للتأكيد *"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="أدخل كلمة المرور الحالية"
          />

          <div className={styles.infoBox}>
            <Text variant="small">
              ملاحظة: سيتم إرسال رسالة تأكيد إلى البريد الإلكتروني الجديد
            </Text>
          </div>
        </div>

        <div className={styles.formActions}>
          <Button variant="outline" onClick={onClose} disabled={isChanging} type="button">
            إلغاء
          </Button>
          <Button variant="primary" type="submit" disabled={isChanging}>
            {isChanging ? 'جاري التغيير...' : 'تغيير البريد الإلكتروني'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
