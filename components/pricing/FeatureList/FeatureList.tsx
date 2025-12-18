'use client';

import React from 'react';
import { Check, X } from 'lucide-react';
import { Text } from '@/components/slices';
import styles from './FeatureList.module.scss';

interface Feature {
  label: string;
  included: boolean;
  icon?: React.ReactNode;
  value?: string;
}

interface FeatureListProps {
  features: Feature[];
}

export const FeatureList: React.FC<FeatureListProps> = ({ features }) => {
  return (
    <div className={styles.list}>
      {features.map((feature, index) => (
        <div
          key={index}
          className={`${styles.item} ${!feature.included ? styles.notIncluded : ''}`}
        >
          {/* Status indicator (check/x) - always shown */}
          <div className={styles.statusIcon}>
            {feature.included ? (
              <Check size={16} className={styles.check} />
            ) : (
              <X size={16} className={styles.x} />
            )}
          </div>
          {/* Feature icon (optional) */}
          {feature.icon && (
            <div className={styles.featureIcon}>
              {feature.icon}
            </div>
          )}
          <div className={styles.content}>
            <Text variant="paragraph">{feature.label}</Text>
            {feature.value && (
              <Text variant="small" color="secondary">
                {feature.value}
              </Text>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
