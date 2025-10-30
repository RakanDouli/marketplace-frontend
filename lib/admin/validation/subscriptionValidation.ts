import { z } from 'zod';

// ===== TYPES =====
export interface SubscriptionFormData {
  name: string;
  title: string;
  description?: string;
  price: number;
  billingCycle: string;
  maxListings: number;
  maxImagesPerListing: number;
  videoAllowed: boolean;
  priorityPlacement: boolean;
  analyticsAccess: boolean;
  customBranding: boolean;
  featuredListings: boolean;
  status: string;
  sortOrder: number;
  isPublic: boolean;
  isDefault: boolean;
  accountType: string;
}

export interface ValidationErrors {
  name?: string;
  title?: string;
  description?: string;
  price?: string;
  billingCycle?: string;
  maxListings?: string;
  maxImagesPerListing?: string;
  status?: string;
  sortOrder?: string;
  accountType?: string;
}

// ===== VALIDATION CONFIG - Single Source of Truth =====
export const SubscriptionValidationConfig = {
  name: {
    minLength: 3,
    maxLength: 50,
    pattern: /^[a-z0-9_]+$/, // Only lowercase letters, numbers, underscores
  },
  title: {
    minLength: 3,
    maxLength: 100,
  },
  description: {
    maxLength: 500,
  },
  price: {
    min: 0, // Free plans allowed
    max: 10000, // Maximum $10,000
  },
  maxListings: {
    min: 0, // 0 = unlimited
    max: 1000,
  },
  maxImagesPerListing: {
    min: 0, // 0 = unlimited
    max: 100,
  },
  sortOrder: {
    min: 0,
    max: 999,
  },
};

// ===== ZOD SCHEMAS =====
const nameSchema = z
  .string()
  .min(
    SubscriptionValidationConfig.name.minLength,
    `اسم المعرف يجب أن يكون ${SubscriptionValidationConfig.name.minLength} أحرف على الأقل`
  )
  .max(
    SubscriptionValidationConfig.name.maxLength,
    `اسم المعرف يجب ألا يتجاوز ${SubscriptionValidationConfig.name.maxLength} حرف`
  )
  .regex(
    SubscriptionValidationConfig.name.pattern,
    'اسم المعرف يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطة سفلية فقط'
  );

const titleSchema = z
  .string()
  .min(
    SubscriptionValidationConfig.title.minLength,
    `عنوان الخطة يجب أن يكون ${SubscriptionValidationConfig.title.minLength} أحرف على الأقل`
  )
  .max(
    SubscriptionValidationConfig.title.maxLength,
    `عنوان الخطة يجب ألا يتجاوز ${SubscriptionValidationConfig.title.maxLength} حرف`
  );

const descriptionSchema = z
  .string()
  .max(
    SubscriptionValidationConfig.description.maxLength,
    `الوصف يجب ألا يتجاوز ${SubscriptionValidationConfig.description.maxLength} حرف`
  )
  .optional();

const priceSchema = z
  .number()
  .min(SubscriptionValidationConfig.price.min, 'السعر يجب أن يكون صفر أو أكثر')
  .max(
    SubscriptionValidationConfig.price.max,
    `السعر يجب ألا يتجاوز ${SubscriptionValidationConfig.price.max} دولار`
  );

const billingCycleSchema = z
  .string()
  .min(1, 'دورة الفوترة مطلوبة');

const maxListingsSchema = z
  .number()
  .min(SubscriptionValidationConfig.maxListings.min, 'حد الإعلانات يجب أن يكون صفر أو أكثر')
  .max(
    SubscriptionValidationConfig.maxListings.max,
    `حد الإعلانات يجب ألا يتجاوز ${SubscriptionValidationConfig.maxListings.max}`
  );

const maxImagesPerListingSchema = z
  .number()
  .min(
    SubscriptionValidationConfig.maxImagesPerListing.min,
    'حد الصور يجب أن يكون صفر أو أكثر'
  )
  .max(
    SubscriptionValidationConfig.maxImagesPerListing.max,
    `حد الصور يجب ألا يتجاوز ${SubscriptionValidationConfig.maxImagesPerListing.max}`
  );

const statusSchema = z.string().min(1, 'الحالة مطلوبة');

const sortOrderSchema = z
  .number()
  .min(SubscriptionValidationConfig.sortOrder.min, 'ترتيب العرض يجب أن يكون صفر أو أكثر')
  .max(
    SubscriptionValidationConfig.sortOrder.max,
    `ترتيب العرض يجب ألا يتجاوز ${SubscriptionValidationConfig.sortOrder.max}`
  );

const accountTypeSchema = z.string().min(1, 'نوع الحساب مطلوب');

// ===== INDIVIDUAL FIELD VALIDATORS =====
export const validateName = (value: string): string | undefined => {
  const result = nameSchema.safeParse(value);
  return result.success ? undefined : result.error.errors[0]?.message;
};

export const validateTitle = (value: string): string | undefined => {
  const result = titleSchema.safeParse(value);
  return result.success ? undefined : result.error.errors[0]?.message;
};

export const validateDescription = (value: string): string | undefined => {
  const result = descriptionSchema.safeParse(value);
  return result.success ? undefined : result.error.errors[0]?.message;
};

export const validatePrice = (value: number): string | undefined => {
  const result = priceSchema.safeParse(value);
  return result.success ? undefined : result.error.errors[0]?.message;
};

export const validateBillingCycle = (value: string): string | undefined => {
  const result = billingCycleSchema.safeParse(value);
  return result.success ? undefined : result.error.errors[0]?.message;
};

export const validateMaxListings = (value: number): string | undefined => {
  const result = maxListingsSchema.safeParse(value);
  return result.success ? undefined : result.error.errors[0]?.message;
};

export const validateMaxImagesPerListing = (value: number): string | undefined => {
  const result = maxImagesPerListingSchema.safeParse(value);
  return result.success ? undefined : result.error.errors[0]?.message;
};

export const validateStatus = (value: string): string | undefined => {
  const result = statusSchema.safeParse(value);
  return result.success ? undefined : result.error.errors[0]?.message;
};

export const validateSortOrder = (value: number): string | undefined => {
  const result = sortOrderSchema.safeParse(value);
  return result.success ? undefined : result.error.errors[0]?.message;
};

export const validateAccountType = (value: string): string | undefined => {
  const result = accountTypeSchema.safeParse(value);
  return result.success ? undefined : result.error.errors[0]?.message;
};

// ===== FULL FORM VALIDATORS =====
export const validateCreateSubscriptionForm = (
  data: SubscriptionFormData
): ValidationErrors => {
  const errors: ValidationErrors = {};

  // Validate required fields
  const nameError = validateName(data.name);
  if (nameError) errors.name = nameError;

  const titleError = validateTitle(data.title);
  if (titleError) errors.title = titleError;

  if (data.description) {
    const descriptionError = validateDescription(data.description);
    if (descriptionError) errors.description = descriptionError;
  }

  const priceError = validatePrice(data.price);
  if (priceError) errors.price = priceError;

  const billingCycleError = validateBillingCycle(data.billingCycle);
  if (billingCycleError) errors.billingCycle = billingCycleError;

  const maxListingsError = validateMaxListings(data.maxListings);
  if (maxListingsError) errors.maxListings = maxListingsError;

  const maxImagesError = validateMaxImagesPerListing(data.maxImagesPerListing);
  if (maxImagesError) errors.maxImagesPerListing = maxImagesError;

  const statusError = validateStatus(data.status);
  if (statusError) errors.status = statusError;

  const sortOrderError = validateSortOrder(data.sortOrder);
  if (sortOrderError) errors.sortOrder = sortOrderError;

  const accountTypeError = validateAccountType(data.accountType);
  if (accountTypeError) errors.accountType = accountTypeError;

  return errors;
};

export const validateEditSubscriptionForm = (
  data: SubscriptionFormData
): ValidationErrors => {
  // Edit form has same validation as create
  return validateCreateSubscriptionForm(data);
};

// ===== FIELD VALIDATOR FACTORY =====
// Used for Input component's `validate` prop for real-time validation
export const createSubscriptionFieldValidator = (
  fieldName: keyof SubscriptionFormData
) => {
  return (value: any): string | undefined => {
    switch (fieldName) {
      case 'name':
        return validateName(value);
      case 'title':
        return validateTitle(value);
      case 'description':
        return validateDescription(value);
      case 'price':
        return validatePrice(value);
      case 'billingCycle':
        return validateBillingCycle(value);
      case 'maxListings':
        return validateMaxListings(value);
      case 'maxImagesPerListing':
        return validateMaxImagesPerListing(value);
      case 'status':
        return validateStatus(value);
      case 'sortOrder':
        return validateSortOrder(value);
      case 'accountType':
        return validateAccountType(value);
      default:
        return undefined;
    }
  };
};

// ===== HELPER FUNCTIONS =====
export const hasValidationErrors = (errors: ValidationErrors): boolean => {
  return Object.values(errors).some((error) => error !== undefined);
};
