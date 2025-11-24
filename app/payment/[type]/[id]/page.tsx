'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Text, Button, Container } from '@/components/slices';
import { PaymentPreview, PaymentMethodSelector } from '@/components/payment';
import type { PaymentType, PaymentMethod, PaymentData } from '@/components/payment';
import { ArrowLeft } from 'lucide-react';
import styles from '../../payment.module.scss';

// GraphQL helper
const makeGraphQLCall = async (query: string, variables: any = {}) => {
  const response = await fetch(process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  const result = await response.json();

  if (result.errors) {
    throw new Error(result.errors[0]?.message || 'GraphQL Error');
  }

  return result.data;
};

// GraphQL queries for different payment types
const GET_CAMPAIGN_QUERY = `
  query GetCampaignForPayment($id: String!) {
    getCampaignForPayment(id: $id) {
      id
      campaignName
      description
      totalPrice
      currency
      startDate
      endDate
      isCustomPackage
      packageBreakdown
      client {
        id
        companyName
        contactName
        contactEmail
      }
      package {
        id
        packageName
        adType
      }
    }
  }
`;

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const type = params?.type as PaymentType;
  const id = params?.id as string;

  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch payment data based on type
  useEffect(() => {
    if (!type || !id) return;

    const fetchPaymentData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (type === 'ad_campaign') {
          const data = await makeGraphQLCall(GET_CAMPAIGN_QUERY, { id });
          setPaymentData(data.getCampaignForPayment);
        } else if (type === 'subscription') {
          // TODO: Add subscription query when backend is ready
          throw new Error('Subscription payment not yet implemented');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'فشل في تحميل البيانات');
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentData();
  }, [type, id]);

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);

    if (method === 'mock') {
      // Redirect to mock payment page
      router.push(`/mock-payment/${id}`);
    } else {
      // TODO: Redirect to Stripe/PayPal
      alert(`ستتم إعادة التوجيه إلى ${method}`);
    }
  };

  if (loading) {
    return (
      <Container className={styles.paymentContainer}>
        <div className={styles.loading}>
          <Text variant="h3">جاري التحميل...</Text>
        </div>
      </Container>
    );
  }

  if (error || !paymentData) {
    return (
      <Container className={styles.paymentContainer}>
        <div className={styles.error}>
          <Text variant="h3">خطأ في تحميل البيانات</Text>
          <Text variant="paragraph" color="secondary">
            {error || 'لم يتم العثور على البيانات المطلوبة'}
          </Text>
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            icon={<ArrowLeft size={20} />}
          >
            العودة إلى الصفحة الرئيسية
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container className={styles.paymentContainer}>
      <div className={styles.paymentPage}>
        <div className={styles.paymentHeader}>
          <Text variant="h2">إتمام عملية الدفع</Text>
          <Text variant="paragraph" color="secondary">
            يرجى مراجعة التفاصيل واختيار طريقة الدفع المناسبة
          </Text>
        </div>

        {/* Payment Preview */}
        <div className={styles.paymentSection}>
          <PaymentPreview type={type} data={paymentData} />
        </div>

        {/* Payment Method Selection */}
        <div className={styles.paymentSection}>
          <PaymentMethodSelector
            methods={['mock', 'stripe', 'paypal']}
            onSelect={handlePaymentMethodSelect}
          />
        </div>

        <div className={styles.paymentFooter}>
          <Text variant="small" color="secondary">
            ملاحظة: بعد اختيار طريقة الدفع، ستتم إعادة توجيهك إلى بوابة الدفع الآمنة.
          </Text>
        </div>
      </div>
    </Container>
  );
}
