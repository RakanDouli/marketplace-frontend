'use client';

import React, { useState } from 'react';
import { Modal, Button, Text, Form, Input } from '@/components/slices';
import { useChatStore } from '@/stores/chatStore';
import { useNotificationStore } from '@/stores/notificationStore';
import {
  validateChatMessageForm,
  hasValidationErrors,
  type ValidationErrors,
} from '@/lib/validation/chatValidation';
import styles from './ContactSellerModal.module.scss';

interface ContactSellerModalProps {
  isVisible: boolean;
  onClose: () => void;
  listingId: string;
  listingTitle: string;
  sellerId: string;
}

const QUICK_MESSAGES = [
  'هل هذا الإعلان لا يزال متاحاً؟',
  'هل يمكنني رؤية المزيد من الصور؟',
];

export const ContactSellerModal: React.FC<ContactSellerModalProps> = ({
  isVisible,
  onClose,
  listingId,
  listingTitle,
  sellerId,
}) => {
  const { getOrCreateThread, sendMessage } = useChatStore();
  const { addNotification } = useNotificationStore();

  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const handleTemplateSelect = (index: number) => {
    setSelectedTemplate(index);
    setMessage(QUICK_MESSAGES[index]);
    setValidationErrors({});
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate using Zod
    const errors = validateChatMessageForm({ message });
    setValidationErrors(errors);

    if (hasValidationErrors(errors)) {
      console.log('❌ Message validation failed:', errors);
      return;
    }

    console.log('✅ Message validation passed, sending...');
    setIsSubmitting(true);

    try {
      const threadId = await getOrCreateThread(listingId, sellerId);
      await sendMessage(threadId, message.trim());

      addNotification({
        type: 'success',
        title: 'نجح',
        message: 'تم إرسال رسالتك بنجاح',
        duration: 5000,
      });

      handleClose();
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'فشل في إرسال الرسالة');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedTemplate(null);
    setMessage('');
    setValidationErrors({});
    setError(null);
    onClose();
  };

  return (
    <Modal isVisible={isVisible} maxWidth='md' onClose={handleClose}>
      <div className={styles.modalContent}>
        <div className={styles.header}>
          <Text variant="h3">تواصل مع صاحب الإعلان</Text>
          <Text variant="small" color="secondary">
            {listingTitle}
          </Text>
        </div>

        <Form onSubmit={handleSend} error={error || undefined}>
          <div className={styles.body}>
            <Text variant="paragraph" color="secondary">
              اختر رسالة سريعة أو اكتب رسالتك:
            </Text>

            <div className={styles.templates}>
              {QUICK_MESSAGES.map((msg, index) => (
                <Button
                  key={index}
                  type="button"
                  variant={selectedTemplate === index ? 'primary' : 'outline'}
                  onClick={() => handleTemplateSelect(index)}
                  disabled={isSubmitting}

                >
                  {msg}
                </Button>
              ))}
            </div>

            <Input
              type="textarea"
              label="رسالتك"
              placeholder="اكتب رسالتك هنا..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              error={validationErrors.message}
              disabled={isSubmitting}
              rows={4}
              required
            />
          </div>

          <div className={styles.actions}>
            <Button variant="outline" onClick={handleClose} disabled={isSubmitting} type="button">
              إلغاء
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'جاري الإرسال...' : 'إرسال'}
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
};
