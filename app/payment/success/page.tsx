'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container, Text, Button } from '@/components/slices';
import { CheckCircle, Home, FileText } from 'lucide-react';
import type { PaymentType } from '@/components/payment';
import styles from './PaymentResult.module.scss';

export default function PaymentSuccessPage() {
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
          url: '/admin',
        };
      case 'ad_campaign':
        return {
          title: 'تم تأكيد دفع الحملة الإعلانية',
          description: 'سيتم تفعيل حملتك الإعلانية قريباً. ستصلك رسالة تأكيد عبر البريد الإلكتروني',
          action: 'عرض الحملات',
          url: '/admin',
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
    <Container className={styles.container}>
      <div className={styles.result}>
        <div className={styles.successIcon}>
          <CheckCircle size={80} />
        </div>

        <Text variant="h1">{message.title}</Text>
        <Text variant="paragraph" color="secondary">
          {message.description}
        </Text>

        <div className={styles.actions}>
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
          <div className={styles.additionalInfo}>
            <Text variant="small" color="secondary">
              رقم الحملة: {id.slice(0, 8)}...
            </Text>
          </div>
        )}
      </div>
    </Container>
  );
}
