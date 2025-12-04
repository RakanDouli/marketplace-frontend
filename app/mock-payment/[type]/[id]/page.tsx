'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Text, Button } from '@/components/slices';
import { CheckCircle, XCircle, CreditCard, DollarSign } from 'lucide-react';
import styles from './MockPayment.module.scss';

// GraphQL queries
const GET_CAMPAIGN_QUERY = `
  query GetCampaignForPayment($id: String!) {
    getCampaignForPayment(id: $id) {
      id
      campaignName
      totalPrice
      currency
    }
  }
`;

// Query for subscription transaction (by transactionId)
const GET_SUBSCRIPTION_TRANSACTION_QUERY = `
  query GetSubscriptionTransaction($transactionId: ID!) {
    getSubscriptionTransaction(transactionId: $transactionId) {
      id
      amount
      currency
      status
      notes
      billingPeriodStart
      billingPeriodEnd
    }
  }
`;

const CONFIRM_CAMPAIGN_PAYMENT_MUTATION = `
  mutation ConfirmPayment($campaignId: String!) {
    confirmPayment(campaignId: $campaignId) {
      id
      status
    }
  }
`;

// Mutation for subscription payment confirmation
const CONFIRM_SUBSCRIPTION_PAYMENT_MUTATION = `
  mutation ConfirmSubscriptionPayment($transactionId: ID!) {
    confirmSubscriptionPayment(transactionId: $transactionId) {
      id
      status
    }
  }
`;

// Helper function for GraphQL calls
const makeGraphQLCall = async (query: string, variables: any = {}) => {
  const response = await fetch(process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql', {
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
  const type = params?.type as 'subscription' | 'ad_campaign';
  const id = params?.id as string; // For ad_campaign: campaignId, for subscription: transactionId

  const [paymentData, setPaymentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // Fetch payment data based on type
  useEffect(() => {
    if (!type || !id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (type === 'ad_campaign') {
          const data = await makeGraphQLCall(GET_CAMPAIGN_QUERY, { id });
          setPaymentData({
            amount: data.getCampaignForPayment.totalPrice,
            currency: data.getCampaignForPayment.currency,
            description: data.getCampaignForPayment.campaignName,
          });
        } else if (type === 'subscription') {
          // For subscription, id is the transactionId
          const data = await makeGraphQLCall(GET_SUBSCRIPTION_TRANSACTION_QUERY, { transactionId: id });
          const transaction = data.getSubscriptionTransaction;

          if (!transaction) {
            throw new Error('Transaction not found');
          }

          // Extract subscription name from notes (format: "Subscription: Name (X months)")
          const subscriptionName = transaction.notes?.replace('Subscription: ', '').split(' (')[0] || 'Subscription';

          setPaymentData({
            amount: transaction.amount,
            currency: transaction.currency,
            description: subscriptionName,
            billingPeriodStart: transaction.billingPeriodStart,
            billingPeriodEnd: transaction.billingPeriodEnd,
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load payment data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [type, id]);

  const handleConfirmPayment = async () => {
    try {
      setUpdating(true);

      if (type === 'ad_campaign') {
        await makeGraphQLCall(CONFIRM_CAMPAIGN_PAYMENT_MUTATION, { campaignId: id });
      } else if (type === 'subscription') {
        // Call subscription payment confirmation with transactionId
        await makeGraphQLCall(CONFIRM_SUBSCRIPTION_PAYMENT_MUTATION, { transactionId: id });
      }

      // Redirect to success page
      router.push(`/payment/success?type=${type}&id=${id}`);
    } catch (err) {
      console.error('Payment confirmation error:', err);
      // Redirect to failure page
      router.push(`/payment/failure?type=${type}&id=${id}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleRejectPayment = () => {
    // Redirect to failure page
    router.push(`/payment/failure?type=${type}&id=${id}`);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <Text variant="h3">Loading...</Text>
        </div>
      </div>
    );
  }

  if (error || !paymentData) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <Text variant="h3">Error Loading Data</Text>
          <Text variant="paragraph" color="secondary">
            {error || 'Payment data not found'}
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Gateway Header */}
        <div className={styles.header}>
          <CreditCard size={48} />
          <Text variant="h2">Mock Payment Gateway</Text>
          <Text variant="small" color="secondary">
            Secure Payment Processing - Development Mode
          </Text>
        </div>

        {/* Payment Amount */}
        <div className={styles.paymentDetails}>
          <div className={styles.amountSection}>
            <Text variant="small" color="secondary">Amount to Pay</Text>
            <div className={styles.amount}>
              <DollarSign size={32} />
              <Text variant="h1">{paymentData.amount.toFixed(2)}</Text>
              <Text variant="h4" color="secondary">{paymentData.currency}</Text>
            </div>
          </div>

          <div className={styles.merchantInfo}>
            <div className={styles.infoRow}>
              <Text variant="small" color="secondary">Merchant</Text>
              <Text variant="paragraph">Marketplace Auto</Text>
            </div>
            <div className={styles.infoRow}>
              <Text variant="small" color="secondary">Description</Text>
              <Text variant="paragraph">{paymentData.description}</Text>
            </div>
            <div className={styles.infoRow}>
              <Text variant="small" color="secondary">Transaction ID</Text>
              <Text variant="small" color="secondary">pi_mock_{id.slice(0, 12)}</Text>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.actions}>
          <Button
            onClick={handleConfirmPayment}
            disabled={updating}
            icon={<CheckCircle size={20} />}
            size="lg"
          >
            {updating ? 'Processing...' : 'Confirm Payment'}
          </Button>
          <Button
            variant="outline"
            onClick={handleRejectPayment}
            disabled={updating}
            icon={<XCircle size={20} />}
            size="lg"
          >
            Cancel
          </Button>
        </div>

        {/* Disclaimer */}
        <div className={styles.disclaimer}>
          <Text variant="small" color="secondary">
            🔒 This is a simulated payment gateway for development purposes only. No actual charges will be made.
          </Text>
        </div>
      </div>
    </div>
  );
}
