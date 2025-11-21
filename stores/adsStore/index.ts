import { create } from "zustand";
import { cachedGraphQLRequest } from "../../utils/graphql-cache";
import { GET_ALL_ACTIVE_ADS_QUERY, GET_ACTIVE_ADS_BY_TYPE_QUERY, GET_ADSENSE_SETTINGS_QUERY } from "./adsStore.gql";

// Ad types matching backend enum
export type AdMediaType =
  | "IMAGE"
  | "VIDEO";

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
  startDate: string;
  endDate: string;
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
    dimensions: {
      desktop: { width: number; height: number };
      mobile: { width: number; height: number };
    };
    placement: string;
    format: string;
  };
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
  loading: boolean;
  error: string | null;

  // Actions
  fetchAllAds: () => Promise<AdCampaign[]>; // NEW: Smart fetch - fetch all ads once
  getAdsByPlacement: (placement: string) => AdCampaign[]; // NEW: Filter cached ads by placement
  fetchAdsByType: (adType: AdMediaType) => Promise<AdCampaign[]>; // DEPRECATED - kept for backward compatibility
  fetchAdSenseSettings: () => Promise<AdSenseSettings | null>;
  trackImpression: (campaignId: string) => Promise<void>;
  trackClick: (campaignId: string) => Promise<void>;
  clearError: () => void;
}

export const useAdsStore = create<AdsState>((set, get) => ({
  // Initial state
  allAds: [], // NEW: Smart cache
  allAdsFetchedAt: null, // NEW: Track last fetch time
  adsByType: {
    BANNER: [],
    VIDEO: [],
    BETWEEN_LISTINGS_CARD: [],
    BETWEEN_LISTINGS_BANNER: [],
  },
  adSenseSettings: null,
  loading: false,
  error: null,

  // NEW: Smart fetch - fetch all active ads once and cache
  fetchAllAds: async () => {
    const { allAds, allAdsFetchedAt } = get();
    const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    // Return cached ads if still fresh
    if (allAds.length > 0 && allAdsFetchedAt && Date.now() - allAdsFetchedAt < CACHE_TTL) {
      console.log(`📢 AdsStore: Using cached ads (${allAds.length} campaigns)`);
      return allAds;
    }

    console.log(`📢 AdsStore: Fetching all active ads (smart cache)`);
    set({ loading: true, error: null });

    try {
      const data = await cachedGraphQLRequest(
        GET_ALL_ACTIVE_ADS_QUERY,
        {},
        { ttl: CACHE_TTL }
      );

      const ads: AdCampaign[] = data.getAllActiveAds || [];

      console.log(`📢 AdsStore: Fetched ${ads.length} active campaigns`, {
        campaigns: ads.map((ad) => ({
          id: ad.id,
          name: ad.campaignName,
          placements: ad.packageBreakdown?.packages?.map(pkg => pkg.packageData.placement) || [],
        })),
      });

      // Update store with fetched ads
      set({
        allAds: ads,
        allAdsFetchedAt: Date.now(),
        loading: false,
        error: null,
      });

      return ads;
    } catch (error: any) {
      console.error(`❌ AdsStore: Failed to fetch ads:`, error);
      set({
        loading: false,
        error: error.message || "Failed to load ads",
      });
      return [];
    }
  },

  // NEW: Filter cached ads by placement (client-side)
  getAdsByPlacement: (placement: string) => {
    const { allAds } = get();
    const now = new Date();

    // Filter ads that have packages for this placement and are currently active
    const filtered = allAds.filter(campaign => {
      if (!campaign.packageBreakdown?.packages) return false;

      // Check if any package matches this placement and is currently active
      return campaign.packageBreakdown.packages.some(pkg => {
        const pkgStart = new Date(pkg.startDate);
        const pkgEnd = new Date(pkg.endDate);

        return (
          pkg.packageData.placement === placement &&
          now >= pkgStart &&
          now <= pkgEnd
        );
      });
    });

    console.log(`📢 AdsStore: Filtered ${filtered.length} ads for placement "${placement}"`);
    return filtered;
  },

  // Fetch active ads by type
  fetchAdsByType: async (adType: AdMediaType) => {
    const { adsByType } = get();

    // Return cached ads if already fetched (cache for 5 minutes)
    if (adsByType[adType].length > 0) {
      console.log(`📢 AdsStore: Using cached ads for ${adType}`);
      return adsByType[adType];
    }

    console.log(`📢 AdsStore: Fetching ads for type: ${adType}`);
    set({ loading: true, error: null });

    try {
      // Convert uppercase enum to lowercase for database compatibility
      const adTypeForBackend = adType.toLowerCase();

      const data = await cachedGraphQLRequest(
        GET_ACTIVE_ADS_BY_TYPE_QUERY,
        { adType: adTypeForBackend },
        { ttl: 5 * 60 * 1000 } // Cache for 5 minutes
      );

      const ads: AdCampaign[] = data.getActiveAdsByType || [];

      console.log(`📢 AdsStore: Fetched ${ads.length} ads for ${adType}`, {
        campaigns: ads.map((ad) => ({
          id: ad.id,
          name: ad.campaignName,
          hasDesktopMedia: !!ad.desktopMediaUrl,
          hasMobileMedia: !!ad.mobileMediaUrl,
        })),
      });

      // Update store with fetched ads
      set({
        adsByType: {
          ...get().adsByType,
          [adType]: ads,
        },
        loading: false,
        error: null,
      });

      return ads;
    } catch (error: any) {
      console.error(`❌ AdsStore: Failed to fetch ads for ${adType}:`, error);
      set({
        loading: false,
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
      console.log(`📢 AdsStore: Using cached AdSense settings`);
      return adSenseSettings;
    }

    console.log(`📢 AdsStore: Fetching AdSense settings`);

    try {
      const data = await cachedGraphQLRequest(
        GET_ADSENSE_SETTINGS_QUERY,
        {},
        { ttl: 10 * 60 * 1000 } // Cache for 10 minutes
      );

      const settings: AdSenseSettings = data.getAdSenseSettings || null;

      console.log(`📢 AdsStore: Fetched AdSense settings`, {
        clientId: settings?.clientId ? 'SET' : 'NOT SET',
        bannerEnabled: settings?.bannerSlot?.enabled || false,
        betweenListingsEnabled: settings?.betweenListingsSlot?.enabled || false,
        videoEnabled: settings?.videoSlot?.enabled || false,
      });

      set({ adSenseSettings: settings });
      return settings;
    } catch (error: any) {
      console.error(`❌ AdsStore: Failed to fetch AdSense settings:`, error);
      return null;
    }
  },

  // Track ad impression
  trackImpression: async (campaignId: string) => {
    console.log(`👁️ AdsStore: Tracking impression for campaign:`, campaignId);

    try {
      // Use GraphQL mutation (public, no auth required)
      const TRACK_IMPRESSION_MUTATION = `
        mutation TrackCampaignImpression($campaignId: String!) {
          trackCampaignImpression(campaignId: $campaignId)
        }
      `;

      await cachedGraphQLRequest(
        TRACK_IMPRESSION_MUTATION,
        { campaignId },
        { ttl: 0 } // No caching for tracking
      );

      console.log(`✅ AdsStore: Impression tracked for campaign:`, campaignId);
    } catch (error) {
      console.error(`❌ AdsStore: Failed to track impression:`, error);
      // Don't throw error - tracking failures shouldn't break ad display
    }
  },

  // Track ad click
  trackClick: async (campaignId: string) => {
    console.log(`🖱️ AdsStore: Tracking click for campaign:`, campaignId);

    try {
      // Use GraphQL mutation (public, no auth required)
      const TRACK_CLICK_MUTATION = `
        mutation TrackCampaignClick($campaignId: String!) {
          trackCampaignClick(campaignId: $campaignId)
        }
      `;

      await cachedGraphQLRequest(
        TRACK_CLICK_MUTATION,
        { campaignId },
        { ttl: 0 } // No caching for tracking
      );

      console.log(`✅ AdsStore: Click tracked for campaign:`, campaignId);
    } catch (error) {
      console.error(`❌ AdsStore: Failed to track click:`, error);
      // Don't throw error - tracking failures shouldn't break ad display
    }
  },

  clearError: () => set({ error: null }),
}));

// Selectors for easy access
export const useAdsByType = (adType: AdMediaType) =>
  useAdsStore((state) => state.adsByType[adType]);
export const useAdsLoading = () => useAdsStore((state) => state.loading);
export const useAdsError = () => useAdsStore((state) => state.error);
export const useAdSenseSettings = () => useAdsStore((state) => state.adSenseSettings);
