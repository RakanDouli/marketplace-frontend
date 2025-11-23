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
  dailyTarget?: number;
}

interface PackageMetrics {
  impressionsPurchased: number;
  impressionsDelivered: number;
  clicks: number;
  ctr: number;
  progress: number;
}

interface PackageReport {
  packageId: string;
  packageName: string;
  placement: string;
  format: string;
  startDate: string;
  endDate: string;
  packageData: any;
  metrics: PackageMetrics;
  dailyReports: DailyReport[];
}

interface PublicCampaignReport {
  campaign: CampaignInfo;
  metrics: CampaignMetrics;
  dailyReports: DailyReport[];
  packages?: PackageReport[];
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
        dailyTarget
      }
      packages {
        packageId
        packageName
        placement
        format
        startDate
        endDate
        packageData
        metrics {
          impressionsPurchased
          impressionsDelivered
          clicks
          ctr
          progress
        }
        dailyReports {
          date
          impressions
          clicks
          ctr
        }
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
  const [activeTab, setActiveTab] = useState<string>('overview'); // 'overview' or packageId

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

  // Helper to render metrics and charts for overview or specific package
  const renderMetricsAndCharts = (
    dailyReports: DailyReport[],
    metrics?: {
      impressionsPurchased?: number;
      impressionsDelivered?: number;
      totalImpressions?: number;
      totalClicks?: number;
      averageCTR?: number;
      progress?: number;
    }
  ) => {
    const chartData = dailyReports.map((daily) => ({
      date: formatDate(daily.date),
      impressions: daily.impressions,
      clicks: daily.clicks,
      ctr: (daily.ctr * 100).toFixed(2),
    }));

    const totalImpressions = metrics?.totalImpressions || dailyReports.reduce((sum, d) => sum + d.impressions, 0);
    const totalClicks = metrics?.totalClicks || dailyReports.reduce((sum, d) => sum + d.clicks, 0);
    const avgCTR = metrics?.averageCTR || (totalImpressions > 0 ? (totalClicks / totalImpressions) : 0);

    return (
      <>
        {/* Metrics Cards */}
        <div className={styles.metricsGrid}>
          {metrics?.impressionsPurchased !== undefined && (
            <div className={styles.metricCard}>
              <Text variant="small" color="secondary">الظهورات المشتراة</Text>
              <Text variant="h2">{metrics.impressionsPurchased.toLocaleString('ar')}</Text>
            </div>
          )}
          {metrics?.impressionsDelivered !== undefined && (
            <div className={styles.metricCard}>
              <Text variant="small" color="secondary">الظهورات المنفذة</Text>
              <Text variant="h2">{metrics.impressionsDelivered.toLocaleString('ar')}</Text>
            </div>
          )}
          <div className={styles.metricCard}>
            <Text variant="small" color="secondary">إجمالي الظهورات</Text>
            <Text variant="h2">{totalImpressions.toLocaleString('ar')}</Text>
          </div>
          <div className={styles.metricCard}>
            <Text variant="small" color="secondary">إجمالي النقرات</Text>
            <Text variant="h2">{totalClicks.toLocaleString('ar')}</Text>
          </div>
          <div className={styles.metricCard}>
            <Text variant="small" color="secondary">معدل النقر (CTR)</Text>
            <Text variant="h2">{(avgCTR * 100).toLocaleString('ar', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%</Text>
          </div>
          {metrics?.progress !== undefined && (
            <div className={styles.metricCard}>
              <Text variant="small" color="secondary">نسبة الإنجاز</Text>
              <Text variant="h2">{metrics.progress.toLocaleString('ar', {minimumFractionDigits: 1, maximumFractionDigits: 1})}%</Text>
            </div>
          )}
        </div>

        {/* Charts */}
        <div className={styles.card}>
          <Text variant="h2">الأداء اليومي</Text>

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
              {dailyReports.map((daily, index) => (
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
      </>
    );
  };

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

        {/* Package Tabs (if multi-package campaign) */}
        {report.packages && report.packages.length > 0 && (
          <div className={styles.card}>
            <Text variant="h2">تقارير الحزم</Text>
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${activeTab === 'overview' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                نظرة عامة
              </button>
              {report.packages.map((pkg) => (
                <button
                  key={pkg.packageId}
                  className={`${styles.tab} ${activeTab === pkg.packageId ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab(pkg.packageId)}
                >
                  {pkg.packageName}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Render content based on active tab */}
        {activeTab === 'overview' ? (
          // Overall campaign metrics
          renderMetricsAndCharts(report.dailyReports, {
            totalImpressions: report.metrics.totalImpressions,
            totalClicks: report.metrics.totalClicks,
            averageCTR: report.metrics.averageCTR
          })
        ) : (
          // Package-specific metrics
          (() => {
            const selectedPackage = report.packages?.find(p => p.packageId === activeTab);
            if (!selectedPackage) return null;

            return (
              <>
                {/* Package Info */}
                <div className={styles.card}>
                  <Text variant="h2">معلومات الحزمة</Text>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <Text variant="small" color="secondary">الموقع</Text>
                      <Text variant="paragraph" weight="medium">{selectedPackage.placement}</Text>
                    </div>
                    <div className={styles.infoItem}>
                      <Text variant="small" color="secondary">الشكل</Text>
                      <Text variant="paragraph" weight="medium">{selectedPackage.format}</Text>
                    </div>
                    <div className={styles.infoItem}>
                      <Text variant="small" color="secondary">تاريخ البدء</Text>
                      <Text variant="paragraph" weight="medium">{formatDate(selectedPackage.startDate)}</Text>
                    </div>
                    <div className={styles.infoItem}>
                      <Text variant="small" color="secondary">تاريخ الانتهاء</Text>
                      <Text variant="paragraph" weight="medium">{formatDate(selectedPackage.endDate)}</Text>
                    </div>
                  </div>
                </div>

                {renderMetricsAndCharts(selectedPackage.dailyReports, {
                  impressionsPurchased: selectedPackage.metrics.impressionsPurchased,
                  impressionsDelivered: selectedPackage.metrics.impressionsDelivered,
                  totalImpressions: selectedPackage.dailyReports.reduce((sum, r) => sum + r.impressions, 0),
                  totalClicks: selectedPackage.metrics.clicks,
                  averageCTR: selectedPackage.metrics.ctr,
                  progress: selectedPackage.metrics.progress
                })}
              </>
            );
          })()
        )}

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
