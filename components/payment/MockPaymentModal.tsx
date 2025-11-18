'use client';

import React, { useState } from 'react';
import { Modal, Button, Text, Form } from '@/components/slices';
import { CheckCircle, XCircle, CreditCard, DollarSign } from 'lucide-react';
import { useNotificationStore } from '@/stores/notificationStore';
import styles from './MockPaymentModal.module.scss';

interface PaymentData {
  amount: number;
  currency: string;
  description: string;
  metadata?: Record<string, any>;
  onConfirm: () => Promise<void>;
}

interface MockPaymentModalProps {
  isVisible: boolean;
  onClose: () => void;
  paymentData: PaymentData;
}

export const MockPaymentModal: React.FC<MockPaymentModalProps> = ({
  isVisible,
  onClose,
  paymentData,
}) => {
  const { addNotification } = useNotificationStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'rejected'>('pending');

  const handleConfirmPayment = async () => {
    try {
      setIsProcessing(true);
      await paymentData.onConfirm();
      setPaymentStatus('success');

      // Show success toast
      addNotification({
        type: 'success',
        title: 'تم الدفع بنجاح',
        message: 'تم تأكيد دفعتك بنجاح',
        duration: 5000,
      });

      // Close modal after short delay
      setTimeout(() => {
        onClose();
        // Reset status for next use
        setPaymentStatus('pending');
      }, 1500);
    } catch (err) {
      console.error('Payment confirmation error:', err);
      addNotification({
        type: 'error',
        title: 'فشل الدفع',
        message: err instanceof Error ? err.message : 'فشل في تأكيد الدفع',
        duration: 5000,
      });
      setIsProcessing(false);
    }
  };

  const handleRejectPayment = () => {
    setPaymentStatus('rejected');
    addNotification({
      type: 'info',
      title: 'تم إلغاء الدفع',
      message: 'تم إلغاء عملية الدفع',
      duration: 3000,
    });
    setTimeout(() => {
      onClose();
      setPaymentStatus('pending');
    }, 1000);
  };

  if (paymentStatus === 'success') {
    return (
      <Modal isVisible={isVisible} onClose={onClose}>
        <div className={styles.successContainer}>
          <div className={styles.successIcon}>
            <CheckCircle size={64} />
          </div>
          <Text variant="h2">تم الدفع بنجاح</Text>
          <Text variant="paragraph" color="secondary">
            تم تأكيد دفعتك بنجاح
          </Text>
        </div>
      </Modal>
    );
  }

  if (paymentStatus === 'rejected') {
    return (
      <Modal isVisible={isVisible} onClose={onClose}>
        <div className={styles.rejectedContainer}>
          <div className={styles.rejectIcon}>
            <XCircle size={64} />
          </div>
          <Text variant="h2">تم إلغاء الدفع</Text>
          <Text variant="paragraph" color="secondary">
            تم إلغاء عملية الدفع
          </Text>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isVisible={isVisible} onClose={onClose}>
      <div className={styles.mockPayment}>
        <div className={styles.header}>
          <CreditCard size={48} />
          <Text variant="h2">محاكي الدفع</Text>
          <Text variant="small" color="secondary">
            Mock Payment Gateway - للتطوير والاختبار فقط
          </Text>
        </div>

        <div className={styles.paymentDetails}>
          <Text variant="h3">تفاصيل الدفع</Text>

          <div className={styles.detail}>
            <Text variant="small" color="secondary">الوصف</Text>
            <Text variant="paragraph">{paymentData.description}</Text>
          </div>

          <div className={styles.detail}>
            <Text variant="small" color="secondary">المبلغ المطلوب</Text>
            <div className={styles.amount}>
              <DollarSign size={20} />
              <Text variant="h3">{paymentData.amount} {paymentData.currency}</Text>
            </div>
          </div>
        </div>

        {paymentData.metadata && Object.keys(paymentData.metadata).length > 0 && (
          <div className={styles.metadata}>
            <Text variant="h4">البيانات المرسلة إلى بوابة الدفع</Text>
            <div className={styles.payloadBox}>
              <pre>
                {JSON.stringify({
                  paymentIntent: {
                    id: `pi_mock_${Date.now()}`,
                    amount: paymentData.amount * 100, // في السنتات
                    currency: paymentData.currency.toLowerCase(),
                    description: paymentData.description,
                    metadata: paymentData.metadata,
                  },
                }, null, 2)}
              </pre>
            </div>
          </div>
        )}

        <div className={styles.actions}>
          <Button
            onClick={handleConfirmPayment}
            disabled={isProcessing}
            icon={<CheckCircle size={20} />}
          >
            {isProcessing ? 'جاري التأكيد...' : 'تأكيد الدفع'}
          </Button>
          <Button
            variant="danger"
            onClick={handleRejectPayment}
            disabled={isProcessing}
            icon={<XCircle size={20} />}
          >
            رفض الدفع
          </Button>
        </div>

        <div className={styles.disclaimer}>
          <Text variant="small" color="secondary">
            هذه صفحة محاكاة للدفع. لن يتم خصم أي مبالغ حقيقية.
          </Text>
        </div>
      </div>
    </Modal>
  );
};
