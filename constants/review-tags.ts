/**
 * Predefined review tags for user ratings
 * Tag-based system (NO free text) to prevent spam and harmful content
 */

export const POSITIVE_REVIEW_TAGS = [
  'مطابق للوصف',           // As described
  'مطابق للصور',           // Matches photos
  'معلومات دقيقة',          // Accurate information
  'بائع متعاون',           // Cooperative seller
  'سريع الاستجابة',        // Fast response
  'احترافي في التعامل',    // Professional
  'صادق وأمين',            // Honest and trustworthy
  'أسعار معقولة',          // Reasonable prices
  'حالة ممتازة',           // Excellent condition
  'تسليم سريع',            // Fast delivery
] as const;

export const NEGATIVE_REVIEW_TAGS = [
  'لا يطابق الوصف',        // Doesn't match description
  'لا يطابق الصور',        // Doesn't match photos
  'معلومات غير دقيقة',     // Inaccurate information
  'بائع غير متعاون',       // Uncooperative seller
  'بطيء في الرد',          // Slow to respond
  'غير احترافي',           // Unprofessional
  'مضلل',                  // Misleading
  'أسعار مبالغ فيها',       // Overpriced
  'حالة سيئة',             // Poor condition
  'تأخير في التسليم',      // Delayed delivery
] as const;

export type PositiveReviewTag = typeof POSITIVE_REVIEW_TAGS[number];
export type NegativeReviewTag = typeof NEGATIVE_REVIEW_TAGS[number];
