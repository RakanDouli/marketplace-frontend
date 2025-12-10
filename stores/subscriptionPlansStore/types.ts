import { AccountType } from '@/common/enums';

export interface SubscriptionPlan {
  id: string;
  name: string;
  title: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice?: number | null;
  yearlySavingsPercent?: number | null;
  maxListings: number;
  maxImagesPerListing: number;
  videoAllowed: boolean;
  priorityPlacement: boolean;
  analyticsAccess: boolean;
  customBranding: boolean;
  featuredListings: boolean;
  accountType: AccountType;
  sortOrder: number;
  status: string;
  isPublic: boolean;
  isDefault: boolean;
  // Promotional discount fields
  originalPrice?: number | null;
  discountPercentage?: number | null;
  discountLabel?: string;
  discountValidUntil?: string | null;
}
