/**
 * Metadata Label Mappings
 *
 * Maps backend enum values (English, lowercase) to frontend display labels (Arabic)
 *
 * Single source of truth: Backend provides enum values via metadata queries
 * Frontend provides Arabic labels for UI display
 *
 * Usage:
 * ```ts
 * import { ACCOUNT_TYPE_LABELS } from '@/constants/metadata-labels';
 *
 * const options = accountTypes.map(value => ({
 *   value,
 *   label: ACCOUNT_TYPE_LABELS[value] || value
 * }));
 * ```
 */

// ===== USER METADATA LABELS =====

export const USER_STATUS_LABELS: Record<string, string> = {
  active: "نشط",
  inactive: "غير نشط",
  suspended: "موقوف",
  banned: "محظور",
};

export const USER_ROLE_LABELS: Record<string, string> = {
  user: "مستخدم",
  admin: "مدير",
  super_admin: "مدير عام",
  moderator: "مشرف",
};

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  individual: "Individual - فردي",
  dealer: "Dealer - معرض سيارات",
  business: "Business - شركة",
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
  deprecated: "متوقفة (قديمة)",
};

export const SUBSCRIPTION_ACCOUNT_TYPE_LABELS: Record<string, string> = {
  individual: "Individual - للأفراد فقط",
  dealer: "Dealer - للتجار فقط",
  business: "Business - للشركات فقط",
  all: "جميع الأنواع (Individual, Dealer, Business)",
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
  column: "عمود مستقل (Column)",
  specs: "مواصفات (Specs JSONB)",
  location: "موقع (Location JSONB)",
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
    label: labelMap[value] || value, // Fallback to value if no label found
  }));
}

/**
 * Get label for a single value
 */
export function getLabel(
  value: string,
  labelMap: Record<string, string>
): string {
  return labelMap[value] || value;
}
