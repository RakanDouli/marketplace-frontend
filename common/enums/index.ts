/**
 * Common Enums
 *
 * Frontend mirror of backend enums for type safety.
 * These should match exactly with backend enum VALUES (lowercase).
 */

/**
 * Account Type Enum
 *
 * IMPORTANT: Values are lowercase to match backend GraphQL enum
 * Backend: marketplace-backend/src/common/enums/account-type.enum.ts
 */
export enum AccountType {
  INDIVIDUAL = "individual", // Individual sellers
  DEALER = "dealer",         // Car dealers
  BUSINESS = "business",     // Business accounts
}

/**
 * For dynamic dropdowns, use:
 * - useMetadataStore().accountTypes (fetches from backend)
 * - ACCOUNT_TYPE_LABELS from @/constants/metadata-labels
 */
