// 🚀 PROGRESSIVE LOADING QUERIES - Optimized for Syrian Internet
// These queries are designed for fast loading on slow connections

// ⚡ ULTRA-MINIMAL Grid Query - Critical data only (< 5KB payload)
export const LISTINGS_GRID_MINIMAL_QUERY = `
  query ListingsGridMinimal($filter: ListingFilterInput, $limit: Int, $offset: Int) {
    listingsSearch(filter: $filter, limit: $limit, offset: $offset) {
      id
      title
      priceMinor
      province
      imageKeys(limit: 1)  # Only first image for thumbnail
      sellerType
      # Essential specs only - determined by showInGrid flags
      specs(fields: ["brandId", "modelId", "year", "fuel_type"])
    }

    # Always include aggregations for filter counts (shared across views)
    listingsAggregations(filter: $filter) {
      totalResults
      attributes {
        field
        options {
          value
          count
          key
        }
      }
      provinces {
        value
        count
      }
    }
  }
`;

// 📋 LIST View Query - Slightly more data but still fast (< 10KB payload)
export const LISTINGS_LIST_OPTIMIZED_QUERY = `
  query ListingsListOptimized($filter: ListingFilterInput, $limit: Int, $offset: Int) {
    listingsSearch(filter: $filter, limit: $limit, offset: $offset) {
      id
      title
      priceMinor
      province
      city
      imageKeys(limit: 2)  # Thumbnail + one additional
      createdAt
      sellerType
      # List specs - more than grid, less than detail
      specs(fields: ["brandId", "modelId", "year", "fuel_type", "mileage", "transmission"])
      prices {
        value
        currency
      }
    }

    # Reuse aggregations from cache or fetch fresh
    listingsAggregations(filter: $filter) {
      totalResults
      attributes {
        field
        options {
          value
          count
          key
        }
      }
    }
  }
`;

// 🔍 SINGLE LISTING Detail Query - Lazy loaded on demand
export const LISTING_DETAIL_FULL_QUERY = `
  query ListingDetailFull($id: String!) {
    listing: getListingById(id: $id) {
      id
      title
      description
      priceMinor
      province
      city
      area
      status
      imageKeys  # All images for gallery
      createdAt
      sellerType
      specs      # ALL specs for detail view
      prices {
        value
        currency
      }

      # Additional detail data
      user {
        id
        name
        profileImage
      }

      # Related listings (lazy loaded)
      relatedListings: similarListings(limit: 4) {
        id
        title
        priceMinor
        imageKeys(limit: 1)
        specs(fields: ["brandId", "modelId", "year"])
      }
    }
  }
`;

// 🏃‍♂️ SUPER FAST Initial Load - For first page paint (< 3KB)
export const CATEGORY_INITIAL_LOAD_QUERY = `
  query CategoryInitialLoad($categorySlug: String!) {
    # Just get 6 featured/latest listings for immediate display
    featuredListings: listingsSearch(
      filter: { categorySlug: $categorySlug }
      limit: 6
      offset: 0
    ) {
      id
      title
      priceMinor
      imageKeys(limit: 1)
      sellerType
    }

    # Get essential filter structure (cached aggressively)
    categoryAttributes: getAttributesByCategorySlug(categorySlug: $categorySlug) {
      key
      name
      type
      showInFilter
      options(limit: 10) {  # Limit options for initial load
        key
        value
        sortOrder
      }
    }
  }
`;

// 📊 AGGREGATIONS ONLY - For filter updates (< 2KB)
export const AGGREGATIONS_ONLY_QUERY = `
  query AggregationsOnly($filter: ListingFilterInput) {
    listingsAggregations(filter: $filter) {
      totalResults
      attributes {
        field
        totalCount
        options {
          value
          count
          key
        }
      }
      provinces {
        value
        count
      }
      cities {
        value
        count
      }
    }
  }
`;

// 🔄 PROGRESSIVE LOADING STRATEGY
export const PROGRESSIVE_LOADING_QUERIES = {
  // Stage 1: Immediate (< 3KB) - Show something instantly
  IMMEDIATE: CATEGORY_INITIAL_LOAD_QUERY,

  // Stage 2: Fast Grid (< 5KB) - Main content
  GRID: LISTINGS_GRID_MINIMAL_QUERY,

  // Stage 3: Rich List (< 10KB) - Enhanced view
  LIST: LISTINGS_LIST_OPTIMIZED_QUERY,

  // Stage 4: Full Detail (< 20KB) - On-demand
  DETAIL: LISTING_DETAIL_FULL_QUERY,

  // Stage 5: Aggregations (< 2KB) - Filter updates
  FILTERS: AGGREGATIONS_ONLY_QUERY
};

// 🎯 QUERY SELECTOR - Choose optimal query based on connection and view
export const getOptimalQuery = (
  viewType: 'grid' | 'list' | 'detail',
  connectionSpeed: 'slow' | 'medium' | 'fast' = 'slow',
  isInitialLoad: boolean = false
): string => {

  // For Syrian internet, assume slow by default
  if (connectionSpeed === 'slow') {
    if (isInitialLoad) {
      return PROGRESSIVE_LOADING_QUERIES.IMMEDIATE;
    }

    switch (viewType) {
      case 'grid':
        return PROGRESSIVE_LOADING_QUERIES.GRID;
      case 'list':
        return PROGRESSIVE_LOADING_QUERIES.LIST;
      case 'detail':
        return PROGRESSIVE_LOADING_QUERIES.DETAIL;
      default:
        return PROGRESSIVE_LOADING_QUERIES.GRID;
    }
  }

  // For faster connections, can use richer queries
  return viewType === 'detail'
    ? PROGRESSIVE_LOADING_QUERIES.DETAIL
    : PROGRESSIVE_LOADING_QUERIES.LIST;
};

// 🔧 SMART CACHING KEYS - For Apollo Cache optimization
export const getCacheKey = (
  viewType: string,
  filters: any,
  pagination: any
): string => {
  const filterStr = JSON.stringify(filters || {});
  const paginationStr = JSON.stringify(pagination || {});
  return `${viewType}-${btoa(filterStr)}-${btoa(paginationStr)}`.slice(0, 100);
};