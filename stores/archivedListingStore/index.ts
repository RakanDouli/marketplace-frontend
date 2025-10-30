import { create } from "zustand";
import { cachedGraphQLRequest } from "@/utils/graphql-cache";
import {
  GET_ARCHIVED_LISTING_QUERY,
  GET_MY_ARCHIVED_LISTINGS_QUERY,
  ARCHIVE_MY_LISTING_MUTATION,
} from "./archivedListingStore.gql";
import { ArchivedListing, ArchivedListingSummary } from "./types";

interface ArchivedListingStore {
  archivedListing: ArchivedListing | null;
  myArchivedListings: ArchivedListingSummary[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchArchivedListing: (id: string) => Promise<void>;
  fetchMyArchivedListings: () => Promise<void>;
  archiveListing: (
    listingId: string,
    reason: "sold_via_platform" | "sold_externally" | "no_longer_for_sale" | "other"
  ) => Promise<void>;
  clearArchivedListing: () => void;
}

export const useArchivedListingStore = create<ArchivedListingStore>((set) => ({
  archivedListing: null,
  myArchivedListings: [],
  isLoading: false,
  error: null,

  fetchArchivedListing: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await cachedGraphQLRequest(
        GET_ARCHIVED_LISTING_QUERY,
        { id },
        { ttl: 5 * 60 * 1000 } // Cache for 5 minutes
      );

      if (data.archivedListing) {
        // Parse specsJson and flatten location
        const listing = data.archivedListing;
        listing.specsDisplay = listing.specsJson ? JSON.parse(listing.specsJson) : {};

        // Flatten location for easier access
        if (listing.location) {
          listing.province = listing.location.province;
          listing.city = listing.location.city;
          listing.area = listing.location.area;
          listing.mapLink = listing.location.link; // Map 'link' to 'mapLink'
        }
      }

      set({
        archivedListing: data.archivedListing,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || "Failed to fetch archived listing",
        isLoading: false,
      });
    }
  },

  fetchMyArchivedListings: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await cachedGraphQLRequest(
        GET_MY_ARCHIVED_LISTINGS_QUERY,
        {},
        { ttl: 2 * 60 * 1000 } // Cache for 2 minutes
      );

      set({
        myArchivedListings: data.myArchivedListings,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || "Failed to fetch archived listings",
        isLoading: false,
      });
    }
  },

  archiveListing: async (listingId: string, reason: string) => {
    set({ isLoading: true, error: null });
    try {
      await cachedGraphQLRequest(
        ARCHIVE_MY_LISTING_MUTATION,
        { listingId, reason },
        { ttl: 0 } // No cache for mutations
      );

      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || "Failed to archive listing",
        isLoading: false,
      });
      throw error;
    }
  },

  clearArchivedListing: () => {
    set({ archivedListing: null, error: null });
  },
}));
