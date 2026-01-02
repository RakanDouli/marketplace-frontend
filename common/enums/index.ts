/**
 * Common Enums
 *
 * Frontend mirror of backend enums for TYPE SAFETY in comparisons.
 *
 * IMPORTANT: Enum values must match what GraphQL returns:
 * - Most enums: UPPERCASE (GraphQL returns enum KEY names)
 * - Some enums: lowercase (when backend returns VALUE instead of KEY)
 * - Check the TypeScript interface for the actual type to confirm
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
  INDIVIDUAL = "individual",
  DEALER = "dealer",
  BUSINESS = "business",
}

// ===== USER STATUS =====

/**
 * User Status Enum
 * Backend: marketplace-backend/src/common/enums/user-status.enum.ts
 */
export enum UserStatus {
  PENDING = "pending",
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
  BANNED = "banned",
}

// ===== USER ROLE =====

/**
 * User Role Enum
 * Backend: marketplace-backend/src/common/enums/user-role.enum.ts
 */
export enum UserRole {
  USER = "user",
  EDITOR = "editor",
  ADMIN = "admin",
  SUPER_ADMIN = "super_admin",
  ADS_MANAGER = "ads_manager",
}

// ===== LISTING TYPE =====

/**
 * Listing Type Enum
 * Backend: marketplace-backend/src/common/enums/listing-type.enum.ts
 */
export enum ListingType {
  SALE = "sale",
  RENT = "rent",
}

// ===== CONDITION =====

/**
 * Condition Enum
 * Backend: marketplace-backend/src/common/enums/condition.enum.ts
 */
export enum Condition {
  NEW = "new",
  USED_LIKE_NEW = "used_like_new",
  USED = "used",
}

// ===== LISTING STATUS =====

/**
 * Listing Status Enum
 * Backend: marketplace-backend/src/common/enums/listing-status.enum.ts
 * NOTE: Values are UPPERCASE because GraphQL returns enum keys (not values)
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
  PENDING = "pending",
  REQUIRES_HUMAN_REVIEW = "requires_human_review",
  REVIEWED = "reviewed",
  RESOLVED = "resolved",
  DISMISSED = "dismissed",
}

/**
 * Report Entity Type Enum
 * Backend: marketplace-backend/src/common/enums/report-reason.enum.ts
 */
export enum ReportEntityType {
  THREAD = "thread",
  USER = "user",
  LISTING = "listing",
}

/**
 * Report Reason Enum
 * Backend: marketplace-backend/src/common/enums/report-reason.enum.ts
 */
export enum ReportReason {
  SCAM = "scam",
  HARASSMENT = "harassment",
  INAPPROPRIATE = "inappropriate",
  SPAM = "spam",
  FAKE_LISTING = "fake_listing",
  FAKE_ACCOUNT = "fake_account",
  IMPERSONATION = "impersonation",
  REPEAT_OFFENDER = "repeat_offender",
  OTHER = "other",
}

// ===== TRANSACTION ENUMS =====

/**
 * Transaction Type Enum
 * Backend: marketplace-backend/src/common/enums/transaction-type.enum.ts
 */
export enum TransactionType {
  USER_SUBSCRIPTION = "user_subscription",
  AD_CAMPAIGN = "ad_campaign",
  LISTING_PROMOTION = "listing_promotion",
}

/**
 * Transaction Status Enum
 * Backend: marketplace-backend/src/common/enums/transaction-status.enum.ts
 */
export enum TransactionStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
  REFUNDED = "refunded",
  CANCELLED = "cancelled",
}

// ===== SUBSCRIPTION ENUMS =====

/**
 * Billing Cycle Enum
 * Backend: marketplace-backend/src/common/enums/billing-cycle.enum.ts
 */
export enum BillingCycle {
  FREE = "free",
  MONTHLY = "monthly",
  YEARLY = "yearly",
}

/**
 * Subscription Status Enum
 * Backend: marketplace-backend/src/common/enums/subscription-status.enum.ts
 */
export enum SubscriptionStatus {
  ACTIVE = "active",
  EXPIRED = "expired",
  CANCELLED = "cancelled",
  PENDING = "pending",
}

// ===== AD SYSTEM ENUMS =====

/**
 * Ad Media Type Enum
 * Backend: marketplace-backend/src/common/enums/ad-media-type.enum.ts
 */
export enum AdMediaType {
  IMAGE = "image",
  VIDEO = "video",
}

/**
 * Ad Campaign Status Enum
 * Backend: marketplace-backend/src/common/enums/ad-campaign-status.enum.ts
 */
export enum AdCampaignStatus {
  DRAFT = "draft",
  PAYMENT_SENT = "payment_sent",
  PAID = "paid",
  ACTIVE = "active",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  PAUSED = "paused",
}

/**
 * Ad Client Status Enum
 * Backend: marketplace-backend/src/common/enums/ad-client-status.enum.ts
 */
export enum AdClientStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
}

/**
 * Ad Placement Enum
 * Backend: marketplace-backend/src/common/enums/ad-placement.enum.ts
 */
export enum AdPlacement {
  HOMEPAGE_TOP = "homepage_top",
  HOMEPAGE_MID = "homepage_mid",
  BETWEEN_LISTINGS = "between_listings",
  DETAIL_TOP = "detail_top",
  DETAIL_BEFORE_DESCRIPTION = "detail_before_description",
  DETAIL_BOTTOM = "detail_bottom",
}

/**
 * Campaign Start Preference Enum
 * Backend: marketplace-backend/src/common/enums/campaign-start-preference.enum.ts
 */
export enum CampaignStartPreference {
  ASAP = "asap",
  SPECIFIC_DATE = "specific_date",
}

// ===== MESSAGE ENUMS =====

/**
 * Message Status Enum
 * Backend: marketplace-backend/src/chats/chat-message.entity.ts
 */
export enum MessageStatus {
  SENT = "sent",
  DELIVERED = "delivered",
  READ = "read",
}

// ===== ACCOUNT BADGE =====

/**
 * Account Badge Enum
 * Backend: marketplace-backend/src/common/enums/account-badge.enum.ts
 */
export enum AccountBadge {
  NONE = "none",
  VERIFIED = "verified",
  PREMIUM = "premium",
}

// ===== BRAND ENUMS =====

/**
 * Brand Source Enum
 */
export enum BrandSource {
  SYNC = "sync",
  MANUAL = "manual",
}

/**
 * Brand Status Enum
 */
export enum BrandStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

// ===== ATTRIBUTE TYPE =====

/**
 * Attribute Type Enum
 * Backend: marketplace-backend/src/common/enums/attribute-type.enum.ts
 * NOTE: Values are UPPERCASE because GraphQL returns enum values in uppercase
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
  UNCLEAR_IMAGES = "unclear_images",
  MISSING_INFO = "missing_info",
  PROHIBITED_CONTENT = "prohibited_content",
  UNREALISTIC_PRICE = "unrealistic_price",
  INAPPROPRIATE_IMAGES = "inappropriate_images",
  PROFANITY = "profanity",
  CONTACT_INFO = "contact_info",
  SCAM_SUSPECTED = "scam_suspected",
  DUPLICATE = "duplicate",
  OTHER = "other",
}

/**
 * For dynamic dropdowns, use:
 * - useMetadataStore() (fetches from backend)
 * - *_LABELS from @/constants/metadata-labels for Arabic translations
 */
