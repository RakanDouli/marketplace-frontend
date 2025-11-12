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
  dimensions?: {
    desktop: { width: number; height: number };
    mobile: { width: number; height: number };
  };
  onImpression?: (campaignId: string) => void;
  onClick?: (campaignId: string) => void;
}

export const AdBanner: React.FC<AdBannerProps> = ({
  campaignId,
  imageUrl,
  targetUrl,
  altText,
  dimensions,
  onImpression,
  onClick,
}) => {
  const hasTrackedImpression = useRef(false);
  const [isMobile, setIsMobile] = useState(false);

  // Default dimensions (970x90 desktop, 300x250 mobile) - IAB Super Leaderboard
  const defaultDimensions = {
    desktop: { width: 970, height: 90 },
    mobile: { width: 300, height: 250 },
  };

  const adDimensions = dimensions || defaultDimensions;

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
          width={isMobile ? adDimensions.mobile.width : adDimensions.desktop.width}
          height={isMobile ? adDimensions.mobile.height : adDimensions.desktop.height}
          sizes={`(max-width: 768px) ${adDimensions.mobile.width}px, ${adDimensions.desktop.width}px`}
          className={styles.adImage}
          priority
          containerClassName={styles.imageWrapper}
        />
      </button>
      <span className={styles.adLabel}>إعلان</span>
    </div>
  );
};
