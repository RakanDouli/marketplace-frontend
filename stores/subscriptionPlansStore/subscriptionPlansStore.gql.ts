export const GET_PUBLIC_SUBSCRIPTION_PLANS_QUERY = `
  query GetPublicSubscriptionPlans {
    userSubscriptions {
      id
      name
      title
      description
      monthlyPrice
      yearlyPrice
      yearlySavingsPercent
      maxListings
      maxImagesPerListing
      videoAllowed
      priorityPlacement
      analyticsAccess
      customBranding
      featuredListings
      accountType
      sortOrder
      status
      isPublic
      isDefault
      originalPrice
      discountPercentage
      discountLabel
      discountValidUntil
    }
  }
`;
