'use client';

import React, { useEffect, useRef, useState } from 'react';
import { optimizeAdImage } from '@/utils/cloudflare-images';
import styles from './AdVideo.module.scss';

export interface AdVideoProps {
  campaignId: string;
  videoUrl: string;
  targetUrl: string;
  altText: string;
  onImpression?: (campaignId: string) => void;
  onClick?: (campaignId: string) => void;
}

export const AdVideo: React.FC<AdVideoProps> = ({
  campaignId,
  videoUrl,
  targetUrl,
  altText,
  onImpression,
  onClick,
}) => {
  const hasTrackedImpression = useRef(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
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
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  // Optimize video URL based on device type
  const optimizedVideoUrl = optimizeAdImage(videoUrl, 'video', isMobile ? 'mobile' : 'desktop');

  return (
    <div className={styles.adVideo}>
      <div className={styles.videoContainer}>
        <div className={styles.videoWrapper} onClick={handleClick}>
          <video
            src={optimizedVideoUrl}
            autoPlay
            muted
            loop
            playsInline
            className={styles.video}
            aria-label={altText}
          />
          <div className={styles.clickOverlay} />
        </div>
      </div>
      <span className={styles.adLabel}>إعلان</span>
    </div>
  );
};
