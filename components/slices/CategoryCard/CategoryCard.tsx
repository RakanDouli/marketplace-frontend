'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock } from 'lucide-react';
import { Text } from '../Text/Text';
import styles from './CategoryCard.module.scss';

export interface CategoryCardProps {
  /** The link to navigate to */
  href: string;
  /** Arabic name (primary) */
  nameAr: string;
  /** English name (fallback) */
  name?: string;
  /** Optional SVG icon HTML string */
  icon?: string;
  /** Show as coming soon (disabled state) */
  comingSoon?: boolean;
  /** Hide icon completely */
  hideIcon?: boolean;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  href,
  nameAr,
  name,
  icon,
  comingSoon = false,
  hideIcon = false,
}) => {
  const displayName = nameAr || name || '';

  // Coming soon card (not clickable)
  if (comingSoon) {
    return (
      <div className={`${styles.card} ${styles.comingSoon}`}>
        <div className={styles.cardContent}>
          <Text variant="h3" className={styles.cardName}>
            {displayName}
          </Text>
          <div className={styles.cardCta}>
            <Clock size={14} />
            <span>قريبا</span>
          </div>
        </div>
        {!hideIcon && (
          <div className={styles.cardIcon}>
            {icon && (
              <div
                className={styles.svgIcon}
                dangerouslySetInnerHTML={{ __html: icon }}
              />
            )}
          </div>
        )}
      </div>
    );
  }

  // Active card (clickable)
  return (
    <Link href={href} className={styles.card}>
      {!hideIcon && (
        <div className={styles.cardIcon}>
          {icon && (
            <div
              className={styles.svgIcon}
              dangerouslySetInnerHTML={{ __html: icon }}
            />
          )}
        </div>
      )}
      <div className={styles.cardContent}>
        <Text variant="h3" className={styles.cardName}>
          {displayName}
        </Text>
        <div className={styles.cardCta}>
          <span>تصفح الآن</span>
          <ArrowLeft size={16} />
        </div>
      </div>

    </Link>
  );
};

export default CategoryCard;
