import React, { useEffect, useState } from 'react';
import { Text } from '@/components/slices';
import { CreditCard, Wallet, TestTube, Building2, Banknote } from 'lucide-react';
import type { PaymentMethod, PaymentMethodOption } from '../types';
import styles from './PaymentMethodSelector.module.scss';

// GraphQL query for payment methods
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
      sortOrder
    }
  }
`;

// Helper function for GraphQL calls
const makeGraphQLCall = async (query: string) => {
  const response = await fetch(process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
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
      return <CreditCard size={32} />;
    case 'paypal':
      return <Wallet size={32} />;
    case 'bank_transfer':
      return <Building2 size={32} />;
    case 'cash':
      return <Banknote size={32} />;
    case 'mock':
      return <TestTube size={32} />;
    default:
      return <CreditCard size={32} />;
  }
};

// Get fee display text
const getFeeText = (option: PaymentMethodOption) => {
  if (option.feePercentage === 0 && option.fixedFee === 0) {
    return 'بدون رسوم';
  }

  let feeText = '';
  if (option.feePercentage > 0) {
    feeText += `${option.feePercentage}%`;
  }
  if (option.fixedFee > 0) {
    if (feeText) feeText += ' + ';
    feeText += `$${option.fixedFee.toFixed(2)}`;
  }
  return `رسوم: ${feeText}`;
};

interface PaymentMethodCardProps {
  option: PaymentMethodOption;
  onClick: () => void;
  disabled?: boolean;
  selected?: boolean;
}

const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({
  option,
  onClick,
  disabled = false,
  selected = false,
}) => {
  return (
    <button
      className={`${styles.methodCard} ${selected ? styles.selected : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      <div className={styles.methodIcon}>{getMethodIcon(option.paymentMethod)}</div>
      <div className={styles.methodContent}>
        <Text variant="h4">{option.displayNameAr || option.displayName}</Text>
        <Text variant="small" color={option.feePercentage === 0 && option.fixedFee === 0 ? 'success' : 'secondary'}>
          {getFeeText(option)}
        </Text>
      </div>
    </button>
  );
};

interface PaymentMethodSelectorProps {
  onSelect: (method: PaymentMethod, option: PaymentMethodOption) => void;
  disabled?: boolean;
  selectedMethod?: PaymentMethod | null;
  baseAmount?: number; // To calculate and show processing fees
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  onSelect,
  disabled = false,
  selectedMethod = null,
  baseAmount = 0,
}) => {
  const [methods, setMethods] = useState<PaymentMethodOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch payment methods from backend
  useEffect(() => {
    const fetchMethods = async () => {
      try {
        setLoading(true);
        const data = await makeGraphQLCall(GET_PAYMENT_METHODS_QUERY);
        const paymentMethods = (data.publicPaymentMethods || [])
          .filter((m: PaymentMethodOption) => m.isActive && m.paymentMethod !== 'manual')
          .sort((a: PaymentMethodOption, b: PaymentMethodOption) => a.sortOrder - b.sortOrder);
        setMethods(paymentMethods);
      } catch (err) {
        console.error('Failed to fetch payment methods:', err);
        setError('فشل في تحميل طرق الدفع');
      } finally {
        setLoading(false);
      }
    };

    fetchMethods();
  }, []);

  if (loading) {
    return (
      <div className={styles.methodSelector}>
        <Text variant="h4">اختر طريقة الدفع</Text>
        <Text variant="small" color="secondary">جاري التحميل...</Text>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.methodSelector}>
        <Text variant="h4">اختر طريقة الدفع</Text>
        <Text variant="small" color="error">{error}</Text>
      </div>
    );
  }

  return (
    <div className={styles.methodSelector}>
      <Text variant="h4">اختر طريقة الدفع</Text>

      <div className={styles.methods}>
        {methods.map((option) => (
          <PaymentMethodCard
            key={option.paymentMethod}
            option={option}
            onClick={() => onSelect(option.paymentMethod as PaymentMethod, option)}
            disabled={disabled}
            selected={selectedMethod === option.paymentMethod}
          />
        ))}
      </div>

    </div>
  );
};
