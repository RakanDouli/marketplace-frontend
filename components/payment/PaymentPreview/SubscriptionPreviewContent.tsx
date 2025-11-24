import React from 'react';
import { Text } from '@/components/slices';
import { Package, DollarSign, Check, X } from 'lucide-react';
import type { SubscriptionPaymentData } from '../types';
import styles from './PaymentPreview.module.scss';

interface SubscriptionPreviewContentProps {
  data: SubscriptionPaymentData;
}

export const SubscriptionPreviewContent: React.FC<SubscriptionPreviewContentProps> = ({ data }) => {
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
            <Text variant="paragraph">{data.billingCycle}</Text>
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
                {feature.value && (
                  <Text variant="small" color="secondary">{feature.value}</Text>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className={styles.pricingSummary}>
        <div className={styles.totalRow}>
          <Text variant="h4">الإجمالي المطلوب</Text>
          <div className={styles.totalAmount}>
            <DollarSign size={24} />
            <Text variant="h3">{data.price.toFixed(2)} {data.currency}</Text>
          </div>
        </div>
      </div>
    </div>
  );
};
