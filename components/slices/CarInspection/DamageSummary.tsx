'use client';

import React from 'react';
import { X, Check } from 'lucide-react';
import { Text } from '@/components/slices/Text/Text';
import { CAR_PARTS, DAMAGE_TYPES, type DamageReport } from './CarInspection';
import styles from './CarInspection.module.scss';

type ViewType = 'front' | 'back' | 'left' | 'right' | 'top';

interface DamageSummaryProps {
  damages: DamageReport[];
}

export const DamageSummary: React.FC<DamageSummaryProps> = ({ damages }) => {
  const getDamageInfo = (damageType: string) => {
    return DAMAGE_TYPES.find(d => d.value === damageType);
  };

  const viewLabels: Record<ViewType, string> = {
    front: 'الأمام',
    back: 'الخلف',
    left: 'الجانب الأيسر',
    right: 'الجانب الأيمن',
    top: 'الأعلى',
  };

  if (damages.length === 0) {
    return (
      <div className={styles.noIssues}>
        <Check size={16} /> لا توجد ملاحظات
      </div>
    );
  }

  return (
    <div className={styles.summary}>
      {(['front', 'back', 'left', 'right', 'top'] as ViewType[]).map(viewType => {
        const viewDamages = damages
          .filter(d => CAR_PARTS[d.part].view === viewType)
          .sort((a, b) => CAR_PARTS[a.part].sortOrder - CAR_PARTS[b.part].sortOrder);

        if (viewDamages.length === 0) return null;

        return (
          <div key={viewType} className={styles.summaryGroup}>
            <Text variant="small" className={styles.summaryGroupTitle}>{viewLabels[viewType]}</Text>
            <div className={styles.summaryGroupItems}>
              {viewDamages.map(d => {
                const info = getDamageInfo(d.damageType);
                return (
                  <span key={d.part} className={`${styles.summaryItem} ${info ? styles[info.colorClass] : ''}`}>
                    {CAR_PARTS[d.part].label}: {info?.label}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DamageSummary;
