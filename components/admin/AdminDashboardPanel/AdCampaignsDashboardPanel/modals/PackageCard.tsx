'use client';

import React from 'react';
import { Text, Button } from '@/components/slices';
import { Edit, Trash2 } from 'lucide-react';
import styles from './PackageCard.module.scss';

interface AdPackage {
  id: string;
  packageName: string;
  basePrice: number;
  currency: string;
  adType: string;
  placement: string;
  format: string;
  dimensions: {
    desktop: { width: number; height: number };
    mobile: { width: number; height: number };
  };
}

interface CampaignPackage {
  packageId: string;
  packageData: AdPackage;
  desktopMediaUrl: string;
  mobileMediaUrl: string;
  customPrice?: number;
}

interface PackageCardProps {
  package: CampaignPackage;
  onEdit: () => void;
  onDelete: () => void;
}

export const PackageCard: React.FC<PackageCardProps> = ({
  package: pkg,
  onEdit,
  onDelete,
}) => {
  const { packageData, desktopMediaUrl, mobileMediaUrl, customPrice } = pkg;
  const displayPrice = customPrice || packageData.basePrice;

  return (
    <div className={styles.packageCard}>
      {/* Header */}
      <div className={styles.cardHeader}>
        <div>
          <Text variant="h5" className={styles.packageName}>
            {packageData.packageName}
          </Text>
          <Text variant="small" className={styles.packageMeta}>
            {packageData.adType} | {packageData.placement}
          </Text>
        </div>
        <div className={styles.cardActions}>
          <Button
            variant="secondary"
            size="small"
            onClick={onEdit}
            aria-label="تعديل"
            iconOnly
          >
            <Edit size={16} />
          </Button>
          <Button
            variant="danger"
            size="small"
            onClick={onDelete}
            aria-label="حذف"
            iconOnly
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>

      {/* Package Info */}
      <div className={styles.packageInfo}>
        <Text variant="small">
          السعر: <strong>${displayPrice}</strong> {packageData.currency}
          {customPrice && <span className={styles.customBadge}> (مخصص)</span>}
        </Text>
        <Text variant="small">
          الأبعاد: {packageData.dimensions.desktop.width}x{packageData.dimensions.desktop.height} (سطح مكتب) | {' '}
          {packageData.dimensions.mobile.width}x{packageData.dimensions.mobile.height} (موبايل)
        </Text>
      </div>

      {/* Media Previews */}
      <div className={styles.mediaGrid}>
        <div className={styles.mediaItem}>
          <Text variant="small" className={styles.mediaLabel}>
            صورة سطح المكتب
          </Text>
          <div className={styles.imagePreview}>
            <img
              src={desktopMediaUrl}
              alt="Desktop media"
              loading="lazy"
            />
          </div>
        </div>

        <div className={styles.mediaItem}>
          <Text variant="small" className={styles.mediaLabel}>
            صورة الموبايل
          </Text>
          <div className={styles.imagePreview}>
            <img
              src={mobileMediaUrl}
              alt="Mobile media"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
