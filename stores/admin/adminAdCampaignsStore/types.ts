export interface AdCampaign {
  id: string;
  campaignName: string;
  description?: string;
  clientId: string;
  packageId: string;
  startDate: string;
  endDate: string;
  status: string;
  totalPrice: number;
  packageBreakdown?: any; // JSONB field containing packages array with media URLs
  createdAt: string;
  updatedAt: string;

  // Relations
  client?: {
    id: string;
    companyName: string;
  };
  package?: {
    id: string;
    packageName: string;
    adType: string;
  };
}

export interface CreateAdCampaignInput {
  campaignName: string;
  description?: string;
  clientId: string;
  packageId: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  packageBreakdown?: any; // JSONB field containing packages array
  campaignStartPreference: string;
}

export interface UpdateAdCampaignInput {
  campaignName?: string;
  description?: string;
  clientId?: string;
  packageId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  totalPrice?: number;
  packageBreakdown?: any; // JSONB field containing packages array
}
