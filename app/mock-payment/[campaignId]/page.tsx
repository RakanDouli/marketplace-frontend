'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Text, Button } from '@/components/slices';
import { CampaignPreview } from '@/components/CampaignPreview';
import { CheckCircle, XCircle, CreditCard } from 'lucide-react';
import styles from './MockPayment.module.scss';

const GET_CAMPAIGN_QUERY = `
  query GetCampaignForPayment($id: String!) {
    getCampaignForPayment(id: $id) {
      id
      campaignName
      description
      totalPrice
      currency
      startDate
      endDate
      status
      isCustomPackage
      packageBreakdown
      client {
        id
        companyName
        contactName
        contactEmail
      }
      package {
        id
        packageName
        adType
      }
    }
  }
`;

const CONFIRM_PAYMENT_MUTATION = `
  mutation ConfirmPayment($campaignId: String!) {
    confirmPayment(campaignId: $campaignId) {
      id
      status
    }
  }
`;

// Helper function for GraphQL calls
const makeGraphQLCall = async (query: string, variables: any = {}) => {
  const response = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  const result = await response.json();

  if (result.errors) {
    throw new Error(result.errors[0]?.message || 'GraphQL Error');
  }

  return result.data;
};

export default function MockPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params?.campaignId as string;

  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // Fetch campaign data on mount
  useEffect(() => {
    if (!campaignId) return;

    const fetchCampaign = async () => {
      try {
        setLoading(true);
        const data = await makeGraphQLCall(GET_CAMPAIGN_QUERY, { id: campaignId });
        setCampaign(data.getCampaignForPayment);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load campaign');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [campaignId]);

  const handleConfirmPayment = async () => {
    try {
      setUpdating(true);
      await makeGraphQLCall(CONFIRM_PAYMENT_MUTATION, {
        campaignId: campaignId,
      });
      // Redirect to success page
      router.push(`/payment/success?type=ad_campaign&id=${campaignId}`);
    } catch (err) {
      console.error('Payment confirmation error:', err);
      // Redirect to failure page
      router.push(`/payment/failure?type=ad_campaign&id=${campaignId}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleRejectPayment = () => {
    // Redirect to failure page
    router.push(`/payment/failure?type=ad_campaign&id=${campaignId}`);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <Text variant="h3">جاري التحميل...</Text>
        </div>
      </div>
    );
  }

  if (error || (!loading && !campaign)) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <Text variant="h3">خطأ في تحميل البيانات</Text>
          <Text variant="paragraph" color="secondary">
            {error || 'لم يتم العثور على الحملة'}
          </Text>
        </div>
      </div>
    );
  }

  // Removed success/rejected screens - now redirecting to unified success/failure pages

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <CreditCard size={48} />
          <Text variant="h2">محاكي الدفع</Text>
          <Text variant="small" color="secondary">
            Mock Payment Gateway - للتطوير والاختبار فقط
          </Text>
        </div>

        <div className={styles.section}>
          <Text variant="h3">تفاصيل الحملة</Text>
          <CampaignPreview campaign={campaign} />
        </div>

        <div className={styles.section}>
          <Text variant="h4">البيانات المرسلة إلى بوابة الدفع</Text>
          <div className={styles.payloadBox}>
            <pre>
              {JSON.stringify({
                paymentIntent: {
                  id: `pi_mock_${campaignId.slice(0, 8)}`,
                  amount: campaign.totalPrice * 100, // في السنتات
                  currency: campaign.currency.toLowerCase(),
                  description: `Payment for ad campaign: ${campaign.campaignName}`,
                  metadata: {
                    campaignId: campaign.id,
                    clientId: campaign.client.id,
                    clientName: campaign.client.companyName,
                    packageId: campaign.package.id,
                    startDate: campaign.startDate,
                    endDate: campaign.endDate,
                  },
                },
                customer: {
                  id: `cus_mock_${campaign.client.id.slice(0, 8)}`,
                  name: campaign.client.companyName,
                  email: campaign.client.contactEmail,
                },
              }, null, 2)}
            </pre>
          </div>
        </div>

        <div className={styles.actions}>
          <Button
            onClick={handleConfirmPayment}
            disabled={updating}
            icon={<CheckCircle size={20} />}
          >
            {updating ? 'جاري التأكيد...' : 'تأكيد الدفع'}
          </Button>
          <Button
            variant="danger"
            onClick={handleRejectPayment}
            disabled={updating}
            icon={<XCircle size={20} />}
          >
            رفض الدفع
          </Button>
        </div>

        <div className={styles.disclaimer}>
          <Text variant="small" color="secondary">
            ⚠️ هذه صفحة محاكاة للدفع. لن يتم خصم أي مبالغ حقيقية.
            سيتم تحديث حالة الحملة تلقائياً عند تأكيد الدفع.
          </Text>
        </div>
      </div>
    </div>
  );
}
