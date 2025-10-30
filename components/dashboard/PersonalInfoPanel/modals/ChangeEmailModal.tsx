import React, { useState } from 'react';
import { Modal, Input, Button, Text, Form } from '@/components/slices';
import { useNotificationStore } from '@/stores/notificationStore';
import { validateEmail } from '@/lib/validation/authValidation';
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
  const { addNotification } = useNotificationStore();
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isChanging, setIsChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    newEmail?: string;
    password?: string;
  }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate using Zod
    const errors: { newEmail?: string; password?: string } = {};

    const emailError = validateEmail(newEmail);
    if (emailError) errors.newEmail = emailError;

    if (!password) errors.password = 'كلمة المرور مطلوبة للتأكيد';

    // Additional validation: new email must be different from current
    if (newEmail === currentEmail) {
      errors.newEmail = 'البريد الإلكتروني الجديد يجب أن يكون مختلفاً عن الحالي';
    }

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      console.log('❌ Change email validation failed:', errors);
      return; // STOP - do not submit
    }

    console.log('✅ Change email validation passed, submitting...');

    setIsChanging(true);

    try {
      await onConfirm(newEmail, password);
      // Show success toast
      addNotification({
        type: 'success',
        title: 'نجح',
        message: 'تم تغيير البريد الإلكتروني بنجاح',
        duration: 5000,
      });
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
            validate={(value) => {
              const emailError = validateEmail(value);
              if (emailError) return emailError;
              if (value === currentEmail) {
                return 'البريد الإلكتروني الجديد يجب أن يكون مختلفاً عن الحالي';
              }
              return undefined;
            }}
            error={validationErrors.newEmail}
            required
            autoComplete="email"
            placeholder="example@email.com"
          />

          <Input
            type="password"
            label="كلمة المرور للتأكيد *"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            validate={(value) => (!value ? 'كلمة المرور مطلوبة' : undefined)}
            error={validationErrors.password}
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
