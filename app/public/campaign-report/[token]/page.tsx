'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Text, Loading, Table, TableHead, TableBody, TableRow, TableCell } from '@/components/slices';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import styles from './PublicCampaignReport.module.scss';

interface CampaignInfo {
  campaignName: string;
  description?: string;
  packageType: string;
  startDate: string;
  endDate: string;
  status: string;
}

interface CampaignMetrics {
  totalImpressions: number;
  totalClicks: number;
  averageCTR: number;
}

interface DailyReport {
  date: string;
  impressions: number;
  clicks: number;
  ctr: number;
}

interface PublicCampaignReport {
  campaign: CampaignInfo;
  metrics: CampaignMetrics;
  dailyReports: DailyReport[];
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

export default function PublicCampaignReportPage() {
  const params = useParams();
  const token = params.token as string;

  const [report, setReport] = useState<PublicCampaignReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
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

        setReport(result.data.getPublicCampaignReport);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching public campaign report:', err);
        setError(err.message || 'حدث خطأ في تحميل التقرير');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchReport();
    }
  }, [token]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      DRAFT: 'مسودة',
      AWAITING_PAYMENT: 'بانتظار الدفع',
      AWAITING_ACTIVATION: 'بانتظار التفعيل',
      ACTIVE: 'نشط',
      PAUSED: 'متوقف مؤقتاً',
      COMPLETED: 'مكتمل',
      CANCELLED: 'ملغى',
    };
    return labels[status.toUpperCase()] || status;
  };

  const getAdTypeLabel = (adType: string) => {
    const labels: Record<string, string> = {
      banner: 'بانر علوي',
      video: 'فيديو علوي',
      between_listings_banner: 'بين القوائم - بانر كامل',
    };
    return labels[adType.toLowerCase()] || adType;
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loading type="svg" />
        <Text variant="paragraph">جاري تحميل التقرير...</Text>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className={styles.errorContainer}>
        <Text variant="h2">⚠️ خطأ</Text>
        <Text variant="paragraph" color="secondary">
          {error || 'لم يتم العثور على التقرير'}
        </Text>
      </div>
    );
  }

  // Prepare chart data
  const chartData = report.dailyReports.map((daily) => ({
    date: formatDate(daily.date),
    impressions: daily.impressions,
    clicks: daily.clicks,
    ctr: (daily.ctr * 100).toFixed(2),
  }));

  return (
    <div className={styles.publicReportPage}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <Text variant="h1">{report.campaign.campaignName}</Text>
          {report.campaign.description && (
            <Text variant="paragraph" color="secondary">
              {report.campaign.description}
            </Text>
          )}
        </div>

        {/* Campaign Info Card */}
        <div className={styles.card}>
          <Text variant="h2">معلومات الحملة</Text>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <Text variant="small" color="secondary">نوع الإعلان</Text>
              <Text variant="paragraph" weight="medium">
                {getAdTypeLabel(report.campaign.packageType)}
              </Text>
            </div>
            <div className={styles.infoItem}>
              <Text variant="small" color="secondary">الحالة</Text>
              <Text variant="paragraph" weight="medium">
                {getStatusLabel(report.campaign.status)}
              </Text>
            </div>
            <div className={styles.infoItem}>
              <Text variant="small" color="secondary">تاريخ البدء</Text>
              <Text variant="paragraph" weight="medium">
                {formatDate(report.campaign.startDate)}
              </Text>
            </div>
            <div className={styles.infoItem}>
              <Text variant="small" color="secondary">تاريخ الانتهاء</Text>
              <Text variant="paragraph" weight="medium">
                {formatDate(report.campaign.endDate)}
              </Text>
            </div>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <Text variant="small" color="secondary">إجمالي الظهورات</Text>
            <Text variant="h2">{report.metrics.totalImpressions.toLocaleString('ar')}</Text>
          </div>
          <div className={styles.metricCard}>
            <Text variant="small" color="secondary">إجمالي النقرات</Text>
            <Text variant="h2">{report.metrics.totalClicks.toLocaleString('ar')}</Text>
          </div>
          <div className={styles.metricCard}>
            <Text variant="small" color="secondary">معدل النقر (CTR)</Text>
            <Text variant="h2">{(report.metrics.averageCTR * 100).toLocaleString('ar', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%</Text>
          </div>
        </div>

        {/* Charts */}
        <div className={styles.card}>
          <Text variant="h2">الأداء اليومي</Text>

          {/* Impressions & Clicks Chart */}
          <div className={styles.chartContainer}>
            <Text variant="h3">الظهورات والنقرات</Text>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="impressions" fill="#4f46e5" name="الظهورات" />
                <Bar dataKey="clicks" fill="#10b981" name="النقرات" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* CTR Chart */}
          <div className={styles.chartContainer}>
            <Text variant="h3">معدل النقر (CTR)</Text>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="ctr" stroke="#f59e0b" name="CTR %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Breakdown Table */}
        <div className={styles.card}>
          <Text variant="h2">التفاصيل اليومية</Text>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell isHeader>التاريخ</TableCell>
                <TableCell isHeader>الظهورات</TableCell>
                <TableCell isHeader>النقرات</TableCell>
                <TableCell isHeader>معدل النقر</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {report.dailyReports.map((daily, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Text variant="small">{formatDate(daily.date)}</Text>
                  </TableCell>
                  <TableCell>
                    <Text variant="small">{daily.impressions.toLocaleString('ar')}</Text>
                  </TableCell>
                  <TableCell>
                    <Text variant="small">{daily.clicks.toLocaleString('ar')}</Text>
                  </TableCell>
                  <TableCell>
                    <Text variant="small">{(daily.ctr * 100).toLocaleString('ar', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%</Text>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <Text variant="small" color="secondary">
            تقرير عام للحملة الإعلانية - تم إنشاؤه بواسطة نظام الإعلانات
          </Text>
        </div>
      </div>
    </div>
  );
}
