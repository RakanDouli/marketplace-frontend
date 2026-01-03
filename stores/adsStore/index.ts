import { create } from "zustand";
import { cachedGraphQLRequest } from "../../utils/graphql-cache";
import {
  GET_ALL_ACTIVE_ADS_QUERY,
  GET_ACTIVE_ADS_BY_TYPE_QUERY,
  GET_ADSENSE_SETTINGS_QUERY,
} from "./adsStore.gql";

// Ad types matching backend enum
export type AdMediaType = "IMAGE" | "VIDEO";

// Package breakdown interfaces (matches backend)
export interface CampaignPackage {
  packageId: string;
  packageData: {
    packageName: string;
    adType: string;
    placement: string;
    format: string;
    dimensions: {
      desktop: { width: number; height: number };
      mobile: { width: number; height: number };
    };
    basePrice: number;
    durationDays: number;
  };
  startDate: string | null; // null for ASAP packages
  endDate: string | null; // null for ASAP packages
  isAsap: boolean;
  desktopMediaUrl: string;
  mobileMediaUrl: string;
  clickUrl?: string;
  openInNewTab?: boolean;
  customPrice?: number;
  discountReason?: string;
}

export interface PackageBreakdown {
  packages: CampaignPackage[];
  discountPercentage?: number;
  discountReason?: string;
  totalBeforeDiscount: number;
  totalAfterDiscount: number;
}

// Ad Campaign interface
export interface AdCampaign {
  id: string;
  campaignName: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
  priority?: number; // Priority 1-5 for weighted selection
  pacingMode?: string; // EVEN, ASAP, MANUAL
  impressionsPurchased?: number; // Total impressions bought
  impressionsDelivered?: number; // Impressions already shown
  packageBreakdown?: PackageBreakdown; // NEW: Per-package configuration
  package?: {
    id: string;
    adType?: string; // IMAGE or VIDEO
    dimensions: {
      desktop: { width: number; height: number };
      mobile: { width: number; height: number };
    };
    placement: string;
    format: string;
  };
}

// Ad Package Instance - Represents a specific package within a campaign for ad display
export interface AdPackageInstance {
  campaignId: string;
  campaignPackageId: string; // The specific package ID for tracking
  campaignName: string;
  priority: number;
  pacingMode?: string;
  impressionsPurchased: number;
  impressionsDelivered: number;
  endDate: string;
  packageData: CampaignPackage; // Full package configuration
}

// AdSense Settings interfaces
export interface AdSenseSlot {
  id: string;
  enabled: boolean;
}

export interface AdSenseSettings {
  clientId: string | null;
  imageSlot: AdSenseSlot | null;
  videoSlot: AdSenseSlot | null;
}

interface AdsState {
  // Data
  allAds: AdCampaign[]; // NEW: Smart cache - all active ads loaded once
  allAdsFetchedAt: number | null; // NEW: Timestamp of last fetch
  adsByType: Record<AdMediaType, AdCampaign[]>; // DEPRECATED - kept for backward compatibility
  adSenseSettings: AdSenseSettings | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchAllAds: () => Promise<AdCampaign[]>; // NEW: Smart fetch - fetch all ads once
  getAdsByPlacement: (placement: string) => AdPackageInstance[]; // NEW: Returns package instances for placement
  fetchAdsByType: (adType: AdMediaType) => Promise<AdCampaign[]>; // DEPRECATED - kept for backward compatibility
  fetchAdSenseSettings: () => Promise<AdSenseSettings | null>;
  trackImpression: (campaignId: string, campaignPackageId?: string) => Promise<void>; // Updated to include packageId
  trackClick: (campaignId: string, campaignPackageId?: string) => Promise<void>; // Updated to include packageId
  clearError: () => void;
}

export const useAdsStore = create<AdsState>((set, get) => ({
  // Initial state
  allAds: [], // NEW: Smart cache
  allAdsFetchedAt: null, // NEW: Track last fetch time
  adsByType: {
    IMAGE: [],
    VIDEO: [],
  },
  adSenseSettings: null,
  isLoading: false,
  error: null,

  // NEW: Smart fetch - fetch all active ads once and cache
  fetchAllAds: async () => {
    const { allAds, allAdsFetchedAt } = get();
    const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    // Return cached ads if still fresh
    if (
      allAds.length > 0 &&
      allAdsFetchedAt &&
      Date.now() - allAdsFetchedAt < CACHE_TTL
    ) {
      return allAds;
    }

    set({ isLoading: true, error: null });

    try {
      const data = await cachedGraphQLRequest(
        GET_ALL_ACTIVE_ADS_QUERY,
        {},
        { ttl: CACHE_TTL }
      );

      const ads: AdCampaign[] = data.getAllActiveAds || [];

      // Update store with fetched ads
      set({
        allAds: ads,
        allAdsFetchedAt: Date.now(),
        isLoading: false,
        error: null,
      });

      return ads;
    } catch (error: any) {
      console.error(`❌ AdsStore: Failed to fetch ads:`, error);
      set({
        isLoading: false,
        error: error.message || "Failed to load ads",
      });
      return [];
    }
  },

  // NEW: Get package instances for a specific placement
  getAdsByPlacement: (placement: string) => {
    const { allAds } = get();
    const now = new Date();
    const packageInstances: AdPackageInstance[] = [];

    // Extract individual packages from campaigns that match this placement
    for (const campaign of allAds) {
      if (!campaign.packageBreakdown?.packages) continue;

      for (const pkg of campaign.packageBreakdown.packages) {
        // Check for null dates before creating Date objects
        if (!pkg.startDate || !pkg.endDate) continue;

        const pkgStart = new Date(pkg.startDate);
        const pkgEnd = new Date(pkg.endDate);

        // Check if this package matches the placement and is currently active
        if (
          pkg.packageData.placement === placement &&
          now >= pkgStart &&
          now <= pkgEnd
        ) {
          // Create package instance
          packageInstances.push({
            campaignId: campaign.id,
            campaignPackageId: pkg.packageId,
            campaignName: campaign.campaignName,
            priority: campaign.priority || 3,
            pacingMode: campaign.pacingMode,
            impressionsPurchased: campaign.impressionsPurchased || 0,
            impressionsDelivered: campaign.impressionsDelivered || 0,
            endDate: pkg.endDate,
            packageData: pkg,
          });
        }
      }
    }

    return packageInstances;
  },

  // Fetch active ads by type
  fetchAdsByType: async (adType: AdMediaType) => {
    const { adsByType } = get();

    // Return cached ads if already fetched (cache for 5 minutes)
    if (adsByType[adType].length > 0) {
      return adsByType[adType];
    }

    set({ isLoading: true, error: null });

    try {
      // Convert uppercase enum to lowercase for database compatibility
      const adTypeForBackend = adType.toLowerCase();

      const data = await cachedGraphQLRequest(
        GET_ACTIVE_ADS_BY_TYPE_QUERY,
        { adType: adTypeForBackend },
        { ttl: 5 * 60 * 1000 } // Cache for 5 minutes
      );

      const ads: AdCampaign[] = data.getActiveAdsByType || [];

      // Update store with fetched ads
      set({
        adsByType: {
          ...get().adsByType,
          [adType]: ads,
        },
        isLoading: false,
        error: null,
      });

      return ads;
    } catch (error: any) {
      console.error(`❌ AdsStore: Failed to fetch ads for ${adType}:`, error);
      set({
        isLoading: false,
        error: error.message || "Failed to load ads",
      });
      return [];
    }
  },

  // Fetch Google AdSense settings
  fetchAdSenseSettings: async () => {
    const { adSenseSettings } = get();

    // Return cached settings if already fetched
    if (adSenseSettings) {
      return adSenseSettings;
    }

    try {
      const data = await cachedGraphQLRequest(
        GET_ADSENSE_SETTINGS_QUERY,
        {},
        { ttl: 10 * 60 * 1000 } // Cache for 10 minutes
      );

      const settings: AdSenseSettings = data.getAdSenseSettings || null;

      set({ adSenseSettings: settings });
      return settings;
    } catch (error: any) {
      console.error(`❌ AdsStore: Failed to fetch AdSense settings:`, error);
      return null;
    }
  },

  // Track ad impression
  trackImpression: async (campaignId: string, campaignPackageId?: string) => {
    try {
      await fetch('/api/ads/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId, campaignPackageId, eventType: 'impression' }),
      });
    } catch {
      // Silent fail - tracking shouldn't break ad display
    }
  },

  // Track ad click
  trackClick: async (campaignId: string, campaignPackageId?: string) => {
    try {
      await fetch('/api/ads/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId, campaignPackageId, eventType: 'click' }),
      });
    } catch {
      // Silent fail - tracking shouldn't break ad display
    }
  },

  clearError: () => set({ error: null }),
}));

// Selectors for easy access
export const useAdsByType = (adType: AdMediaType) =>
  useAdsStore((state) => state.adsByType[adType]);
export const useAdsLoading = () => useAdsStore((state) => state.isLoading);
export const useAdsError = () => useAdsStore((state) => state.error);
export const useAdSenseSettings = () =>
  useAdsStore((state) => state.adSenseSettings);
