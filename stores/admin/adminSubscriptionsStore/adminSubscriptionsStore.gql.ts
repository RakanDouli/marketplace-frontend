// GraphQL queries and mutations for admin subscriptions management

export const GET_ALL_SUBSCRIPTIONS_QUERY = `
  query GetAllSubscriptions {
    allUserSubscriptions {
      id
      name
      title
      description
      price
      billingCycle
      maxListings
      maxImagesPerListing
      videoAllowed
      priorityPlacement
      analyticsAccess
      customBranding
      featuredListings
      status
      sortOrder
      isPublic
      isDefault
      accountType
      createdAt
      updatedAt
    }
  }
`;

export const GET_SUBSCRIPTION_BY_ID_QUERY = `
  query GetSubscriptionById($id: ID!) {
    userSubscription(id: $id) {
      id
      name
      title
      description
      price
      billingCycle
      maxListings
      maxImagesPerListing
      videoAllowed
      priorityPlacement
      analyticsAccess
      customBranding
      featuredListings
      status
      sortOrder
      isPublic
      isDefault
      accountType
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_SUBSCRIPTION_MUTATION = `
  mutation CreateSubscription($input: CreateUserSubscriptionInput!) {
    createUserSubscription(input: $input) {
      id
      name
      title
      description
      price
      billingCycle
      maxListings
      maxImagesPerListing
      videoAllowed
      priorityPlacement
      analyticsAccess
      customBranding
      featuredListings
      status
      sortOrder
      isPublic
      isDefault
      accountType
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_SUBSCRIPTION_MUTATION = `
  mutation UpdateSubscription($input: UpdateUserSubscriptionInput!) {
    updateUserSubscription(input: $input) {
      id
      name
      title
      description
      price
      billingCycle
      maxListings
      maxImagesPerListing
      videoAllowed
      priorityPlacement
      analyticsAccess
      customBranding
      featuredListings
      status
      sortOrder
      isPublic
      isDefault
      accountType
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_SUBSCRIPTION_MUTATION = `
  mutation DeleteSubscription($id: ID!) {
    deleteUserSubscription(id: $id)
  }
`;
