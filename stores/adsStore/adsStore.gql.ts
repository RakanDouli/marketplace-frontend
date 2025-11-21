// GraphQL queries for public ads fetching

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
      bannerSlot {
        id
        enabled
      }
      betweenListingsSlot {
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
