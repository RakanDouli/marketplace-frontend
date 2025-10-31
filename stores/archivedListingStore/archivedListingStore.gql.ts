export const GET_ARCHIVED_LISTING_QUERY = `
  query GetArchivedListing($id: ID!) {
    archivedListing(id: $id) {
      id
      originalListingId
      archivalReason
      archivedAt
      viewCount
      wishlistCount
      chatCount
      bidCount
      daysToSell
      title
      description
      priceMinor
      specsDisplay
      specsJson
      videoUrl
      imageKeys
      location {
        province
        city
        area
        link
      }
      allowBidding
      biddingStartPrice
      accountType
      accountLabel
      accountBadge
      status
      moderationScore
      moderationFlags
      rejectionReason
      rejectionMessage
      reviewedBy
      reviewedAt
      createdAt
      updatedAt
      prices {
        currency
        value
      }
      category {
        id
        slug
        name
        nameAr
      }
      user {
        id
        name
        email
        accountType
        accountBadge
        companyName
        businessVerified
        avatar
      }
    }
  }
`;

export const GET_MY_ARCHIVED_LISTINGS_QUERY = `
  query GetMyArchivedListings {
    myArchivedListings {
      id
      originalListingId
      archivalReason
      archivedAt
      title
      priceMinor
      imageKeys
      location {
        province
        city
        area
        link
      }
      viewCount
      prices {
        currency
        value
      }
      category {
        id
        nameAr
      }
    }
  }
`;

export const ARCHIVE_MY_LISTING_MUTATION = `
  mutation ArchiveMyListing($listingId: ID!, $reason: ArchivalReason!) {
    archiveMyListing(listingId: $listingId, reason: $reason) {
      id
      archivalReason
      archivedAt
    }
  }
`;
