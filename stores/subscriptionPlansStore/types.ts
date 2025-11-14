import { AccountType } from '@/common/enums';

export interface SubscriptionPlan {
  id: string;
  name: string;
  title: string;
  description: string;
  price: number;
  billingCycle: 'monthly' | 'yearly' | 'free';
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
}
