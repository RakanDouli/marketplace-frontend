// Core business entities - aligned with backend GraphQL schema

export interface Price {
  value: string;
  currency: string;
}

export interface Listing {
  id: string;
  title: string;
  description?: string;
  priceMinor: number; // Backend stores price in cents (USD)
  prices: Price[]; // Calculated price array for display
  city: string;
  country: string;
  status: 'ACTIVE' | 'SOLD' | 'EXPIRED' | 'DRAFT';
  allowBidding: boolean;
  biddingStartPrice?: number;
  specs?: Record<string, any>; // Dynamic attribute specs
  imageKeys?: string[];
  sellerLabel?: string;
  sellerBadge?: string;
  sellerType?: 'PRIVATE' | 'DEALER' | 'BUSINESS'; // Updated to match backend
  lat?: number;
  lng?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

// Brand and Model are now dynamic - handled through specs and aggregations
// No need for hardcoded types since they're category-specific

export interface Attribute {
  id: string;
  key: string;
  name: string; // Arabic name
  type: 'SELECTOR' | 'MULTI_SELECTOR' | 'RANGE' | 'CURRENCY' | 'TEXT' | 'TEXTAREA' | 'NUMBER' | 'DATE_RANGE' | 'BOOLEAN';
  validation: 'REQUIRED' | 'OPTIONAL';
  sortOrder: number;
  group: string | null;
  isActive: boolean;
  maxSelections?: number | null; // Maximum selections for multi-selector types
  // Display Control Flags for View-Specific Filtering
  showInGrid: boolean;
  showInList: boolean;
  showInDetail: boolean;
  showInFilter: boolean;
  options: AttributeOption[];
}

export interface AttributeOption {
  id: string;
  key: string;
  value: string; // Arabic value
  sortOrder: number;
  isActive: boolean;
  // Display Control Flags for View-Specific Filtering
  showInGrid: boolean;
  showInList: boolean;
  showInDetail: boolean;
  showInFilter: boolean;
  count?: number; // For aggregation results
}

export interface ListingFilterInput {
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  currency?: string;
  city?: string;
  country?: string;
  status?: string[];
  allowBidding?: boolean;
  specs?: Record<string, any>; // Dynamic attribute filters
}