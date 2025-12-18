'use client';

import React, { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Text, Loading, Button } from '@/components/slices';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { useListingAnalyticsStore } from '@/stores/listingAnalyticsStore';
import { BarChart3, Eye, Heart, TrendingUp, Calendar, ArrowRight, ArrowLeft } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './ListingAnalytics.module.scss';

export default function ListingAnalyticsPage() {
  const router = useRouter();
  const params = useParams();
  const listingId = params.listingId as string;
  const { user, userPackage } = useUserAuthStore();
  const { listingAnalytics, isLoading, error, fetchListingAnalytics } = useListingAnalyticsStore();
  const [dateRange, setDateRange] = React.useState<number>(30);

  // Check if user has access to analytics
  useEffect(() => {
    if (!user) {
      router.push('/dashboard');
      return;
    }

    const hasAnalyticsAccess = userPackage?.userSubscription?.analyticsAccess;
    if (!hasAnalyticsAccess) {
      router.push('/dashboard');
      return;
    }

    // Fetch listing analytics
    if (listingId) {
      fetchListingAnalytics(listingId, dateRange);
    }
  }, [user, userPackage, router, listingId, dateRange, fetchListingAnalytics]);

  const handleDateRangeChange = (days: number) => {
    setDateRange(days);
    fetchListingAnalytics(listingId, days);
  };

  const hasAnalyticsAccess = userPackage?.userSubscription?.analyticsAccess;
  if (!user || !hasAnalyticsAccess) {
    return null;
  }

  if (isLoading && !listingAnalytics) {
    return (
      <div className={styles.dashboardPanel}>
        <div className={styles.loadingContainer}>
          <Loading type="svg" />
          <Text variant="paragraph">جاري تحميل الإحصائيات...</Text>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.dashboardPanel}>
        <Button
          variant='link'
          href='/dashboard/analytics'
          icon={<ArrowLeft size={18} />}
        >
          عودة إلى الإحصائيات
        </Button>
        <div className={styles.emptyState}>
          <Text variant="paragraph" color="error">{error}</Text>
        </div>
      </div>
    );
  }

  if (!listingAnalytics) {
    return null;
  }

  // Format numbers with commas (English numbers)
  const formatNumber = (num: number) => num.toLocaleString('en-US');

  // Performance indicator helpers
  const getPerformanceLabel = (indicator: string) => {
    switch (indicator) {
      case 'excellent': return 'ممتاز';
      case 'good': return 'جيد';
      case 'poor': return 'ضعيف';
      case 'very_poor': return 'ضعيف جداً';
      default: return 'غير محدد';
    }
  };

  const getPerformanceColor = (indicator: string) => {
    switch (indicator) {
      case 'excellent': return 'var(--success)';
      case 'good': return 'var(--info)';
      case 'poor': return 'var(--warning)';
      case 'very_poor': return 'var(--error)';
      default: return 'var(--text-secondary)';
    }
  };

  // Get marker position based on performance indicator (0-100%)
  // LTR: Red (very_poor) on left, Green (excellent) on right
  const getMarkerPosition = (indicator: string) => {
    switch (indicator) {
      case 'very_poor': return 8;   // Left (red zone)
      case 'poor': return 28;       // Orange zone
      case 'good': return 55;       // Blue zone
      case 'excellent': return 85;  // Right (green zone)
      default: return 50;
    }
  };

  // Format large numbers for Y-axis (e.g., 1000 → "1k", 1500 → "1.5k")
  const formatYAxis = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
    }
    return value.toString();
  };

  // Format date for chart (e.g., "Nov 5")
  const formatChartDate = (dateString: string | number) => {
    // Handle both string dates (YYYY-MM-DD) and timestamps
    const date = typeof dateString === 'number'
      ? new Date(dateString)
      : new Date(dateString + 'T00:00:00'); // Add time to avoid timezone issues

    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateString);
      return String(dateString);
    }

    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
  };

  // Get date range label
  const getDateRangeLabel = () => {
    if (dateRange === 7) return 'آخر 7 أيام';
    if (dateRange === 30) return 'آخر 30 يوم';
    if (dateRange === 90) return 'آخر 90 يوم';
    return 'كل الوقت';
  };

  return (<>
    {/* Back Button */}
    <Button
      variant='link'
      href='/dashboard/analytics'
      icon={<ArrowLeft size={18} />}
      className={styles.backButton}
    >
      عودة إلى الإحصائيات
    </Button>

    <div className={styles.dashboardPanel}>

      {/* Header with Date Selector */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <Text variant="h2">تفاصيل الإعلان</Text>
          <Text variant="paragraph" color="secondary">
            {getDateRangeLabel()}
          </Text>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.dateRangeSelector}>
            <Button
              variant={dateRange === 7 ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleDateRangeChange(7)}
            >
              7 أيام
            </Button>
            <Button
              variant={dateRange === 30 ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleDateRangeChange(30)}
            >
              30 يوم
            </Button>
            <Button
              variant={dateRange === 90 ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleDateRangeChange(90)}
            >
              90 يوم
            </Button>
            <Button
              variant={dateRange === -1 ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleDateRangeChange(-1)}
            >
              كل الوقت
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Eye size={20} />
          </div>
          <div className={styles.statContent}>
            <Text variant="small" color="secondary">المشاهدات</Text>
            <Text variant="h2">
              {formatNumber(listingAnalytics.viewCount)}
            </Text>
            {listingAnalytics.viewsToday > 0 && (
              <Text variant="small" color="success">
                +{formatNumber(listingAnalytics.viewsToday)} اليوم
              </Text>
            )}
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Heart size={20} />
          </div>
          <div className={styles.statContent}>
            <Text variant="small" color="secondary">المفضلة</Text>
            <Text variant="h2">
              {formatNumber(listingAnalytics.wishlistCount)}
            </Text>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Calendar size={20} />
          </div>
          <div className={styles.statContent}>
            <Text variant="small" color="secondary">أيام في السوق</Text>
            <Text variant="h2">
              {formatNumber(listingAnalytics.daysOnMarket)}
            </Text>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <TrendingUp size={20} />
          </div>
          <div className={styles.statContent}>
            <Text variant="small" color="secondary">معدل التفاعل</Text>
            <Text variant="h2">
              {listingAnalytics.engagementRate.toFixed(1)}%
            </Text>
          </div>
        </div>
      </div>

      {/* Performance Indicator Bar (Google-style) */}
      {listingAnalytics.performanceIndicator && (
        <div className={styles.performanceCard}>
          <div className={styles.performanceHeader}>
            <TrendingUp size={20} />
            <Text variant="h4" className={styles.performanceTitle}>مؤشر الأداء</Text>
            <span
              className={styles.performanceBadge}
              style={{ backgroundColor: getPerformanceColor(listingAnalytics.performanceIndicator) }}
            >
              {getPerformanceLabel(listingAnalytics.performanceIndicator)}
            </span>
          </div>

          <div className={styles.performanceBar}>
            <div
              className={styles.performanceMarker}
              style={{ left: `${getMarkerPosition(listingAnalytics.performanceIndicator)}%` }}
            />
          </div>

          <div className={styles.performanceScale}>
            <Text variant="small" color="error">ضعيف جداً</Text>
            <Text variant="small" color="warning">ضعيف</Text>
            <Text variant="small" color="info">جيد</Text>
            <Text variant="small" color="success">ممتاز</Text>
          </div>
        </div>
      )}

      {/* Performance Comparison */}
      {listingAnalytics.comparisonText && (
        <div className={styles.comparisonCard}>
          <Text variant="paragraph">{listingAnalytics.comparisonText}</Text>
        </div>
      )}

      {/* Views Chart */}
      <div className={styles.chartCard}>
        <Text variant="h4">المشاهدات</Text>

        {listingAnalytics.viewsByDate.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={listingAnalytics.viewsByDate}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="date"
                stroke="var(--text-secondary)"
                style={{ fontSize: '12px', direction: 'ltr' }}
                tickFormatter={formatChartDate}
              />
              <YAxis
                stroke="var(--text-secondary)"
                style={{ fontSize: '12px' }}
                tickFormatter={formatYAxis}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'var(--text)' }}
              />
              <Line
                type="monotone"
                dataKey="views"
                stroke="var(--primary)"
                strokeWidth={2}
                dot={{ fill: 'var(--primary)', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className={styles.chartPlaceholder}>
            <BarChart3 size={48} className={styles.chartIcon} />
            <Text variant="paragraph" color="secondary">
              لا توجد بيانات مشاهدات بعد
            </Text>
          </div>
        )}
      </div>
    </div></>
  );
}
