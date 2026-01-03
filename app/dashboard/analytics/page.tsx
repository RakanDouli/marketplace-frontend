'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Text, Loading, Button, MobileBackButton, Grid, StatCard, Container } from '@/components/slices';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { useListingAnalyticsStore } from '@/stores/listingAnalyticsStore';
import { Eye, Heart, TrendingUp, BarChart3 } from 'lucide-react';
import sharedStyles from '@/components/dashboard/SharedDashboardPanel.module.scss';
import styles from './Analytics.module.scss';

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, userPackage } = useUserAuthStore();
  const { analyticsSummary, isLoading, error, fetchAnalyticsSummary } = useListingAnalyticsStore();
  const [dateRange, setDateRange] = useState<number>(30);

  const hasAnalyticsAccess = userPackage?.userSubscription?.analyticsAccess;

  // Check if user has access to analytics
  useEffect(() => {
    // Wait for userPackage to load (undefined = still loading)
    if (userPackage === undefined) {
      return;
    }

    if (!user) {
      router.push('/dashboard');
      return;
    }

    if (!hasAnalyticsAccess) {
      router.push('/dashboard');
      return;
    }

    // Only fetch if user has access
    fetchAnalyticsSummary(dateRange);
  }, [user, userPackage, hasAnalyticsAccess, router, dateRange, fetchAnalyticsSummary]);

  const handleDateRangeChange = (days: number) => {
    setDateRange(days);
  };

  const handleListingSelect = (listingId: string) => {
    router.push(`/dashboard/analytics/${listingId}`);
  };

  // Show loading while userPackage is loading, or redirect if no access
  if (!user || userPackage === undefined) {
    return (
      <>
        <MobileBackButton
          onClick={() => router.push('/dashboard')}
          title="الإحصائيات"
        />
        <div className={sharedStyles.loadingState}>
          <Loading type="svg" />
        </div>
      </>
    );
  }

  // No access - will redirect via useEffect
  if (!hasAnalyticsAccess) {
    return null;
  }

  if (isLoading && !analyticsSummary) {
    return (
      <>
        <MobileBackButton
          onClick={() => router.push('/dashboard')}
          title="الإحصائيات"
        />
        <div className={sharedStyles.loadingState}>
          <Loading type="svg" />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <MobileBackButton
          onClick={() => router.push('/dashboard')}
          title="الإحصائيات"
        />
        <div className={sharedStyles.panel}>
          <Container paddingX="none" paddingY="none" background="bg" innerPadding="lg" innerBorder>
            <div className={styles.emptyState}>
              <Text variant="paragraph" color="error">{error}</Text>
            </div>
          </Container>
        </div>
      </>
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

  // Performance indicator color (matches detail page indicator)
  const getPerformanceColor = (indicator: string) => {
    switch (indicator) {
      case 'excellent': return 'var(--success)';
      case 'good': return 'var(--info)';
      case 'poor': return 'var(--warning)';
      case 'very_poor': return 'var(--error)';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <>
      <MobileBackButton
        onClick={() => router.push('/dashboard')}
        title="الإحصائيات"
      />
      <div className={sharedStyles.panel}>
        {/* Header with Date Selector */}
        <Container paddingX="none" paddingY="none" background="bg" innerPadding="lg" innerBorder>
          <div className={sharedStyles.sectionHeader}>
            <div>
              <Text variant="h2">الإحصائيات</Text>
              <Text variant="small" color="secondary">
                تحليل شامل لأداء إعلاناتك
              </Text>
            </div>
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
        </Container>

        {/* Summary Stats - All Listings */}
        <Container paddingX="none" paddingY="none" background="bg" innerPadding="lg" innerBorder>
          <div className={sharedStyles.sectionHeader}>
            <Text variant="h3">نظرة عامة - جميع الإعلانات</Text>
            <Text variant="small" color="secondary">{getDateRangeLabel()}</Text>
          </div>

          <Grid columns={4} gap="md">
            <StatCard
              title="إجمالي المشاهدات"
              value={formatNumber(analyticsSummary.totalViews)}
              subtitle={analyticsSummary.totalViewsToday > 0 ? `+${formatNumber(analyticsSummary.totalViewsToday)} اليوم` : undefined}
              icon={<Eye size={24} />}
            />
            <StatCard
              title="المفضلة"
              value={formatNumber(analyticsSummary.totalWishlists)}
              subtitle={analyticsSummary.totalWishlistsToday > 0 ? `+${formatNumber(analyticsSummary.totalWishlistsToday)} اليوم` : undefined}
              icon={<Heart size={24} />}
            />
            <StatCard
              title="الإعلانات النشطة"
              value={formatNumber(analyticsSummary.activeListingsCount)}
              icon={<TrendingUp size={24} />}
            />
            <StatCard
              title="معدل التفاعل"
              value={`${analyticsSummary.avgEngagementRate.toFixed(1)}%`}
              icon={<BarChart3 size={24} />}
            />
          </Grid>
        </Container>

        {/* Top Performers - Listing Selector */}
        {analyticsSummary.topPerformers.length > 0 && (
          <Container paddingX="none" paddingY="none" background="bg" innerPadding="lg" innerBorder>
            <div className={sharedStyles.sectionHeader}>
              <Text variant="h3">إعلاناتك</Text>
              <Text variant="small" color="secondary">
                اختر إعلان لمشاهدة التفاصيل
              </Text>
            </div>

            <Grid columns={3} mobileColumns={1} gap="md">
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
            </Grid>
          </Container>
        )}
      </div>
    </>
  );
}
