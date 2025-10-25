import { create } from "zustand";
import { useAdminAuthStore } from "../adminAuthStore";
import {
  GET_ALL_AD_CLIENTS_QUERY,
  GET_AD_CLIENT_BY_ID_QUERY,
  GET_ACTIVE_AD_CLIENTS_QUERY,
  CREATE_AD_CLIENT_MUTATION,
  UPDATE_AD_CLIENT_MUTATION,
  DELETE_AD_CLIENT_MUTATION,
} from "./adminAdClientsStore.gql";

// Interface for User (nested relation)
export interface UserInfo {
  id: string;
  email: string;
  name?: string;
}

// Main AdClient interface
export interface AdClient {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  website?: string;
  description?: string;
  industry?: string;
  status: string; // AdClientStatus: ACTIVE | INACTIVE | BLACKLISTED
  notes?: string;
  createdByUserId: string;
  createdByUser: UserInfo;
  createdAt: string;
  updatedAt: string;
}

// Input types for mutations
export interface CreateAdClientInput {
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  website?: string;
  description?: string;
  industry?: string;
  status?: string;
  notes?: string;
}

export interface UpdateAdClientInput {
  id: string;
  companyName?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  description?: string;
  industry?: string;
  status?: string;
  notes?: string;
}

interface AdminAdClientsStore {
  // Data
  adClients: AdClient[];
  loading: boolean;
  error: string | null;
  selectedAdClient: AdClient | null;

  // Caching
  lastFetched: number | null;
  cacheTimeout: number;

  // CRUD operations
  loadAdClients: () => Promise<void>;
  createAdClient: (input: CreateAdClientInput) => Promise<AdClient | null>;
  updateAdClient: (input: UpdateAdClientInput) => Promise<AdClient | null>;
  deleteAdClient: (id: string) => Promise<boolean>;
  getAdClientById: (id: string) => Promise<AdClient | null>;
  loadActiveAdClients: () => Promise<void>;

  // UI state
  setSelectedAdClient: (client: AdClient | null) => void;
  clearError: () => void;

  // Cache management
  isCacheValid: () => boolean;
  loadAdClientsWithCache: (forceRefresh?: boolean) => Promise<void>;
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

export const useAdminAdClientsStore = create<AdminAdClientsStore>((set, get) => ({
  adClients: [],
  loading: false,
  error: null,
  selectedAdClient: null,

  // Cache state
  lastFetched: null,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes

  loadAdClients: async () => {
    set({ loading: true, error: null });

    try {
      const data = await makeGraphQLCall(GET_ALL_AD_CLIENTS_QUERY);
      const adClients: AdClient[] = data.adClients || [];

      set({
        adClients,
        loading: false,
        error: null,
        lastFetched: Date.now(),
      });
    } catch (error: any) {
      console.error("Failed to load ad clients:", error);
      set({
        loading: false,
        error: error.message || "Failed to load ad clients",
        adClients: [],
      });
    }
  },

  loadActiveAdClients: async () => {
    set({ loading: true, error: null });

    try {
      const data = await makeGraphQLCall(GET_ACTIVE_AD_CLIENTS_QUERY);
      const adClients: AdClient[] = data.activeAdClients || [];

      set({
        adClients,
        loading: false,
        error: null,
        lastFetched: Date.now(),
      });
    } catch (error: any) {
      console.error("Failed to load active ad clients:", error);
      set({
        loading: false,
        error: error.message || "Failed to load active ad clients",
        adClients: [],
      });
    }
  },

  createAdClient: async (input: CreateAdClientInput) => {
    set({ loading: true, error: null });

    try {
      const data = await makeGraphQLCall(CREATE_AD_CLIENT_MUTATION, { input });
      const newClient = data.createAdClient;

      // Add new client to local state
      const { adClients } = get();
      set({
        adClients: [...adClients, newClient],
        loading: false,
        error: null,
        lastFetched: Date.now(),
      });

      return newClient;
    } catch (error: any) {
      console.error("Failed to create ad client:", error);
      set({
        loading: false,
        error: error.message || "Failed to create ad client",
      });
      return null;
    }
  },

  updateAdClient: async (input: UpdateAdClientInput) => {
    set({ loading: true, error: null });

    try {
      const data = await makeGraphQLCall(UPDATE_AD_CLIENT_MUTATION, { input });
      const updatedClient = data.updateAdClient;

      // Update the client in local state
      const { adClients } = get();
      const updatedClients = adClients.map((client) =>
        client.id === updatedClient.id ? updatedClient : client
      );

      set({
        adClients: updatedClients,
        loading: false,
        error: null,
        lastFetched: Date.now(),
      });

      return updatedClient;
    } catch (error: any) {
      console.error("Failed to update ad client:", error);
      set({
        loading: false,
        error: error.message || "Failed to update ad client",
      });
      return null;
    }
  },

  deleteAdClient: async (id: string) => {
    set({ loading: true, error: null });

    try {
      await makeGraphQLCall(DELETE_AD_CLIENT_MUTATION, { input: { id } });

      // Remove the client from local state
      const { adClients } = get();
      const filteredClients = adClients.filter((client) => client.id !== id);

      set({
        adClients: filteredClients,
        loading: false,
        error: null,
        lastFetched: Date.now(),
      });

      return true;
    } catch (error: any) {
      console.error("Failed to delete ad client:", error);
      set({
        loading: false,
        error: error.message || "Failed to delete ad client",
      });
      return false;
    }
  },

  getAdClientById: async (id: string) => {
    set({ loading: true, error: null });

    try {
      const data = await makeGraphQLCall(GET_AD_CLIENT_BY_ID_QUERY, { id });
      const client = data.adClient;

      if (!client) {
        throw new Error("Ad client not found");
      }

      set({
        selectedAdClient: client,
        loading: false,
        error: null,
      });

      return client;
    } catch (error: any) {
      console.error("Failed to get ad client by ID:", error);
      set({
        loading: false,
        error: error.message || "Failed to get ad client",
        selectedAdClient: null,
      });
      return null;
    }
  },

  setSelectedAdClient: (client: AdClient | null) => {
    set({ selectedAdClient: client });
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

  loadAdClientsWithCache: async (forceRefresh = false) => {
    const state = get();

    // If cache is valid and not forcing refresh, return early
    if (!forceRefresh && state.isCacheValid() && state.adClients.length > 0) {
      console.log("🚀 Ad Clients loaded from cache - no API call needed");
      return;
    }

    console.log("🔄 Ad Clients cache invalid - fetching fresh data");
    await state.loadAdClients();
  },
}));
