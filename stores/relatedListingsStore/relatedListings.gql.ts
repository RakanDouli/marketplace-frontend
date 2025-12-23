// GraphQL queries for related listings

export const RELATED_LISTINGS_QUERY = `
  query RelatedListings($listingId: ID!, $type: String!, $limit: Int) {
    relatedListings(listingId: $listingId, type: $type, limit: $limit) {
      id
      title
      priceMinor
      imageKeys
      categoryId
      accountType
      location {
        province
        city
      }
      specs
      specsDisplay
      user {
        id
      }
    }
  }
`;

export const LISTING_BRAND_NAME_QUERY = `
  query ListingBrandName($listingId: ID!) {
    listingBrandName(listingId: $listingId)
  }
`;
