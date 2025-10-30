// GraphQL queries for metadata (enums and dropdown options)

// ===== USER METADATA =====

export const GET_USER_STATUSES_QUERY = `
  query GetUserStatuses {
    getUserStatuses
  }
`;

export const GET_USER_ROLES_QUERY = `
  query GetUserRoles {
    getUserRoles
  }
`;

export const GET_ACCOUNT_TYPES_QUERY = `
  query GetAccountTypes {
    getAccountTypes
  }
`;

export const GET_ACCOUNT_BADGES_QUERY = `
  query GetAccountBadges {
    getAccountBadges
  }
`;

// ===== LISTING METADATA =====

export const GET_LISTING_STATUSES_QUERY = `
  query GetListingStatuses {
    getListingStatuses
  }
`;

export const GET_REJECTION_REASONS_QUERY = `
  query GetRejectionReasons {
    getRejectionReasons
  }
`;

// ===== SUBSCRIPTION METADATA =====

export const GET_BILLING_CYCLES_QUERY = `
  query GetBillingCycles {
    getBillingCycles
  }
`;

export const GET_SUBSCRIPTION_STATUSES_QUERY = `
  query GetSubscriptionStatuses {
    getSubscriptionStatuses
  }
`;

export const GET_SUBSCRIPTION_ACCOUNT_TYPES_QUERY = `
  query GetSubscriptionAccountTypes {
    getSubscriptionAccountTypes
  }
`;

// ===== ATTRIBUTE METADATA =====

export const GET_ATTRIBUTE_TYPES_QUERY = `
  query GetAttributeTypes {
    getAttributeTypes
  }
`;

export const GET_ATTRIBUTE_VALIDATIONS_QUERY = `
  query GetAttributeValidations {
    getAttributeValidations
  }
`;

export const GET_ATTRIBUTE_STORAGE_TYPES_QUERY = `
  query GetAttributeStorageTypes {
    getAttributeStorageTypes
  }
`;

// ===== AD SYSTEM METADATA =====

export const GET_AD_MEDIA_TYPES_QUERY = `
  query GetAdMediaTypes {
    getAdMediaTypes
  }
`;

export const GET_AD_CAMPAIGN_STATUSES_QUERY = `
  query GetAdCampaignStatuses {
    getAdCampaignStatuses
  }
`;

export const GET_AD_CLIENT_STATUSES_QUERY = `
  query GetAdClientStatuses {
    getAdClientStatuses
  }
`;

export const GET_CAMPAIGN_START_PREFERENCES_QUERY = `
  query GetCampaignStartPreferences {
    getCampaignStartPreferences
  }
`;

// ===== LOCATION METADATA =====

export const GET_PROVINCES_QUERY = `
  query GetProvinces {
    getProvinces {
      key
      nameAr
      coordinates {
        lat
        lng
      }
    }
  }
`;
