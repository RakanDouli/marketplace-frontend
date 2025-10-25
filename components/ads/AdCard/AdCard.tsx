'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import { optimizeAdImage } from '@/utils/cloudflare-images';
import styles from './AdCard.module.scss';

export interface AdCardProps {
  campaignId: string;
  imageUrl: string;
  targetUrl: string;
  altText: string;
  onImpression?: (campaignId: string) => void;
  onClick?: (campaignId: string) => void;
}

export const AdCard: React.FC<AdCardProps> = ({
  campaignId,
  imageUrl,
  targetUrl,
  altText,
  onImpression,
  onClick,
}) => {
  const hasTrackedImpression = useRef(false);

  useEffect(() => {
    // Track impression only once when component mounts
    if (!hasTrackedImpression.current && onImpression) {
      onImpression(campaignId);
      hasTrackedImpression.current = true;
    }
  }, [campaignId, onImpression]);

  const handleClick = () => {
    if (onClick) {
      onClick(campaignId);
    }
    // Open target URL in new tab
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  // Optimize image URL (card is 300x250 for both desktop and mobile)
  const optimizedImageUrl = optimizeAdImage(imageUrl, 'card', 'desktop');

  return (
    <div className={styles.adCard}>
      <button
        className={styles.adButton}
        onClick={handleClick}
        aria-label={altText}
      >
        <div className={styles.imageWrapper}>
          <Image
            src={optimizedImageUrl}
            alt={altText}
            fill
            sizes="(max-width: 768px) 50vw, 33vw"
            className={styles.adImage}
          />
        </div>
      </button>
      <span className={styles.adLabel}>إعلان</span>
    </div>
  );
};
