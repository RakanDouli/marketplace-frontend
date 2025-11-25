'use client';

import React, { useEffect, useRef } from 'react';
import Image from '@/components/slices/Image/Image';
import { AdCampaign } from '@/stores/adsStore';
import styles from './CustomAd.module.scss';
import { Text } from '@/components/slices';

export interface CustomAdProps {
  campaign: AdCampaign;
  onImpression: (campaignId: string) => void;
  onClick: (campaignId: string) => void;
  className?: string;
}

export const CustomAd: React.FC<CustomAdProps> = ({
  campaign,
  onImpression,
  onClick,
  className,
}) => {
  const impressionTracked = useRef(false);

  // Determine if we're on mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  // Extract media URLs from packageBreakdown
  let desktopMediaUrl: string | null = null;
  let mobileMediaUrl: string | null = null;
  let clickUrl: string | null = null;
  let openInNewTab: boolean = false;
  let dimensions = campaign.package?.dimensions;
  let adType = campaign.package?.adType || 'IMAGE';

  if (campaign.packageBreakdown?.packages) {
    // Find the first active package (within date range)
    const now = new Date();
    const activePackage = campaign.packageBreakdown.packages.find(pkg => {
      if (!pkg.startDate || !pkg.endDate) return false;
      const start = new Date(pkg.startDate);
      const end = new Date(pkg.endDate);
      return now >= start && now <= end;
    });

    if (activePackage) {
      desktopMediaUrl = activePackage.desktopMediaUrl;
      mobileMediaUrl = activePackage.mobileMediaUrl;
      clickUrl = activePackage.clickUrl || null;
      openInNewTab = activePackage.openInNewTab || false;
      dimensions = activePackage.packageData?.dimensions;
      adType = activePackage.packageData?.adType || 'IMAGE';
    }
  }

  // Choose the appropriate media URL based on device
  const mediaUrl = isMobile && mobileMediaUrl
    ? mobileMediaUrl
    : desktopMediaUrl;

  // Track impression on mount (once)
  useEffect(() => {
    if (!impressionTracked.current && mediaUrl) {
      onImpression(campaign.id);
      impressionTracked.current = true;
    }
  }, [campaign.id, onImpression, mediaUrl]);

  // Handle click
  const handleClick = () => {
    onClick(campaign.id);
    if (clickUrl) {
      if (openInNewTab) {
        window.open(clickUrl, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = clickUrl;
      }
    }
  };

  if (!mediaUrl) {
    return null;
  }

  // Get dimensions for current device
  const currentDimensions = isMobile
    ? dimensions?.mobile || { width: 300, height: 250 }
    : dimensions?.desktop || { width: 970, height: 250 };

  // Debug: Log dimensions
  console.log('📐 CustomAd Dimensions Debug:', {
    campaignId: campaign.id,
    campaignName: campaign.campaignName,
    isMobile,
    allDimensions: dimensions,
    currentDimensions,
    desktopDimensions: dimensions?.desktop,
    mobileDimensions: dimensions?.mobile,
  });

  return (
    <div className={`${styles.customAd} ${className || ''}`}>



      <div
        className={styles.adContent}
        onClick={clickUrl ? handleClick : undefined}
        style={{
          cursor: clickUrl ? 'pointer' : 'default',
          width: '100%',
          maxWidth: `${currentDimensions.width}px`,
          height: `${currentDimensions.height}px`,
          overflow: 'hidden',
          borderRadius: '8px'
        }}
      >
        <Text variant="small" className={styles.adLabel}> إعلان</Text>
        {adType === 'VIDEO' ? (
          <video
            src={mediaUrl}
            className={styles.adVideo}
            autoPlay
            muted
            loop
            playsInline
            style={{
              width: '100%',
              height: 'auto',
              display: 'block'
            }}
          />
        ) : (
          <Image
            src={mediaUrl}
            alt={campaign.description || campaign.campaignName}
            width={currentDimensions.width}
            height={currentDimensions.height}
            className={styles.adImage}
            style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain' }}
            priority
            sizes={`(max-width: 768px) ${dimensions?.mobile?.width || 300}px, ${currentDimensions.width}px`}
          />
        )}
      </div>
    </div>
  );
};
