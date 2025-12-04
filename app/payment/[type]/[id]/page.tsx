'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Text, Button, Container } from '@/components/slices';
import { PaymentPreview, PaymentMethodSelector } from '@/components/payment';
import type { PaymentType, PaymentMethod, PaymentData } from '@/components/payment';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { ArrowLeft } from 'lucide-react';
import styles from '../../payment.module.scss';

// GraphQL helper
const makeGraphQLCall = async (query: string, variables: any = {}, token?: string) => {
  const response = await fetch(process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
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

const GET_SUBSCRIPTION_PLANS_QUERY = `
  query GetPublicSubscriptionPlans {
    userSubscriptions {
      id
      name
      title
      description
      price
      billingCycle
      accountType
      maxListings
      maxImagesPerListing
      videoAllowed
      priorityPlacement
      analyticsAccess
      customBranding
      featuredListings
    }
  }
`;

// Mutation to initiate subscription payment (creates transaction and returns payment URL)
const INITIATE_SUBSCRIPTION_PAYMENT_MUTATION = `
  mutation InitiateSubscriptionPayment($input: InitiateSubscriptionPaymentInput!) {
    initiateSubscriptionPayment(input: $input) {
      transactionId
      paymentUrl
      amount
      currency
      subscriptionName
      billingPeriodStart
      billingPeriodEnd
    }
  }
`;

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUserAuthStore();
  const { addNotification } = useNotificationStore();
  const type = params?.type as PaymentType;
  const id = params?.id as string;

  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
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
          const data = await makeGraphQLCall(GET_SUBSCRIPTION_PLANS_QUERY);
          const plans = data.userSubscriptions || [];
          const plan = plans.find((p: any) => p.id === id);

          if (!plan) {
            throw new Error('الخطة المطلوبة غير موجودة');
          }

          // Transform plan data to match SubscriptionPaymentData interface
          setPaymentData({
            planId: plan.id,
            planName: plan.name,
            title: plan.title,
            price: plan.price,
            currency: 'USD',
            billingCycle: plan.billingCycle,
            accountType: plan.accountType,
            features: [
              {
                label: 'عدد الإعلانات',
                value: plan.maxListings === 0 ? 'غير محدود' : `${plan.maxListings} إعلانات`,
                included: true,
              },
              {
                label: 'الصور لكل إعلان',
                value: `${plan.maxImagesPerListing} صورة`,
                included: true,
              },
              {
                label: 'رفع فيديو',
                included: plan.videoAllowed,
              },
              {
                label: 'الأولوية في البحث',
                included: plan.priorityPlacement,
              },
              {
                label: 'لوحة التحليلات',
                included: plan.analyticsAccess,
              },
              {
                label: 'شعار الشركة',
                included: plan.customBranding,
              },
              {
                label: 'إعلانات مميزة',
                included: plan.featuredListings,
              },
            ],
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'فشل في تحميل البيانات');
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentData();
  }, [type, id]);

  const handlePaymentMethodSelect = async (method: PaymentMethod) => {
    setSelectedMethod(method);
    setProcessingPayment(true);

    try {
      if (type === 'subscription') {
        // For subscriptions, we need to initiate payment first to get transactionId
        if (!user?.token) {
          addNotification({
            type: 'error',
            title: 'خطأ',
            message: 'يجب تسجيل الدخول للمتابعة',
          });
          router.push('/');
          return;
        }

        // Call initiateSubscriptionPayment mutation
        const data = await makeGraphQLCall(
          INITIATE_SUBSCRIPTION_PAYMENT_MUTATION,
          { input: { subscriptionId: id, durationMonths: 1 } },
          user.token
        );

        const { transactionId, paymentUrl } = data.initiateSubscriptionPayment;

        if (method === 'mock') {
          // For mock payment, redirect to our mock payment page with transactionId
          router.push(`/mock-payment/subscription/${transactionId}`);
        } else {
          // TODO: For real payment, use paymentUrl or redirect to Stripe/PayPal
          alert(`ستتم إعادة التوجيه إلى ${method}`);
        }
      } else if (type === 'ad_campaign') {
        // For ad campaigns, the campaign already exists, just redirect
        if (method === 'mock') {
          router.push(`/mock-payment/ad_campaign/${id}`);
        } else {
          // TODO: Redirect to Stripe/PayPal
          alert(`ستتم إعادة التوجيه إلى ${method}`);
        }
      }
    } catch (err) {
      console.error('Payment initiation error:', err);
      addNotification({
        type: 'error',
        title: 'خطأ في بدء عملية الدفع',
        message: err instanceof Error ? err.message : 'حدث خطأ غير متوقع',
      });
    } finally {
      setProcessingPayment(false);
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
            disabled={processingPayment}
          />
          {processingPayment && (
            <Text variant="small" color="secondary" style={{ marginTop: '1rem', textAlign: 'center' }}>
              جاري إنشاء طلب الدفع...
            </Text>
          )}
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
