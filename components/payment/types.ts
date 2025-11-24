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

export interface AdCampaignPaymentData {
  id: string;
  campaignName: string;
  description?: string;
  totalPrice: number;
  currency: string;
  startDate: string;
  endDate: string;
  isCustomPackage: boolean;
  packageBreakdown?: any;
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
