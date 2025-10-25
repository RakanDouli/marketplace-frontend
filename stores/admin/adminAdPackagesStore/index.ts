import { create } from "zustand";
import { useAdminAuthStore } from "../adminAuthStore";
import {
  GET_ALL_AD_PACKAGES_QUERY,
  GET_AD_PACKAGE_BY_ID_QUERY,
  GET_ACTIVE_AD_PACKAGES_QUERY,
  CREATE_AD_PACKAGE_MUTATION,
  UPDATE_AD_PACKAGE_MUTATION,
  DELETE_AD_PACKAGE_MUTATION,
} from "./adminAdPackagesStore.gql";

export interface AdPackage {
  id: string;
  packageName: string;
  description: string;
  adType: string; // "BANNER" | "VIDEO" | "BETWEEN_LISTINGS_CARD" | "BETWEEN_LISTINGS_BANNER"
  durationDays: number;
  impressionLimit: number;
  basePrice: number;
  currency: string;
  isActive: boolean;
  mediaRequirements: string[];
  includedPackages?: string[] | null;
  customDiscount?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

interface CreateAdPackageInput {
  packageName: string;
  description: string;
  adType: string;
  durationDays: number;
  impressionLimit: number;
  basePrice: number;
  currency?: string;
  isActive?: boolean;
  mediaRequirements?: string[];
  includedPackages?: string[];
  customDiscount?: number;
}

interface UpdateAdPackageInput {
  id: string;
  packageName?: string;
  description?: string;
  adType?: string;
  durationDays?: number;
  impressionLimit?: number;
  basePrice?: number;
  currency?: string;
  isActive?: boolean;
  mediaRequirements?: string[];
  includedPackages?: string[];
  customDiscount?: number;
}

interface AdminAdPackagesStore {
  // Data
  adPackages: AdPackage[];
  loading: boolean;
  error: string | null;
  selectedAdPackage: AdPackage | null;

  // Caching
  lastFetched: number | null;
  cacheTimeout: number;

  // CRUD operations
  loadAdPackages: () => Promise<void>;
  createAdPackage: (input: CreateAdPackageInput) => Promise<AdPackage | null>;
  updateAdPackage: (input: UpdateAdPackageInput) => Promise<AdPackage | null>;
  deleteAdPackage: (id: string) => Promise<boolean>;
  getAdPackageById: (id: string) => Promise<AdPackage | null>;
  loadActiveAdPackages: () => Promise<void>;

  // UI state
  setSelectedAdPackage: (adPackage: AdPackage | null) => void;
  clearError: () => void;

  // Cache management
  isCacheValid: () => boolean;
  loadAdPackagesWithCache: (forceRefresh?: boolean) => Promise<void>;
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

export const useAdminAdPackagesStore = create<AdminAdPackagesStore>((set, get) => ({
  adPackages: [],
  loading: false,
  error: null,
  selectedAdPackage: null,

  // Cache state
  lastFetched: null,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes

  loadAdPackages: async () => {
    set({ loading: true, error: null });

    try {
      const data = await makeGraphQLCall(GET_ALL_AD_PACKAGES_QUERY);
      const adPackages: AdPackage[] = data.adPackages || [];

      set({
        adPackages,
        loading: false,
        error: null,
        lastFetched: Date.now(),
      });
    } catch (error: any) {
      console.error("Failed to load ad packages:", error);
      set({
        loading: false,
        error: error.message || "Failed to load ad packages",
        adPackages: [],
      });
    }
  },

  loadActiveAdPackages: async () => {
    set({ loading: true, error: null });

    try {
      const data = await makeGraphQLCall(GET_ACTIVE_AD_PACKAGES_QUERY);
      const adPackages: AdPackage[] = data.activeAdPackages || [];

      set({
        adPackages,
        loading: false,
        error: null,
        lastFetched: Date.now(),
      });
    } catch (error: any) {
      console.error("Failed to load active ad packages:", error);
      set({
        loading: false,
        error: error.message || "Failed to load active ad packages",
        adPackages: [],
      });
    }
  },

  createAdPackage: async (input: CreateAdPackageInput) => {
    set({ loading: true, error: null });

    try {
      const data = await makeGraphQLCall(CREATE_AD_PACKAGE_MUTATION, { input });
      const newAdPackage = data.createAdPackage;

      // Add new ad package to local state
      const { adPackages } = get();
      set({
        adPackages: [...adPackages, newAdPackage],
        loading: false,
        error: null,
        lastFetched: Date.now(),
      });

      return newAdPackage;
    } catch (error: any) {
      console.error("Failed to create ad package:", error);
      set({
        loading: false,
        error: error.message || "Failed to create ad package",
      });
      return null;
    }
  },

  updateAdPackage: async (input: UpdateAdPackageInput) => {
    set({ loading: true, error: null });

    try {
      const data = await makeGraphQLCall(UPDATE_AD_PACKAGE_MUTATION, { input });
      const updatedAdPackage = data.updateAdPackage;

      // Update the ad package in local state
      const { adPackages } = get();
      const updatedAdPackages = adPackages.map((pkg) =>
        pkg.id === updatedAdPackage.id ? updatedAdPackage : pkg
      );

      set({
        adPackages: updatedAdPackages,
        loading: false,
        error: null,
        lastFetched: Date.now(),
      });

      return updatedAdPackage;
    } catch (error: any) {
      console.error("Failed to update ad package:", error);
      set({
        loading: false,
        error: error.message || "Failed to update ad package",
      });
      return null;
    }
  },

  deleteAdPackage: async (id: string) => {
    set({ loading: true, error: null });

    try {
      await makeGraphQLCall(DELETE_AD_PACKAGE_MUTATION, { input: { id } });

      // Remove the ad package from local state
      const { adPackages } = get();
      const filteredAdPackages = adPackages.filter((pkg) => pkg.id !== id);

      set({
        adPackages: filteredAdPackages,
        loading: false,
        error: null,
        lastFetched: Date.now(),
      });

      return true;
    } catch (error: any) {
      console.error("Failed to delete ad package:", error);
      set({
        loading: false,
        error: error.message || "Failed to delete ad package",
      });
      return false;
    }
  },

  getAdPackageById: async (id: string) => {
    set({ loading: true, error: null });

    try {
      const data = await makeGraphQLCall(GET_AD_PACKAGE_BY_ID_QUERY, { id });
      const adPackage = data.adPackage;

      if (!adPackage) {
        throw new Error("Ad package not found");
      }

      set({
        selectedAdPackage: adPackage,
        loading: false,
        error: null,
      });

      return adPackage;
    } catch (error: any) {
      console.error("Failed to get ad package by ID:", error);
      set({
        loading: false,
        error: error.message || "Failed to get ad package",
        selectedAdPackage: null,
      });
      return null;
    }
  },

  setSelectedAdPackage: (adPackage: AdPackage | null) => {
    set({ selectedAdPackage: adPackage });
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

  loadAdPackagesWithCache: async (forceRefresh = false) => {
    const state = get();

    // If cache is valid and not forcing refresh, return early
    if (!forceRefresh && state.isCacheValid() && state.adPackages.length > 0) {
      console.log("🚀 Ad Packages loaded from cache - no API call needed");
      return;
    }

    console.log("🔄 Ad Packages cache invalid - fetching fresh data");
    await state.loadAdPackages();
  },
}));
