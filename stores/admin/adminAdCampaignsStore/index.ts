import { create } from "zustand";
import { useAdminAuthStore } from "../adminAuthStore";
import {
  GET_ALL_AD_CAMPAIGNS_QUERY,
  GET_AD_CAMPAIGN_BY_ID_QUERY,
  GET_ACTIVE_AD_CAMPAIGNS_QUERY,
  GET_CAMPAIGNS_BY_CLIENT_QUERY,
  GET_MY_CAMPAIGNS_QUERY,
  CREATE_AD_CAMPAIGN_MUTATION,
  UPDATE_AD_CAMPAIGN_MUTATION,
  UPDATE_CAMPAIGN_STATUS_MUTATION,
  DELETE_AD_CAMPAIGN_MUTATION,
  REGENERATE_PUBLIC_REPORT_TOKEN_MUTATION,
  PROCESS_CAMPAIGN_AUTOMATION_MUTATION,
  GET_CAMPAIGN_STATUS_INSIGHTS_QUERY,
} from "./adminAdCampaignsStore.gql";

// Interface for AdClient (nested relation)
export interface AdClient {
  id: string;
  companyName: string;
  industry?: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  status: string;
}

// Interface for AdPackage (nested relation)
export interface AdPackageInfo {
  id: string;
  packageName: string;
  adType: string;
  durationDays: number;
  impressionLimit: number;
  basePrice: number;
  currency: string;
}

// Interface for User (nested relation)
export interface UserInfo {
  id: string;
  email: string;
  name?: string;
}

// Main AdCampaign interface
export interface AdCampaign {
  id: string;
  campaignName: string;
  description?: string;
  clientId: string;
  client: AdClient;
  packageId: string;
  package: AdPackageInfo;
  isCustomPackage: boolean;
  packageBreakdown?: Record<string, any>;
  status: string; // AdCampaignStatus
  startPreference: string; // CampaignStartPreference
  startDate: string;
  endDate: string;
  totalPrice: number;
  currency: string;
  paymentLink?: string;
  paymentLinkSentAt?: string;
  paidAt?: string;
  activatedAt?: string;
  completedAt?: string;
  createdByUserId: string;
  createdByUser: UserInfo;
  notes?: string;
  desktopMediaUrl?: string;
  mobileMediaUrl?: string;
  clickUrl?: string;
  openInNewTab?: boolean;
  publicReportToken?: string;
  createdAt: string;
  updatedAt: string;
}

// Input types for mutations
export interface CreateAdCampaignInput {
  campaignName: string;
  description?: string;
  clientId: string;
  packageId: string;
  isCustomPackage?: boolean;
  packageBreakdown?: Record<string, any>;
  startPreference?: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  currency?: string;
  notes?: string;
  desktopMediaUrl?: string;
  mobileMediaUrl?: string;
  clickUrl?: string;
  openInNewTab?: boolean;
}

export interface UpdateAdCampaignInput {
  id: string;
  campaignName?: string;
  description?: string;
  clientId?: string;
  packageId?: string;
  isCustomPackage?: boolean;
  packageBreakdown?: Record<string, any>;
  startPreference?: string;
  startDate?: string;
  endDate?: string;
  totalPrice?: number;
  currency?: string;
  paymentLink?: string;
  notes?: string;
  desktopMediaUrl?: string;
  mobileMediaUrl?: string;
  clickUrl?: string;
  openInNewTab?: boolean;
}

export interface UpdateCampaignStatusInput {
  id: string;
  status: string;
  paymentLink?: string;
}

export interface FilterAdCampaignsInput {
  status?: string;
  clientId?: string;
  packageId?: string;
  startDateFrom?: string;
  startDateTo?: string;
}

export interface CampaignStatusInsights {
  totalCampaigns: number;
  activeCampaigns: number;
  draftCampaigns: number;
  pausedCampaigns: number;
  completedCampaigns: number;
  cancelledCampaigns: number;
  awaitingPayment: number;
  awaitingActivation: number;
}

interface AdminAdCampaignsStore {
  // Data
  adCampaigns: AdCampaign[];
  loading: boolean;
  error: string | null;
  selectedAdCampaign: AdCampaign | null;
  statusInsights: CampaignStatusInsights | null;

  // Caching
  lastFetched: number | null;
  cacheTimeout: number;

  // CRUD operations
  loadAdCampaigns: (filter?: FilterAdCampaignsInput) => Promise<void>;
  createAdCampaign: (input: CreateAdCampaignInput) => Promise<AdCampaign | null>;
  updateAdCampaign: (input: UpdateAdCampaignInput) => Promise<AdCampaign | null>;
  updateCampaignStatus: (input: UpdateCampaignStatusInput) => Promise<AdCampaign | null>;
  deleteAdCampaign: (id: string) => Promise<boolean>;
  getAdCampaignById: (id: string) => Promise<AdCampaign | null>;
  loadActiveCampaigns: () => Promise<void>;
  loadCampaignsByClient: (clientId: string) => Promise<void>;
  loadMyCampaigns: () => Promise<void>;
  regeneratePublicReportToken: (campaignId: string) => Promise<AdCampaign | null>;
  processCampaignAutomation: (campaignId: string) => Promise<AdCampaign | null>;
  loadStatusInsights: () => Promise<void>;

  // UI state
  setSelectedAdCampaign: (campaign: AdCampaign | null) => void;
  clearError: () => void;

  // Cache management
  isCacheValid: () => boolean;
  loadAdCampaignsWithCache: (forceRefresh?: boolean, filter?: FilterAdCampaignsInput) => Promise<void>;
  invalidateCache: () => void;
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

export const useAdminAdCampaignsStore = create<AdminAdCampaignsStore>((set, get) => ({
  adCampaigns: [],
  loading: false,
  error: null,
  selectedAdCampaign: null,
  statusInsights: null,

  // Cache state
  lastFetched: null,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes

  loadAdCampaigns: async (filter?: FilterAdCampaignsInput) => {
    set({ loading: true, error: null });

    try {
      const data = await makeGraphQLCall(GET_ALL_AD_CAMPAIGNS_QUERY, { filter });
      const adCampaigns: AdCampaign[] = data.adCampaigns || [];

      set({
        adCampaigns,
        loading: false,
        error: null,
        lastFetched: Date.now(),
      });
    } catch (error: any) {
      console.error("Failed to load ad campaigns:", error);
      set({
        loading: false,
        error: error.message || "Failed to load ad campaigns",
        adCampaigns: [],
      });
    }
  },

  loadActiveCampaigns: async () => {
    set({ loading: true, error: null });

    try {
      const data = await makeGraphQLCall(GET_ACTIVE_AD_CAMPAIGNS_QUERY);
      const adCampaigns: AdCampaign[] = data.activeAdCampaigns || [];

      set({
        adCampaigns,
        loading: false,
        error: null,
        lastFetched: Date.now(),
      });
    } catch (error: any) {
      console.error("Failed to load active ad campaigns:", error);
      set({
        loading: false,
        error: error.message || "Failed to load active ad campaigns",
        adCampaigns: [],
      });
    }
  },

  loadCampaignsByClient: async (clientId: string) => {
    set({ loading: true, error: null });

    try {
      const data = await makeGraphQLCall(GET_CAMPAIGNS_BY_CLIENT_QUERY, { clientId });
      const adCampaigns: AdCampaign[] = data.campaignsByClient || [];

      set({
        adCampaigns,
        loading: false,
        error: null,
        lastFetched: Date.now(),
      });
    } catch (error: any) {
      console.error("Failed to load campaigns by client:", error);
      set({
        loading: false,
        error: error.message || "Failed to load campaigns by client",
        adCampaigns: [],
      });
    }
  },

  loadMyCampaigns: async () => {
    set({ loading: true, error: null });

    try {
      const data = await makeGraphQLCall(GET_MY_CAMPAIGNS_QUERY);
      const adCampaigns: AdCampaign[] = data.myCampaigns || [];

      set({
        adCampaigns,
        loading: false,
        error: null,
        lastFetched: Date.now(),
      });
    } catch (error: any) {
      console.error("Failed to load my campaigns:", error);
      set({
        loading: false,
        error: error.message || "Failed to load my campaigns",
        adCampaigns: [],
      });
    }
  },

  createAdCampaign: async (input: CreateAdCampaignInput) => {
    set({ loading: true, error: null });

    try {
      const data = await makeGraphQLCall(CREATE_AD_CAMPAIGN_MUTATION, { input });
      const newCampaign = data.createAdCampaign;

      // Add new campaign to local state
      const { adCampaigns } = get();
      set({
        adCampaigns: [...adCampaigns, newCampaign],
        loading: false,
        error: null,
        lastFetched: Date.now(),
      });

      return newCampaign;
    } catch (error: any) {
      console.error("Failed to create ad campaign:", error);
      set({
        loading: false,
        error: error.message || "Failed to create ad campaign",
      });
      return null;
    }
  },

  updateAdCampaign: async (input: UpdateAdCampaignInput) => {
    set({ loading: true, error: null });

    try {
      const data = await makeGraphQLCall(UPDATE_AD_CAMPAIGN_MUTATION, { input });
      const updatedCampaign = data.updateAdCampaign;

      // Update the campaign in local state
      const { adCampaigns } = get();
      const updatedCampaigns = adCampaigns.map((campaign) =>
        campaign.id === updatedCampaign.id ? updatedCampaign : campaign
      );

      set({
        adCampaigns: updatedCampaigns,
        loading: false,
        error: null,
        lastFetched: Date.now(),
      });

      return updatedCampaign;
    } catch (error: any) {
      console.error("Failed to update ad campaign:", error);
      set({
        loading: false,
        error: error.message || "Failed to update ad campaign",
      });
      return null;
    }
  },

  updateCampaignStatus: async (input: UpdateCampaignStatusInput) => {
    set({ loading: true, error: null });

    try {
      const data = await makeGraphQLCall(UPDATE_CAMPAIGN_STATUS_MUTATION, { input });
      const updatedCampaign = data.updateCampaignStatus;

      // Update the campaign in local state
      const { adCampaigns } = get();
      const updatedCampaigns = adCampaigns.map((campaign) =>
        campaign.id === updatedCampaign.id ? { ...campaign, ...updatedCampaign } : campaign
      );

      set({
        adCampaigns: updatedCampaigns,
        loading: false,
        error: null,
        lastFetched: Date.now(),
      });

      return updatedCampaign;
    } catch (error: any) {
      console.error("Failed to update campaign status:", error);
      set({
        loading: false,
        error: error.message || "Failed to update campaign status",
      });
      return null;
    }
  },

  deleteAdCampaign: async (id: string) => {
    set({ loading: true, error: null });

    try {
      await makeGraphQLCall(DELETE_AD_CAMPAIGN_MUTATION, { input: { id } });

      // Remove the campaign from local state
      const { adCampaigns } = get();
      const filteredCampaigns = adCampaigns.filter((campaign) => campaign.id !== id);

      set({
        adCampaigns: filteredCampaigns,
        loading: false,
        error: null,
        lastFetched: Date.now(),
      });

      return true;
    } catch (error: any) {
      console.error("Failed to delete ad campaign:", error);
      set({
        loading: false,
        error: error.message || "Failed to delete ad campaign",
      });
      return false;
    }
  },

  getAdCampaignById: async (id: string) => {
    set({ loading: true, error: null });

    try {
      const data = await makeGraphQLCall(GET_AD_CAMPAIGN_BY_ID_QUERY, { id });
      const campaign = data.adCampaign;

      if (!campaign) {
        throw new Error("Ad campaign not found");
      }

      set({
        selectedAdCampaign: campaign,
        loading: false,
        error: null,
      });

      return campaign;
    } catch (error: any) {
      console.error("Failed to get ad campaign by ID:", error);
      set({
        loading: false,
        error: error.message || "Failed to get ad campaign",
        selectedAdCampaign: null,
      });
      return null;
    }
  },

  regeneratePublicReportToken: async (campaignId: string) => {
    set({ loading: true, error: null });

    try {
      const data = await makeGraphQLCall(REGENERATE_PUBLIC_REPORT_TOKEN_MUTATION, { campaignId });
      const updatedCampaign = data.regeneratePublicReportToken;

      // Update the campaign in local state
      const { adCampaigns } = get();
      const updatedCampaigns = adCampaigns.map((campaign) =>
        campaign.id === updatedCampaign.id
          ? { ...campaign, publicReportToken: updatedCampaign.publicReportToken, updatedAt: updatedCampaign.updatedAt }
          : campaign
      );

      set({
        adCampaigns: updatedCampaigns,
        loading: false,
        error: null,
      });

      return updatedCampaign;
    } catch (error: any) {
      console.error("Failed to regenerate public report token:", error);
      set({
        loading: false,
        error: error.message || "Failed to regenerate public report token",
      });
      return null;
    }
  },

  processCampaignAutomation: async (campaignId: string) => {
    set({ loading: true, error: null });

    try {
      const data = await makeGraphQLCall(PROCESS_CAMPAIGN_AUTOMATION_MUTATION, { campaignId });
      const updatedCampaign = data.processCampaignAutomation;

      // Update the campaign in local state
      const { adCampaigns } = get();
      const updatedCampaigns = adCampaigns.map((campaign) =>
        campaign.id === updatedCampaign.id ? { ...campaign, ...updatedCampaign } : campaign
      );

      set({
        adCampaigns: updatedCampaigns,
        loading: false,
        error: null,
      });

      return updatedCampaign;
    } catch (error: any) {
      console.error("Failed to process campaign automation:", error);
      set({
        loading: false,
        error: error.message || "Failed to process campaign automation",
      });
      return null;
    }
  },

  loadStatusInsights: async () => {
    set({ loading: true, error: null });

    try {
      const data = await makeGraphQLCall(GET_CAMPAIGN_STATUS_INSIGHTS_QUERY);
      const insights: CampaignStatusInsights = data.campaignStatusInsights;

      set({
        statusInsights: insights,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      console.error("Failed to load campaign status insights:", error);
      set({
        loading: false,
        error: error.message || "Failed to load campaign status insights",
        statusInsights: null,
      });
    }
  },

  setSelectedAdCampaign: (campaign: AdCampaign | null) => {
    set({ selectedAdCampaign: campaign });
  },

  clearError: () => {
    set({ error: null });
  },

  // Cache management methods
  isCacheValid: () => {
    const { lastFetched, cacheTimeout } = get();
    if (!lastFetched) return false;
    return Date.now() - lastFetched < cacheTimeout;
  },

  invalidateCache: () => {
    set({ lastFetched: null });
  },

  loadAdCampaignsWithCache: async (forceRefresh = false, filter?: FilterAdCampaignsInput) => {
    const state = get();

    // If cache is valid and not forcing refresh, return early
    if (!forceRefresh && state.isCacheValid() && state.adCampaigns.length > 0) {
      console.log("🚀 Ad Campaigns loaded from cache - no API call needed");
      return;
    }

    console.log("🔄 Ad Campaigns cache invalid - fetching fresh data");
    await state.loadAdCampaigns(filter);
  },
}));
