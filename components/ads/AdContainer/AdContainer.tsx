'use client';

import React, { useEffect, useState } from 'react';
import { useAdsStore, AdCampaign, AdSenseSettings } from '@/stores/adsStore';
import { CustomAd } from '../CustomAd';
import { GoogleAdSense } from '../GoogleAdSense';

export interface AdContainerProps {
  placement: string; // For tracking purposes (e.g., "homepage-top", "listings-between")
  className?: string;
}

export const AdContainer: React.FC<AdContainerProps> = ({
  placement,
  className,
}) => {
  const [selectedAd, setSelectedAd] = useState<AdCampaign | null>(null);
  const [adSenseSettings, setAdSenseSettings] = useState<AdSenseSettings | null>(null);
  const { fetchAllAds, getAdsByPlacement, fetchAdSenseSettings, trackImpression, trackClick } = useAdsStore();

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
      // Step 1: Fetch all ads once (smart caching)
      await fetchAllAds();

      // Step 2: Filter by placement locally
      const ads = getAdsByPlacement(placement);

      if (ads.length > 0) {
        // Use priority-based weighted selection
        const ad = selectAdByPriority(ads);
        setSelectedAd(ad);
        return;
      }

      // Step 3: No custom ads - try Google AdSense fallback
      console.log(`📢 AdContainer: No custom ads for placement "${placement}", checking AdSense fallback...`);
      const settings = await fetchAdSenseSettings();
      setAdSenseSettings(settings);
    };

    loadAd();
  }, [placement, fetchAllAds, getAdsByPlacement, fetchAdSenseSettings]);

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
    return (
      <div className={className}>
        <CustomAd
          campaign={selectedAd}
          onImpression={handleImpression}
          onClick={handleClick}
        />
      </div>
    );
  }

  // No custom ad - try Google AdSense fallback
  if (adSenseSettings && adSenseSettings.clientId) {
    // Use image slot by default (Google AdSense auto-detects format/dimensions)
    // Admin can disable image/video slots independently via toggles
    const adSenseSlot = adSenseSettings.imageSlot;

    // Check if slot exists and is enabled
    if (adSenseSlot && adSenseSlot.enabled && adSenseSlot.id) {
      console.log(`📢 AdContainer: Rendering Google AdSense for placement "${placement}"`, {
        clientId: adSenseSettings.clientId,
        slotId: adSenseSlot.id,
      });

      return (
        <div className={className}>
          <GoogleAdSense
            client={adSenseSettings.clientId}
            slot={adSenseSlot.id}
            format="horizontal"
            responsive={true}
          />
        </div>
      );
    } else {
      console.log(`📢 AdContainer: AdSense slot is disabled or not configured for placement "${placement}"`);
    }
  } else {
    console.log(`📢 AdContainer: No AdSense settings available (clientId missing or settings not loaded)`);
  }

  // No custom ad and no AdSense fallback - render nothing
  return null;
};
