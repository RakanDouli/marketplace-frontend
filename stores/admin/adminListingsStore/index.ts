import { create } from "zustand";
import { useAdminAuthStore } from "../adminAuthStore";
import {
  LISTINGS_SEARCH_QUERY,
  LISTINGS_COUNT_QUERY,
  ADMIN_LISTINGS_PAGINATED_QUERY,
  UPDATE_LISTING_MUTATION,
  MODERATE_LISTING_STATUS_MUTATION,
  DELETE_LISTING_MUTATION,
  GET_LISTING_STATUSES_QUERY,
  GET_LISTING_BY_ID_QUERY,
  UPDATE_USER_MUTATION,
} from "./adminListingsStore.gql";
import { Listing } from "@/types/listing";

interface UpdateListingInput {
  id: string;
  title?: string;
  description?: string;
  status?: string;
  // Add other fields as needed
}

interface UpdateUserInput {
  id: string;
  name?: string;
  role?: string;
  status?: string;
  accountType?: string;
  // Add other fields as needed
}

interface ListingFilterInput {
  search?: string;
  status?: string;
  categoryId?: string;
  sellerType?: string;
  city?: string;
  province?: string;
  priceMinMinor?: number;
  priceMaxMinor?: number;
}

interface PaginationInput {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

interface PaginatedListings {
  listings: Listing[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface AdminListingsStore {
  // Data
  listings: Listing[];
  loading: boolean;
  error: string | null;
  selectedListing: Listing | null;

  // Pagination
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };

  // Filters
  filters: ListingFilterInput;
  sortBy: string;
  sortOrder: "ASC" | "DESC";

  // CRUD operations
  loadListings: (page?: number) => Promise<void>;
  loadListingsPaginated: (
    pagination?: PaginationInput,
    filter?: ListingFilterInput
  ) => Promise<void>;
  updateListingStatus: (id: string, status: string) => Promise<Listing | null>;
  deleteListing: (id: string) => Promise<boolean>;
  getListingById: (id: string) => Promise<Listing | null>;

  // User management
  updateUser: (input: UpdateUserInput) => Promise<any>;

  // UI state
  setSelectedListing: (listing: Listing | null) => void;
  setFilters: (filters: ListingFilterInput) => void;
  setSorting: (sortBy: string, sortOrder: "ASC" | "DESC") => void;
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

export const useAdminListingsStore = create<AdminListingsStore>((set, get) => ({
  listings: [],
  loading: false,
  error: null,
  selectedListing: null,

  // Pagination state
  pagination: {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },

  // Filter state
  filters: {},
  sortBy: "createdAt",
  sortOrder: "DESC",

  loadListings: async (page = 1) => {
    const state = get();
    await state.loadListingsPaginated(
      {
        page,
        limit: state.pagination.limit,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
      },
      state.filters
    );
  },

  loadListingsPaginated: async (
    paginationInput: PaginationInput = {},
    filterInput: ListingFilterInput = {}
  ) => {
    set({ loading: true, error: null });

    try {
      const {
        page = 1,
        limit = 20,
        sortBy = "createdAt",
        sortOrder = "DESC",
      } = paginationInput;

      const offset = (page - 1) * limit;

      // Build GraphQL filter object
      const filter: any = {};

      // Add filter conditions
      if (filterInput.search) {
        filter.search = filterInput.search;
      }
      if (filterInput.status) {
        filter.status = filterInput.status;
      }
      if (filterInput.categoryId) {
        filter.categoryId = filterInput.categoryId;
      }
      if (filterInput.sellerType) {
        filter.sellerType = filterInput.sellerType;
      }
      if (filterInput.city) {
        filter.city = filterInput.city;
      }
      if (filterInput.province) {
        filter.province = filterInput.province;
      }
      if (filterInput.priceMinMinor) {
        filter.priceMinMinor = filterInput.priceMinMinor;
      }
      if (filterInput.priceMaxMinor) {
        filter.priceMaxMinor = filterInput.priceMaxMinor;
      }

      // Add sorting - backend expects "sort" field with format like "createdAt:DESC"
      filter.sort = `${sortBy}:${sortOrder}`;

      // Get listings data and count in single call
      const data = await makeGraphQLCall(ADMIN_LISTINGS_PAGINATED_QUERY, {
        filter,
        limit,
        offset,
      });

      const listings: Listing[] = (data.listingsSearch || []).map(
        (item: any) => {
          return {
            id: item.id,
            title: item.title,
            description: "", // Not requested in simplified query
            priceMinor: item.priceMinor,
            status: item.status,
            allowBidding: false,
            specs: {}, // Not requested in simplified query
            specsDisplay: {}, // Not requested in simplified query
            imageKeys: [], // Not requested in simplified query
            sellerType: "PRIVATE" as "PRIVATE" | "DEALER" | "BUSINESS", // Default value
            city: "", // Not requested in simplified query
            country: "", // Add missing country field
            prices: [
              { currency: "USD", value: (item.priceMinor / 100).toString() },
            ],
            createdAt: new Date().toISOString(), // Use current date as fallback
            updatedAt: new Date().toISOString(), // Use current date as fallback
          };
        }
      );

      const total = data.listingsAggregations?.totalResults || 0;
      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      set({
        listings,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNext,
          hasPrev,
        },
        filters: filterInput,
        sortBy,
        sortOrder,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      console.error("Failed to load listings:", error);
      set({
        loading: false,
        error: error.message || "Failed to load listings",
        listings: [],
      });
    }
  },

  updateListingStatus: async (id: string, status: string) => {
    set({ loading: true, error: null });

    try {
      const data = await makeGraphQLCall(MODERATE_LISTING_STATUS_MUTATION, {
        id,
        status: status.toUpperCase(), // Backend expects uppercase status
      });

      const updatedListing = data.moderateListingStatus;

      // Update the listing in the local state
      const { listings } = get();
      const updatedListings = listings.map((listing) =>
        listing.id === id
          ? {
              ...listing,
              status: updatedListing.status,
              updatedAt: updatedListing.updatedAt,
            }
          : listing
      );

      set({
        listings: updatedListings,
        loading: false,
        error: null,
      });

      return updatedListings.find((l) => l.id === id) || null;
    } catch (error: any) {
      console.error("Failed to update listing status:", error);
      set({
        loading: false,
        error: error.message || "Failed to update listing status",
      });
      return null;
    }
  },

  deleteListing: async (id: string) => {
    set({ loading: true, error: null });

    try {
      await makeGraphQLCall(DELETE_LISTING_MUTATION, { id });

      // Remove the listing from local state
      const { listings } = get();
      const filteredListings = listings.filter((listing) => listing.id !== id);

      set({
        listings: filteredListings,
        loading: false,
        error: null,
        pagination: {
          ...get().pagination,
          total: get().pagination.total - 1,
        },
      });

      return true;
    } catch (error: any) {
      console.error("Failed to delete listing:", error);
      set({
        loading: false,
        error: error.message || "Failed to delete listing",
      });
      return false;
    }
  },

  getListingById: async (id: string) => {
    set({ loading: true, error: null });

    try {
      const data = await makeGraphQLCall(GET_LISTING_BY_ID_QUERY, { id });
      const listingData = data.listingById;

      if (!listingData) {
        throw new Error("Listing not found");
      }

      // Parse specs and specsDisplay
      let specs = {};
      let specsDisplay = {};

      try {
        specs = listingData.specs ? JSON.parse(listingData.specs) : {};
        specsDisplay = listingData.specsDisplay
          ? JSON.parse(listingData.specsDisplay)
          : {};
      } catch (error) {
        console.warn("Failed to parse listing specs:", error);
      }

      const listing: Listing = {
        id: listingData.id,
        title: listingData.title,
        description: listingData.description || "",
        priceMinor: listingData.priceMinor,
        status: listingData.status,
        allowBidding: listingData.allowBidding || false,
        specs,
        specsDisplay,
        imageKeys: listingData.imageKeys || [],
        images: (listingData.imageKeys || []).map((imageUrl: string) => ({
          url: imageUrl, // imageKeys already contain full URLs
          alt: listingData.title,
        })),
        sellerType: listingData.sellerType as "PRIVATE" | "DEALER" | "BUSINESS",
        sellerLabel: listingData.sellerLabel || "",
        sellerBadge: listingData.sellerBadge || "",
        province: listingData.province || "",
        city: listingData.city || "",
        area: listingData.area || "",
        locationLink: listingData.locationLink || "",
        lat: listingData.lat || null,
        lng: listingData.lng || null,
        biddingStartPrice: listingData.biddingStartPrice || null,
        country: "Syria", // Default for Syrian marketplace
        prices: listingData.prices || [
          { currency: "USD", value: (listingData.priceMinor / 100).toString() },
        ],
        createdAt: listingData.createdAt,
        updatedAt: listingData.updatedAt,
        user: listingData.user
          ? {
              id: listingData.user.id,
              name: listingData.user.name,
              email: listingData.user.email,
              role: listingData.user.role,
              status: listingData.user.status,
              accountType: listingData.user.accountType,
              companyName: listingData.user.companyName,
              sellerBadge: listingData.user.sellerBadge,
              businessVerified: listingData.user.businessVerified,
              phone: listingData.user.phone,
              contactPhone: listingData.user.contactPhone,
              website: listingData.user.website,
              createdAt: listingData.user.createdAt,
              updatedAt: listingData.user.updatedAt,
            }
          : undefined,
      };

      set({
        selectedListing: listing,
        loading: false,
        error: null,
      });

      return listing;
    } catch (error: any) {
      console.error("Failed to get listing by ID:", error);
      set({
        loading: false,
        error: error.message || "Failed to get listing",
        selectedListing: null,
      });
      return null;
    }
  },

  setSelectedListing: (listing: Listing | null) => {
    set({ selectedListing: listing });
  },

  setFilters: (filters: ListingFilterInput) => {
    set({ filters, pagination: { ...get().pagination, page: 1 } });
  },

  setSorting: (sortBy: string, sortOrder: "ASC" | "DESC") => {
    set({ sortBy, sortOrder });
  },

  updateUser: async (input: UpdateUserInput) => {
    set({ loading: true, error: null });

    try {
      const { id, ...updateData } = input;
      const data = await makeGraphQLCall(UPDATE_USER_MUTATION, {
        id,
        input: updateData,
      });
      const updatedUser = data.updateUser;

      // Update the user data in the selectedListing if it's the same user
      const { selectedListing } = get();
      if (selectedListing && selectedListing.user?.id === updatedUser.id) {
        set({
          selectedListing: {
            ...selectedListing,
            user: updatedUser,
          },
          loading: false,
          error: null,
        });
      } else {
        set({
          loading: false,
          error: null,
        });
      }

      return updatedUser;
    } catch (error: any) {
      console.error("Failed to update user:", error);
      set({
        loading: false,
        error: error.message || "Failed to update user",
      });
      return null;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
