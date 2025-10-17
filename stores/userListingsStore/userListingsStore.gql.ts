export const MY_LISTINGS_QUERY = `
  query MyListings($status: ListingStatus, $limit: Int, $offset: Int) {
    myListings(status: $status, limit: $limit, offset: $offset) {
      id
      title
      priceMinor
      status
      imageKeys
      createdAt
      updatedAt
      category {
        id
        name
        nameAr
        slug
      }
      prices {
        currency
        value
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
  query MyListingById($id: ID!) {
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
      location
      allowBidding
      biddingStartPrice
      createdAt
      updatedAt
      category {
        id
        name
        nameAr
        slug
      }
      prices {
        currency
        value
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
      updatedAt
    }
  }
`;

export const DELETE_MY_LISTING_MUTATION = `
  mutation DeleteMyListing($id: ID!, $soldViaPlatform: Boolean) {
    deleteMyListing(id: $id, soldViaPlatform: $soldViaPlatform)
  }
`;
