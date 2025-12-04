'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container, Text, Button, Loading } from '@/components/slices';
import { CheckCircle, Home, FileText } from 'lucide-react';
import type { PaymentType } from '@/components/payment';
import styles from '../payment.module.scss';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams?.get('type') as PaymentType | null;
  const id = searchParams?.get('id');

  const getMessage = () => {
    switch (type) {
      case 'subscription':
        return {
          title: 'تم ترقية حسابك بنجاح',
          description: 'يمكنك الآن الاستفادة من جميع ميزات الخطة الجديدة',
          action: 'الذهاب إلى لوحة التحكم',
          url: '/dashboard',
        };
      case 'ad_campaign':
        return {
          title: 'تم تأكيد دفع الحملة الإعلانية',
          description: 'سيتم تفعيل حملتك الإعلانية قريباً. ستصلك رسالة تأكيد عبر البريد الإلكتروني',
          action: 'الصفحة الرئيسية',
          url: '/',
        };
      default:
        return {
          title: 'تم الدفع بنجاح',
          description: 'تمت عملية الدفع بنجاح',
          action: 'العودة إلى الصفحة الرئيسية',
          url: '/',
        };
    }
  };

  const message = getMessage();

  return (
    <Container className={styles.resultContainer}>
      <div className={styles.result}>
        <div className={styles.successIcon}>
          <CheckCircle size={80} />
        </div>

        <h1 className={styles.resultTitle}>{message.title}</h1>
        <p className={styles.resultMessage}>{message.description}</p>

        <div className={styles.resultActions}>
          <Button
            onClick={() => router.push(message.url)}
            icon={<FileText size={20} />}
          >
            {message.action}
          </Button>

          <Button
            variant="outline"
            onClick={() => router.push('/')}
            icon={<Home size={20} />}
          >
            الصفحة الرئيسية
          </Button>
        </div>

        {type === 'ad_campaign' && id && (
          <div className={styles.resultInfo}>
            <Text variant="small" color="secondary">
              رقم الحملة: {id.slice(0, 8)}...
            </Text>
          </div>
        )}
      </div>
    </Container>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<Container className={styles.resultContainer}><Loading type="svg" /></Container>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
