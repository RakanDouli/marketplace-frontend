'use client';

import React, { useEffect, useState } from 'react';
import { Text, Button } from '@/components/slices';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { usePayments } from '@/hooks/usePayments';
import { CreditCard } from 'lucide-react';
import styles from './Payments.module.scss';

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  createdAt: string;
}

export default function PaymentsPage() {
  const { user } = useUserAuthStore();
  const { getPaymentHistory, isLoading: paymentsLoading } = usePayments();
  const [payments, setPayments] = useState<Payment[]>([]);

  // Fetch payment history using the hook
  useEffect(() => {
    const fetchPayments = async () => {
      const history = await getPaymentHistory();
      setPayments(history);
    };
    if (user) {
      fetchPayments();
    }
  }, [user, getPaymentHistory]);

  const statusLabels = {
    pending: 'قيد الانتظار',
    completed: 'مكتمل',
    failed: 'فشل',
  };

  const statusColors = {
    pending: 'warning',
    completed: 'success',
    failed: 'error',
  };

  return (
    <div className={styles.payments}>
      <div className={styles.header}>
        <Text variant="h2">المدفوعات</Text>
        <Button icon={<CreditCard size={20} />}>إضافة طريقة دفع</Button>
      </div>

      {/* Current plan */}
      {/* TODO: Implement subscription display when userPackage is added to user object */}
      {/* {user?.subscription && (
        <div className={styles.currentPlan}>
          <Text variant="h3">الخطة الحالية</Text>
          <div className={styles.planInfo}>
            <div className={styles.planItem}>
              <Text variant="small" color="secondary">
                الحالة
              </Text>
              <Text variant="paragraph">
                {user.subscription.status === 'active' ? 'نشط' : 'غير نشط'}
              </Text>
            </div>
            <div className={styles.planItem}>
              <Text variant="small" color="secondary">
                تاريخ التجديد
              </Text>
              <Text variant="paragraph">
                {new Date(user.subscription.currentPeriodEnd).toLocaleDateString(
                  'ar'
                )}
              </Text>
            </div>
          </div>
          <Button variant="primary">ترقية الخطة</Button>
        </div>
      )} */}

      {/* Payment history */}
      <div className={styles.section}>
        <Text variant="h3">سجل المدفوعات</Text>

        {paymentsLoading ? (
          <div className={styles.empty}>
            <Text variant="paragraph">جاري التحميل...</Text>
          </div>
        ) : payments.length === 0 ? (
          <div className={styles.empty}>
            <CreditCard size={48} className={styles.emptyIcon} />
            <Text variant="h4">لا توجد مدفوعات</Text>
            <Text variant="paragraph" color="secondary">
              سيظهر هنا سجل جميع المدفوعات والفواتير
            </Text>
          </div>
        ) : (
          <div className={styles.paymentsList}>
            {payments.map((payment) => (
              <div key={payment.id} className={styles.paymentItem}>
                <div className={styles.paymentInfo}>
                  <Text variant="paragraph">{payment.description}</Text>
                  <Text variant="small" color="secondary">
                    {new Date(payment.createdAt).toLocaleDateString('ar')}
                  </Text>
                </div>
                <div className={styles.paymentDetails}>
                  <Text variant="paragraph">
                    {payment.amount} {payment.currency}
                  </Text>
                  <span
                    className={`${styles.status} ${
                      styles[statusColors[payment.status]]
                    }`}
                  >
                    {statusLabels[payment.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
