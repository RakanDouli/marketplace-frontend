'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container, Text, Button, Loading } from '@/components/slices';
import { XCircle, RefreshCw, Home } from 'lucide-react';
import type { PaymentType } from '@/components/payment';
import styles from '../payment.module.scss';

function PaymentFailureContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams?.get('type') as PaymentType | null;
  const id = searchParams?.get('id');

  const getMessage = () => {
    switch (type) {
      case 'subscription':
        return {
          title: 'فشلت عملية ترقية الحساب',
          description: 'لم تتم عملية الدفع. يرجى المحاولة مرة أخرى أو التواصل مع الدعم الفني',
          retryUrl: `/pricing`,
        };
      case 'ad_campaign':
        return {
          title: 'فشلت عملية دفع الحملة',
          description: 'لم تتم عملية الدفع. يرجى المحاولة مرة أخرى',
          retryUrl: id ? `/payment/ad_campaign/${id}` : '/admin',
        };
      default:
        return {
          title: 'فشلت عملية الدفع',
          description: 'لم تتم عملية الدفع. يرجى المحاولة مرة أخرى',
          retryUrl: '/',
        };
    }
  };

  const message = getMessage();

  return (
    <Container className={styles.resultContainer}>
      <div className={styles.result}>
        <div className={styles.errorIcon}>
          <XCircle size={80} />
        </div>

        <h1 className={styles.resultTitle}>{message.title}</h1>
        <p className={styles.resultMessage}>{message.description}</p>

        <div className={styles.resultActions}>
          <Button
            onClick={() => router.push(message.retryUrl)}
            icon={<RefreshCw size={20} />}
          >
            المحاولة مرة أخرى
          </Button>

          <Button
            variant="outline"
            onClick={() => router.push('/')}
            icon={<Home size={20} />}
          >
            الصفحة الرئيسية
          </Button>
        </div>

        <div className={styles.resultInfo}>
          <Text variant="small" color="secondary">
            إذا استمرت المشكلة، يرجى التواصل مع الدعم الفني
          </Text>
        </div>
      </div>
    </Container>
  );
}

export default function PaymentFailurePage() {
  return (
    <Suspense fallback={<Container className={styles.resultContainer}><Loading type="svg" /></Container>}>
      <PaymentFailureContent />
    </Suspense>
  );
}
