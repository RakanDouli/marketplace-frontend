export interface DailyViews {
  date: string; // YYYY-MM-DD
  views: number;
}

export interface ListingPerformance {
  id: string;
  title: string;
  viewCount: number;
  wishlistCount: number;
  engagementRate: number;
  performanceIndicator: string; // 'excellent' | 'good' | 'poor' | 'very_poor'
}

export interface ListingAnalytics {
  viewCount: number;
  wishlistCount: number;
  daysOnMarket: number;
  engagementRate: number;
  viewsToday: number;
  performanceIndicator: string;
  comparisonText: string;
  viewsByDate: DailyViews[];
}

export interface AnalyticsSummary {
  totalViews: number;
  totalWishlists: number;
  activeListingsCount: number;
  avgEngagementRate: number;
  totalViewsToday: number;
  totalWishlistsToday: number;
  viewsLast30Days: DailyViews[];
  topPerformers: ListingPerformance[];
}
