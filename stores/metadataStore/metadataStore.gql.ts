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

// ===== LISTING METADATA =====

export const GET_SELLER_TYPES_QUERY = `
  query GetSellerTypes {
    getSellerTypes
  }
`;

export const GET_LISTING_STATUSES_QUERY = `
  query GetListingStatuses {
    getListingStatuses
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
