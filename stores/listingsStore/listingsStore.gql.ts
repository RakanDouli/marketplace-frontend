// GraphQL queries for ListingsStore
// All listings-related queries organized by view type for optimized payload

// Grid view query - Minimal data for card view
export const LISTINGS_GRID_QUERY = `
  query ListingsGrid($filter: ListingFilterInput, $limit: Int, $offset: Int) {
    listingsSearch(filter: $filter, limit: $limit, offset: $offset) {
      id
      title
      priceMinor
      imageKeys
      categoryId
      sellerType
      city
      province
      specs
      specsDisplay
      prices {
        value
        currency
      }
    }
  }
`;

// List view query - More data than grid, less than full
export const LISTINGS_LIST_QUERY = `
  query ListingsList($filter: ListingFilterInput, $limit: Int, $offset: Int) {
    listingsSearch(filter: $filter, limit: $limit, offset: $offset) {
      id
      title
      description
      priceMinor
      imageKeys
      createdAt
      categoryId
      sellerType
      city
      province
      specs
      specsDisplay
      prices {
        value
        currency
      }
    }
  }
`;

// Detail view query - Full data
export const LISTINGS_DETAIL_QUERY = `
  query ListingsDetail($filter: ListingFilterInput, $limit: Int, $offset: Int) {
    listingsSearch(filter: $filter, limit: $limit, offset: $offset) {
      id
      title
      description
      priceMinor
      status
      imageKeys
      createdAt
      categoryId
      sellerType
      city
      province
      specs
      specsDisplay
      prices {
        value
        currency
      }
    }
  }
`;

// Full search query - Complete data (fallback)
export const LISTINGS_SEARCH_QUERY = `
  query ListingsSearch($filter: ListingFilterInput, $limit: Int, $offset: Int) {
    listingsSearch(filter: $filter, limit: $limit, offset: $offset) {
      id
      title
      description
      priceMinor
      status
      imageKeys
      createdAt
      categoryId
      sellerType
      city
      province
      specs
      specsDisplay
      prices {
        value
        currency
      }
    }
  }
`;


// Query selector based on view type for optimal payload
export const getQueryByViewType = (viewType: 'grid' | 'list' | 'detail'): string => {
  switch (viewType) {
    case 'grid':
      return LISTINGS_GRID_QUERY;
    case 'list':
      return LISTINGS_LIST_QUERY;
    case 'detail':
      return LISTINGS_DETAIL_QUERY;
    default:
      return LISTINGS_SEARCH_QUERY;
  }
};