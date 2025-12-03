'use client';

import React, { useEffect, useState } from 'react';
import { useAdsStore, AdPackageInstance, AdSenseSettings } from '@/stores/adsStore';
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
  const [selectedPackage, setSelectedPackage] = useState<AdPackageInstance | null>(null);
  const [adSenseSettings, setAdSenseSettings] = useState<AdSenseSettings | null>(null);
  const { fetchAllAds, getAdsByPlacement, fetchAdSenseSettings, trackImpression, trackClick } = useAdsStore();

  // Helper: Calculate days until package ends
  const getDaysUntilEnd = (endDate: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays); // Minimum 1 day
  };

  // Dynamic priority selection with soft limits
  const selectPackageByPriority = (packages: AdPackageInstance[]): AdPackageInstance | null => {
    if (packages.length === 0) return null;
    if (packages.length === 1) return packages[0];

    // Calculate weights for each package based on urgency and static priority
    const packagesWithWeights = packages.map(pkg => {
      // Static priority (1-5) set by admin or default to 3
      const staticPriority = pkg.priority || 3;

      // Calculate dynamic priority based on delivery urgency
      const impressionsPurchased = pkg.impressionsPurchased || 0;
      const impressionsDelivered = pkg.impressionsDelivered || 0;
      const impressionsRemaining = impressionsPurchased - impressionsDelivered;
      const daysLeft = getDaysUntilEnd(pkg.endDate);

      // Daily target = impressions we need to deliver per day to meet goal
      const dailyTarget = impressionsRemaining / daysLeft;

      // Calculate final weight
      let weight: number;

      if (impressionsRemaining <= 0) {
        // Over-delivered: Reduce weight to 10% (soft limit - still eligible)
        weight = staticPriority * 0.1;
        console.log(`📊 Package ${pkg.campaignPackageId} over-delivered (${impressionsDelivered}/${impressionsPurchased}) - weight reduced to ${weight.toFixed(2)}`);
      } else {
        // Normal: Weight = static priority × daily target (urgency-based)
        weight = staticPriority * Math.max(dailyTarget, 1);
        console.log(`📊 Package ${pkg.campaignPackageId}: ${impressionsDelivered}/${impressionsPurchased} impressions, ${daysLeft} days left, weight: ${weight.toFixed(2)}`);
      }

      return { pkg, weight: Math.max(0.1, weight) }; // Minimum weight 0.1
    });

    // Weighted random selection
    const totalWeight = packagesWithWeights.reduce((sum, item) => sum + item.weight, 0);

    if (totalWeight === 0) {
      // All packages exhausted, pick random
      return packages[Math.floor(Math.random() * packages.length)];
    }

    let random = Math.random() * totalWeight;

    for (const { pkg, weight } of packagesWithWeights) {
      random -= weight;
      if (random <= 0) {
        return pkg;
      }
    }

    // Fallback (should never reach here)
    return packagesWithWeights[0].pkg;
  };

  useEffect(() => {
    const loadAd = async () => {
      // Step 1: Fetch all ads once (smart caching)
      await fetchAllAds();

      // Step 2: Filter by placement locally
      const packages = getAdsByPlacement(placement);

      if (packages.length > 0) {
        // Use priority-based weighted selection
        const selectedPkg = selectPackageByPriority(packages);
        setSelectedPackage(selectedPkg);
        return;
      }

      // Step 3: No custom ads - try Google AdSense fallback
      console.log(`📢 AdContainer: No custom ads for placement "${placement}", checking AdSense fallback...`);
      const settings = await fetchAdSenseSettings();
      setAdSenseSettings(settings);
    };

    loadAd();
  }, [placement, fetchAllAds, getAdsByPlacement, fetchAdSenseSettings]);

  // Handle impression tracking - Pass both campaignId AND campaignPackageId
  const handleImpression = () => {
    if (selectedPackage) {
      trackImpression(selectedPackage.campaignId, selectedPackage.campaignPackageId);
    }
  };

  // Handle click tracking - Pass both campaignId AND campaignPackageId
  const handleClick = () => {
    if (selectedPackage) {
      trackClick(selectedPackage.campaignId, selectedPackage.campaignPackageId);
    }
  };

  // Render custom ad if available
  if (selectedPackage) {
    // Convert AdPackageInstance to AdCampaign format for CustomAd component
    const campaignForAd = {
      id: selectedPackage.campaignId,
      campaignName: selectedPackage.campaignName,
      description: '',
      status: 'ACTIVE',
      startDate: selectedPackage.packageData.startDate,
      endDate: selectedPackage.endDate,
      priority: selectedPackage.priority,
      pacingMode: selectedPackage.pacingMode,
      impressionsPurchased: selectedPackage.impressionsPurchased,
      impressionsDelivered: selectedPackage.impressionsDelivered,
      packageBreakdown: {
        packages: [selectedPackage.packageData],
        totalBeforeDiscount: selectedPackage.packageData.packageData.basePrice,
        totalAfterDiscount: selectedPackage.packageData.customPrice || selectedPackage.packageData.packageData.basePrice,
      },
      package: {
        id: selectedPackage.campaignPackageId,
        adType: selectedPackage.packageData.packageData.adType,
        dimensions: selectedPackage.packageData.packageData.dimensions,
        placement: selectedPackage.packageData.packageData.placement,
        format: selectedPackage.packageData.packageData.format,
      },
    };

    return (
      <CustomAd
        campaign={campaignForAd as any}
        onImpression={handleImpression}
        onClick={handleClick}
        className={className}
      />
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
        <GoogleAdSense
          client={adSenseSettings.clientId}
          slot={adSenseSlot.id}
          format="horizontal"
          responsive={true}
          className={className}
        />
      );
    } else {
      console.log(`📢 AdContainer: AdSense slot is disabled or not configured for placement "${placement}"`);
    }
  } else {
    console.log(`📢 AdContainer: No AdSense settings available (clientId missing or settings not loaded)`);
  }

  // No custom ad and no AdSense fallback - render nothing
  console.log(`📢 AdContainer: Returning NULL for placement "${placement}" (no ads available)`);
  return null;
};
