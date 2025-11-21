// GraphQL queries for public ads fetching

// Fetch all active ads at once (no filtering by type or placement)
export const GET_ALL_ACTIVE_ADS_QUERY = `
  query GetAllActiveAds {
    getAllActiveAds {
      id
      campaignName
      description
      status
      startDate
      endDate
      priority
      pacingMode
      impressionsPurchased
      impressionsDelivered
      packageBreakdown
      package {
        id
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
        placement
        format
      }
    }
  }
`;

// Legacy query - kept for backward compatibility if needed
export const GET_ACTIVE_ADS_BY_TYPE_QUERY = `
  query GetActiveAdsByType($adType: String!) {
    getActiveAdsByType(adType: $adType) {
      id
      campaignName
      description
      status
      startDate
      endDate
      priority
      pacingMode
      impressionsPurchased
      impressionsDelivered
      packageBreakdown
      package {
        id
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
        placement
        format
      }
    }
  }
`;

export const GET_ADSENSE_SETTINGS_QUERY = `
  query GetAdSenseSettings {
    getAdSenseSettings {
      clientId
      imageSlot {
        id
        enabled
      }
      videoSlot {
        id
        enabled
      }
    }
  }
`;
