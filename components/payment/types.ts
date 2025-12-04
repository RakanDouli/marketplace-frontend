export type PaymentType = 'subscription' | 'ad_campaign';

export type PaymentMethod = 'stripe' | 'paypal' | 'mock';

export interface PaymentIntent {
  id: string;
  type: PaymentType;
  amount: number;
  currency: string;
  description: string;
  metadata: Record<string, any>;
}

export interface SubscriptionPaymentData {
  planId: string;
  planName: string;
  title: string;
  price: number;
  currency: string;
  billingCycle: string;
  accountType: string;
  features: Array<{
    label: string;
    value?: string;
    included: boolean;
  }>;
}

export interface CampaignPackageData {
  packageId: string;
  isAsap: boolean;
  startDate: string | null;
  endDate: string | null;
  desktopMediaUrl?: string;
  mobileMediaUrl?: string;
  clickUrl?: string;
  packageData: {
    packageName: string;
    adType: string;
    placement: string;
    format: string;
    basePrice: number;
    durationDays: number;
    impressionLimit?: number;
    dimensions?: {
      desktop: { width: number; height: number };
      mobile: { width: number; height: number };
    };
  };
}

export interface PackageBreakdown {
  packages: CampaignPackageData[];
  discountPercentage?: number;
  discountReason?: string;
  totalBeforeDiscount?: number;
  totalAfterDiscount?: number;
}

export interface AdCampaignPaymentData {
  id: string;
  campaignName: string;
  description?: string;
  totalPrice: number;
  currency: string;
  startDate: string;
  endDate: string;
  isCustomPackage: boolean;
  packageBreakdown?: PackageBreakdown;
  client: {
    id: string;
    companyName: string;
    contactName: string;
    contactEmail: string;
  };
  package?: {
    id: string;
    packageName: string;
    adType: string;
  };
}

export type PaymentData = SubscriptionPaymentData | AdCampaignPaymentData;
