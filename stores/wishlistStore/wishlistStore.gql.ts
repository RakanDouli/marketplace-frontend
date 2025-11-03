export const ADD_TO_WISHLIST_MUTATION = `
  mutation AddToWishlist($listingId: ID!, $isArchived: Boolean) {
    addToWishlist(listingId: $listingId, isArchived: $isArchived)
  }
`;

export const REMOVE_FROM_WISHLIST_MUTATION = `
  mutation RemoveFromWishlist($listingId: ID!, $isArchived: Boolean) {
    removeFromWishlist(listingId: $listingId, isArchived: $isArchived)
  }
`;

export const MY_WISHLIST_QUERY = `
  query MyWishlist {
    myWishlist {
      id
      title
      priceMinor
      status
      imageKeys
      wishlistCount
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
      user {
        id
        name
        accountType
        accountBadge
        companyName
        businessVerified
      }
    }
  }
`;

export const IS_IN_MY_WISHLIST_QUERY = `
  query IsInMyWishlist($listingId: ID!, $isArchived: Boolean) {
    isInMyWishlist(listingId: $listingId, isArchived: $isArchived)
  }
`;
