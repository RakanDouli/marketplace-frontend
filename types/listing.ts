export interface Price {
  value: string;
  currency: string;
}

export interface Listing {
  id: string;
  title: string;
  description?: string;
  prices: Price[];
  city: string;
  country: string;
  status: 'ACTIVE' | 'SOLD' | 'EXPIRED' | 'DRAFT';
  allowBidding: boolean;
  biddingStartPrice?: number;
  brandId?: string;
  modelId?: string;
  specs?: any; // JSON object
  imageKeys?: string[];
  sellerLabel?: string;
  sellerBadge?: string;
  sellerType?: 'PRIVATE' | 'DEALER';
  lat?: number;
  lng?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
}

export interface Model {
  id: string;
  name: string;
  slug: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface ListingFilterInput {
  search?: string;
  categoryId?: string;
  brandId?: string;
  modelId?: string;
  minPrice?: number;
  maxPrice?: number;
  currency?: string;
  city?: string;
  country?: string;
  status?: string[];
  allowBidding?: boolean;
}