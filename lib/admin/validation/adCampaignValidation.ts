import { z } from 'zod';

// ===== TYPES =====
export interface AdCampaignFormData {
  campaignName: string;
  description?: string;
  clientId: string;
  packageId: string;
  isCustomPackage: boolean;
  startPreference: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  totalPrice: number;
  currency: string;
  notes?: string;
}

export interface ValidationErrors {
  campaignName?: string;
  description?: string;
  clientId?: string;
  packageId?: string;
  startDate?: string;
  endDate?: string;
  totalPrice?: string;
  notes?: string;
}

// ===== VALIDATION CONFIG - Single Source of Truth =====
export const AdCampaignValidationConfig = {
  campaignName: {
    minLength: 3,
    maxLength: 150,
  },
  description: {
    maxLength: 1000,
  },
  totalPrice: {
    min: 0,
    max: 1000000, // Maximum $1 million per campaign
  },
  notes: {
    maxLength: 1000,
  },
  dateValidation: {
    minimumDurationDays: 1, // Campaign must run at least 1 day
  },
};

// ===== ZOD SCHEMAS =====
const campaignNameSchema = z
  .string()
  .min(
    AdCampaignValidationConfig.campaignName.minLength,
    `اسم الحملة يجب أن يكون ${AdCampaignValidationConfig.campaignName.minLength} أحرف على الأقل`
  )
  .max(
    AdCampaignValidationConfig.campaignName.maxLength,
    `اسم الحملة يجب ألا يتجاوز ${AdCampaignValidationConfig.campaignName.maxLength} حرف`
  );

const descriptionSchema = z
  .string()
  .max(
    AdCampaignValidationConfig.description.maxLength,
    `الوصف يجب ألا يتجاوز ${AdCampaignValidationConfig.description.maxLength} حرف`
  )
  .optional();

const clientIdSchema = z.string().min(1, 'يجب اختيار العميل');

const packageIdSchema = z.string().min(1, 'يجب اختيار الحزمة');

const dateStringSchema = z.string().min(1, 'التاريخ مطلوب');

const totalPriceSchema = z
  .number()
  .min(
    AdCampaignValidationConfig.totalPrice.min,
    'السعر الإجمالي يجب أن يكون صفر أو أكثر'
  )
  .max(
    AdCampaignValidationConfig.totalPrice.max,
    `السعر الإجمالي يجب ألا يتجاوز ${AdCampaignValidationConfig.totalPrice.max.toLocaleString()} دولار`
  );

const notesSchema = z
  .string()
  .max(
    AdCampaignValidationConfig.notes.maxLength,
    `الملاحظات يجب ألا تتجاوز ${AdCampaignValidationConfig.notes.maxLength} حرف`
  )
  .optional();

// ===== INDIVIDUAL FIELD VALIDATORS =====
export const validateCampaignName = (value: string): string | undefined => {
  const result = campaignNameSchema.safeParse(value);
  return result.success ? undefined : (result.error?.errors?.[0]?.message || 'اسم الحملة غير صحيح');
};

export const validateDescription = (value: string): string | undefined => {
  if (!value) return undefined; // Optional field
  const result = descriptionSchema.safeParse(value);
  return result.success ? undefined : (result.error?.errors?.[0]?.message || 'الوصف غير صحيح');
};

export const validateClientId = (value: string): string | undefined => {
  const result = clientIdSchema.safeParse(value);
  return result.success ? undefined : (result.error?.errors?.[0]?.message || 'يجب اختيار العميل');
};

export const validatePackageId = (value: string): string | undefined => {
  const result = packageIdSchema.safeParse(value);
  return result.success ? undefined : (result.error?.errors?.[0]?.message || 'يجب اختيار الحزمة');
};

export const validateStartDate = (value: string): string | undefined => {
  const result = dateStringSchema.safeParse(value);
  return result.success ? undefined : (result.error?.errors?.[0]?.message || 'تاريخ البداية مطلوب');
};

export const validateEndDate = (value: string): string | undefined => {
  const result = dateStringSchema.safeParse(value);
  return result.success ? undefined : (result.error?.errors?.[0]?.message || 'تاريخ الانتهاء مطلوب');
};

export const validateTotalPrice = (value: number): string | undefined => {
  const result = totalPriceSchema.safeParse(value);
  return result.success ? undefined : (result.error?.errors?.[0]?.message || 'السعر الإجمالي غير صحيح');
};

export const validateNotes = (value: string): string | undefined => {
  if (!value) return undefined; // Optional field
  const result = notesSchema.safeParse(value);
  return result.success ? undefined : (result.error?.errors?.[0]?.message || 'الملاحظات غير صحيحة');
};

// ===== DATE RANGE VALIDATION =====
export const validateDateRange = (
  startDate: string,
  endDate: string
): string | undefined => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime())) {
    return 'تاريخ البداية غير صحيح';
  }

  if (isNaN(end.getTime())) {
    return 'تاريخ الانتهاء غير صحيح';
  }

  if (end <= start) {
    return 'تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية';
  }

  const durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (durationDays < AdCampaignValidationConfig.dateValidation.minimumDurationDays) {
    return `مدة الحملة يجب أن تكون ${AdCampaignValidationConfig.dateValidation.minimumDurationDays} يوم على الأقل`;
  }

  return undefined;
};

// ===== FULL FORM VALIDATORS =====
export const validateCreateAdCampaignForm = (
  data: AdCampaignFormData
): ValidationErrors => {
  const errors: ValidationErrors = {};

  // Validate required fields
  const campaignNameError = validateCampaignName(data.campaignName);
  if (campaignNameError) errors.campaignName = campaignNameError;

  const clientIdError = validateClientId(data.clientId);
  if (clientIdError) errors.clientId = clientIdError;

  const packageIdError = validatePackageId(data.packageId);
  if (packageIdError) errors.packageId = packageIdError;

  const startDateError = validateStartDate(data.startDate);
  if (startDateError) errors.startDate = startDateError;

  const endDateError = validateEndDate(data.endDate);
  if (endDateError) errors.endDate = endDateError;

  // Validate date range (only if both dates are valid)
  if (!startDateError && !endDateError) {
    const dateRangeError = validateDateRange(data.startDate, data.endDate);
    if (dateRangeError) {
      // Put error on endDate since it's usually the issue
      errors.endDate = dateRangeError;
    }
  }

  const totalPriceError = validateTotalPrice(data.totalPrice);
  if (totalPriceError) errors.totalPrice = totalPriceError;

  // Validate optional fields if provided
  if (data.description) {
    const descriptionError = validateDescription(data.description);
    if (descriptionError) errors.description = descriptionError;
  }

  if (data.notes) {
    const notesError = validateNotes(data.notes);
    if (notesError) errors.notes = notesError;
  }

  return errors;
};

export const validateEditAdCampaignForm = (
  data: AdCampaignFormData
): ValidationErrors => {
  // Edit form has same validation as create
  return validateCreateAdCampaignForm(data);
};

// ===== FIELD VALIDATOR FACTORY =====
// Used for Input component's `validate` prop for real-time validation
export const createAdCampaignFieldValidator = (
  fieldName: keyof AdCampaignFormData
) => {
  return (value: any): string | undefined => {
    switch (fieldName) {
      case 'campaignName':
        return validateCampaignName(value);
      case 'description':
        return validateDescription(value);
      case 'clientId':
        return validateClientId(value);
      case 'packageId':
        return validatePackageId(value);
      case 'startDate':
        return validateStartDate(value);
      case 'endDate':
        return validateEndDate(value);
      case 'totalPrice':
        return validateTotalPrice(value);
      case 'notes':
        return validateNotes(value);
      default:
        return undefined;
    }
  };
};

// ===== HELPER FUNCTIONS =====
export const hasValidationErrors = (errors: ValidationErrors): boolean => {
  return Object.values(errors).some((error) => error !== undefined);
};
