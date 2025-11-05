'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Text, Loading, Button } from '@/components/slices';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { useListingAnalyticsStore } from '@/stores/listingAnalyticsStore';
import { Eye, Heart, TrendingUp, BarChart3 } from 'lucide-react';
import styles from './Analytics.module.scss';

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, userPackage } = useUserAuthStore();
  const { analyticsSummary, isLoading, error, fetchAnalyticsSummary } = useListingAnalyticsStore();
  const [dateRange, setDateRange] = useState<number>(30);

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

    // Fetch summary data
    fetchAnalyticsSummary(dateRange);
  }, [user, userPackage, router, dateRange, fetchAnalyticsSummary]);

  const handleDateRangeChange = (days: number) => {
    setDateRange(days);
  };

  const handleListingSelect = (listingId: string) => {
    router.push(`/dashboard/analytics/${listingId}`);
  };

  const hasAnalyticsAccess = userPackage?.userSubscription?.analyticsAccess;
  if (!user || !hasAnalyticsAccess) {
    return null;
  }

  if (isLoading && !analyticsSummary) {
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
        <div className={styles.emptyState}>
          <Text variant="paragraph" color="error">{error}</Text>
        </div>
      </div>
    );
  }

  if (!analyticsSummary) {
    return null;
  }

  // Format numbers with commas (English numbers)
  const formatNumber = (num: number) => num.toLocaleString('en-US');

  // Get date range label
  const getDateRangeLabel = () => {
    if (dateRange === 7) return 'آخر 7 أيام';
    if (dateRange === 30) return 'آخر 30 يوم';
    if (dateRange === 90) return 'آخر 90 يوم';
    return 'كل الوقت';
  };

  // Performance indicator label
  const getPerformanceLabel = (indicator: string) => {
    switch (indicator) {
      case 'excellent': return 'ممتاز';
      case 'good': return 'جيد';
      case 'poor': return 'ضعيف';
      case 'very_poor': return 'ضعيف جداً';
      default: return indicator;
    }
  };

  // Performance indicator color
  const getPerformanceColor = (indicator: string) => {
    switch (indicator) {
      case 'excellent': return 'var(--success)';
      case 'good': return 'var(--primary)';
      case 'poor': return 'var(--warning)';
      case 'very_poor': return 'var(--error)';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div className={styles.dashboardPanel}>
      {/* Header with Date Selector */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <Text variant="h2">الإحصائيات</Text>
          <Text variant="paragraph" color="secondary">
            تحليل شامل لأداء إعلاناتك
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

      {/* Summary Stats - All Listings */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Text variant="h3">نظرة عامة - جميع الإعلانات</Text>
          <Text variant="small" color="secondary">{getDateRangeLabel()}</Text>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <Eye size={20} />
            </div>
            <div className={styles.statContent}>
              <Text variant="small" color="secondary">إجمالي المشاهدات</Text>
              <Text variant="h2">
                {formatNumber(analyticsSummary.totalViews)}
              </Text>
              {analyticsSummary.totalViewsToday > 0 && (
                <Text variant="small" color="success">
                  +{formatNumber(analyticsSummary.totalViewsToday)} اليوم
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
                {formatNumber(analyticsSummary.totalWishlists)}
              </Text>
              {analyticsSummary.totalWishlistsToday > 0 && (
                <Text variant="small" color="success">
                  +{formatNumber(analyticsSummary.totalWishlistsToday)} اليوم
                </Text>
              )}
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <TrendingUp size={20} />
            </div>
            <div className={styles.statContent}>
              <Text variant="small" color="secondary">الإعلانات النشطة</Text>
              <Text variant="h2">
                {formatNumber(analyticsSummary.activeListingsCount)}
              </Text>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <BarChart3 size={20} />
            </div>
            <div className={styles.statContent}>
              <Text variant="small" color="secondary">معدل التفاعل</Text>
              <Text variant="h2">
                {analyticsSummary.avgEngagementRate.toFixed(1)}%
              </Text>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performers - Listing Selector */}
      {analyticsSummary.topPerformers.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Text variant="h3">إعلاناتك</Text>
            <Text variant="small" color="secondary">
              اختر إعلان لمشاهدة التفاصيل
            </Text>
          </div>

          <div className={styles.listingsGrid}>
            {analyticsSummary.topPerformers.map((listing) => (
              <div
                key={listing.id}
                className={styles.listingCard}
                onClick={() => handleListingSelect(listing.id)}
              >
                <div className={styles.listingHeader}>
                  <Text variant="paragraph">
                    {listing.title}
                  </Text>
                  <span
                    className={styles.performanceBadge}
                    style={{ backgroundColor: getPerformanceColor(listing.performanceIndicator) }}
                  >
                    {getPerformanceLabel(listing.performanceIndicator)}
                  </span>
                </div>

                <div className={styles.listingStats}>
                  <div className={styles.listingStat}>
                    <Eye size={14} />
                    <Text variant="small">{formatNumber(listing.viewCount)}</Text>
                  </div>
                  <div className={styles.listingStat}>
                    <Heart size={14} />
                    <Text variant="small">{formatNumber(listing.wishlistCount)}</Text>
                  </div>
                  <div className={styles.listingStat}>
                    <TrendingUp size={14} />
                    <Text variant="small">{listing.engagementRate.toFixed(1)}%</Text>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
