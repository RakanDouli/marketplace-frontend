'use client';
import { formatDateShort } from '@/utils/formatDate';

import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/slices/Modal/Modal';
import { Button, Text, Loading } from '@/components/slices';
import { Table, TableHead, TableBody, TableRow, TableCell } from '@/components/slices';
import type { AdCampaign } from '@/stores/admin/adminAdCampaignsStore';
import { AD_MEDIA_TYPE_LABELS, AD_CAMPAIGN_STATUS_LABELS, getLabel } from '@/constants/metadata-labels';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import styles from './AdReportModals.module.scss';
import sharedStyles from '../../SharedDashboardPanel.module.scss';

interface ViewCampaignReportModalProps {
  isVisible: boolean;
  onClose: () => void;
  campaign: AdCampaign | null;
}

interface PublicCampaignReportData {
  campaign: {
    campaignName: string;
    description?: string;
    packageType: string;
    startDate: string;
    endDate: string;
    status: string;
  };
  metrics: {
    totalImpressions: number;
    totalClicks: number;
    averageCTR: number;
    totalCost: number;
    currency: string;
  };
  dailyReports: Array<{
    date: string;
    impressions: number;
    clicks: number;
    ctr: number;
  }>;
}

const GET_PUBLIC_CAMPAIGN_REPORT_QUERY = `
  query GetPublicCampaignReport($token: String!) {
    getPublicCampaignReport(token: $token) {
      campaign {
        campaignName
        description
        packageType
        startDate
        endDate
        status
      }
      metrics {
        totalImpressions
        totalClicks
        averageCTR
        totalCost
        currency
      }
      dailyReports {
        date
        impressions
        clicks
        ctr
      }
    }
  }
`;

export const ViewCampaignReportModal: React.FC<ViewCampaignReportModalProps> = ({
  isVisible,
  onClose,
  campaign
}) => {
  const [reportData, setReportData] = useState<PublicCampaignReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isVisible && campaign?.publicReportToken) {
      fetchReportData(campaign.publicReportToken);
    }
  }, [isVisible, campaign]);

  const fetchReportData = async (token: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: GET_PUBLIC_CAMPAIGN_REPORT_QUERY,
          variables: { token },
        }),
      });

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      setReportData(result.data.getPublicCampaignReport);
    } catch (err: any) {
      console.error('Error fetching campaign report:', err);
      setError(err.message || 'حدث خطأ في تحميل التقرير');
    } finally {
      setLoading(false);
    }
  };

  if (!campaign) return null;

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ar').format(num);
  };

  const getStatusLabel = (status: string) => {
    return getLabel(status.toLowerCase(), AD_CAMPAIGN_STATUS_LABELS);
  };

  const getAdTypeLabel = (adType: string) => {
    return getLabel(adType.toLowerCase(), AD_MEDIA_TYPE_LABELS);
  };

  const getStatusClass = (status: string): string => {
    const classes: Record<string, string> = {
      DRAFT: 'draft',
      PAYMENT_SENT: 'paymentSent',
      PAID: 'paid',
      ACTIVE: 'active',
      PAUSED: 'paused',
      COMPLETED: 'completed',
      CANCELLED: 'cancelled',
    };
    return classes[status.toUpperCase()] || 'draft';
  };

  // Prepare chart data
  const chartData = reportData?.dailyReports.map((daily) => ({
    date: formatDate(daily.date),
    impressions: daily.impressions,
    clicks: daily.clicks,
    ctr: (daily.ctr * 100).toFixed(2),
  })) || [];

  return (
    <Modal
      isVisible={isVisible}
      onClose={onClose}
      title="تقرير الحملة الإعلانية"
      maxWidth="xl"
    >
      <div className={styles.viewModalContent}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <Loading type="svg" />
            <Text variant="paragraph">جاري تحميل التقرير...</Text>
          </div>
        ) : error || !reportData ? (
          <div className={styles.errorContainer}>
            <Text variant="h3">⚠️ خطأ</Text>
            <Text variant="paragraph" color="secondary">
              {error || 'لا يوجد رمز تقرير عام لهذه الحملة'}
            </Text>
          </div>
        ) : (
          <>
            {/* Admin-Only Section: Campaign & Client Info */}
            <div className={styles.adminSection}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <Text variant="h3" className={styles.sectionTitle} style={{ margin: 0 }}>📊 معلومات إدارية</Text>
                <span className={`${sharedStyles.statusBadge} ${sharedStyles[getStatusClass(campaign.status)]}`}>
                  {getStatusLabel(campaign.status)}
                </span>
              </div>

              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <Text variant="small" color="secondary">العميل</Text>
                  <Text variant="paragraph" weight="medium">{campaign.client.companyName}</Text>
                  {campaign.client.contactName && (
                    <Text variant="small">{campaign.client.contactName}</Text>
                  )}
                  {campaign.client.contactEmail && (
                    <Text variant="small" color="secondary">{campaign.client.contactEmail}</Text>
                  )}
                  {campaign.client.contactPhone && (
                    <Text variant="small" color="secondary">{campaign.client.contactPhone}</Text>
                  )}
                </div>

                <div className={styles.infoItem}>
                  <Text variant="small" color="secondary">تفاصيل الدفع</Text>
                  <Text variant="paragraph" weight="medium">
                    {formatNumber(campaign.totalPrice)} {campaign.currency}
                  </Text>
                  {campaign.paidAt && (
                    <Text variant="small" color="success">✓ تم الدفع: {formatDateShort(campaign.paidAt)}</Text>
                  )}
                  {!campaign.paidAt && campaign.paymentLink && (
                    <Text variant="small" color="warning">⏳ بانتظار الدفع</Text>
                  )}
                </div>

                <div className={styles.infoItem}>
                  <Text variant="small" color="secondary">تواريخ التفعيل</Text>
                  {campaign.activatedAt && (
                    <Text variant="small">تم التفعيل: {formatDateShort(campaign.activatedAt)}</Text>
                  )}
                  {campaign.completedAt && (
                    <Text variant="small">تم الإكمال: {formatDateShort(campaign.completedAt)}</Text>
                  )}
                  {!campaign.activatedAt && (
                    <Text variant="small" color="secondary">لم يتم التفعيل بعد</Text>
                  )}
                </div>

                {campaign.notes && (
                  <div className={`${styles.infoItem} ${styles.notesItem}`}>
                    <Text variant="small" color="secondary">ملاحظات داخلية</Text>
                    <Text variant="small" style={{ whiteSpace: 'pre-wrap' }}>{campaign.notes}</Text>
                  </div>
                )}

                <div className={styles.infoItem}>
                  <Text variant="small" color="secondary">تم الإنشاء بواسطة</Text>
                  <Text variant="small">{campaign.createdByUser.email}</Text>
                  <Text variant="small" color="secondary">{formatDateShort(campaign.createdAt)}</Text>
                </div>

                {campaign.publicReportToken && (
                  <div className={styles.infoItem}>
                    <Text variant="small" color="secondary">رابط التقرير العام</Text>
                    <Text variant="small" style={{ wordBreak: 'break-all', fontSize: '0.75rem' }}>
                      /public/campaign-report/{campaign.publicReportToken}
                    </Text>
                  </div>
                )}
              </div>
            </div>

            {/* Campaign Info Card (From Public Report) */}
            <div className={styles.section}>
              <Text variant="h3" className={styles.sectionTitle}>معلومات الحملة</Text>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <Text variant="small" color="secondary">اسم الحملة</Text>
                  <Text variant="paragraph" weight="medium">{reportData.campaign.campaignName}</Text>
                </div>

                {reportData.campaign.description && (
                  <div className={styles.infoItem}>
                    <Text variant="small" color="secondary">الوصف</Text>
                    <Text variant="paragraph">{reportData.campaign.description}</Text>
                  </div>
                )}

                <div className={styles.infoItem}>
                  <Text variant="small" color="secondary">نوع الإعلان</Text>
                  <Text variant="paragraph" weight="medium">
                    {getAdTypeLabel(reportData.campaign.packageType)}
                  </Text>
                </div>

                <div className={styles.infoItem}>
                  <Text variant="small" color="secondary">الحالة</Text>
                  <Text variant="paragraph" weight="medium">
                    {getStatusLabel(reportData.campaign.status)}
                  </Text>
                </div>

                <div className={styles.infoItem}>
                  <Text variant="small" color="secondary">تاريخ البدء</Text>
                  <Text variant="paragraph" weight="medium">
                    {formatDateShort(reportData.campaign.startDate)}
                  </Text>
                </div>

                <div className={styles.infoItem}>
                  <Text variant="small" color="secondary">تاريخ الانتهاء</Text>
                  <Text variant="paragraph" weight="medium">
                    {formatDateShort(reportData.campaign.endDate)}
                  </Text>
                </div>
              </div>
            </div>

            {/* Metrics Cards */}
            <div className={styles.section}>
              <Text variant="h3" className={styles.sectionTitle}>مقاييس الأداء</Text>
              <div className={styles.metricsGrid}>
                <div className={styles.metricCard}>
                  <Text variant="small" color="secondary">إجمالي الظهورات</Text>
                  <Text variant="h2">{formatNumber(reportData.metrics.totalImpressions)}</Text>
                </div>

                <div className={styles.metricCard}>
                  <Text variant="small" color="secondary">إجمالي النقرات</Text>
                  <Text variant="h2">{formatNumber(reportData.metrics.totalClicks)}</Text>
                </div>

                <div className={styles.metricCard}>
                  <Text variant="small" color="secondary">معدل النقر (CTR)</Text>
                  <Text variant="h2">{(reportData.metrics.averageCTR * 100).toFixed(2)}%</Text>
                </div>

                <div className={styles.metricCard}>
                  <Text variant="small" color="secondary">إجمالي التكلفة</Text>
                  <Text variant="h2">
                    {formatNumber(reportData.metrics.totalCost)} {reportData.metrics.currency}
                  </Text>
                </div>

                {reportData.metrics.totalClicks > 0 && (
                  <div className={styles.metricCard}>
                    <Text variant="small" color="secondary">تكلفة النقرة (CPC)</Text>
                    <Text variant="h2">
                      {(reportData.metrics.totalCost / reportData.metrics.totalClicks).toFixed(2)} {reportData.metrics.currency}
                    </Text>
                  </div>
                )}
              </div>
            </div>

            {/* Charts */}
            {chartData.length > 0 && (
              <div className={styles.section}>
                <Text variant="h3" className={styles.sectionTitle}>الأداء اليومي</Text>

                {/* Impressions & Clicks Chart */}
                <div className={styles.chartContainer}>
                  <Text variant="paragraph" weight="medium">الظهورات والنقرات</Text>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="impressions" fill="var(--color-primary)" name="الظهورات" />
                      <Bar dataKey="clicks" fill="var(--color-success)" name="النقرات" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* CTR Chart */}
                <div className={styles.chartContainer}>
                  <Text variant="paragraph" weight="medium">معدل النقر (CTR)</Text>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="ctr" stroke="var(--color-warning)" name="CTR %" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Daily Breakdown Table */}
            {reportData.dailyReports.length > 0 && (
              <div className={styles.section}>
                <Text variant="h3" className={styles.sectionTitle}>التفاصيل اليومية</Text>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell isHeader>التاريخ</TableCell>
                      <TableCell isHeader>الظهورات</TableCell>
                      <TableCell isHeader>النقرات</TableCell>
                      <TableCell isHeader>معدل النقر</TableCell>
                      <TableCell isHeader>الحالة</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.dailyReports.map((daily, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Text variant="small">{formatDate(daily.date)}</Text>
                        </TableCell>
                        <TableCell>
                          <Text variant="small">{formatNumber(daily.impressions)}</Text>
                        </TableCell>
                        <TableCell>
                          <Text variant="small">{formatNumber(daily.clicks)}</Text>
                        </TableCell>
                        <TableCell>
                          <Text variant="small">{(daily.ctr * 100).toFixed(2)}%</Text>
                        </TableCell>
                        <TableCell>
                          {daily.dailyTarget ? (
                            daily.impressions >= daily.dailyTarget ? (
                              <Text variant="small" color="success">On track ✅</Text>
                            ) : (
                              <Text variant="small" color="warning">Behind ⚠️</Text>
                            )
                          ) : (
                            <Text variant="small" color="secondary">-</Text>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Actions */}
            <div className={styles.actions}>
              <Button variant="secondary" onClick={onClose}>
                إغلاق
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
