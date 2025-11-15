export const PLACE_BID_MUTATION = `
  mutation PlaceBid($input: PlaceBidInput!) {
    placeBid(input: $input) {
      id
      listingId
      bidderId
      amount
      createdAt
      bidder {
        id
        name
        email
      }
    }
  }
`;

export const GET_LISTING_BIDS_QUERY = `
  query GetListingBids($listingId: ID!) {
    listingBids(listingId: $listingId) {
      id
      listingId
      bidderId
      amount
      createdAt
      bidder {
        id
        name
        email
      }
    }
  }
`;

export const GET_MY_BIDS_QUERY = `
  query GetMyBids {
    myBids {
      id
      listingId
      bidderId
      amount
      createdAt
      listing {
        id
        title
        imageKeys
      }
    }
  }
`;

export const GET_HIGHEST_BID_QUERY = `
  query GetHighestBid($listingId: ID!) {
    highestBid(listingId: $listingId) {
      id
      listingId
      bidderId
      amount
      createdAt
      bidder {
        id
        name
        email
      }
    }
  }
`;

export const GET_PUBLIC_LISTING_BIDS_QUERY = `
  query GetPublicListingBids($listingId: ID!) {
    publicListingBids(listingId: $listingId) {
      id
      listingId
      bidderId
      amount
      createdAt
      bidder {
        id
        name
        email
      }
    }
  }
`;
