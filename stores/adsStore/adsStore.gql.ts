// GraphQL queries for public ads fetching

export const GET_ACTIVE_ADS_BY_TYPE_QUERY = `
  query GetActiveAdsByType($adType: String!) {
    getActiveAdsByType(adType: $adType) {
      id
      campaignName
      description
      desktopMediaUrl
      mobileMediaUrl
      clickUrl
      openInNewTab
      status
      startDate
      endDate
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
