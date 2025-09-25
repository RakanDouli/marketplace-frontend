// GraphQL queries and mutations for admin listings management

export const LISTINGS_SEARCH_QUERY = `
  query ListingsSearch($filter: ListingFilterInput, $limit: Int, $offset: Int) {
    listingsSearch(filter: $filter, limit: $limit, offset: $offset) {
      id
      title
      priceMinor
      status
    }
  }
`;

export const LISTINGS_COUNT_QUERY = `
  query ListingsCount($filter: ListingFilterInput) {
    listingsAggregations(filter: $filter) {
      totalResults
    }
  }
`;

export const UPDATE_LISTING_MUTATION = `
  mutation UpdateListing($id: ID!, $input: UpdateListingInput!) {
    updateListing(id: $id, input: $input) {
      id
      title
      description
      priceMinor
      status
      imageKeys
      updatedAt
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

export const MODERATE_LISTING_STATUS_MUTATION = `
  mutation ModerateListingStatus($id: ID!, $status: ListingStatus!) {
    moderateListingStatus(id: $id, status: $status) {
      id
      status
      updatedAt
    }
  }
`;

export const DELETE_LISTING_MUTATION = `
  mutation DeleteListing($id: ID!) {
    deleteListing(id: $id)
  }
`;

export const GET_LISTING_STATUSES_QUERY = `
  query GetListingStatuses {
    getListingStatuses
  }
`;

export const GET_LISTING_BY_ID_QUERY = `
  query GetListingById($id: ID!) {
    listingById(id: $id) {
      id
      title
      description
      priceMinor
      status
      imageKeys
      createdAt
      updatedAt
      categoryId
      sellerType
      sellerLabel
      sellerBadge
      allowBidding
      biddingStartPrice
      province
      city
      area
      locationLink
      lat
      lng
      specs
      specsDisplay
      prices {
        value
        currency
      }
      user {
        id
        name
        email
        role
        status
        accountType
        companyName
        sellerBadge
        businessVerified
        phone
        contactPhone
        website
        createdAt
        updatedAt
      }
    }
  }
`;

export const UPDATE_USER_MUTATION = `
  mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
    updateUser(id: $id, input: $input) {
      id
      email
      name
      role
      status
      accountType
      sellerBadge
      businessVerified
      updatedAt
    }
  }
`;