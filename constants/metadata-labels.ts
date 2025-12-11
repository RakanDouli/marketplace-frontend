/**
 * Metadata Label Mappings - Arabic Translations Only
 *
 * This file contains ONLY Arabic translations for backend enum values.
 * Backend provides enum values via GraphQL metadata queries (metadataStore).
 *
 * Single source of truth:
 * - Backend: Enum values (via metadata.resolver.ts)
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
  active: "نشط",
  pending: "معلق",
  inactive: "غير نشط",
  suspended: "موقوف", // 7-day suspension (strike 2)
  banned: "محظور",    // permanent ban (strike 3)
};

export const USER_ROLE_LABELS: Record<string, string> = {
  user: "مستخدم",
  editor: "محرر",
  admin: "مدير",
  super_admin: "مدير عام",
  ads_manager: "مدير إعلانات",
};

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  individual: "فردي",
  dealer: "تاجر",
  business: "شركة",
};

// ===== USER/SELLER BADGE LABELS =====

export const ACCOUNT_BADGE_LABELS: Record<string, string> = {
  none: "بدون شارة",
  verified: "موثق",
  premium: "مميز",
};

// ===== LISTING METADATA LABELS =====

export const LISTING_STATUS_LABELS: Record<string, string> = {
  draft: "مسودة",
  pending_approval: "في الانتظار",
  rejected: "مرفوض", // AI auto-rejected (user can edit & resubmit)
  active: "نشط",
  sold: "تم البيع",
  sold_via_platform: "تم البيع عبر المنصة",
  hidden: "مخفي",
};

export const REJECTION_REASON_LABELS: Record<string, string> = {
  unclear_images: "صور غير واضحة",
  missing_info: "معلومات ناقصة",
  prohibited_content: "محتوى مخالف",
  unrealistic_price: "سعر غير واقعي",
  inappropriate_images: "صور مخالفة",
  profanity: "ألفاظ نابية",
  contact_info: "معلومات اتصال في الوصف",
  scam_suspected: "اشتباه في احتيال",
  duplicate: "إعلان مكرر",
  other: "سبب آخر",
};

export const MODERATION_FLAG_LABELS: Record<string, string> = {
  harassment: "تحرش",
  "harassment/threatening": "تحرش مع تهديد",
  hate: "خطاب كراهية",
  "hate/threatening": "خطاب كراهية مع تهديد",
  "self-harm": "إيذاء النفس",
  "self-harm/intent": "نية إيذاء النفس",
  "self-harm/instructions": "تعليمات إيذاء النفس",
  sexual: "محتوى جنسي",
  "sexual/minors": "محتوى جنسي - قاصرين",
  violence: "عنف",
  "violence/graphic": "عنف صريح",
  nsfw: "محتوى غير لائق",
  gore: "محتوى دموي",
  spam: "رسائل مزعجة",
  profanity: "ألفاظ نابية",
};

// ===== SUBSCRIPTION METADATA LABELS =====

export const BILLING_CYCLE_LABELS: Record<string, string> = {
  free: "مجاني",
  monthly: "شهري",
  yearly: "سنوي",
};

export const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  active: "نشطة",
  expired: "منتهية",   // Backend: expired (not 'inactive')
  cancelled: "ملغاة",  // Backend: cancelled (not 'deprecated')
  pending: "معلقة",    // Backend: pending
};

// Note: SUBSCRIPTION_ACCOUNT_TYPE_LABELS removed - use ACCOUNT_TYPE_LABELS instead
// Subscriptions now use AccountType enum (single source of truth)

// ===== ATTRIBUTE METADATA LABELS =====

export const ATTRIBUTE_TYPE_LABELS: Record<string, string> = {
  selector: "قائمة منسدلة (اختيار واحد)",
  multi_selector: "قائمة منسدلة (اختيارات متعددة)",
  range: "نطاق (من - إلى)",
  currency: "عملة",
  text: "نص قصير",
  textarea: "نص طويل",
  number: "رقم",
  date_range: "نطاق تاريخ",
  boolean: "نعم/لا",
};

export const ATTRIBUTE_VALIDATION_LABELS: Record<string, string> = {
  required: "إلزامي",
  optional: "اختياري",
};

export const ATTRIBUTE_STORAGE_TYPE_LABELS: Record<string, string> = {
  column: "عمود مستقل",
  specs: "مواصفات (JSONB)",
  location: "موقع (JSONB)",
};

// ===== AD SYSTEM METADATA LABELS =====

export const AD_MEDIA_TYPE_LABELS: Record<string, string> = {
  image: "صورة",
  video: "فيديو",
};

export const AD_CAMPAIGN_STATUS_LABELS: Record<string, string> = {
  draft: "مسودة",
  payment_sent: "تم إرسال رابط الدفع",
  paid: "مدفوعة",
  active: "نشطة",
  completed: "مكتملة",
  cancelled: "ملغاة",
  paused: "موقفة مؤقتاً",
};

export const AD_CLIENT_STATUS_LABELS: Record<string, string> = {
  active: "نشط",
  inactive: "غير نشط",
  suspended: "محظور", // Backend uses 'suspended' not 'blacklisted'
};

export const CAMPAIGN_START_PREFERENCE_LABELS: Record<string, string> = {
  asap: "فوري بعد الدفع",       // Backend: asap (not 'immediate')
  specific_date: "تاريخ محدد",  // Backend: specific_date (not 'scheduled')
};

export const AD_PLACEMENT_LABELS: Record<string, string> = {
  homepage_top: "الصفحة الرئيسية - أعلى",
  homepage_mid: "الصفحة الرئيسية - وسط",
  between_listings: "بين القوائم",
  detail_top: "صفحة التفاصيل - أعلى",
  detail_before_description: "صفحة التفاصيل - قبل الوصف",
};

export const AD_FORMAT_LABELS: Record<string, string> = {
  billboard: "بيلبورد (970x250)",
  super_leaderboard: "سوبر ليدربورد (970x90)",
  leaderboard: "ليدربورد (728x90)",
  mobile_banner: "بانر موبايل (320x50)",
  large_mobile_banner: "بانر موبايل كبير (320x100)",
  hd_player: "فيديو HD (1280x720)",
  leaderboard_video: "فيديو ليدربورد (970x546)",
};

// ===== REPORTS METADATA LABELS =====

export const REPORT_REASON_LABELS: Record<string, string> = {
  fake_listing: "إعلان وهمي",
  scam: "احتيال أو نصب",
  inappropriate: "محتوى غير لائق",
  spam: "رسائل مزعجة",
  harassment: "تحرش أو إزعاج",
  fake_account: "حساب وهمي",
  impersonation: "انتحال شخصية",
  repeat_offender: "مخالف متكرر",
  other: "سبب آخر",
};

// Report Status - Backend: report-reason.enum.ts (ReportStatus)
export const REPORT_STATUS_LABELS: Record<string, string> = {
  pending: "قيد المراجعة",
  requires_human_review: "يتطلب مراجعة بشرية",
  reviewed: "تمت المراجعة",
  resolved: "تم الحل",
  dismissed: "مرفوض",
};

// Report Entity Type - Backend: report-reason.enum.ts (ReportEntityType)
export const REPORT_ENTITY_TYPE_LABELS: Record<string, string> = {
  thread: "محادثة",
  user: "مستخدم",
  listing: "إعلان",
};

// ===== HELPER FUNCTIONS =====

/**
 * Convert backend enum values to dropdown options with Arabic labels
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
 */
export function getLabel(
  value: string,
  labelMap: Record<string, string>
): string {
  // Try exact match first
  if (labelMap[value]) return labelMap[value];

  // Try lowercase match (backend returns uppercase enum keys like MISSING_INFO)
  const lowercaseValue = value.toLowerCase();
  if (labelMap[lowercaseValue]) return labelMap[lowercaseValue];

  // Fallback to original value
  return value;
}
