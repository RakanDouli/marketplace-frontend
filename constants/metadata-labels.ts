/**
 * Metadata Label Mappings - Arabic Translations Only
 *
 * This file contains ONLY Arabic translations for backend enum KEYS.
 * Backend provides enum KEYS (UPPERCASE) via GraphQL metadata queries (metadataStore).
 *
 * IMPORTANT: All keys are UPPERCASE to match:
 * - Backend metadata resolver (returns Object.keys())
 * - GraphQL enum serialization (returns UPPERCASE keys)
 * - GraphQL mutation inputs (expect UPPERCASE keys)
 *
 * Single source of truth:
 * - Backend: Enum keys (via metadata.resolver.ts)
 * - Frontend: Arabic labels (this file)
 *
 * Usage:
 * ```ts
 * import { ACCOUNT_TYPE_LABELS, mapToOptions } from '@/constants/metadata-labels';
 * import { useMetadataStore } from '@/stores/metadataStore';
 *
 * const { accountTypes } = useMetadataStore();
 * const options = mapToOptions(accountTypes, ACCOUNT_TYPE_LABELS);
 * ```
 */

// ===== USER METADATA LABELS =====

export const USER_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "نشط",
  PENDING: "معلق",
  INACTIVE: "غير نشط",
  SUSPENDED: "موقوف", // 7-day suspension (strike 2)
  BANNED: "محظور",    // permanent ban (strike 3)
};

export const USER_ROLE_LABELS: Record<string, string> = {
  USER: "مستخدم",
  EDITOR: "محرر",
  ADMIN: "مدير",
  SUPER_ADMIN: "مدير عام",
  ADS_MANAGER: "مدير إعلانات",
};

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  INDIVIDUAL: "فردي",
  DEALER: "تاجر",
  BUSINESS: "شركة",
};

// ===== USER/SELLER BADGE LABELS =====

export const ACCOUNT_BADGE_LABELS: Record<string, string> = {
  NONE: "بدون شارة",
  VERIFIED: "موثق",
  PREMIUM: "مميز",
};

// ===== LISTING TYPE LABELS =====

export const LISTING_TYPE_LABELS: Record<string, string> = {
  SALE: "للبيع",
  RENT: "للإيجار",
};

// ===== CONDITION LABELS =====

export const CONDITION_LABELS: Record<string, string> = {
  NEW: "جديد",
  USED_LIKE_NEW: "مستعمل كالجديد",
  USED: "مستعمل",
};

// ===== LISTING METADATA LABELS =====

export const LISTING_STATUS_LABELS: Record<string, string> = {
  DRAFT: "مسودة",
  PENDING_APPROVAL: "في الانتظار",
  REJECTED: "مرفوض", // AI auto-rejected (user can edit & resubmit)
  ACTIVE: "نشط",
  SOLD: "تم البيع",
  SOLD_VIA_PLATFORM: "تم البيع عبر المنصة",
  HIDDEN: "مخفي",
  ARCHIVED: "مؤرشف",
};

export const REJECTION_REASON_LABELS: Record<string, string> = {
  UNCLEAR_IMAGES: "صور غير واضحة",
  MISSING_INFO: "معلومات ناقصة",
  PROHIBITED_CONTENT: "محتوى مخالف",
  UNREALISTIC_PRICE: "سعر غير واقعي",
  INAPPROPRIATE_IMAGES: "صور مخالفة",
  PROFANITY: "ألفاظ نابية",
  CONTACT_INFO: "معلومات اتصال في الوصف",
  SCAM_SUSPECTED: "اشتباه في احتيال",
  DUPLICATE: "إعلان مكرر",
  OTHER: "سبب آخر",
};

export const MODERATION_FLAG_LABELS: Record<string, string> = {
  HARASSMENT: "تحرش",
  "HARASSMENT/THREATENING": "تحرش مع تهديد",
  HATE: "خطاب كراهية",
  "HATE/THREATENING": "خطاب كراهية مع تهديد",
  "SELF-HARM": "إيذاء النفس",
  "SELF-HARM/INTENT": "نية إيذاء النفس",
  "SELF-HARM/INSTRUCTIONS": "تعليمات إيذاء النفس",
  SEXUAL: "محتوى جنسي",
  "SEXUAL/MINORS": "محتوى جنسي - قاصرين",
  VIOLENCE: "عنف",
  "VIOLENCE/GRAPHIC": "عنف صريح",
  NSFW: "محتوى غير لائق",
  GORE: "محتوى دموي",
  SPAM: "رسائل مزعجة",
};

// ===== SUBSCRIPTION METADATA LABELS =====

export const BILLING_CYCLE_LABELS: Record<string, string> = {
  FREE: "مجاني",
  MONTHLY: "شهري",
  YEARLY: "سنوي",
};

export const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "نشطة",
  EXPIRED: "منتهية",
  CANCELLED: "ملغاة",
  PENDING: "معلقة",
};

// Note: SUBSCRIPTION_ACCOUNT_TYPE_LABELS removed - use ACCOUNT_TYPE_LABELS instead
// Subscriptions now use AccountType enum (single source of truth)

// ===== ATTRIBUTE METADATA LABELS =====

export const ATTRIBUTE_TYPE_LABELS: Record<string, string> = {
  SELECTOR: "قائمة منسدلة (اختيار واحد)",
  MULTI_SELECTOR: "قائمة منسدلة (اختيارات متعددة)",
  RANGE: "نطاق (من - إلى)",
  RANGE_SELECTOR: "نطاق بخيارات محددة",
  CURRENCY: "عملة",
  TEXT: "نص قصير",
  TEXTAREA: "نص طويل",
  NUMBER: "رقم",
  DATE_RANGE: "نطاق تاريخ",
  BOOLEAN: "نعم/لا",
};

export const ATTRIBUTE_VALIDATION_LABELS: Record<string, string> = {
  REQUIRED: "إلزامي",
  OPTIONAL: "اختياري",
};

export const ATTRIBUTE_STORAGE_TYPE_LABELS: Record<string, string> = {
  COLUMN: "عمود مستقل",
  SPECS: "مواصفات (JSONB)",
  LOCATION: "موقع (JSONB)",
};

// ===== AD SYSTEM METADATA LABELS =====

export const AD_MEDIA_TYPE_LABELS: Record<string, string> = {
  IMAGE: "صورة",
  VIDEO: "فيديو",
};

export const AD_CAMPAIGN_STATUS_LABELS: Record<string, string> = {
  DRAFT: "مسودة",
  PAYMENT_SENT: "تم إرسال رابط الدفع",
  PAID: "مدفوعة",
  ACTIVE: "نشطة",
  COMPLETED: "مكتملة",
  CANCELLED: "ملغاة",
  PAUSED: "موقفة مؤقتاً",
};

export const AD_CLIENT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "نشط",
  INACTIVE: "غير نشط",
  SUSPENDED: "محظور",
};

export const CAMPAIGN_START_PREFERENCE_LABELS: Record<string, string> = {
  ASAP: "فوري بعد الدفع",
  SPECIFIC_DATE: "تاريخ محدد",
};

export const AD_PLACEMENT_LABELS: Record<string, string> = {
  HOMEPAGE_TOP: "الصفحة الرئيسية - أعلى",
  HOMEPAGE_MID: "الصفحة الرئيسية - وسط",
  BETWEEN_LISTINGS: "بين القوائم",
  DETAIL_TOP: "صفحة التفاصيل - أعلى",
  DETAIL_BEFORE_DESCRIPTION: "صفحة التفاصيل - قبل الوصف",
};

export const AD_FORMAT_LABELS: Record<string, string> = {
  BILLBOARD: "بيلبورد (970x250)",
  SUPER_LEADERBOARD: "سوبر ليدربورد (970x90)",
  LEADERBOARD: "ليدربورد (728x90)",
  MOBILE_BANNER: "بانر موبايل (320x50)",
  LARGE_MOBILE_BANNER: "بانر موبايل كبير (320x100)",
  BILLBOARD_VIDEO: "فيديو بيلبورد (970x250)",
  LEADERBOARD_VIDEO: "فيديو ليدربورد (970x350)",
};

// ===== REPORTS METADATA LABELS =====

export const REPORT_REASON_LABELS: Record<string, string> = {
  FAKE_LISTING: "إعلان وهمي",
  SCAM: "احتيال أو نصب",
  INAPPROPRIATE: "محتوى غير لائق",
  SPAM: "رسائل مزعجة",
  HARASSMENT: "تحرش أو إزعاج",
  FAKE_ACCOUNT: "حساب وهمي",
  IMPERSONATION: "انتحال شخصية",
  REPEAT_OFFENDER: "مخالف متكرر",
  OTHER: "سبب آخر",
};

// Report Status - Backend: report-reason.enum.ts (ReportStatus)
export const REPORT_STATUS_LABELS: Record<string, string> = {
  PENDING: "قيد المراجعة",
  REQUIRES_HUMAN_REVIEW: "يتطلب مراجعة بشرية",
  REVIEWED: "تمت المراجعة",
  RESOLVED: "تم الحل",
  DISMISSED: "مرفوض",
};

// Report Entity Type - Backend: report-reason.enum.ts (ReportEntityType)
export const REPORT_ENTITY_TYPE_LABELS: Record<string, string> = {
  THREAD: "محادثة",
  USER: "مستخدم",
  LISTING: "إعلان",
};

// ===== HELPER FUNCTIONS =====

/**
 * Convert backend enum keys to dropdown options with Arabic labels
 */
export function mapToOptions(
  values: string[],
  labelMap: Record<string, string>
): Array<{ value: string; label: string }> {
  return values.map((value) => ({
    value,
    label: labelMap[value] || value,
  }));
}

/**
 * Get Arabic label for a single enum value
 * Handles both UPPERCASE keys (from metadata/entities) and provides fallback
 */
export function getLabel(
  value: string,
  labelMap: Record<string, string>
): string {
  // Try exact match first (UPPERCASE)
  if (labelMap[value]) return labelMap[value];

  // Try uppercase match (in case value comes as lowercase)
  const uppercaseValue = value.toUpperCase();
  if (labelMap[uppercaseValue]) return labelMap[uppercaseValue];

  // Fallback to original value
  return value;
}
