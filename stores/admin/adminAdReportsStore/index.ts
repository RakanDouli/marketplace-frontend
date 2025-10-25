import { create } from 'zustand';
import { useAdminAuthStore } from '../adminAuthStore';
import {
  GET_ALL_AD_REPORTS_QUERY,
  GET_AD_REPORT_BY_ID_QUERY,
  GET_CAMPAIGN_REPORTS_QUERY,
  GET_CAMPAIGN_SUMMARY_QUERY,
  GET_TOP_PERFORMING_CAMPAIGNS_QUERY,
  GET_ADS_STATS_QUERY,
} from './adminAdReportsStore.gql';

// TypeScript Interfaces
export interface AdReport {
  id: string;
  campaignId: string;
  campaign: {
    id: string;
    campaignName: string;
    description?: string;
    client: {
      id: string;
      companyName: string;
      contactName?: string;
      contactEmail?: string;
    };
    package: {
      id: string;
      packageName: string;
    };
    status: string;
    startDate?: string;
    endDate?: string;
    totalPrice?: number;
    currency?: string;
  };
  mediaAssetKey?: string;
  date: string;
  impressions: number;
  clicks: number;
  ctr: number;
  cost: number;
  currency: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignSummary {
  campaignId: string;
  campaignName: string;
  totalImpressions: number;
  totalClicks: number;
  averageCTR: number;
  totalCost: number;
  currency: string;
  reportCount: number;
}

export interface AdsStats {
  totalImpressions: number;
  totalClicks: number;
  averageCTR: number;
  totalCost: number;
  totalCampaigns: number;
}

export interface FilterAdReportsInput {
  campaignId?: string;
  startDate?: string;
  endDate?: string;
}

interface AdminAdReportsStore {
  adReports: AdReport[];
  selectedReport: AdReport | null;
  topCampaigns: CampaignSummary[];
  adsStats: AdsStats | null;
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  cacheTimeout: number;

  // Actions
  loadAdReports: (filter?: FilterAdReportsInput) => Promise<void>;
  loadAdReportsWithCache: (filter?: FilterAdReportsInput) => Promise<void>;
  loadAdReportById: (id: string) => Promise<void>;
  loadCampaignReports: (campaignId: string, startDate?: string, endDate?: string) => Promise<AdReport[]>;
  loadCampaignSummary: (campaignId: string, startDate?: string, endDate?: string) => Promise<CampaignSummary>;
  loadTopPerformingCampaigns: (limit?: number, startDate?: string, endDate?: string) => Promise<void>;
  loadAdsStats: (startDate?: string, endDate?: string) => Promise<void>;
  setSelectedReport: (report: AdReport | null) => void;
  clearCache: () => void;
  clearError: () => void;
}

// Helper function for API calls
const makeGraphQLCall = async (query: string, variables: any = {}) => {
  const { user } = useAdminAuthStore.getState();
  const token = user?.token;

  const response = await fetch("http://localhost:4000/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ query, variables }),
  });

  const result = await response.json();

  if (result.errors) {
    throw new Error(result.errors[0].message);
  }

  return result.data;
};

export const useAdminAdReportsStore = create<AdminAdReportsStore>((set, get) => ({
  adReports: [],
  selectedReport: null,
  topCampaigns: [],
  adsStats: null,
  loading: false,
  error: null,
  lastFetched: null,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes

  loadAdReports: async (filter?: FilterAdReportsInput) => {
    set({ loading: true, error: null });
    try {
      const data = await makeGraphQLCall(GET_ALL_AD_REPORTS_QUERY, { filter });
      set({
        adReports: data.adReports || [],
        loading: false,
        lastFetched: Date.now(),
      });
    } catch (error: any) {
      console.error('Load ad reports error:', error);
      set({
        error: error.message || 'Failed to load ad reports',
        loading: false,
      });
    }
  },

  loadAdReportsWithCache: async (filter?: FilterAdReportsInput) => {
    const { lastFetched, cacheTimeout, loadAdReports } = get();
    const now = Date.now();

    if (!lastFetched || now - lastFetched > cacheTimeout) {
      await loadAdReports(filter);
    }
  },

  loadAdReportById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const data = await makeGraphQLCall(GET_AD_REPORT_BY_ID_QUERY, { id });
      set({
        selectedReport: data.adReport,
        loading: false,
      });
    } catch (error: any) {
      console.error('Load ad report error:', error);
      set({
        error: error.message || 'Failed to load ad report',
        loading: false,
      });
    }
  },

  loadCampaignReports: async (campaignId: string, startDate?: string, endDate?: string) => {
    try {
      const data = await makeGraphQLCall(GET_CAMPAIGN_REPORTS_QUERY, {
        campaignId,
        startDate,
        endDate,
      });
      return data.campaignReports || [];
    } catch (error: any) {
      console.error('Load campaign reports error:', error);
      throw error;
    }
  },

  loadCampaignSummary: async (campaignId: string, startDate?: string, endDate?: string) => {
    try {
      const data = await makeGraphQLCall(GET_CAMPAIGN_SUMMARY_QUERY, {
        campaignId,
        startDate,
        endDate,
      });
      return data.campaignSummary;
    } catch (error: any) {
      console.error('Load campaign summary error:', error);
      throw error;
    }
  },

  loadTopPerformingCampaigns: async (limit?: number, startDate?: string, endDate?: string) => {
    set({ loading: true, error: null });
    try {
      const data = await makeGraphQLCall(GET_TOP_PERFORMING_CAMPAIGNS_QUERY, {
        limit,
        startDate,
        endDate,
      });
      set({
        topCampaigns: data.topPerformingCampaigns || [],
        loading: false,
      });
    } catch (error: any) {
      console.error('Load top campaigns error:', error);
      set({
        error: error.message || 'Failed to load top campaigns',
        loading: false,
      });
    }
  },

  loadAdsStats: async (startDate?: string, endDate?: string) => {
    set({ loading: true, error: null });
    try {
      const data = await makeGraphQLCall(GET_ADS_STATS_QUERY, {
        startDate,
        endDate,
      });
      set({
        adsStats: data.adsStats,
        loading: false,
      });
    } catch (error: any) {
      console.error('Load ads stats error:', error);
      set({
        error: error.message || 'Failed to load ads stats',
        loading: false,
      });
    }
  },

  setSelectedReport: (report: AdReport | null) => {
    set({ selectedReport: report });
  },

  clearCache: () => {
    set({ lastFetched: null });
  },

  clearError: () => {
    set({ error: null });
  },
}));
