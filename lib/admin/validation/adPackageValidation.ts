import { z } from 'zod';

// ===== TYPES =====
export interface AdPackageFormData {
  packageName: string;
  description: string;
  adType: string;
  durationDays: number;
  impressionLimit: number;
  basePrice: number;
  currency: string;
  isActive: boolean;
  mediaRequirements?: string[];
}

export interface ValidationErrors {
  packageName?: string;
  description?: string;
  adType?: string;
  durationDays?: string;
  impressionLimit?: string;
  basePrice?: string;
}

// ===== VALIDATION CONFIG - Single Source of Truth =====
export const AdPackageValidationConfig = {
  packageName: {
    minLength: 5,
    maxLength: 100,
  },
  description: {
    minLength: 10,
    maxLength: 500,
  },
  durationDays: {
    min: 1,
    max: 365, // Maximum 1 year
  },
  impressionLimit: {
    min: 0, // 0 = unlimited
    max: 10000000, // 10 million impressions max
  },
  basePrice: {
    min: 0,
    max: 100000, // Maximum $100,000
  },
};

// ===== ZOD SCHEMAS =====
const packageNameSchema = z
  .string()
  .min(
    AdPackageValidationConfig.packageName.minLength,
    `اسم الحزمة يجب أن يكون ${AdPackageValidationConfig.packageName.minLength} أحرف على الأقل`
  )
  .max(
    AdPackageValidationConfig.packageName.maxLength,
    `اسم الحزمة يجب ألا يتجاوز ${AdPackageValidationConfig.packageName.maxLength} حرف`
  );

const descriptionSchema = z
  .string()
  .min(
    AdPackageValidationConfig.description.minLength,
    `الوصف يجب أن يكون ${AdPackageValidationConfig.description.minLength} أحرف على الأقل`
  )
  .max(
    AdPackageValidationConfig.description.maxLength,
    `الوصف يجب ألا يتجاوز ${AdPackageValidationConfig.description.maxLength} حرف`
  );

const adTypeSchema = z
  .string()
  .min(1, 'نوع الإعلان مطلوب');

const durationDaysSchema = z
  .number()
  .min(
    AdPackageValidationConfig.durationDays.min,
    `المدة يجب أن تكون ${AdPackageValidationConfig.durationDays.min} يوم على الأقل`
  )
  .max(
    AdPackageValidationConfig.durationDays.max,
    `المدة يجب ألا تتجاوز ${AdPackageValidationConfig.durationDays.max} يوم`
  );

const impressionLimitSchema = z
  .number()
  .min(
    AdPackageValidationConfig.impressionLimit.min,
    'حد الظهور يجب أن يكون صفر أو أكثر (صفر = غير محدود)'
  )
  .max(
    AdPackageValidationConfig.impressionLimit.max,
    `حد الظهور يجب ألا يتجاوز ${AdPackageValidationConfig.impressionLimit.max.toLocaleString()}`
  );

const basePriceSchema = z
  .number()
  .min(
    AdPackageValidationConfig.basePrice.min,
    'السعر يجب أن يكون صفر أو أكثر'
  )
  .max(
    AdPackageValidationConfig.basePrice.max,
    `السعر يجب ألا يتجاوز ${AdPackageValidationConfig.basePrice.max.toLocaleString()} دولار`
  );

// ===== INDIVIDUAL FIELD VALIDATORS =====
export const validatePackageName = (value: string): string | undefined => {
  const result = packageNameSchema.safeParse(value);
  return result.success ? undefined : result.error.errors[0]?.message;
};

export const validateDescription = (value: string): string | undefined => {
  const result = descriptionSchema.safeParse(value);
  return result.success ? undefined : result.error.errors[0]?.message;
};

export const validateAdType = (value: string): string | undefined => {
  const result = adTypeSchema.safeParse(value);
  return result.success ? undefined : result.error.errors[0]?.message;
};

export const validateDurationDays = (value: number): string | undefined => {
  const result = durationDaysSchema.safeParse(value);
  return result.success ? undefined : result.error.errors[0]?.message;
};

export const validateImpressionLimit = (value: number): string | undefined => {
  const result = impressionLimitSchema.safeParse(value);
  return result.success ? undefined : result.error.errors[0]?.message;
};

export const validateBasePrice = (value: number): string | undefined => {
  const result = basePriceSchema.safeParse(value);
  return result.success ? undefined : result.error.errors[0]?.message;
};

// ===== FULL FORM VALIDATORS =====
export const validateCreateAdPackageForm = (
  data: AdPackageFormData
): ValidationErrors => {
  const errors: ValidationErrors = {};

  // Validate required fields
  const packageNameError = validatePackageName(data.packageName);
  if (packageNameError) errors.packageName = packageNameError;

  const descriptionError = validateDescription(data.description);
  if (descriptionError) errors.description = descriptionError;

  const adTypeError = validateAdType(data.adType);
  if (adTypeError) errors.adType = adTypeError;

  const durationError = validateDurationDays(data.durationDays);
  if (durationError) errors.durationDays = durationError;

  const impressionError = validateImpressionLimit(data.impressionLimit);
  if (impressionError) errors.impressionLimit = impressionError;

  const priceError = validateBasePrice(data.basePrice);
  if (priceError) errors.basePrice = priceError;

  return errors;
};

export const validateEditAdPackageForm = (
  data: AdPackageFormData
): ValidationErrors => {
  // Edit form has same validation as create
  return validateCreateAdPackageForm(data);
};

// ===== FIELD VALIDATOR FACTORY =====
// Used for Input component's `validate` prop for real-time validation
export const createAdPackageFieldValidator = (
  fieldName: keyof AdPackageFormData
) => {
  return (value: any): string | undefined => {
    switch (fieldName) {
      case 'packageName':
        return validatePackageName(value);
      case 'description':
        return validateDescription(value);
      case 'adType':
        return validateAdType(value);
      case 'durationDays':
        return validateDurationDays(value);
      case 'impressionLimit':
        return validateImpressionLimit(value);
      case 'basePrice':
        return validateBasePrice(value);
      default:
        return undefined;
    }
  };
};

// ===== HELPER FUNCTIONS =====
export const hasValidationErrors = (errors: ValidationErrors): boolean => {
  return Object.values(errors).some((error) => error !== undefined);
};
