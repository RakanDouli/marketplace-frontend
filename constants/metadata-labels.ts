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
  banned: "محظور",
  // Uppercase variants (for backward compatibility)
  ACTIVE: "نشط",
  PENDING: "معلق",
  BANNED: "محظور",
};

export const USER_ROLE_LABELS: Record<string, string> = {
  user: "مستخدم",
  editor: "محرر",
  admin: "مدير",
  super_admin: "مدير عام",
  ads_manager: "مدير إعلانات",
  // Uppercase variants (for backward compatibility)
  USER: "مستخدم",
  EDITOR: "محرر",
  ADMIN: "مدير",
  SUPER_ADMIN: "مدير عام",
  ADS_MANAGER: "مدير إعلانات",
};

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  individual: "فردي",
  dealer: "تاجر",
  business: "شركة",
  // Uppercase variants (for backward compatibility)
  INDIVIDUAL: "فردي",
  DEALER: "تاجر",
  BUSINESS: "شركة",
};

// ===== LISTING METADATA LABELS =====

export const SELLER_TYPE_LABELS: Record<string, string> = {
  private: "المالك",
  dealer: "تاجر",
  business: "شركه",
  // Uppercase variants (for backward compatibility)
  PRIVATE: "المالك",
  DEALER: "تاجر",
  BUSINESS: "شركه",
};

export const LISTING_STATUS_LABELS: Record<string, string> = {
  draft: "مسودة",
  pending_approval: "في الانتظار",
  active: "نشط",
  sold: "تم البيع",
  sold_via_platform: "تم البيع عبر المنصة",
  hidden: "مخفي",
  // Uppercase variants (for backward compatibility)
  DRAFT: "مسودة",
  PENDING_APPROVAL: "في الانتظار",
  ACTIVE: "نشط",
  SOLD: "تم البيع",
  SOLD_VIA_PLATFORM: "تم البيع عبر المنصة",
  HIDDEN: "مخفي",
};

// ===== SUBSCRIPTION METADATA LABELS =====

export const BILLING_CYCLE_LABELS: Record<string, string> = {
  free: "مجاني",
  monthly: "شهري",
  yearly: "سنوي",
  // Uppercase variants
  FREE: "مجاني",
  MONTHLY: "شهري",
  YEARLY: "سنوي",
};

export const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  active: "نشطة",
  inactive: "غير نشطة",
  deprecated: "متوقفة",
  // Uppercase variants
  ACTIVE: "نشطة",
  INACTIVE: "غير نشطة",
  DEPRECATED: "متوقفة",
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
  return labelMap[value] || value;
}
