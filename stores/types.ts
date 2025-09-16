// Store state types - import business entities from types/
import type { Listing, Category, Attribute } from '../types/listing';

// Re-export business entities for convenience
export type { Listing, Category, Attribute };

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  isVerified: boolean;
  role: 'BUYER' | 'SELLER' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

export interface Bid {
  id: string;
  amount: number;
  message?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  listingId: string;
  bidderId: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  listing?: Listing;
  bidder?: User;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface ListingsState {
  listings: Listing[];
  currentListing: Listing | null;
  isLoading: boolean;
  error: string | null;
  viewType: 'grid' | 'list' | 'detail';
  filters: {
    categoryId?: string;
    // Price filters
    minPrice?: number;
    maxPrice?: number;
    priceMinMinor?: number;
    priceMaxMinor?: number;
    priceCurrency?: string;
    // Location filters
    location?: string;
    city?: string;
    province?: string;
    sellerType?: string;
    // Dynamic attribute filters (replaces hardcoded car filters)
    specs?: Record<string, any>;
    // Other filters
    condition?: string;
    search?: string;
    // Sorting
    sort?: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface BidsState {
  bids: Bid[];
  myBids: Bid[];
  receivedBids: Bid[];
  isLoading: boolean;
  error: string | null;
}

export interface CategoriesState {
  categories: Category[];
  selectedCategory: Category | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean; // Track if categories have been fetched once
}