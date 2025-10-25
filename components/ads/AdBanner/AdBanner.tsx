'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Image } from '@/components/slices';
import { optimizeAdImage } from '@/utils/cloudflare-images';
import styles from './AdBanner.module.scss';

export interface AdBannerProps {
  campaignId: string;
  imageUrl: string;
  targetUrl: string;
  altText: string;
  onImpression?: (campaignId: string) => void;
  onClick?: (campaignId: string) => void;
}

export const AdBanner: React.FC<AdBannerProps> = ({
  campaignId,
  imageUrl,
  targetUrl,
  altText,
  onImpression,
  onClick,
}) => {
  const hasTrackedImpression = useRef(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Track impression only once when component mounts
    if (!hasTrackedImpression.current && onImpression) {
      onImpression(campaignId);
      hasTrackedImpression.current = true;
    }

    // Detect mobile screen
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [campaignId, onImpression]);

  const handleClick = () => {
    if (onClick) {
      onClick(campaignId);
    }
    // Open target URL in new tab
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  // Optimize image URL based on device type
  const optimizedImageUrl = optimizeAdImage(imageUrl, 'banner', isMobile ? 'mobile' : 'desktop');

  return (
    <div className={styles.adBanner}>
      <button
        className={styles.adButton}
        onClick={handleClick}
        aria-label={altText}
      >
        <Image
          src={optimizedImageUrl}
          alt={altText}
          width={isMobile ? 300 : 970}
          height={isMobile ? 250 : 90}
          sizes="(max-width: 768px) 300px, 970px"
          className={styles.adImage}
          priority
          containerClassName={styles.imageWrapper}
        />
      </button>
      <span className={styles.adLabel}>إعلان</span>
    </div>
  );
};
