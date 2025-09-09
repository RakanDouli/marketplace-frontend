import { gql } from '@apollo/client';

export const GET_LISTINGS = gql`
  query GetListings($limit: Float, $offset: Float, $filter: ListingFilterInput) {
    listingsSearch(limit: $limit, offset: $offset, filter: $filter) {
      id
      title
      prices {
        value
        currency
      }
      city
      country
      status
      allowBidding
      biddingStartPrice
      brandId
      modelId
      specs
      imageKeys
      createdAt
      updatedAt
    }
  }
`;

export const GET_LISTING_BY_ID = gql`
  query GetListingById($id: ID!) {
    listingById(id: $id) {
      id
      title
      description
      prices {
        value
        currency
      }
      city
      country
      status
      allowBidding
      biddingStartPrice
      brandId
      modelId
      specs
      imageKeys
      sellerLabel
      sellerBadge
      sellerType
      lat
      lng
      createdAt
      updatedAt
    }
  }
`;

export const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      id
      name
      slug
    }
  }
`;

export const GET_BRANDS = gql`
  query GetBrands($categoryId: ID, $q: String) {
    brands(categoryId: $categoryId, q: $q) {
      id
      name
      slug
    }
  }
`;

export const GET_MODELS = gql`
  query GetModels($brandId: ID, $q: String) {
    models(brandId: $brandId, q: $q) {
      id
      name
      slug
    }
  }
`;

export const GET_LISTING_BIDS = gql`
  query GetListingBids($listingId: ID!) {
    listingBids(listingId: $listingId) {
      id
      amount
      createdAt
      # Add bidder info when available
    }
  }
`;

export const GET_LISTINGS_COUNT = gql`
  query GetListingsCount {
    listingsCount
  }
`;