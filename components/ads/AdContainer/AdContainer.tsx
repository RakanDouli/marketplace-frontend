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

  // Helper: Calculate days until campaign ends
  const getDaysUntilEnd = (endDate: string | Date): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays); // Minimum 1 day
  };

  // Dynamic priority selection with soft limits
  const selectAdByPriority = (ads: AdCampaign[]): AdCampaign | null => {
    if (ads.length === 0) return null;
    if (ads.length === 1) return ads[0];

    // Calculate weights for each ad based on urgency and static priority
    const adsWithWeights = ads.map(ad => {
      // Static priority (1-5) set by admin or default to 3
      const staticPriority = ad.priority || 3;

      // Calculate dynamic priority based on delivery urgency
      const impressionsPurchased = ad.impressionsPurchased || 0;
      const impressionsDelivered = ad.impressionsDelivered || 0;
      const impressionsRemaining = impressionsPurchased - impressionsDelivered;
      const daysLeft = getDaysUntilEnd(ad.endDate);

      // Daily target = impressions we need to deliver per day to meet goal
      const dailyTarget = impressionsRemaining / daysLeft;

      // Calculate final weight
      let weight: number;

      if (impressionsRemaining <= 0) {
        // Over-delivered: Reduce weight to 10% (soft limit - still eligible)
        weight = staticPriority * 0.1;
        console.log(`📊 Ad ${ad.id} over-delivered (${impressionsDelivered}/${impressionsPurchased}) - weight reduced to ${weight.toFixed(2)}`);
      } else {
        // Normal: Weight = static priority × daily target (urgency-based)
        weight = staticPriority * Math.max(dailyTarget, 1);
        console.log(`📊 Ad ${ad.id}: ${impressionsDelivered}/${impressionsPurchased} impressions, ${daysLeft} days left, weight: ${weight.toFixed(2)}`);
      }

      return { ad, weight: Math.max(0.1, weight) }; // Minimum weight 0.1
    });

    // Weighted random selection
    const totalWeight = adsWithWeights.reduce((sum, item) => sum + item.weight, 0);

    if (totalWeight === 0) {
      // All campaigns exhausted, pick random
      return ads[Math.floor(Math.random() * ads.length)];
    }

    let random = Math.random() * totalWeight;

    for (const { ad, weight } of adsWithWeights) {
      random -= weight;
      if (random <= 0) {
        return ad;
      }
    }

    // Fallback (should never reach here)
    return adsWithWeights[0].ad;
  };

  useEffect(() => {
    const loadAd = async () => {
      // Step 1: Try to fetch custom ads (backend already filters by pacing)
      const ads = await fetchAdsByType(type);

      if (ads.length > 0) {
        // Use priority-based weighted selection
        const ad = selectAdByPriority(ads);
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

    // Extract media URLs from packageBreakdown
    let desktopMediaUrl: string | null = null;
    let mobileMediaUrl: string | null = null;
    let clickUrl: string | null = null;
    let openInNewTab: boolean = false;
    let dimensions = selectedAd.package?.dimensions;

    if (selectedAd.packageBreakdown?.packages) {
      // Find the first active package (within date range)
      const now = new Date();
      const activePackage = selectedAd.packageBreakdown.packages.find(pkg => {
        const start = new Date(pkg.startDate);
        const end = new Date(pkg.endDate);
        return now >= start && now <= end;
      });

      if (activePackage) {
        desktopMediaUrl = activePackage.desktopMediaUrl;
        mobileMediaUrl = activePackage.mobileMediaUrl;
        clickUrl = activePackage.clickUrl || null;
        openInNewTab = activePackage.openInNewTab || false;
        dimensions = activePackage.packageData.dimensions;
      }
    }

    // Choose the appropriate media URL based on device
    const mediaUrl = isMobile && mobileMediaUrl
      ? mobileMediaUrl
      : desktopMediaUrl;

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
                targetUrl={clickUrl}
                altText={selectedAd.description || selectedAd.campaignName}
                dimensions={dimensions}
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
                targetUrl={clickUrl}
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
