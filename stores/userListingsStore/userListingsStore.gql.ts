export const MY_LISTINGS_QUERY = `
  query MyListings($status: ListingStatus, $limit: Int, $offset: Int) {
    myListings(status: $status, limit: $limit, offset: $offset) {
      id
      title
      priceMinor
      status
      imageKeys
      viewCount
      createdAt
      updatedAt
      rejectionReason
      rejectionMessage
      location {
        province
      }
      category {
        id
        name
        nameAr
        slug
      }
    }
  }
`;

export const MY_LISTINGS_COUNT_QUERY = `
  query MyListingsCount($status: ListingStatus) {
    myListingsCount(status: $status)
  }
`;

export const MY_LISTING_BY_ID_QUERY = `
  query MyListingByIdV2($id: ID!) {
    myListingById(id: $id) {
      id
      title
      description
      priceMinor
      status
      imageKeys
      videoUrl
      specs
      specsDisplay
      location {
        province
        city
        area
        link
      }
      allowBidding
      biddingStartPrice
      rejectionReason
      rejectionMessage
      createdAt
      updatedAt
      category {
        id
        name
        nameAr
        slug
      }
    }
  }
`;

export const CREATE_MY_LISTING_MUTATION = `
  mutation CreateMyListing($input: CreateListingInput!) {
    createMyListing(input: $input) {
      id
      title
      status
      priceMinor
      imageKeys
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_MY_LISTING_MUTATION = `
  mutation UpdateMyListing($id: ID!, $input: UpdateListingInput!) {
    updateMyListing(id: $id, input: $input) {
      id
      title
      status
      allowBidding
      biddingStartPrice
      updatedAt
    }
  }
`;

export const DELETE_MY_LISTING_MUTATION = `
  mutation DeleteMyListing($id: ID!, $archivalReason: ArchivalReason!) {
    deleteMyListing(id: $id, archivalReason: $archivalReason)
  }
`;
