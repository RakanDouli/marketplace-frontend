'use client';

import React, { useState } from 'react';
import { Ban, Trash2 } from 'lucide-react';
import { Text, Button, Form } from '@/components/slices';
import { Modal } from '@/components/slices/Modal';
import { useNotificationStore } from '@/stores/notificationStore';
import styles from './ChatModals.module.scss';

interface BlockUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName: string;
}

export const BlockUserModal: React.FC<BlockUserModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  userName,
}) => {
  const { addNotification } = useNotificationStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onConfirm();

      // Success toast
      addNotification({
        type: 'success',
        title: 'نجح',
        message: `تم حظر ${userName} بنجاح`,
        duration: 5000,
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في حظر المستخدم. حاول مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isVisible={isOpen} onClose={onClose}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <Ban size={24} className={styles.dangerIcon} />
          <Text variant="h3">حظر المستخدم</Text>
        </div>

        <Form onSubmit={handleSubmit} error={error || undefined}>
          <div className={styles.modalBody}>
            <Text variant="paragraph" className={styles.description}>
              هل أنت متأكد من حظر <strong>{userName}</strong>؟
            </Text>
            <Text variant="paragraph" color="secondary" className={styles.description}>
              لن يتمكن هذا المستخدم من إرسال رسائل إليك بعد الحظر. يمكنك إلغاء الحظر لاحقاً من الإعدادات.
            </Text>
          </div>

          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting} type="button">
              إلغاء
            </Button>
            <Button
              variant="danger"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'جاري الحظر...' : 'حظر المستخدم'}
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
};

interface DeleteThreadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteThreadModal: React.FC<DeleteThreadModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const { addNotification } = useNotificationStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onConfirm();

      // Success toast
      addNotification({
        type: 'success',
        title: 'نجح',
        message: 'تم حذف المحادثة بنجاح',
        duration: 5000,
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في حذف المحادثة. حاول مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isVisible={isOpen} onClose={onClose}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <Trash2 size={24} className={styles.dangerIcon} />
          <Text variant="h3">حذف المحادثة</Text>
        </div>

        <Form onSubmit={handleSubmit} error={error || undefined}>
          <div className={styles.modalBody}>
            <Text variant="paragraph" className={styles.description}>
              هل أنت متأكد من حذف هذه المحادثة؟
            </Text>
            <Text variant="paragraph" color="secondary" className={styles.description}>
              لن تتمكن من استرجاع الرسائل بعد الحذف. هذا الإجراء نهائي.
            </Text>
          </div>

          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting} type="button">
              إلغاء
            </Button>
            <Button
              variant="danger"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'جاري الحذف...' : 'حذف المحادثة'}
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
};

interface DeleteMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteMessageModal: React.FC<DeleteMessageModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const { addNotification } = useNotificationStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onConfirm();

      // Success toast
      addNotification({
        type: 'success',
        title: 'نجح',
        message: 'تم حذف الرسالة بنجاح',
        duration: 5000,
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في حذف الرسالة. حاول مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isVisible={isOpen} onClose={onClose}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <Trash2 size={24} className={styles.dangerIcon} />
          <Text variant="h3">حذف الرسالة</Text>
        </div>

        <Form onSubmit={handleSubmit} error={error || undefined}>
          <div className={styles.modalBody}>
            <Text variant="paragraph" className={styles.description}>
              هل أنت متأكد من حذف هذه الرسالة؟
            </Text>
            <Text variant="paragraph" color="secondary" className={styles.description}>
              سيتم حذف الرسالة من المحادثة نهائياً.
            </Text>
          </div>

          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting} type="button">
              إلغاء
            </Button>
            <Button
              variant="danger"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'جاري الحذف...' : 'حذف الرسالة'}
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
};
