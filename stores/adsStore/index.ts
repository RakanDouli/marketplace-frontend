import { create } from "zustand";
import { cachedGraphQLRequest } from "../../utils/graphql-cache";
import { GET_ACTIVE_ADS_BY_TYPE_QUERY, GET_ADSENSE_SETTINGS_QUERY } from "./adsStore.gql";

// Ad types matching backend enum
export type AdMediaType =
  | "BANNER"
  | "VIDEO"
  | "BETWEEN_LISTINGS_CARD"
  | "BETWEEN_LISTINGS_BANNER";

// Ad Campaign interface
export interface AdCampaign {
  id: string;
  campaignName: string;
  description: string;
  desktopMediaUrl: string | null;
  mobileMediaUrl: string | null;
  clickUrl: string;
  openInNewTab: boolean;
  status: string;
  startDate: string;
  endDate: string;
}

// AdSense Settings interfaces
export interface AdSenseSlot {
  id: string;
  enabled: boolean;
}

export interface AdSenseSettings {
  clientId: string | null;
  bannerSlot: AdSenseSlot | null;
  betweenListingsSlot: AdSenseSlot | null;
  videoSlot: AdSenseSlot | null;
}

interface AdsState {
  // Data
  adsByType: Record<AdMediaType, AdCampaign[]>;
  adSenseSettings: AdSenseSettings | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchAdsByType: (adType: AdMediaType) => Promise<AdCampaign[]>;
  fetchAdSenseSettings: () => Promise<AdSenseSettings | null>;
  trackImpression: (campaignId: string) => Promise<void>;
  trackClick: (campaignId: string) => Promise<void>;
  clearError: () => void;
}

export const useAdsStore = create<AdsState>((set, get) => ({
  // Initial state
  adsByType: {
    BANNER: [],
    VIDEO: [],
    BETWEEN_LISTINGS_CARD: [],
    BETWEEN_LISTINGS_BANNER: [],
  },
  adSenseSettings: null,
  loading: false,
  error: null,

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
      // POST to backend tracking endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT?.replace('/graphql', '')}/api/ads/track`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaignId,
          eventType: "impression",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to track impression");
      }

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
      // POST to backend tracking endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT?.replace('/graphql', '')}/api/ads/track`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaignId,
          eventType: "click",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to track click");
      }

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
