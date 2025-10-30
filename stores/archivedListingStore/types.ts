export interface ArchivedListing {
  id: string;
  originalListingId: string;
  archivalReason: "sold_via_platform" | "sold_externally" | "no_longer_for_sale" | "other";
  archivedAt: string;
  viewCount: number;
  wishlistCount: number;
  chatCount: number;
  bidCount: number;
  daysToSell: number | null;
  title: string;
  description: string;
  priceMinor: number;
  specsJson: string;
  specsDisplay?: Record<string, any>; // Computed from specsJson
  videoUrl: string | null;
  imageKeys: string[];
  location: {
    province: string;
    city: string | null;
    area: string | null;
    link: string | null;
  } | null;
  // Flatten location for easier access
  province?: string;
  city?: string | null;
  area?: string | null;
  mapLink?: string | null; // Keep for compatibility with component
  allowBidding: boolean;
  biddingStartPrice: number | null;
  accountType: string;
  accountLabel: string | null;
  accountBadge: string;
  status: string;
  moderationStatus: string | null;
  moderationScore: number | null;
  moderationFlags: string[] | null;
  rejectionReason: string | null;
  rejectionMessage: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  prices: Array<{
    currency: string;
    value: number;
  }>;
  category: {
    id: string;
    slug: string;
    name: string;
    nameAr: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
    accountType: string;
    accountBadge: string;
    companyName: string | null;
    businessVerified: boolean;
    avatar: string | null;
  };
}

export interface ArchivedListingSummary {
  id: string;
  originalListingId: string;
  archivalReason: string;
  archivedAt: string;
  title: string;
  priceMinor: number;
  imageKeys: string[];
  province: string;
  city: string | null;
  viewCount: number;
  prices: Array<{
    currency: string;
    value: number;
  }>;
  category: {
    id: string;
    nameAr: string;
  };
}
