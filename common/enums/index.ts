/**
 * Common Enums
 *
 * Frontend mirror of backend enums for type safety.
 * These should match exactly with backend enum VALUES (lowercase).
 *
 * IMPORTANT: GraphQL may return UPPERCASE enum names, but the VALUES are lowercase.
 * Always use the matchesEnum() helper for comparisons to handle case differences.
 */

// ===== HELPER FUNCTION =====

/**
 * Case-insensitive enum comparison helper.
 * Use this instead of direct === comparison to avoid case mismatch issues.
 *
 * @example
 * // Instead of: user.accountType === 'business' or user.accountType.toLowerCase() === AccountType.BUSINESS
 * // Use: matchesEnum(user.accountType, AccountType.BUSINESS)
 */
export function matchesEnum(value: string | null | undefined, enumValue: string): boolean {
  if (!value) return false;
  return value.toLowerCase() === enumValue.toLowerCase();
}

/**
 * Check if value matches any of the provided enum values
 *
 * @example
 * matchesAnyEnum(user.accountType, [AccountType.DEALER, AccountType.BUSINESS])
 */
export function matchesAnyEnum(value: string | null | undefined, enumValues: string[]): boolean {
  if (!value) return false;
  const lowerValue = value.toLowerCase();
  return enumValues.some(ev => ev.toLowerCase() === lowerValue);
}

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

// ===== LISTING STATUS =====

/**
 * Listing Status Enum
 * Backend: marketplace-backend/src/common/enums/listing-status.enum.ts
 */
export enum ListingStatus {
  DRAFT = "draft",
  PENDING_APPROVAL = "pending_approval",
  REJECTED = "rejected",
  ACTIVE = "active",
  SOLD = "sold",
  SOLD_VIA_PLATFORM = "sold_via_platform",
  HIDDEN = "hidden",
  ARCHIVED = "archived",
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
