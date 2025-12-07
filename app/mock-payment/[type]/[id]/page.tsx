'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Text, Button } from '@/components/slices';
import { CheckCircle, XCircle, CreditCard, DollarSign, Wallet, Building2, Banknote, TestTube } from 'lucide-react';
import styles from './MockPayment.module.scss';

// Types
interface PaymentOption {
  displayName: string;
  displayNameAr?: string;
  feePercentage: number;
  fixedFee: number;
  processingFee: number;
  total: number;
}

// GraphQL queries
const GET_CAMPAIGN_QUERY = `
  query GetCampaignForPayment($id: String!) {
    getCampaignForPayment(id: $id) {
      id
      campaignName
      totalPrice
      currency
      packageBreakdown
    }
  }
`;

// Query for subscription transaction (by transactionId)
const GET_SUBSCRIPTION_TRANSACTION_QUERY = `
  query GetSubscriptionTransaction($transactionId: ID!) {
    getSubscriptionTransaction(transactionId: $transactionId) {
      id
      amount
      currency
      status
      notes
      billingPeriodStart
      billingPeriodEnd
      taxRate
      taxAmount
      originalAmount
      discountAmount
      discountPercentage
      discountReason
    }
  }
`;

// Query for payment method settings to calculate fees
const GET_PAYMENT_METHODS_QUERY = `
  query GetPublicPaymentMethods {
    publicPaymentMethods {
      id
      paymentMethod
      displayName
      displayNameAr
      feePercentage
      fixedFee
      isActive
    }
  }
`;

// Mutation for ad campaign payment confirmation
const CONFIRM_CAMPAIGN_PAYMENT_MUTATION = `
  mutation ConfirmPayment($campaignId: String!, $paymentMethod: String) {
    confirmPayment(campaignId: $campaignId, paymentMethod: $paymentMethod) {
      id
      status
    }
  }
`;

// Mutation for subscription payment confirmation
const CONFIRM_SUBSCRIPTION_PAYMENT_MUTATION = `
  mutation ConfirmSubscriptionPayment($transactionId: ID!, $paymentMethod: String) {
    confirmSubscriptionPayment(transactionId: $transactionId, paymentMethod: $paymentMethod) {
      id
      status
      processingFee
    }
  }
`;

// Helper function for GraphQL calls
const makeGraphQLCall = async (query: string, variables: Record<string, unknown> = {}) => {
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

// Get icon for payment method
const getMethodIcon = (method: string) => {
  switch (method) {
    case 'stripe':
      return <CreditCard size={24} />;
    case 'paypal':
      return <Wallet size={24} />;
    case 'bank_transfer':
      return <Building2 size={24} />;
    case 'cash':
      return <Banknote size={24} />;
    case 'mock':
      return <TestTube size={24} />;
    default:
      return <CreditCard size={24} />;
  }
};

export default function MockPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const type = params?.type as 'subscription' | 'ad_campaign';
  const id = params?.id as string;
  const paymentMethod = searchParams?.get('method') || 'mock';

  const [paymentData, setPaymentData] = useState<{
    amount: number;
    currency: string;
    description: string;
    billingPeriodStart?: string;
    billingPeriodEnd?: string;
    taxRate?: number;
    taxAmount?: number;
    originalAmount?: number;
    discountAmount?: number;
    discountPercentage?: number;
    discountReason?: string;
  } | null>(null);

  const [paymentOption, setPaymentOption] = useState<PaymentOption | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // Fetch payment data and calculate fees
  useEffect(() => {
    if (!type || !id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch payment methods to get fee info
        const methodsData = await makeGraphQLCall(GET_PAYMENT_METHODS_QUERY);
        const methods = methodsData.publicPaymentMethods || [];
        const selectedMethodData = methods.find((m: any) => m.paymentMethod === paymentMethod);

        // Fetch payment data based on type
        if (type === 'ad_campaign') {
          const data = await makeGraphQLCall(GET_CAMPAIGN_QUERY, { id });
          const campaign = data.getCampaignForPayment;
          const packageBreakdown = campaign.packageBreakdown;
          const hasDiscount = packageBreakdown?.discountPercentage && packageBreakdown.discountPercentage > 0;

          setPaymentData({
            amount: campaign.totalPrice,
            currency: campaign.currency,
            description: campaign.campaignName,
            originalAmount: hasDiscount ? packageBreakdown.totalBeforeDiscount : undefined,
            discountAmount: hasDiscount ? (packageBreakdown.totalBeforeDiscount - packageBreakdown.totalAfterDiscount) : undefined,
            discountPercentage: hasDiscount ? packageBreakdown.discountPercentage : undefined,
            discountReason: hasDiscount ? packageBreakdown.discountReason : undefined,
          });

          // Calculate processing fee
          if (selectedMethodData) {
            const amount = campaign.totalPrice;
            const percentageFee = amount * (selectedMethodData.feePercentage / 100);
            const processingFee = parseFloat((percentageFee + selectedMethodData.fixedFee).toFixed(2));
            setPaymentOption({
              displayName: selectedMethodData.displayName,
              displayNameAr: selectedMethodData.displayNameAr,
              feePercentage: selectedMethodData.feePercentage,
              fixedFee: selectedMethodData.fixedFee,
              processingFee,
              total: parseFloat((amount + processingFee).toFixed(2)),
            });
          }
        } else if (type === 'subscription') {
          const data = await makeGraphQLCall(GET_SUBSCRIPTION_TRANSACTION_QUERY, { transactionId: id });
          const transaction = data.getSubscriptionTransaction;

          if (!transaction) {
            throw new Error('Transaction not found');
          }

          const subscriptionName = transaction.notes?.replace('Subscription: ', '').split(' (')[0] || 'Subscription';

          setPaymentData({
            amount: transaction.amount,
            currency: transaction.currency,
            description: subscriptionName,
            billingPeriodStart: transaction.billingPeriodStart,
            billingPeriodEnd: transaction.billingPeriodEnd,
            taxRate: transaction.taxRate,
            taxAmount: transaction.taxAmount,
            originalAmount: transaction.originalAmount,
            discountAmount: transaction.discountAmount,
            discountPercentage: transaction.discountPercentage,
            discountReason: transaction.discountReason,
          });

          // Calculate processing fee
          if (selectedMethodData) {
            const amount = transaction.amount;
            const percentageFee = amount * (selectedMethodData.feePercentage / 100);
            const processingFee = parseFloat((percentageFee + selectedMethodData.fixedFee).toFixed(2));
            setPaymentOption({
              displayName: selectedMethodData.displayName,
              displayNameAr: selectedMethodData.displayNameAr,
              feePercentage: selectedMethodData.feePercentage,
              fixedFee: selectedMethodData.fixedFee,
              processingFee,
              total: parseFloat((amount + processingFee).toFixed(2)),
            });
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load payment data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [type, id, paymentMethod]);

  const handleConfirmPayment = async () => {
    try {
      setUpdating(true);

      if (type === 'ad_campaign') {
        await makeGraphQLCall(CONFIRM_CAMPAIGN_PAYMENT_MUTATION, {
          campaignId: id,
          paymentMethod: paymentMethod,
        });
      } else if (type === 'subscription') {
        await makeGraphQLCall(CONFIRM_SUBSCRIPTION_PAYMENT_MUTATION, {
          transactionId: id,
          paymentMethod: paymentMethod,
        });
      }

      router.push(`/payment/success?type=${type}&id=${id}`);
    } catch (err) {
      console.error('Payment confirmation error:', err);
      router.push(`/payment/failure?type=${type}&id=${id}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleRejectPayment = () => {
    router.push(`/payment/failure?type=${type}&id=${id}`);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <Text variant="h3">جاري التحميل...</Text>
        </div>
      </div>
    );
  }

  if (error || !paymentData) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <Text variant="h3">خطأ في تحميل البيانات</Text>
          <Text variant="paragraph" color="secondary">
            {error || 'لم يتم العثور على بيانات الدفع'}
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Gateway Header */}
        <div className={styles.header}>
          <CreditCard size={48} />
          <Text variant="h2">بوابة الدفع</Text>
          <Text variant="small" color="secondary">
            معالجة الدفع الآمنة - وضع التطوير
          </Text>
        </div>

        {/* Selected Payment Method Display */}
        <div className={styles.selectedMethod}>
          {getMethodIcon(paymentMethod)}
          <Text variant="h4">
            {paymentOption?.displayNameAr || paymentOption?.displayName || paymentMethod}
          </Text>
        </div>

        {/* Payment Amount Breakdown */}
        <div className={styles.paymentDetails}>
          <div className={styles.amountSection}>
            <Text variant="small" color="secondary">المبلغ الإجمالي</Text>
            <div className={styles.amount}>
              <DollarSign size={32} />
              <Text variant="h1">
                {(paymentOption?.total || paymentData.amount).toFixed(2)}
              </Text>
              <Text variant="h4" color="secondary">{paymentData.currency}</Text>
            </div>
          </div>

          {/* Fee Breakdown */}
          <div className={styles.feeBreakdown}>
            {/* Show original price if there's a discount */}
            {paymentData.originalAmount && paymentData.discountAmount && paymentData.discountAmount > 0 && (
              <>
                <div className={styles.feeRow}>
                  <Text variant="small" color="secondary">السعر الأصلي</Text>
                  <Text variant="paragraph" style={{ textDecoration: 'line-through' }}>
                    ${paymentData.originalAmount.toFixed(2)}
                  </Text>
                </div>
                <div className={styles.feeRow}>
                  <Text variant="small" color="secondary">
                    الخصم {paymentData.discountPercentage ? `(${paymentData.discountPercentage}%)` : ''}
                    {paymentData.discountReason && <span style={{ fontSize: '10px', display: 'block' }}>{paymentData.discountReason}</span>}
                  </Text>
                  <Text variant="paragraph" style={{ color: '#16a34a' }}>
                    -${paymentData.discountAmount.toFixed(2)}
                  </Text>
                </div>
              </>
            )}

            <div className={styles.feeRow}>
              <Text variant="small" color="secondary">سعر الخدمة</Text>
              <Text variant="paragraph">${paymentData.amount.toFixed(2)}</Text>
            </div>

            {/* Show tax info if available */}
            {paymentData.taxRate && paymentData.taxRate > 0 && (
              <div className={styles.feeRow}>
                <Text variant="small" color="secondary">ضريبة القيمة المضافة ({paymentData.taxRate}%)</Text>
                <Text variant="small" color="secondary">مشمولة (${paymentData.taxAmount?.toFixed(2) || '0.00'})</Text>
              </div>
            )}

            {paymentOption && paymentOption.processingFee > 0 && (
              <div className={styles.feeRow}>
                <Text variant="small" color="secondary">رسوم المعالجة ({paymentOption.displayNameAr || paymentOption.displayName})</Text>
                <Text variant="paragraph" color="warning">+${paymentOption.processingFee.toFixed(2)}</Text>
              </div>
            )}

            <div className={`${styles.feeRow} ${styles.total}`}>
              <Text variant="paragraph">الإجمالي</Text>
              <Text variant="h4">${(paymentOption?.total || paymentData.amount).toFixed(2)}</Text>
            </div>
          </div>

          <div className={styles.merchantInfo}>
            <div className={styles.infoRow}>
              <Text variant="small" color="secondary">التاجر</Text>
              <Text variant="paragraph">Marketplace Auto</Text>
            </div>
            <div className={styles.infoRow}>
              <Text variant="small" color="secondary">الوصف</Text>
              <Text variant="paragraph">{paymentData.description}</Text>
            </div>
            <div className={styles.infoRow}>
              <Text variant="small" color="secondary">رقم المعاملة</Text>
              <Text variant="small" color="secondary">pi_mock_{id.slice(0, 12)}</Text>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.actions}>
          <Button
            onClick={handleConfirmPayment}
            disabled={updating}
            icon={<CheckCircle size={20} />}
            size="lg"
          >
            {updating ? 'جاري المعالجة...' : 'تأكيد الدفع'}
          </Button>
          <Button
            variant="outline"
            onClick={handleRejectPayment}
            disabled={updating}
            icon={<XCircle size={20} />}
            size="lg"
          >
            إلغاء
          </Button>
        </div>

        {/* Disclaimer */}
        <div className={styles.disclaimer}>
          <Text variant="small" color="secondary">
            هذه بوابة دفع محاكاة لأغراض التطوير فقط. لن يتم إجراء أي رسوم فعلية.
          </Text>
        </div>
      </div>
    </div>
  );
}
