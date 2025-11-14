export const GET_ACTIVE_AD_PACKAGES_QUERY = `
  query GetActiveAdPackages {
    activeAdPackages {
      id
      packageName
      description
      adType
      placement
      format
      dimensions {
        desktop {
          width
          height
        }
        mobile {
          width
          height
        }
      }
      durationDays
      impressionLimit
      basePrice
      currency
      mediaRequirements
      isActive
    }
  }
`;
