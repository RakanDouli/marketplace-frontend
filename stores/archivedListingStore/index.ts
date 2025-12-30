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
    reason:
      | "sold_via_platform"
      | "sold_externally"
      | "no_longer_for_sale"
      | "other"
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
        // Parse specsDisplay (same as listings store)
        const listing = data.archivedListing;
        // Check if specsDisplay is already an object or needs parsing
        if (listing.specsDisplay) {
          listing.specsDisplay = typeof listing.specsDisplay === 'string'
            ? JSON.parse(listing.specsDisplay)
            : listing.specsDisplay;
        } else {
          listing.specsDisplay = {};
        }

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

      // Flatten location for each listing
      const listings = data.myArchivedListings.map((listing: any) => {
        if (listing.location) {
          listing.province = listing.location.province;
          listing.city = listing.location.city;
        }
        return listing;
      });

      set({
        myArchivedListings: listings,
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
      // Convert reason to uppercase for GraphQL enum (e.g., "sold_externally" → "SOLD_EXTERNALLY")
      const enumReason = reason.toUpperCase();
      await cachedGraphQLRequest(
        ARCHIVE_MY_LISTING_MUTATION,
        { listingId, reason: enumReason },
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
