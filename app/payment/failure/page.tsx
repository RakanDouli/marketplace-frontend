'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container, Text, Button } from '@/components/slices';
import { XCircle, RefreshCw, Home } from 'lucide-react';
import type { PaymentType } from '@/components/payment';
import styles from './PaymentResult.module.scss';

export default function PaymentFailurePage() {
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
    <Container className={styles.container}>
      <div className={styles.result}>
        <div className={styles.errorIcon}>
          <XCircle size={80} />
        </div>

        <Text variant="h1">{message.title}</Text>
        <Text variant="paragraph" color="secondary">
          {message.description}
        </Text>

        <div className={styles.actions}>
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

        <div className={styles.additionalInfo}>
          <Text variant="small" color="secondary">
            إذا استمرت المشكلة، يرجى التواصل مع الدعم الفني
          </Text>
        </div>
      </div>
    </Container>
  );
}
