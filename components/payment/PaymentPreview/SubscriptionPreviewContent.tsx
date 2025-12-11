import React from 'react';
import { Text } from '@/components/slices';
import { Package, DollarSign, Check, X, CreditCard, ArrowLeftRight, Receipt } from 'lucide-react';
import type { SubscriptionPaymentData, PaymentFeeInfo } from '../types';
import styles from './PaymentPreview.module.scss';

// Billing cycle label map
const BILLING_CYCLE_ARABIC: Record<string, string> = {
  monthly: 'شهري',
  yearly: 'سنوي',
};

// Format numbers with thousand separators (English digits)
const formatNumber = (num: number, decimals: number = 2) => {
  return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

interface SubscriptionPreviewContentProps {
  data: SubscriptionPaymentData;
  feeInfo?: PaymentFeeInfo | null;
}

export const SubscriptionPreviewContent: React.FC<SubscriptionPreviewContentProps> = ({ data, feeInfo }) => {
  // Calculate totals based on whether payment method is selected
  const baseAmount = data.price;
  const hasPaymentMethod = feeInfo && feeInfo.paymentMethod !== null;
  const taxRate = feeInfo?.taxRate || 0;
  const taxAmount = feeInfo?.taxAmount || 0;
  const processingFee = hasPaymentMethod ? feeInfo.processingFee : 0;
  const finalTotal = feeInfo?.totalWithFee || baseAmount;
  const finalTotalSyp = feeInfo?.totalInSyp || 0;
  return (
    <div className={styles.preview}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.icon}>
          <Package size={32} />
        </div>
        <div className={styles.headerContent}>
          <Text variant="h3">{data.title}</Text>
          <Text variant="small" color="secondary">خطة الاشتراك</Text>
        </div>
      </div>

      {/* Plan Details */}
      <div className={styles.section}>
        <Text variant="h4">تفاصيل الخطة</Text>

        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <Text variant="small" color="secondary">اسم الخطة</Text>
            <Text variant="paragraph">{data.planName}</Text>
          </div>

          <div className={styles.infoItem}>
            <Text variant="small" color="secondary">نوع الحساب</Text>
            <Text variant="paragraph">{data.accountType}</Text>
          </div>

          <div className={styles.infoItem}>
            <Text variant="small" color="secondary">دورة الفوترة</Text>
            <Text variant="paragraph">{BILLING_CYCLE_ARABIC[data.billingCycle] || data.billingCycle}</Text>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className={styles.section}>
        <Text variant="h4">الميزات المضمنة</Text>

        <div className={styles.featuresList}>
          {data.features.map((feature, index) => (
            <div key={index} className={styles.featureItem}>
              <div className={styles.featureIcon}>
                {feature.included ? (
                  <Check size={16} className={styles.checkIcon} />
                ) : (
                  <X size={16} className={styles.crossIcon} />
                )}
              </div>
              <div className={styles.featureContent}>
                <Text variant="paragraph">{feature.label}</Text>
                {Boolean(feature.value) && (
                  <Text variant="small" color="secondary">{feature.value}</Text>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className={styles.pricingSummary}>
        <div className={styles.pricingDetails}>
          {/* Base amount */}
          <div className={styles.pricingRow}>
            <Text variant="paragraph" color="secondary">المبلغ</Text>
            <Text variant="paragraph">{baseAmount.toFixed(2)} {data.currency}</Text>
          </div>

          {/* Tax Row - Always show if tax rate > 0 (tax is INCLUDED in price) */}
          {taxRate > 0 && (
            <div className={styles.taxRow}>
              <div className={styles.feeLabel}>
                <Receipt size={16} />
                <Text variant="paragraph">الضريبة ({taxRate}%) - شامل</Text>
              </div>
              <Text variant="paragraph" color="secondary">{taxAmount.toFixed(2)} {data.currency}</Text>
            </div>
          )}

          {/* Processing Fee - Only show when payment method is selected */}
          {hasPaymentMethod && processingFee > 0 && (
            <div className={styles.processingFeeRow}>
              <div className={styles.feeLabel}>
                <CreditCard size={16} />
                <Text variant="paragraph">رسوم المعالجة ({feeInfo.paymentMethodNameAr})</Text>
              </div>
              <Text variant="paragraph">+{processingFee.toFixed(2)} {data.currency}</Text>
            </div>
          )}
        </div>

        {/* Final Total in USD */}
        <div className={styles.totalRow}>
          <Text variant="h4">الإجمالي المطلوب</Text>
          <div className={styles.totalAmount}>
            <DollarSign size={24} />
            <Text variant="h3">{finalTotal.toFixed(2)} {data.currency}</Text>
          </div>
        </div>

        {/* Syrian Pound Total - Always show if exchange rate is available */}
        {feeInfo?.exchangeRate && feeInfo.exchangeRate > 0 && (
          <div className={styles.sypTotalSection}>
            <div className={styles.exchangeRateRow}>
              <div className={styles.exchangeInfo}>
                <ArrowLeftRight size={16} />
                <Text variant="small" color="secondary">
                  سعر الصرف: 1 {data.currency} = {formatNumber(feeInfo.exchangeRate, 0)} ل.س
                </Text>
              </div>
            </div>
            <div className={styles.sypTotalRow}>
              <Text variant="h4">الإجمالي بالليرة السورية</Text>
              <div className={styles.sypAmount}>
                <Text variant="h3">{formatNumber(finalTotalSyp, 0)} ل.س</Text>
              </div>
            </div>
          </div>
        )}

        {/* Prompt to select payment method if not selected */}
        {!hasPaymentMethod && (
          <div className={styles.selectMethodPrompt}>
            <Text variant="small" color="secondary">
              اختر طريقة الدفع لعرض الرسوم النهائية والمبلغ بالليرة السورية
            </Text>
          </div>
        )}
      </div>
    </div>
  );
};
