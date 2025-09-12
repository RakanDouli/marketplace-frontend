// Store types based on backend entities
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

export interface Category {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  isActive: boolean;
}

export interface Listing {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  price: number;
  currency: string;
  condition: 'NEW' | 'USED' | 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  status: 'ACTIVE' | 'SOLD' | 'EXPIRED' | 'SUSPENDED';
  images: string[];
  location: string;
  province?: string;
  area?: string;
  locationLink?: string;
  categoryId: string;
  sellerId: string;
  viewCount: number;
  isFeatured: boolean;
  isPromoted: boolean;
  createdAt: string;
  updatedAt: string;
  // Relations
  category?: Category;
  seller?: User;
  attributes?: ListingAttribute[];
}

export interface ListingAttribute {
  id: string;
  attributeId: string;
  listingId: string;
  value: any; // JSON value that can be selector, range, currency, etc.
  attribute?: {
    id: string;
    key: string;
    name: string; // Arabic-only (simplified from bilingual)
    type: 'selector' | 'range' | 'currency' | 'text';
    options?: AttributeOption[];
  };
}

export interface AttributeOption {
  id: string;
  key: string;
  value: string; // Arabic-only (simplified from bilingual)
  sortOrder: number;
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
  filters: {
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    condition?: string;
    location?: string;
    search?: string;
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
}