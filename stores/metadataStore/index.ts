import { create } from "zustand";
import { cachedGraphQLRequest } from "../../utils/graphql-cache";
import {
  GET_USER_STATUSES_QUERY,
  GET_USER_ROLES_QUERY,
  GET_ACCOUNT_TYPES_QUERY,
  GET_SELLER_TYPES_QUERY,
  GET_LISTING_STATUSES_QUERY,
  GET_BILLING_CYCLES_QUERY,
  GET_SUBSCRIPTION_STATUSES_QUERY,
  GET_SUBSCRIPTION_ACCOUNT_TYPES_QUERY,
  GET_ATTRIBUTE_TYPES_QUERY,
  GET_ATTRIBUTE_VALIDATIONS_QUERY,
  GET_ATTRIBUTE_STORAGE_TYPES_QUERY,
} from "./metadataStore.gql";

// ===== TYPES =====

interface MetadataState {
  // User metadata
  userStatuses: string[];
  userRoles: string[];
  accountTypes: string[];

  // Listing metadata
  sellerTypes: string[];
  listingStatuses: string[];

  // Subscription metadata
  billingCycles: string[];
  subscriptionStatuses: string[];
  subscriptionAccountTypes: string[];

  // Attribute metadata
  attributeTypes: string[];
  attributeValidations: string[];
  attributeStorageTypes: string[];

  // Loading states
  loading: boolean;
  error: string | null;

  // Actions
  fetchAllMetadata: () => Promise<void>;
  fetchUserMetadata: () => Promise<void>;
  fetchListingMetadata: () => Promise<void>;
  fetchSubscriptionMetadata: () => Promise<void>;
  fetchAttributeMetadata: () => Promise<void>;
}

// ===== STORE =====

export const useMetadataStore = create<MetadataState>((set) => ({
  // Initial state
  userStatuses: [],
  userRoles: [],
  accountTypes: [],
  sellerTypes: [],
  listingStatuses: [],
  billingCycles: [],
  subscriptionStatuses: [],
  subscriptionAccountTypes: [],
  attributeTypes: [],
  attributeValidations: [],
  attributeStorageTypes: [],
  loading: false,
  error: null,

  // Fetch all metadata at once
  fetchAllMetadata: async () => {
    const store = useMetadataStore.getState();
    await Promise.all([
      store.fetchUserMetadata(),
      store.fetchListingMetadata(),
      store.fetchSubscriptionMetadata(),
      store.fetchAttributeMetadata(),
    ]);
  },

  // Fetch user-related metadata
  fetchUserMetadata: async () => {
    set({ loading: true, error: null });
    try {
      const [statusesData, rolesData, accountTypesData] = await Promise.all([
        cachedGraphQLRequest(GET_USER_STATUSES_QUERY),
        cachedGraphQLRequest(GET_USER_ROLES_QUERY),
        cachedGraphQLRequest(GET_ACCOUNT_TYPES_QUERY),
      ]);

      set({
        userStatuses: (statusesData as any).getUserStatuses || [],
        userRoles: (rolesData as any).getUserRoles || [],
        accountTypes: (accountTypesData as any).getAccountTypes || [],
        loading: false,
      });
    } catch (error: any) {
      console.error("❌ Failed to fetch user metadata:", error);
      set({ error: error.message, loading: false });
    }
  },

  // Fetch listing-related metadata
  fetchListingMetadata: async () => {
    set({ loading: true, error: null });
    try {
      const [sellerTypesData, listingStatusesData] = await Promise.all([
        cachedGraphQLRequest(GET_SELLER_TYPES_QUERY),
        cachedGraphQLRequest(GET_LISTING_STATUSES_QUERY),
      ]);

      set({
        sellerTypes: (sellerTypesData as any).getSellerTypes || [],
        listingStatuses: (listingStatusesData as any).getListingStatuses || [],
        loading: false,
      });
    } catch (error: any) {
      console.error("❌ Failed to fetch listing metadata:", error);
      set({ error: error.message, loading: false });
    }
  },

  // Fetch subscription-related metadata
  fetchSubscriptionMetadata: async () => {
    set({ loading: true, error: null });
    try {
      const [cyclesData, statusesData, accountTypesData] = await Promise.all([
        cachedGraphQLRequest(GET_BILLING_CYCLES_QUERY),
        cachedGraphQLRequest(GET_SUBSCRIPTION_STATUSES_QUERY),
        cachedGraphQLRequest(GET_SUBSCRIPTION_ACCOUNT_TYPES_QUERY),
      ]);

      set({
        billingCycles: (cyclesData as any).getBillingCycles || [],
        subscriptionStatuses: (statusesData as any).getSubscriptionStatuses || [],
        subscriptionAccountTypes: (accountTypesData as any).getSubscriptionAccountTypes || [],
        loading: false,
      });
    } catch (error: any) {
      console.error("❌ Failed to fetch subscription metadata:", error);
      set({ error: error.message, loading: false });
    }
  },

  // Fetch attribute-related metadata
  fetchAttributeMetadata: async () => {
    set({ loading: true, error: null });
    try {
      const [typesData, validationsData, storageTypesData] = await Promise.all([
        cachedGraphQLRequest(GET_ATTRIBUTE_TYPES_QUERY),
        cachedGraphQLRequest(GET_ATTRIBUTE_VALIDATIONS_QUERY),
        cachedGraphQLRequest(GET_ATTRIBUTE_STORAGE_TYPES_QUERY),
      ]);

      set({
        attributeTypes: (typesData as any).getAttributeTypes || [],
        attributeValidations: (validationsData as any).getAttributeValidations || [],
        attributeStorageTypes: (storageTypesData as any).getAttributeStorageTypes || [],
        loading: false,
      });
    } catch (error: any) {
      console.error("❌ Failed to fetch attribute metadata:", error);
      set({ error: error.message, loading: false });
    }
  },
}));
