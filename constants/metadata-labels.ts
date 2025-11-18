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
  banned: "محظور",
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
  inactive: "غير نشطة",
  deprecated: "متوقفة",
};

export const SUBSCRIPTION_ACCOUNT_TYPE_LABELS: Record<string, string> = {
  individual: "للأفراد",
  dealer: "للتجار",
  business: "للشركات",
  all: "جميع الأنواع",
};

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
  banner: "بانر علوي",
  video: "فيديو علوي",
  between_listings_banner: "بين القوائم - بانر كامل",
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
  blacklisted: "محظور",
};

export const CAMPAIGN_START_PREFERENCE_LABELS: Record<string, string> = {
  immediate: "فوري بعد الدفع",
  scheduled: "تاريخ محدد",
  after_review: "بعد المراجعة",
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
