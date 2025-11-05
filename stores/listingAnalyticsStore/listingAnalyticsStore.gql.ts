export const GET_MY_LISTING_ANALYTICS_QUERY = `
  query GetMyListingAnalytics($listingId: ID!, $days: Int) {
    getMyListingAnalytics(listingId: $listingId, days: $days) {
      viewCount
      wishlistCount
      daysOnMarket
      engagementRate
      viewsToday
      performanceIndicator
      comparisonText
      viewsByDate {
        date
        views
      }
    }
  }
`;

export const GET_MY_ANALYTICS_SUMMARY_QUERY = `
  query GetMyAnalyticsSummary($days: Int) {
    getMyAnalyticsSummary(days: $days) {
      totalViews
      totalWishlists
      activeListingsCount
      avgEngagementRate
      totalViewsToday
      totalWishlistsToday
      viewsLast30Days {
        date
        views
      }
      topPerformers {
        id
        title
        viewCount
        wishlistCount
        engagementRate
        performanceIndicator
      }
    }
  }
`;
