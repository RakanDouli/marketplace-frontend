// Core business entities - aligned with backend GraphQL schema

export interface Price {
  value: string;
  currency: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Location {
  province?: string;
  city?: string;
  area?: string;
  link?: string;
  coordinates?: Coordinates;
}

export interface Listing {
  id: string;
  title: string;
  description?: string;
  priceMinor: number; // Backend stores price in USD dollars
  prices: Price[]; // Calculated price array for display
  location?: Location; // Location JSONB object (new structure)
  // Legacy fields for backward compatibility (deprecated)
  province?: string;
  city?: string;
  status:
    | "DRAFT"
    | "PENDING_APPROVAL"
    | "REJECTED" // AI auto-rejected (user can edit & resubmit)
    | "ACTIVE"
    | "SOLD"
    | "SOLD_VIA_PLATFORM"
    | "HIDDEN";
  allowBidding: boolean;
  biddingStartPrice?: number;
  specs?: Record<string, any>; // Dynamic attribute specs (English keys for backend processing)
  specsDisplay?: Record<string, { label: string; value: string }>; // Display specs (English keys with Arabic label/value)
  imageKeys?: string[];
  videoUrl?: string; // Video URL for premium accounts (Business/Dealer)
  images?: Array<{ url: string; alt?: string }>; // For ImageGallery component
  accountLabel?: string;
  accountBadge?: string;
  accountType?: "individual" | "dealer" | "business"; // Lowercase to match backend enum values
  // AI Moderation fields
  moderationScore?: number | null;
  moderationFlags?: string[] | null;
  rejectionReason?: string | null;
  rejectionMessage?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  // Analytics fields
  viewCount?: number;
  wishlistCount?: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    status: "pending" | "active" | "banned"; // Lowercase to match backend
    accountType: "individual" | "dealer" | "business"; // Lowercase to match backend
    companyName?: string;
    accountBadge: "none" | "verified" | "premium"; // Lowercase to match backend
    businessVerified: boolean;
    phone?: string;
    phoneIsWhatsApp?: boolean;
    showPhone?: boolean;
    contactPhone?: string;
    showContactPhone?: boolean;
    website?: string;
    companyRegistrationNumber?: string;
    createdAt: string;
    updatedAt: string;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface Category {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  description?: string;
  descriptionAr?: string;
  parentId?: string | null;
  level: number;
  imageUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Relations
  parent?: Category | null;
  children?: Category[];
  // Counts for admin
  _count?: {
    children: number;
    listings: number;
    attributes: number;
  };
}

// Brand and Model are now dynamic - handled through specs and aggregations
// No need for hardcoded types since they're category-specific

export interface Attribute {
  id: string;
  key: string;
  name: string; // Arabic name
  type:
    | "SELECTOR"
    | "MULTI_SELECTOR"
    | "RANGE"
    | "CURRENCY"
    | "TEXT"
    | "TEXTAREA"
    | "NUMBER"
    | "DATE_RANGE"
    | "BOOLEAN";
  validation: "REQUIRED" | "OPTIONAL";
  sortOrder: number; // Order within group (or standalone position)
  group: string | null; // Group name (null = standalone)
  groupOrder: number; // Order of the group itself in the filter list
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
  status?: string[];
  allowBidding?: boolean;
  specs?: Record<string, any>; // Dynamic attribute filters
}
