'use client';

import React, { useEffect, useState } from 'react';
import { Text, Button, Loading } from '@/components/slices';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { formatAdPrice } from '@/utils/formatPrice';
import { formatDate } from '@/utils/formatDate';
import { CreditCard, Receipt, FileText, Download, RefreshCw } from 'lucide-react';
import styles from './Payments.module.scss';

// GraphQL query for transactions with receipts
const MY_TRANSACTIONS_QUERY = `
  query MyTransactionsWithReceipts {
    myTransactionsWithReceipts {
      id
      transactionType
      referenceId
      amount
      currency
      paymentMethod
      status
      billingPeriodStart
      billingPeriodEnd
      notes
      createdAt
      description
      isSuccessful
    }
  }
`;

// GraphQL helper
const makeGraphQLCall = async (query: string, variables: any = {}, token?: string) => {
  const response = await fetch(process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ query, variables }),
  });

  const result = await response.json();

  if (result.errors) {
    throw new Error(result.errors[0]?.message || 'GraphQL Error');
  }

  return result.data;
};

interface Transaction {
  id: string;
  transactionType: 'user_subscription' | 'ad_campaign' | 'listing_promotion';
  referenceId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  notes?: string;
  createdAt: string;
  description: string;
  isSuccessful: boolean;
}

// Status labels in Arabic
const STATUS_LABELS: Record<string, string> = {
  pending: 'قيد الانتظار',
  completed: 'مكتملة',
  failed: 'فاشلة',
  refunded: 'مستردة',
  cancelled: 'ملغاة',
};

// Transaction type labels in Arabic
const TYPE_LABELS: Record<string, string> = {
  user_subscription: 'اشتراك',
  ad_campaign: 'حملة إعلانية',
  listing_promotion: 'ترويج إعلان',
};

export default function PaymentsPage() {
  const { user } = useUserAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Fetch transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user?.token) return;

      setIsLoading(true);
      try {
        const data = await makeGraphQLCall(MY_TRANSACTIONS_QUERY, {}, user.token);
        setTransactions(data.myTransactionsWithReceipts || []);
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [user?.token]);

  // Filter transactions by type
  const filteredTransactions = transactions.filter(t => {
    if (activeTab === 'all') return true;
    if (activeTab === 'subscriptions') return t.transactionType === 'user_subscription';
    if (activeTab === 'ads') return t.transactionType === 'ad_campaign';
    return true;
  });

  // Calculate summary stats
  const totalSpent = transactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const subscriptionSpent = transactions
    .filter(t => t.status === 'completed' && t.transactionType === 'user_subscription')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const adsSpent = transactions
    .filter(t => t.status === 'completed' && t.transactionType === 'ad_campaign')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Download receipt
  const handleDownloadReceipt = async (transactionId: string) => {
    if (!user?.token) return;

    setDownloadingId(transactionId);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/receipts/${transactionId}/download`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to download receipt');
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${transactionId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download receipt:', error);
    } finally {
      setDownloadingId(null);
    }
  };

  // Tab items
  const tabItems = [
    { id: 'all', label: 'جميع العمليات' },
    { id: 'subscriptions', label: 'الاشتراكات' },
    { id: 'ads', label: 'الحملات الإعلانية' },
  ];

  if (isLoading) {
    return (
      <div className={styles.payments}>
        <div className={styles.loading}>
          <Loading type="svg" />
          <Text variant="paragraph">جاري تحميل البيانات المالية...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.payments}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <Text variant="h2">لوحة الحسابات المالية</Text>
          <Text variant="paragraph" color="secondary">
            إدارة الاشتراكات والمدفوعات والإيصالات
          </Text>
        </div>
      </div>

      {/* Overview Cards */}
      <div className={styles.overviewGrid}>
        <div className={styles.overviewCard}>
          <div className={styles.overviewIcon}>
            <CreditCard size={24} />
          </div>
          <div className={styles.overviewContent}>
            <Text variant="small" color="secondary">إجمالي المدفوعات</Text>
            <Text variant="h3">{formatAdPrice(totalSpent, 'USD')}</Text>
          </div>
        </div>

        <div className={styles.overviewCard}>
          <div className={styles.overviewIcon}>
            <RefreshCw size={24} />
          </div>
          <div className={styles.overviewContent}>
            <Text variant="small" color="secondary">الاشتراكات</Text>
            <Text variant="h3">{formatAdPrice(subscriptionSpent, 'USD')}</Text>
          </div>
        </div>

        <div className={styles.overviewCard}>
          <div className={styles.overviewIcon}>
            <FileText size={24} />
          </div>
          <div className={styles.overviewContent}>
            <Text variant="small" color="secondary">الحملات الإعلانية</Text>
            <Text variant="h3">{formatAdPrice(adsSpent, 'USD')}</Text>
          </div>
        </div>

        <div className={styles.overviewCard}>
          <div className={styles.overviewIcon}>
            <Receipt size={24} />
          </div>
          <div className={styles.overviewContent}>
            <Text variant="small" color="secondary">عدد العمليات</Text>
            <Text variant="h3">{transactions.length}</Text>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabsSection}>
        <div className={styles.tabs}>
          {tabItems.map((item) => (
            <button
              key={item.id}
              className={`${styles.tab} ${activeTab === item.id ? styles.active : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <div className={styles.section}>
        <Text variant="h3">سجل العمليات</Text>

        {filteredTransactions.length === 0 ? (
          <div className={styles.empty}>
            <CreditCard size={48} className={styles.emptyIcon} />
            <Text variant="h4">لا توجد عمليات</Text>
            <Text variant="paragraph" color="secondary">
              {activeTab === 'all'
                ? 'سيظهر هنا سجل جميع المدفوعات والإيصالات'
                : activeTab === 'subscriptions'
                ? 'لم تقم بأي اشتراكات بعد'
                : 'لم تقم بأي حملات إعلانية بعد'}
            </Text>
          </div>
        ) : (
          <div className={styles.transactionsList}>
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} className={styles.transactionItem}>
                <div className={styles.transactionMain}>
                  <div className={styles.transactionInfo}>
                    <div className={styles.transactionHeader}>
                      <Text variant="paragraph" weight="medium">
                        {transaction.description || TYPE_LABELS[transaction.transactionType]}
                      </Text>
                      <span className={`${styles.typeBadge} ${styles[transaction.transactionType]}`}>
                        {TYPE_LABELS[transaction.transactionType]}
                      </span>
                    </div>
                    <Text variant="small" color="secondary">
                      {formatDate(transaction.createdAt)}
                      {transaction.billingPeriodStart && transaction.billingPeriodEnd && (
                        <> • {formatDate(transaction.billingPeriodStart)} - {formatDate(transaction.billingPeriodEnd)}</>
                      )}
                    </Text>
                    {transaction.notes && (
                      <Text variant="small" color="secondary">
                        {transaction.notes}
                      </Text>
                    )}
                  </div>

                  <div className={styles.transactionDetails}>
                    <Text variant="h4">
                      {formatAdPrice(Number(transaction.amount), transaction.currency)}
                    </Text>
                    <span className={`${styles.status} ${styles[transaction.status]}`}>
                      {STATUS_LABELS[transaction.status]}
                    </span>
                  </div>
                </div>

                {/* Receipt download button - only for completed transactions */}
                {transaction.isSuccessful && (
                  <div className={styles.transactionActions}>
                    <Button
                      variant="link"
                      size="sm"
                      icon={<Download size={16} />}
                      onClick={() => handleDownloadReceipt(transaction.id)}
                      disabled={downloadingId === transaction.id}
                    >
                      {downloadingId === transaction.id ? 'جاري التحميل...' : 'تحميل الإيصال'}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
