import React from 'react';
import { SubscriptionPreviewContent } from './SubscriptionPreviewContent';
import { CampaignPreviewContent } from './CampaignPreviewContent';
import type { PaymentType, PaymentData, SubscriptionPaymentData, AdCampaignPaymentData, PaymentFeeInfo } from '../types';

interface PaymentPreviewProps {
  type: PaymentType;
  data: PaymentData;
  feeInfo?: PaymentFeeInfo | null;
}

export const PaymentPreview: React.FC<PaymentPreviewProps> = ({ type, data, feeInfo }) => {
  switch (type) {
    case 'subscription':
      return <SubscriptionPreviewContent data={data as SubscriptionPaymentData} feeInfo={feeInfo} />;

    case 'ad_campaign':
      return <CampaignPreviewContent data={data as AdCampaignPaymentData} feeInfo={feeInfo} />;

    default:
      return null;
  }
};
