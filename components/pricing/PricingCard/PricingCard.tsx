'use client';

import React from 'react';
import { Check, X } from 'lucide-react';
import { Text, Button, Badge } from '@/components/slices';
import { useCurrencyStore } from '@/stores/currencyStore';
import { formatAdPrice } from '@/utils/formatPrice';
import styles from './PricingCard.module.scss';

export interface FeatureItem {
  icon?: React.ReactNode;
  label: string;
  value?: string;
  included: boolean;
  highlight?: boolean;
}

export interface PricingCardProps {
  title: string;
  description: string;
  monthlyPrice?: number;
  yearlyPrice?: number | null;
  yearlySavingsPercent?: number | null;
  price?: number; // For ad packages (one-time price)
  currency?: string;
  billingCycle: 'monthly' | 'yearly' | 'days';
  durationDays?: number;
  features: FeatureItem[];
  badge?: string;
  badgeColor?: 'primary' | 'success' | 'warning' | 'accent';
  highlighted?: boolean;
  buttonText: string;
  buttonVariant?: 'primary' | 'outline' | 'secondary';
  onButtonClick: () => void;
  metadata?: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export const PricingCard: React.FC<PricingCardProps> = ({
  title,
  description,
  monthlyPrice,
  yearlyPrice,
  yearlySavingsPercent,
  price: oneTimePrice,
  currency = 'USD',
  billingCycle,
  durationDays,
  features,
  badge,
  badgeColor = 'primary',
  highlighted = false,
  buttonText,
  buttonVariant = 'primary',
  onButtonClick,
  metadata,
  icon,
  disabled = false,
}) => {
  // Subscribe to preferredCurrency to trigger re-render when currency changes
  const preferredCurrency = useCurrencyStore((state) => state.preferredCurrency);

  // Get the current price based on billing cycle
  const displayPrice = billingCycle === 'days' && oneTimePrice !== undefined
    ? oneTimePrice
    : billingCycle === 'yearly' && yearlyPrice
      ? yearlyPrice
      : monthlyPrice || 0;

  // Format price display
  const getPriceDisplay = () => {
    if (displayPrice === 0) {
      return { main: 'مجاني', period: '', savings: null };
    }

    // Use formatAdPrice utility for ad packages (decimal dollars, not minor units)
    const formattedPrice = formatAdPrice(displayPrice, currency);

    if (billingCycle === 'days') {
      return {
        main: formattedPrice,
        period: durationDays ? `/ ${durationDays} يوم` : '',
        savings: null,
      };
    }

    if (billingCycle === 'yearly') {
      return {
        main: formattedPrice,
        period: '/ سنة',
        savings: yearlySavingsPercent ? `وفر ${yearlySavingsPercent}%` : null,
      };
    }

    return {
      main: formattedPrice,
      period: '/ شهر',
      savings: null,
    };
  };

  const { main, period, savings } = getPriceDisplay();

  return (
    <div className={`${styles.card} ${highlighted ? styles.highlighted : ''} ${disabled ? styles.disabled : ''}`}>
      {/* Badge */}
      {badge && (
        <div className={styles.badge}>
          <Badge size='large' variant={badgeColor}>{badge}</Badge>
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        {icon && <div className={styles.icon}>{icon}</div>}
        <Text variant="h3">{title}</Text>
        <Text variant="small" color="secondary">
          {description}
        </Text>
      </div>

      {/* Price */}
      <div className={styles.price}>
        <Text variant="h2">{main}</Text>
        {period && (
          <Text variant="paragraph">
            {period}
          </Text>
        )}
        {/* Savings badge for yearly plans */}
        {savings && (
          <div className={styles.savingsBadge}>
            <Badge size="small" variant="accent">
              {savings}
            </Badge>
          </div>
        )}
        {/* Tax included label - shown for paid plans */}
        {displayPrice > 0 && (
          <Text variant="small" color="secondary" className={styles.taxLabel}>
            شامل الضريبة
          </Text>
        )}
      </div>

      {/* Features List */}
      <div className={styles.features}>
        {features.map((feature, index) => (
          <div
            key={index}
            className={`${styles.feature} ${!feature.included ? styles.notIncluded : ''}`}
          >
            <div className={styles.featureIcon}>
              {feature.icon || (
                feature.included ? (
                  <Check size={16} className={styles.checkIcon} />
                ) : (
                  <X size={16} className={styles.xIcon} />
                )
              )}
            </div>
            <div className={styles.featureContent}>
              <Text variant="paragraph">
                {feature.label}
              </Text>
              {feature.value && (
                <Text variant="small" color="secondary">
                  {feature.value}
                </Text>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Metadata (optional extra info) */}
      {metadata && (
        <div className={styles.metadata}>
          {metadata}
        </div>
      )}

      {/* Action Button */}
      <div className={styles.action}>
        <Button
          variant={buttonVariant}
          onClick={onButtonClick}
          disabled={disabled}
        >
          {buttonText}
        </Button>
      </div>
    </div>
  );
};
