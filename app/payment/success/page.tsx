'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container, Text, Button, Loading } from '@/components/slices';
import { CheckCircle, Home, FileText, Download } from 'lucide-react';
import type { PaymentType } from '@/components/payment';
import { useUserAuthStore } from '@/stores/userAuthStore';
import styles from '../payment.module.scss';

// GraphQL query for generating invoice PDF
const GENERATE_INVOICE_PDF_QUERY = `
  query GenerateInvoicePdf($transactionId: ID!) {
    generateInvoicePdf(transactionId: $transactionId)
  }
`;

// Helper for GraphQL calls
const makeGraphQLCall = async (query: string, variables: Record<string, unknown> = {}) => {
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

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams?.get('type') as PaymentType | null;
  const id = searchParams?.get('id');
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const { refreshUserData, isAuthenticated } = useUserAuthStore();

  // Refresh user data after successful subscription payment to update the dashboard
  useEffect(() => {
    if (type === 'subscription' && isAuthenticated) {
      console.log('Payment success: Refreshing user data to update subscription...');
      refreshUserData();
    }
  }, [type, isAuthenticated, refreshUserData]);

  const getMessage = () => {
    switch (type) {
      case 'subscription':
        return {
          title: 'تم ترقية حسابك بنجاح',
          description: 'يمكنك الآن الاستفادة من جميع ميزات الخطة الجديدة',
          action: 'الذهاب إلى لوحة التحكم',
          url: '/dashboard',
          showButtons: true, // Show action buttons for subscriptions
        };
      case 'ad_campaign':
        return {
          title: 'تم تأكيد دفع الحملة الإعلانية',
          description: 'سيتم تفعيل حملتك الإعلانية قريباً. ستصلك رسالة تأكيد عبر البريد الإلكتروني',
          action: 'الصفحة الرئيسية',
          url: '/',
          showButtons: false, // Hide action buttons for ad campaigns
        };
      default:
        return {
          title: 'تم الدفع بنجاح',
          description: 'تمت عملية الدفع بنجاح',
          action: 'العودة إلى الصفحة الرئيسية',
          url: '/',
          showButtons: true,
        };
    }
  };

  // Download invoice as PDF
  const handleDownloadInvoice = async () => {
    if (!id || type !== 'subscription') return;

    try {
      setDownloadingInvoice(true);
      const data = await makeGraphQLCall(GENERATE_INVOICE_PDF_QUERY, { transactionId: id });

      if (data.generateInvoicePdf) {
        // Convert base64 to blob and download
        const byteCharacters = atob(data.generateInvoicePdf);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice-${id.slice(0, 8)}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to download invoice:', error);
    } finally {
      setDownloadingInvoice(false);
    }
  };

  const message = getMessage();

  return (
    <Container className={styles.resultContainer}>
      <div className={styles.result}>
        <div className={styles.successIcon}>
          <CheckCircle size={80} />
        </div>

        <Text variant="h1" className={styles.resultTitle}>{message.title}</Text>
        <Text variant="paragraph" className={styles.resultMessage}>{message.description}</Text>

        {/* Action buttons - hidden for ad campaigns */}
        {message.showButtons && (
          <div className={styles.resultActions}>
            <Button
              onClick={() => router.push(message.url)}
              icon={<FileText size={20} />}
            >
              {message.action}
            </Button>

            <Button
              variant="outline"
              onClick={() => router.push('/')}
              icon={<Home size={20} />}
            >
              الصفحة الرئيسية
            </Button>
          </div>
        )}

        {/* Invoice download button - for subscriptions only */}
        {type === 'subscription' && id && (
          <div className={styles.invoiceSection}>
            <Button
              variant="outline"
              onClick={handleDownloadInvoice}
              disabled={downloadingInvoice}
              icon={<Download size={20} />}
            >
              {downloadingInvoice ? 'جاري التحميل...' : 'تحميل الفاتورة'}
            </Button>
          </div>
        )}

        {type === 'ad_campaign' && id && (
          <div className={styles.resultInfo}>
            <Text variant="small" color="secondary">
              رقم الحملة: {id.slice(0, 8)}...
            </Text>
          </div>
        )}
      </div>
    </Container>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<Container className={styles.resultContainer}><Loading type="svg" /></Container>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
