'use client';

import React from 'react';
import { Check, X } from 'lucide-react';
import { Text, Button, Badge } from '@/components/slices';
import { formatPrice } from '@/utils/formatPrice';
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
  price: number;
  currency?: string;
  billingCycle?: 'monthly' | 'yearly' | 'days' | 'free';
  durationDays?: number;
  features: FeatureItem[];
  badge?: string;
  badgeColor?: 'primary' | 'success' | 'warning';
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
  price,
  currency = 'USD',
  billingCycle = 'monthly',
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
  // Format price display
  const getPriceDisplay = () => {
    if (price === 0) {
      return { main: 'مجاني', period: '' };
    }

    // Use formatPrice utility for consistent formatting
    const formattedPrice = formatPrice(price);

    if (billingCycle === 'days' && durationDays) {
      return {
        main: formattedPrice,
        period: `/ ${durationDays} يوم`,
      };
    }

    const periodMap = {
      monthly: '/ شهر',
      yearly: '/ سنة',
      free: '',
      days: '',
    };

    return {
      main: formattedPrice,
      period: periodMap[billingCycle] || '',
    };
  };

  const { main, period } = getPriceDisplay();

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
