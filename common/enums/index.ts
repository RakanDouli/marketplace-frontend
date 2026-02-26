/**
 * Common Enums
 *
 * Frontend mirror of backend enums for TYPE SAFETY in comparisons.
 * All enum VALUES are UPPERCASE to match GraphQL responses.
 *
 * Usage:
 * ```ts
 * import { UserStatus, ListingStatus } from '@/common/enums';
 *
 * // ✅ CORRECT - Type-safe, catches typos at compile time
 * if (listing.status === ListingStatus.ACTIVE) { }
 *
 * // ❌ WRONG - Typos not caught
 * if (listing.status === 'ACTVE') { }
 * ```
 *
 * For dropdowns: Use metadataStore + metadata-labels
 * For display: Use metadata-labels for Arabic translations
 */

// ===== ACCOUNT TYPE =====

/**
 * Account Type Enum
 * Backend: marketplace-backend/src/common/enums/account-type.enum.ts
 */
export enum AccountType {
  INDIVIDUAL = "INDIVIDUAL",
  DEALER = "DEALER",
  BUSINESS = "BUSINESS",
}

// ===== USER STATUS =====

/**
 * User Status Enum
 * Backend: marketplace-backend/src/common/enums/user-status.enum.ts
 */
export enum UserStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
  BANNED = "BANNED",
}

// ===== USER ROLE =====

/**
 * User Role Enum
 * Backend: marketplace-backend/src/common/enums/user-role.enum.ts
 */
export enum UserRole {
  USER = "USER",
  EDITOR = "EDITOR",
  ADMIN = "ADMIN",
  SUPER_ADMIN = "SUPER_ADMIN",
  ADS_MANAGER = "ADS_MANAGER",
}

// ===== LISTING TYPE =====

/**
 * Listing Type Enum
 * Backend: marketplace-backend/src/common/enums/listing-type.enum.ts
 */
export enum ListingType {
  SALE = "SALE",
  RENT = "RENT",
}

// ===== CONDITION =====

/**
 * Condition Enum
 * Backend: marketplace-backend/src/common/enums/condition.enum.ts
 */
export enum Condition {
  NEW = "NEW",
  USED_LIKE_NEW = "USED_LIKE_NEW",
  USED = "USED",
}

// ===== LISTING STATUS =====

/**
 * Listing Status Enum
 * Backend: marketplace-backend/src/common/enums/listing-status.enum.ts
 */
export enum ListingStatus {
  DRAFT = "DRAFT",
  PENDING_APPROVAL = "PENDING_APPROVAL",
  REJECTED = "REJECTED",
  ACTIVE = "ACTIVE",
  SOLD = "SOLD",
  SOLD_VIA_PLATFORM = "SOLD_VIA_PLATFORM",
  HIDDEN = "HIDDEN",
  ARCHIVED = "ARCHIVED",
}

// ===== REPORT ENUMS =====

/**
 * Report Status Enum
 * Backend: marketplace-backend/src/common/enums/report-reason.enum.ts
 */
export enum ReportStatus {
  PENDING = "PENDING",
  REQUIRES_HUMAN_REVIEW = "REQUIRES_HUMAN_REVIEW",
  REVIEWED = "REVIEWED",
  RESOLVED = "RESOLVED",
  DISMISSED = "DISMISSED",
}

/**
 * Report Entity Type Enum
 * Backend: marketplace-backend/src/common/enums/report-reason.enum.ts
 */
export enum ReportEntityType {
  THREAD = "THREAD",
  USER = "USER",
  LISTING = "LISTING",
}

/**
 * Report Reason Enum
 * Backend: marketplace-backend/src/common/enums/report-reason.enum.ts
 */
export enum ReportReason {
  SCAM = "SCAM",
  HARASSMENT = "HARASSMENT",
  INAPPROPRIATE = "INAPPROPRIATE",
  SPAM = "SPAM",
  FAKE_LISTING = "FAKE_LISTING",
  FAKE_ACCOUNT = "FAKE_ACCOUNT",
  IMPERSONATION = "IMPERSONATION",
  REPEAT_OFFENDER = "REPEAT_OFFENDER",
  OTHER = "OTHER",
}

// ===== TRANSACTION ENUMS =====

/**
 * Transaction Type Enum
 * Backend: marketplace-backend/src/common/enums/transaction-type.enum.ts
 */
export enum TransactionType {
  USER_SUBSCRIPTION = "USER_SUBSCRIPTION",
  AD_CAMPAIGN = "AD_CAMPAIGN",
  LISTING_PROMOTION = "LISTING_PROMOTION",
}

/**
 * Transaction Status Enum
 * Backend: marketplace-backend/src/common/enums/transaction-status.enum.ts
 */
export enum TransactionStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
  CANCELLED = "CANCELLED",
}

// ===== SUBSCRIPTION ENUMS =====

/**
 * Billing Cycle Enum
 * Backend: marketplace-backend/src/common/enums/billing-cycle.enum.ts
 */
export enum BillingCycle {
  FREE = "FREE",
  MONTHLY = "MONTHLY",
  YEARLY = "YEARLY",
}

/**
 * Subscription Status Enum
 * Backend: marketplace-backend/src/common/enums/subscription-status.enum.ts
 */
export enum SubscriptionStatus {
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
  PENDING = "PENDING",
}

// ===== AD SYSTEM ENUMS =====

/**
 * Ad Media Type Enum
 * Backend: marketplace-backend/src/common/enums/ad-media-type.enum.ts
 */
export enum AdMediaType {
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
}

/**
 * Ad Campaign Status Enum
 * Backend: marketplace-backend/src/common/enums/ad-campaign-status.enum.ts
 */
export enum AdCampaignStatus {
  DRAFT = "DRAFT",
  PAYMENT_SENT = "PAYMENT_SENT",
  PAID = "PAID",
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  PAUSED = "PAUSED",
}

/**
 * Ad Client Status Enum
 * Backend: marketplace-backend/src/common/enums/ad-client-status.enum.ts
 */
export enum AdClientStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
}

/**
 * Ad Placement Enum
 * Backend: marketplace-backend/src/common/enums/ad-placement.enum.ts
 */
export enum AdPlacement {
  HOMEPAGE_TOP = "HOMEPAGE_TOP",
  HOMEPAGE_MID = "HOMEPAGE_MID",
  BETWEEN_LISTINGS = "BETWEEN_LISTINGS",
  DETAIL_TOP = "DETAIL_TOP",
  DETAIL_BEFORE_DESCRIPTION = "DETAIL_BEFORE_DESCRIPTION",
  DETAIL_BOTTOM = "DETAIL_BOTTOM",
}

/**
 * Campaign Start Preference Enum
 * Backend: marketplace-backend/src/common/enums/campaign-start-preference.enum.ts
 */
export enum CampaignStartPreference {
  ASAP = "ASAP",
  SPECIFIC_DATE = "SPECIFIC_DATE",
}

// ===== MESSAGE ENUMS =====

/**
 * Message Status Enum
 * Backend: marketplace-backend/src/chats/chat-message.entity.ts
 */
export enum MessageStatus {
  SENT = "SENT",
  DELIVERED = "DELIVERED",
  READ = "READ",
}

// ===== ACCOUNT BADGE =====

/**
 * Account Badge Enum
 * Backend: marketplace-backend/src/common/enums/account-badge.enum.ts
 */
export enum AccountBadge {
  NONE = "NONE",
  VERIFIED = "VERIFIED",
  PREMIUM = "PREMIUM",
}

// ===== BRAND ENUMS =====

/**
 * Brand Source Enum
 */
export enum BrandSource {
  SYNC = "SYNC",
  MANUAL = "MANUAL",
}

/**
 * Brand Status Enum
 */
export enum BrandStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

// ===== ATTRIBUTE TYPE =====

/**
 * Attribute Type Enum
 * Backend: marketplace-backend/src/common/enums/attribute-type.enum.ts
 */
export enum AttributeType {
  SELECTOR = "SELECTOR",
  MULTI_SELECTOR = "MULTI_SELECTOR",
  RANGE = "RANGE",
  RANGE_SELECTOR = "RANGE_SELECTOR",
  CURRENCY = "CURRENCY",
  TEXT = "TEXT",
  TEXTAREA = "TEXTAREA",
  NUMBER = "NUMBER",
  DATE_RANGE = "DATE_RANGE",
  BOOLEAN = "BOOLEAN",
}

// ===== REJECTION REASON =====

/**
 * Rejection Reason Enum
 * Backend: marketplace-backend/src/common/enums/rejection-reason.enum.ts
 */
export enum RejectionReason {
  UNCLEAR_IMAGES = "UNCLEAR_IMAGES",
  MISSING_INFO = "MISSING_INFO",
  PROHIBITED_CONTENT = "PROHIBITED_CONTENT",
  UNREALISTIC_PRICE = "UNREALISTIC_PRICE",
  INAPPROPRIATE_IMAGES = "INAPPROPRIATE_IMAGES",
  PROFANITY = "PROFANITY",
  CONTACT_INFO = "CONTACT_INFO",
  SCAM_SUSPECTED = "SCAM_SUSPECTED",
  DUPLICATE = "DUPLICATE",
  OTHER = "OTHER",
}

/**
 * For dynamic dropdowns, use:
 * - useMetadataStore() (fetches from backend)
 * - *_LABELS from @/constants/metadata-labels for Arabic translations
 */
