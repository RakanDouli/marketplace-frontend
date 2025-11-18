'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Text, Button } from '@/components/slices';
import { CheckCircle, XCircle, CreditCard, Calendar, DollarSign } from 'lucide-react';
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

  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'rejected'>('pending');
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
      setPaymentStatus('success');
    } catch (err) {
      console.error('Payment confirmation error:', err);
      alert('فشل في تأكيد الدفع');
    } finally {
      setUpdating(false);
    }
  };

  const handleRejectPayment = () => {
    setPaymentStatus('rejected');
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

  if (paymentStatus === 'success') {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.successIcon}>
            <CheckCircle size={64} />
          </div>
          <Text variant="h2">تم الدفع بنجاح</Text>
          <Text variant="paragraph" color="secondary">
            تم تأكيد دفعتك للحملة الإعلانية "{campaign.campaignName}"
          </Text>
          <div className={styles.actions}>
            <Button onClick={() => router.push('/admin')}>
              العودة إلى لوحة التحكم
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'rejected') {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.rejectIcon}>
            <XCircle size={64} />
          </div>
          <Text variant="h2">تم رفض الدفع</Text>
          <Text variant="paragraph" color="secondary">
            تم إلغاء عملية الدفع للحملة "{campaign.campaignName}"
          </Text>
          <div className={styles.actions}>
            <Button variant="outline" onClick={() => setPaymentStatus('pending')}>
              المحاولة مرة أخرى
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
          <Text variant="h3">تفاصيل الدفع</Text>

          <div className={styles.detailsGrid}>
            <div className={styles.detail}>
              <Text variant="small" color="secondary">اسم الحملة</Text>
              <Text variant="paragraph">{campaign.campaignName}</Text>
            </div>

            <div className={styles.detail}>
              <Text variant="small" color="secondary">العميل</Text>
              <Text variant="paragraph">{campaign.client.companyName}</Text>
            </div>

            <div className={styles.detail}>
              <Text variant="small" color="secondary">نوع الحزمة</Text>
              <Text variant="paragraph">{campaign.package.packageName}</Text>
            </div>

            <div className={styles.detail}>
              <Text variant="small" color="secondary">المبلغ المطلوب</Text>
              <div className={styles.amount}>
                <DollarSign size={20} />
                <Text variant="h3">{campaign.totalPrice} {campaign.currency}</Text>
              </div>
            </div>

            <div className={styles.detail}>
              <Text variant="small" color="secondary">تاريخ البدء</Text>
              <div className={styles.dateInfo}>
                <Calendar size={16} />
                <Text variant="paragraph">
                  {new Date(campaign.startDate).toLocaleDateString('ar-EG')}
                </Text>
              </div>
            </div>

            <div className={styles.detail}>
              <Text variant="small" color="secondary">تاريخ الانتهاء</Text>
              <div className={styles.dateInfo}>
                <Calendar size={16} />
                <Text variant="paragraph">
                  {new Date(campaign.endDate).toLocaleDateString('ar-EG')}
                </Text>
              </div>
            </div>
          </div>
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
