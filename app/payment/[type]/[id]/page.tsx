'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Text, Button, Container } from '@/components/slices';
import { PaymentPreview, PaymentMethodSelector } from '@/components/payment';
import type { PaymentType, PaymentMethod, PaymentMethodOption, PaymentData, PaymentFeeInfo } from '@/components/payment';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { ArrowLeft, CreditCard } from 'lucide-react';
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
      monthlyPrice
      yearlyPrice
      yearlySavingsPercent
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

// Query to get exchange rate
const GET_EXCHANGE_RATE_QUERY = `
  query GetExchangeRate($from: String!, $to: String!) {
    getExchangeRate(from: $from, to: $to)
  }
`;

// Query to get financial settings (tax rate)
const GET_FINANCIAL_SETTINGS_QUERY = `
  query GetPublicFinancialSettings {
    publicFinancialSettings {
      taxEnabled
      taxRate
    }
  }
`;

export default function PaymentPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUserAuthStore();
  const { addNotification } = useNotificationStore();
  const type = params?.type as PaymentType;
  const id = params?.id as string;

  // Get billing cycle from URL query param (for subscriptions)
  const billingCycleParam = searchParams?.get('cycle') as 'monthly' | 'yearly' | null;
  const billingCycle = billingCycleParam || 'monthly';

  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [selectedMethodOption, setSelectedMethodOption] = useState<PaymentMethodOption | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(0);

  // Get base amount for fee calculation
  const baseAmount = paymentData
    ? 'totalPrice' in paymentData
      ? paymentData.totalPrice
      : paymentData.price
    : 0;

  // Calculate fee info based on selected payment method
  // NOTE: Tax is INCLUDED in the base price, NOT added on top
  const feeInfo = useMemo<PaymentFeeInfo | null>(() => {
    // Tax is INCLUDED in baseAmount - calculate the tax portion for display only
    // If tax rate is 10% and price is $100, tax portion is $100 * (10/110) = $9.09
    const taxAmount = taxRate > 0 ? baseAmount * (taxRate / (100 + taxRate)) : 0;

    if (!paymentData) {
      return null;
    }

    if (!selectedMethod || !selectedMethodOption) {
      // No payment method selected yet - show base amounts (tax already included)
      const totalWithFee = baseAmount; // Tax is already in baseAmount
      const totalInSyp = exchangeRate > 0 ? totalWithFee * exchangeRate : 0;
      return {
        paymentMethod: null,
        paymentMethodNameAr: '',
        feePercentage: 0,
        fixedFee: 0,
        processingFee: 0,
        taxRate,
        taxAmount,
        totalWithFee,
        exchangeRate,
        totalInSyp,
      };
    }

    // Calculate processing fee based on selected method (on base amount which includes tax)
    const processingFee = (baseAmount * (selectedMethodOption.feePercentage / 100)) + selectedMethodOption.fixedFee;
    // Total = baseAmount (which includes tax) + processingFee
    const totalWithFee = baseAmount + processingFee;
    const totalInSyp = exchangeRate > 0 ? totalWithFee * exchangeRate : 0;

    return {
      paymentMethod: selectedMethod,
      paymentMethodNameAr: selectedMethodOption.displayNameAr || selectedMethodOption.displayName,
      feePercentage: selectedMethodOption.feePercentage,
      fixedFee: selectedMethodOption.fixedFee,
      processingFee,
      taxRate,
      taxAmount,
      totalWithFee,
      exchangeRate,
      totalInSyp,
    };
  }, [paymentData, selectedMethod, selectedMethodOption, baseAmount, exchangeRate, taxRate]);

  // Fetch exchange rate and tax rate
  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        // Fetch exchange rate and financial settings in parallel
        const [exchangeData, financialData] = await Promise.all([
          makeGraphQLCall(GET_EXCHANGE_RATE_QUERY, { from: 'USD', to: 'SYP' }),
          makeGraphQLCall(GET_FINANCIAL_SETTINGS_QUERY),
        ]);

        setExchangeRate(exchangeData.getExchangeRate || 0);

        // Set tax rate if enabled
        const settings = financialData.publicFinancialSettings;
        if (settings?.taxEnabled && settings?.taxRate > 0) {
          setTaxRate(Number(settings.taxRate));
        }
      } catch (err) {
        console.error('Failed to fetch financial data:', err);
        setExchangeRate(0);
        setTaxRate(0);
      }
    };

    fetchFinancialData();
  }, []);

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

          // Calculate the price based on selected billing cycle
          const selectedPrice = billingCycle === 'yearly' && plan.yearlyPrice
            ? plan.yearlyPrice
            : plan.monthlyPrice;

          // Transform plan data to match SubscriptionPaymentData interface
          setPaymentData({
            planId: plan.id,
            planName: plan.name,
            title: plan.title,
            monthlyPrice: plan.monthlyPrice,
            yearlyPrice: plan.yearlyPrice,
            price: selectedPrice,
            currency: 'USD',
            billingCycle: billingCycle,
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
  }, [type, id, billingCycle]);

  // Handle payment method selection (just updates state)
  const handlePaymentMethodSelect = (method: PaymentMethod, option: PaymentMethodOption) => {
    setSelectedMethod(method);
    setSelectedMethodOption(option);
  };

  // Handle proceed to payment button
  const handleProceedToPayment = async () => {
    if (!selectedMethod) {
      addNotification({
        type: 'error',
        title: 'خطأ',
        message: 'يرجى اختيار طريقة الدفع',
      });
      return;
    }

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

        // Call initiateSubscriptionPayment mutation with billing cycle
        const durationMonths = billingCycle === 'yearly' ? 12 : 1;
        const data = await makeGraphQLCall(
          INITIATE_SUBSCRIPTION_PAYMENT_MUTATION,
          { input: { subscriptionId: id, durationMonths, billingCycle } },
          user.token
        );

        const { transactionId } = data.initiateSubscriptionPayment;

        // Redirect to mock payment page with selected method
        router.push(`/mock-payment/subscription/${transactionId}?method=${selectedMethod}`);
      } else if (type === 'ad_campaign') {
        // For ad campaigns, the campaign already exists, just redirect with method
        router.push(`/mock-payment/ad_campaign/${id}?method=${selectedMethod}`);
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
          <PaymentPreview type={type} data={paymentData} feeInfo={feeInfo} />
        </div>

        {/* Payment Method Selection - Now fetches from backend */}
        <div className={styles.paymentSection}>
          <PaymentMethodSelector
            onSelect={handlePaymentMethodSelect}
            disabled={processingPayment}
            selectedMethod={selectedMethod}
            baseAmount={baseAmount}
          />
        </div>

        {/* Proceed Button */}
        <div className={styles.paymentSection}>
          <Button
            onClick={handleProceedToPayment}
            disabled={!selectedMethod || processingPayment}
            icon={<CreditCard size={20} />}
            size="lg"
            style={{ width: '100%' }}
          >
            {processingPayment ? 'جاري المعالجة...' : 'متابعة الدفع'}
          </Button>
        </div>

        <div className={styles.paymentFooter}>
          <Text variant="small" color="secondary">
            ملاحظة: بعد الضغط على "متابعة الدفع"، ستتم إعادة توجيهك إلى بوابة الدفع الآمنة.
          </Text>
        </div>
      </div>
    </Container>
  );
}
