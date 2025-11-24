import React from 'react';
import { SubscriptionPreviewContent } from './SubscriptionPreviewContent';
import { CampaignPreviewContent } from './CampaignPreviewContent';
import type { PaymentType, PaymentData, SubscriptionPaymentData, AdCampaignPaymentData } from '../types';

interface PaymentPreviewProps {
  type: PaymentType;
  data: PaymentData;
}

export const PaymentPreview: React.FC<PaymentPreviewProps> = ({ type, data }) => {
  switch (type) {
    case 'subscription':
      return <SubscriptionPreviewContent data={data as SubscriptionPaymentData} />;

    case 'ad_campaign':
      return <CampaignPreviewContent data={data as AdCampaignPaymentData} />;

    default:
      return null;
  }
};
