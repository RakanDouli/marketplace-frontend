// GraphQL queries for FiltersStore
// All filter-related queries for attributes, aggregations, and dynamic data

// Get dynamic attributes for a specific category
export const GET_CATEGORY_ATTRIBUTES_QUERY = `
  query GetAttributesByCategorySlug($categorySlug: String!) {
    getAttributesByCategorySlug(categorySlug: $categorySlug) {
      id
      key
      name
      type
      validation
      sortOrder
      group
      groupOrder
      isActive
      isGlobal
      showInGrid
      showInList
      showInDetail
      showInFilter
      config
      options {
        id
        key
        value
        sortOrder
        isActive
        showInGrid
        showInList
        showInDetail
        showInFilter
      }
    }
  }
`;

// Get all categories (used to resolve category slug to ID)
export const CATEGORIES_QUERY = `
  query GetCategories {
    categories {
      id
      name
      nameAr
      slug
      isActive
      supportedListingTypes
    }
  }
`;

// Get listing aggregations for filter counts and options
// Updated for performance optimizations - unified attributes structure
export const GET_LISTING_AGGREGATIONS_QUERY = `
  query GetListingAggregations($filter: ListingFilterInput) {
    listingsAggregations(filter: $filter) {
      totalResults
      provinces {
        value
        count
      }
      attributes {
        field
        totalCount
        options {
          value
          count
          key
          modelId
          modelName
        }
      }
    }
  }
`;

// Future: Get provinces/locations (placeholder for when we have location data)
export const GET_PROVINCES_QUERY = `
  query GetProvinces {
    provinces {
      name
      code
    }
  }
`;

// Future: Get cities by province (placeholder for when we have location data)
export const GET_CITIES_QUERY = `
  query GetCities($province: String!) {
    cities(province: $province) {
      name
      province
    }
  }
`;