import { create } from "zustand";
import { useAdminAuthStore } from "../adminAuthStore";
import {
  GET_ALL_SUBSCRIPTIONS_QUERY,
  GET_SUBSCRIPTION_BY_ID_QUERY,
  CREATE_SUBSCRIPTION_MUTATION,
  UPDATE_SUBSCRIPTION_MUTATION,
  DELETE_SUBSCRIPTION_MUTATION,
} from "./adminSubscriptionsStore.gql";

interface Subscription {
  id: string;
  name: string;
  title: string;
  description?: string;
  price: number;
  billingCycle: string; // "monthly" | "yearly" | "free"
  maxListings: number;
  maxImagesPerListing: number;
  videoAllowed: boolean;
  priorityPlacement: boolean;
  analyticsAccess: boolean;
  customBranding: boolean;
  featuredListings: boolean;
  status: string; // "active" | "inactive"
  sortOrder: number;
  isPublic: boolean;
  isDefault: boolean;
  accountType: string; // "individual" | "dealer" | "business" | "all"
  createdAt?: string;
  updatedAt?: string;
}

interface CreateSubscriptionInput {
  name: string;
  title: string;
  description?: string;
  price: number;
  billingCycle: string;
  maxListings: number;
  maxImagesPerListing: number;
  videoAllowed: boolean;
  priorityPlacement: boolean;
  analyticsAccess: boolean;
  customBranding: boolean;
  featuredListings: boolean;
  status?: string;
  sortOrder?: number;
  isPublic?: boolean;
  isDefault?: boolean;
  accountType?: string;
}

interface UpdateSubscriptionInput {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  price?: number;
  billingCycle?: string;
  maxListings?: number;
  maxImagesPerListing?: number;
  videoAllowed?: boolean;
  priorityPlacement?: boolean;
  analyticsAccess?: boolean;
  customBranding?: boolean;
  featuredListings?: boolean;
  status?: string;
  sortOrder?: number;
  isPublic?: boolean;
  isDefault?: boolean;
  accountType?: string;
}

interface AdminSubscriptionsStore {
  // Data
  subscriptions: Subscription[];
  loading: boolean;
  error: string | null;
  selectedSubscription: Subscription | null;

  // Caching
  lastFetched: number | null;
  cacheTimeout: number;

  // CRUD operations
  loadSubscriptions: () => Promise<void>;
  createSubscription: (input: CreateSubscriptionInput) => Promise<Subscription | null>;
  updateSubscription: (input: UpdateSubscriptionInput) => Promise<Subscription | null>;
  deleteSubscription: (id: string) => Promise<boolean>;
  getSubscriptionById: (id: string) => Promise<Subscription | null>;

  // UI state
  setSelectedSubscription: (subscription: Subscription | null) => void;
  clearError: () => void;

  // Cache management
  isCacheValid: () => boolean;
  loadSubscriptionsWithCache: (forceRefresh?: boolean) => Promise<void>;
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

export const useAdminSubscriptionsStore = create<AdminSubscriptionsStore>((set, get) => ({
  subscriptions: [],
  loading: false,
  error: null,
  selectedSubscription: null,

  // Cache state
  lastFetched: null,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes

  loadSubscriptions: async () => {
    set({ loading: true, error: null });

    try {
      const data = await makeGraphQLCall(GET_ALL_SUBSCRIPTIONS_QUERY);
      const subscriptions: Subscription[] = data.allUserSubscriptions || [];

      set({
        subscriptions,
        loading: false,
        error: null,
        lastFetched: Date.now(),
      });
    } catch (error: any) {
      console.error("Failed to load subscriptions:", error);
      set({
        loading: false,
        error: error.message || "Failed to load subscriptions",
        subscriptions: [],
      });
    }
  },

  createSubscription: async (input: CreateSubscriptionInput) => {
    set({ loading: true, error: null });

    try {
      const data = await makeGraphQLCall(CREATE_SUBSCRIPTION_MUTATION, { input });
      const newSubscription = data.createUserSubscription;

      // Add new subscription to local state
      const { subscriptions } = get();
      set({
        subscriptions: [...subscriptions, newSubscription],
        loading: false,
        error: null,
        lastFetched: Date.now(),
      });

      return newSubscription;
    } catch (error: any) {
      console.error("Failed to create subscription:", error);
      set({
        loading: false,
        error: error.message || "Failed to create subscription",
      });
      return null;
    }
  },

  updateSubscription: async (input: UpdateSubscriptionInput) => {
    set({ loading: true, error: null });

    try {
      const data = await makeGraphQLCall(UPDATE_SUBSCRIPTION_MUTATION, { input });
      const updatedSubscription = data.updateUserSubscription;

      // Update the subscription in local state
      const { subscriptions } = get();
      const updatedSubscriptions = subscriptions.map((sub) =>
        sub.id === updatedSubscription.id ? updatedSubscription : sub
      );

      set({
        subscriptions: updatedSubscriptions,
        loading: false,
        error: null,
        lastFetched: Date.now(),
      });

      return updatedSubscription;
    } catch (error: any) {
      console.error("Failed to update subscription:", error);
      set({
        loading: false,
        error: error.message || "Failed to update subscription",
      });
      return null;
    }
  },

  deleteSubscription: async (id: string) => {
    set({ loading: true, error: null });

    try {
      await makeGraphQLCall(DELETE_SUBSCRIPTION_MUTATION, { id });

      // Remove the subscription from local state
      const { subscriptions } = get();
      const filteredSubscriptions = subscriptions.filter((sub) => sub.id !== id);

      set({
        subscriptions: filteredSubscriptions,
        loading: false,
        error: null,
        lastFetched: Date.now(),
      });

      return true;
    } catch (error: any) {
      console.error("Failed to delete subscription:", error);
      set({
        loading: false,
        error: error.message || "Failed to delete subscription",
      });
      return false;
    }
  },

  getSubscriptionById: async (id: string) => {
    set({ loading: true, error: null });

    try {
      const data = await makeGraphQLCall(GET_SUBSCRIPTION_BY_ID_QUERY, { id });
      const subscription = data.userSubscription;

      if (!subscription) {
        throw new Error("Subscription not found");
      }

      set({
        selectedSubscription: subscription,
        loading: false,
        error: null,
      });

      return subscription;
    } catch (error: any) {
      console.error("Failed to get subscription by ID:", error);
      set({
        loading: false,
        error: error.message || "Failed to get subscription",
        selectedSubscription: null,
      });
      return null;
    }
  },

  setSelectedSubscription: (subscription: Subscription | null) => {
    set({ selectedSubscription: subscription });
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

  loadSubscriptionsWithCache: async (forceRefresh = false) => {
    const state = get();

    // If cache is valid and not forcing refresh, return early
    if (!forceRefresh && state.isCacheValid() && state.subscriptions.length > 0) {
      console.log("🚀 Subscriptions loaded from cache - no API call needed");
      return;
    }

    console.log("🔄 Subscriptions cache invalid - fetching fresh data");
    await state.loadSubscriptions();
  },
}));
