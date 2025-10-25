'use client';

import React from 'react';
import { Text } from '@/components/slices';
import { Construction } from 'lucide-react';
import styles from './SharedDashboardPanel.module.scss';

interface PlaceholderDashboardPanelProps {
  title: string;
  description: string;
}

export const PlaceholderDashboardPanel: React.FC<PlaceholderDashboardPanelProps> = ({
  title,
  description
}) => {
  return (
    <div className={styles.dashboardPanel}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <Text variant="h2" className={styles.title}>{title}</Text>
          <Text variant="paragraph" color="secondary" className={styles.description}>
            {description}
          </Text>
        </div>
      </div>

      <div className={styles.emptyState} style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <Construction size={64} style={{ margin: '0 auto 1rem', color: 'var(--text-muted)' }} />
        <Text variant="h3">🚧 قيد التطوير</Text>
        <Text variant="paragraph" color="secondary">
          هذه الصفحة قيد التطوير وستكون متاحة قريباً
        </Text>
      </div>
    </div>
  );
};
