import { z } from 'zod';

// ===== TYPES =====
export interface AdClientFormData {
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  website?: string;
  description?: string;
  industry?: string;
  status: string;
  notes?: string;
}

export interface ValidationErrors {
  companyName?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  description?: string;
  industry?: string;
  status?: string;
  notes?: string;
}

// ===== VALIDATION CONFIG - Single Source of Truth =====
export const AdClientValidationConfig = {
  companyName: {
    minLength: 2,
    maxLength: 100,
  },
  contactName: {
    minLength: 2,
    maxLength: 100,
  },
  contactEmail: {
    maxLength: 255,
  },
  contactPhone: {
    minLength: 7,
    maxLength: 20,
    pattern: /^[\d\s\-\+\(\)]+$/, // Numbers, spaces, dashes, plus, parentheses
  },
  website: {
    maxLength: 255,
    pattern: /^https?:\/\/.+/i, // Must start with http:// or https://
  },
  description: {
    maxLength: 1000,
  },
  industry: {
    maxLength: 100,
  },
  notes: {
    maxLength: 1000,
  },
};

// ===== ZOD SCHEMAS =====
const companyNameSchema = z
  .string()
  .min(
    AdClientValidationConfig.companyName.minLength,
    `اسم الشركة يجب أن يكون ${AdClientValidationConfig.companyName.minLength} أحرف على الأقل`
  )
  .max(
    AdClientValidationConfig.companyName.maxLength,
    `اسم الشركة يجب ألا يتجاوز ${AdClientValidationConfig.companyName.maxLength} حرف`
  );

const contactNameSchema = z
  .string()
  .min(
    AdClientValidationConfig.contactName.minLength,
    `اسم جهة الاتصال يجب أن يكون ${AdClientValidationConfig.contactName.minLength} أحرف على الأقل`
  )
  .max(
    AdClientValidationConfig.contactName.maxLength,
    `اسم جهة الاتصال يجب ألا يتجاوز ${AdClientValidationConfig.contactName.maxLength} حرف`
  );

const contactEmailSchema = z
  .string()
  .email('يجب إدخال بريد إلكتروني صحيح')
  .max(
    AdClientValidationConfig.contactEmail.maxLength,
    `البريد الإلكتروني يجب ألا يتجاوز ${AdClientValidationConfig.contactEmail.maxLength} حرف`
  );

const contactPhoneSchema = z
  .string()
  .min(
    AdClientValidationConfig.contactPhone.minLength,
    `رقم الهاتف يجب أن يكون ${AdClientValidationConfig.contactPhone.minLength} أرقام على الأقل`
  )
  .max(
    AdClientValidationConfig.contactPhone.maxLength,
    `رقم الهاتف يجب ألا يتجاوز ${AdClientValidationConfig.contactPhone.maxLength} رقم`
  )
  .regex(
    AdClientValidationConfig.contactPhone.pattern,
    'رقم الهاتف يجب أن يحتوي على أرقام فقط'
  )
  .optional();

const websiteSchema = z
  .string()
  .max(
    AdClientValidationConfig.website.maxLength,
    `الموقع الإلكتروني يجب ألا يتجاوز ${AdClientValidationConfig.website.maxLength} حرف`
  )
  .regex(
    AdClientValidationConfig.website.pattern,
    'الموقع الإلكتروني يجب أن يبدأ بـ http:// أو https://'
  )
  .optional();

const descriptionSchema = z
  .string()
  .max(
    AdClientValidationConfig.description.maxLength,
    `الوصف يجب ألا يتجاوز ${AdClientValidationConfig.description.maxLength} حرف`
  )
  .optional();

const industrySchema = z
  .string()
  .max(
    AdClientValidationConfig.industry.maxLength,
    `الصناعة يجب ألا تتجاوز ${AdClientValidationConfig.industry.maxLength} حرف`
  )
  .optional();

const statusSchema = z.string().min(1, 'الحالة مطلوبة');

const notesSchema = z
  .string()
  .max(
    AdClientValidationConfig.notes.maxLength,
    `الملاحظات يجب ألا تتجاوز ${AdClientValidationConfig.notes.maxLength} حرف`
  )
  .optional();

// ===== INDIVIDUAL FIELD VALIDATORS =====
export const validateCompanyName = (value: string): string | undefined => {
  const result = companyNameSchema.safeParse(value);
  return result.success ? undefined : result.error.errors[0]?.message;
};

export const validateContactName = (value: string): string | undefined => {
  const result = contactNameSchema.safeParse(value);
  return result.success ? undefined : result.error.errors[0]?.message;
};

export const validateContactEmail = (value: string): string | undefined => {
  const result = contactEmailSchema.safeParse(value);
  return result.success ? undefined : result.error.errors[0]?.message;
};

export const validateContactPhone = (value: string): string | undefined => {
  if (!value) return undefined; // Optional field
  const result = contactPhoneSchema.safeParse(value);
  return result.success ? undefined : result.error.errors[0]?.message;
};

export const validateWebsite = (value: string): string | undefined => {
  if (!value) return undefined; // Optional field
  const result = websiteSchema.safeParse(value);
  return result.success ? undefined : result.error.errors[0]?.message;
};

export const validateDescription = (value: string): string | undefined => {
  if (!value) return undefined; // Optional field
  const result = descriptionSchema.safeParse(value);
  return result.success ? undefined : result.error.errors[0]?.message;
};

export const validateIndustry = (value: string): string | undefined => {
  if (!value) return undefined; // Optional field
  const result = industrySchema.safeParse(value);
  return result.success ? undefined : result.error.errors[0]?.message;
};

export const validateStatus = (value: string): string | undefined => {
  const result = statusSchema.safeParse(value);
  return result.success ? undefined : result.error.errors[0]?.message;
};

export const validateNotes = (value: string): string | undefined => {
  if (!value) return undefined; // Optional field
  const result = notesSchema.safeParse(value);
  return result.success ? undefined : result.error.errors[0]?.message;
};

// ===== FULL FORM VALIDATORS =====
export const validateCreateAdClientForm = (
  data: AdClientFormData
): ValidationErrors => {
  const errors: ValidationErrors = {};

  // Validate required fields
  const companyNameError = validateCompanyName(data.companyName);
  if (companyNameError) errors.companyName = companyNameError;

  const contactNameError = validateContactName(data.contactName);
  if (contactNameError) errors.contactName = contactNameError;

  const contactEmailError = validateContactEmail(data.contactEmail);
  if (contactEmailError) errors.contactEmail = contactEmailError;

  const statusError = validateStatus(data.status);
  if (statusError) errors.status = statusError;

  // Validate optional fields if provided
  if (data.contactPhone) {
    const phoneError = validateContactPhone(data.contactPhone);
    if (phoneError) errors.contactPhone = phoneError;
  }

  if (data.website) {
    const websiteError = validateWebsite(data.website);
    if (websiteError) errors.website = websiteError;
  }

  if (data.description) {
    const descriptionError = validateDescription(data.description);
    if (descriptionError) errors.description = descriptionError;
  }

  if (data.industry) {
    const industryError = validateIndustry(data.industry);
    if (industryError) errors.industry = industryError;
  }

  if (data.notes) {
    const notesError = validateNotes(data.notes);
    if (notesError) errors.notes = notesError;
  }

  return errors;
};

export const validateEditAdClientForm = (
  data: AdClientFormData
): ValidationErrors => {
  // Edit form has same validation as create
  return validateCreateAdClientForm(data);
};

// ===== FIELD VALIDATOR FACTORY =====
// Used for Input component's `validate` prop for real-time validation
export const createAdClientFieldValidator = (
  fieldName: keyof AdClientFormData
) => {
  return (value: any): string | undefined => {
    switch (fieldName) {
      case 'companyName':
        return validateCompanyName(value);
      case 'contactName':
        return validateContactName(value);
      case 'contactEmail':
        return validateContactEmail(value);
      case 'contactPhone':
        return validateContactPhone(value);
      case 'website':
        return validateWebsite(value);
      case 'description':
        return validateDescription(value);
      case 'industry':
        return validateIndustry(value);
      case 'status':
        return validateStatus(value);
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
