// User authentication types

// AccountType definition (matches backend enum)
export type AccountType = 'INDIVIDUAL' | 'DEALER' | 'BUSINESS';

export interface UserSubscriptionPlan {
  id: string;
  name: string;
  title: string;
  description: string | null;
  price: number;
  billingCycle: 'monthly' | 'yearly' | 'free';
  maxListings: number;
  maxImagesPerListing: number;
  videoAllowed: boolean;
  priorityPlacement: boolean;
  analyticsAccess: boolean;
  customBranding: boolean;
  featuredListings: boolean;
}

export interface UserPackage {
  id: string;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  startDate: string;
  endDate: string | null;
  currentListings: number;
  userSubscription: UserSubscriptionPlan;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  role: 'USER'; // Only USER role allowed in public area
  accountType: AccountType;
  status: string; // User status: ACTIVE, INACTIVE, BANNED, PENDING
  isEmailConfirmed: boolean;
  companyName: string | null;
  accountBadge: string | null;
  avatar: string | null;
  website: string | null;
  kvkNumber: string | null;
  contactPhone: string | null;
  businessVerified: boolean;
  createdAt: string;
  updatedAt: string;
  token?: string;
  tokenExpiresAt?: number;
}

export interface UserAuthState {
  user: PublicUser | null;
  userPackage: UserPackage | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  showAuthModal: boolean;
  authModalView: 'login' | 'signup' | 'magic-link';
  showExpirationWarning: boolean;
}
