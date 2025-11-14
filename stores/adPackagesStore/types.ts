export interface AdDimensions {
  desktop: {
    width: number;
    height: number;
  };
  mobile: {
    width: number;
    height: number;
  };
}

export interface AdPackage {
  id: string;
  packageName: string;
  description: string;
  adType: string;
  placement: string;
  format: string;
  dimensions: AdDimensions;
  durationDays: number;
  impressionLimit: number;
  basePrice: number;
  currency: string;
  mediaRequirements: string[];
  isActive: boolean;
}
