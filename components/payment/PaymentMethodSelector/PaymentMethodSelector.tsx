import React from 'react';
import { Text } from '@/components/slices';
import { CreditCard, Wallet, TestTube } from 'lucide-react';
import type { PaymentMethod } from '../types';
import styles from './PaymentMethodSelector.module.scss';

interface PaymentMethodCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onClick: () => void;
  disabled?: boolean;
}

const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({
  icon,
  title,
  subtitle,
  onClick,
  disabled = false,
}) => {
  return (
    <button
      className={styles.methodCard}
      onClick={onClick}
      disabled={disabled}
    >
      <div className={styles.methodIcon}>{icon}</div>
      <div className={styles.methodContent}>
        <Text variant="h4">{title}</Text>
        {subtitle && (
          <Text variant="small" color="secondary">{subtitle}</Text>
        )}
      </div>
    </button>
  );
};

interface PaymentMethodSelectorProps {
  methods: PaymentMethod[];
  onSelect: (method: PaymentMethod) => void;
  disabled?: boolean;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  methods,
  onSelect,
  disabled = false,
}) => {
  return (
    <div className={styles.methodSelector}>
      <Text variant="h4">اختر طريقة الدفع</Text>

      <div className={styles.methods}>
        {methods.includes('stripe') && (
          <PaymentMethodCard
            icon={<CreditCard size={32} />}
            title="بطاقة ائتمان"
            subtitle="Stripe"
            onClick={() => onSelect('stripe')}
            disabled={disabled}
          />
        )}

        {methods.includes('paypal') && (
          <PaymentMethodCard
            icon={<Wallet size={32} />}
            title="PayPal"
            subtitle="محفظة إلكترونية"
            onClick={() => onSelect('paypal')}
            disabled={disabled}
          />
        )}

        {methods.includes('mock') && (
          <PaymentMethodCard
            icon={<TestTube size={32} />}
            title="محاكي الدفع"
            subtitle="للاختبار فقط"
            onClick={() => onSelect('mock')}
            disabled={disabled}
          />
        )}
      </div>
    </div>
  );
};
