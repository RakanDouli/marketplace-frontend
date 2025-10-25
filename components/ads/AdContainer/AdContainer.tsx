'use client';

import React, { useEffect, useState } from 'react';
import { useAdsStore, AdMediaType, AdCampaign, AdSenseSettings } from '@/stores/adsStore';
import { AdBanner } from '../AdBanner';
import { AdVideo } from '../AdVideo';
import { AdCard } from '../AdCard';
import { GoogleAdSense } from '../GoogleAdSense';

export interface AdContainerProps {
  type: AdMediaType;
  placement: string; // For tracking purposes (e.g., "homepage-top", "listings-between")
  className?: string;
}

export const AdContainer: React.FC<AdContainerProps> = ({
  type,
  placement,
  className,
}) => {
  const [selectedAd, setSelectedAd] = useState<AdCampaign | null>(null);
  const [adSenseSettings, setAdSenseSettings] = useState<AdSenseSettings | null>(null);
  const { fetchAdsByType, fetchAdSenseSettings, trackImpression, trackClick } = useAdsStore();

  useEffect(() => {
    const loadAd = async () => {
      // Step 1: Try to fetch custom ads
      const ads = await fetchAdsByType(type);

      if (ads.length > 0) {
        // Randomly select one ad if multiple exist
        const randomIndex = Math.floor(Math.random() * ads.length);
        const ad = ads[randomIndex];
        setSelectedAd(ad);
        return;
      }

      // Step 2: No custom ads - try Google AdSense fallback
      console.log(`📢 AdContainer: No custom ads for ${type}, checking AdSense fallback...`);
      const settings = await fetchAdSenseSettings();
      setAdSenseSettings(settings);
    };

    loadAd();
  }, [type, placement, fetchAdsByType, fetchAdSenseSettings]);

  // Handle impression tracking
  const handleImpression = (campaignId: string) => {
    trackImpression(campaignId);
  };

  // Handle click tracking
  const handleClick = (campaignId: string) => {
    trackClick(campaignId);
  };

  // Render custom ad if available
  if (selectedAd) {
    // Determine if we're on mobile
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

    // Choose the appropriate media URL based on device
    const mediaUrl = isMobile && selectedAd.mobileMediaUrl
      ? selectedAd.mobileMediaUrl
      : selectedAd.desktopMediaUrl;

    // If no media URL, fall through to AdSense fallback
    if (mediaUrl) {
      // Render appropriate component based on ad type
      switch (type) {
        case 'BANNER':
        case 'BETWEEN_LISTINGS_BANNER':
          return (
            <div className={className}>
              <AdBanner
                campaignId={selectedAd.id}
                imageUrl={mediaUrl}
                targetUrl={selectedAd.clickUrl}
                altText={selectedAd.description || selectedAd.campaignName}
                onImpression={handleImpression}
                onClick={handleClick}
              />
            </div>
          );

        case 'VIDEO':
          return (
            <div className={className}>
              <AdVideo
                campaignId={selectedAd.id}
                videoUrl={mediaUrl}
                targetUrl={selectedAd.clickUrl}
                altText={selectedAd.description || selectedAd.campaignName}
                onImpression={handleImpression}
                onClick={handleClick}
              />
            </div>
          );

        case 'BETWEEN_LISTINGS_CARD':
          return (
            <div className={className}>
              <AdCard
                campaignId={selectedAd.id}
                imageUrl={mediaUrl}
                targetUrl={selectedAd.clickUrl}
                altText={selectedAd.description || selectedAd.campaignName}
                onImpression={handleImpression}
                onClick={handleClick}
              />
            </div>
          );

        default:
          console.warn(`📢 AdContainer: Unknown ad type: ${type}`);
          return null;
      }
    }
  }

  // No custom ad - try Google AdSense fallback
  if (adSenseSettings && adSenseSettings.clientId) {
    // Map ad type to AdSense slot
    let adSenseSlot = null;

    switch (type) {
      case 'BANNER':
        adSenseSlot = adSenseSettings.bannerSlot;
        break;
      case 'VIDEO':
        adSenseSlot = adSenseSettings.videoSlot;
        break;
      case 'BETWEEN_LISTINGS_BANNER':
      case 'BETWEEN_LISTINGS_CARD':
        adSenseSlot = adSenseSettings.betweenListingsSlot;
        break;
      default:
        console.warn(`📢 AdContainer: Unknown ad type for AdSense: ${type}`);
    }

    // Check if slot exists and is enabled
    if (adSenseSlot && adSenseSlot.enabled) {
      console.log(`📢 AdContainer: Rendering Google AdSense for ${type}`, {
        clientId: adSenseSettings.clientId,
        slotId: adSenseSlot.id,
      });

      return (
        <div className={className}>
          <GoogleAdSense
            client={adSenseSettings.clientId}
            slot={adSenseSlot.id}
            format="auto"
            responsive={true}
          />
        </div>
      );
    } else {
      console.log(`📢 AdContainer: AdSense slot for ${type} is disabled or not configured`);
    }
  } else {
    console.log(`📢 AdContainer: No AdSense settings available (clientId missing or settings not loaded)`);
  }

  // No custom ad and no AdSense fallback - render nothing
  return null;
};
