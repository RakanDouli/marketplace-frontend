import { z } from 'zod';

// ===== TYPES =====
export interface ProfileFormData {
  name: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  companyName?: string;
  website?: string;
  companyRegistrationNumber?: string;
  contactPhone?: string; // renamed from contactPhone
}

export interface ValidationErrors {
  name?: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  companyName?: string;
  website?: string;
  companyRegistrationNumber?: string;
  contactPhone?: string; // renamed from contactPhone
}

// ===== VALIDATION CONFIG - Single Source of Truth =====
export const ProfileValidationConfig = {
  name: {
    minLength: 2,
    maxLength: 100,
  },
  phone: {
    minLength: 7,
    maxLength: 20,
    pattern: /^[\d\s\-\+\(\)]+$/, // Numbers, spaces, dashes, plus, parentheses
  },
  companyName: {
    minLength: 2,
    maxLength: 100,
  },
  website: {
    maxLength: 255,
    pattern: /^https?:\/\/.+/i, // Must start with http:// or https://
  },
  companyRegistrationNumber: {
    minLength: 8,
    maxLength: 8,
    pattern: /^\d{8}$/, // Exactly 8 digits (Dutch KVK number)
  },
  contactPhone: {
    minLength: 7,
    maxLength: 20,
    pattern: /^[\d\s\-\+\(\)]+$/,
  },
};

// ===== ZOD SCHEMAS =====
const nameSchema = z
  .string()
  .min(1, 'الاسم مطلوب')
  .min(
    ProfileValidationConfig.name.minLength,
    `الاسم يجب أن يكون ${ProfileValidationConfig.name.minLength} أحرف على الأقل`
  )
  .max(
    ProfileValidationConfig.name.maxLength,
    `الاسم يجب ألا يتجاوز ${ProfileValidationConfig.name.maxLength} حرف`
  );

const phoneSchema = z
  .string()
  .min(
    ProfileValidationConfig.phone.minLength,
    `رقم الجوال يجب أن يكون ${ProfileValidationConfig.phone.minLength} أرقام على الأقل`
  )
  .max(
    ProfileValidationConfig.phone.maxLength,
    `رقم الجوال يجب ألا يتجاوز ${ProfileValidationConfig.phone.maxLength} رقم`
  )
  .regex(ProfileValidationConfig.phone.pattern, 'رقم الجوال يجب أن يحتوي على أرقام فقط')
  .optional();

const genderSchema = z.string().optional();

const dateOfBirthSchema = z.string().optional();

const companyNameSchema = z
  .string()
  .min(
    ProfileValidationConfig.companyName.minLength,
    `اسم الشركة يجب أن يكون ${ProfileValidationConfig.companyName.minLength} أحرف على الأقل`
  )
  .max(
    ProfileValidationConfig.companyName.maxLength,
    `اسم الشركة يجب ألا يتجاوز ${ProfileValidationConfig.companyName.maxLength} حرف`
  )
  .or(z.literal(''))
  .optional();

const websiteSchema = z
  .string()
  .max(
    ProfileValidationConfig.website.maxLength,
    `الموقع الإلكتروني يجب ألا يتجاوز ${ProfileValidationConfig.website.maxLength} حرف`
  )
  .regex(
    ProfileValidationConfig.website.pattern,
    'الموقع الإلكتروني يجب أن يبدأ بـ http:// أو https://'
  )
  .or(z.literal(''))
  .optional();

const companyRegistrationNumberSchema = z
  .string()
  .length(ProfileValidationConfig.companyRegistrationNumber.minLength, 'رقم التسجيل التجاري يجب أن يكون 8 أرقام')
  .regex(ProfileValidationConfig.companyRegistrationNumber.pattern, 'رقم التسجيل التجاري يجب أن يحتوي على أرقام فقط')
  .or(z.literal(''))
  .optional();

const contactPhoneSchema = z
  .string()
  .min(
    ProfileValidationConfig.contactPhone.minLength,
    `هاتف المكتب يجب أن يكون ${ProfileValidationConfig.contactPhone.minLength} أرقام على الأقل`
  )
  .max(
    ProfileValidationConfig.contactPhone.maxLength,
    `هاتف المكتب يجب ألا يتجاوز ${ProfileValidationConfig.contactPhone.maxLength} رقم`
  )
  .regex(ProfileValidationConfig.contactPhone.pattern, 'هاتف المكتب يجب أن يحتوي على أرقام فقط')
  .or(z.literal(''))
  .optional();

// Full profile form schema
const profileSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  gender: genderSchema,
  dateOfBirth: dateOfBirthSchema,
  companyName: companyNameSchema,
  website: websiteSchema,
  companyRegistrationNumber: companyRegistrationNumberSchema,
  contactPhone: contactPhoneSchema,
});

// ===== INDIVIDUAL FIELD VALIDATORS =====
export const validateName = (value: string): string | undefined => {
  const result = nameSchema.safeParse(value);
  return result.success ? undefined : result.error.issues[0]?.message;
};

export const validatePhone = (value: string): string | undefined => {
  if (!value) return undefined; // Optional field
  const result = phoneSchema.safeParse(value);
  return result.success ? undefined : result.error.issues[0]?.message;
};

export const validateGender = (value: string): string | undefined => {
  if (!value) return undefined; // Optional field
  const result = genderSchema.safeParse(value);
  return result.success ? undefined : result.error.issues[0]?.message;
};

export const validateDateOfBirth = (value: string): string | undefined => {
  if (!value) return undefined; // Optional field
  const result = dateOfBirthSchema.safeParse(value);
  return result.success ? undefined : result.error.issues[0]?.message;
};

export const validateCompanyName = (value: string): string | undefined => {
  if (!value) return undefined; // Optional field
  const result = companyNameSchema.safeParse(value);
  return result.success ? undefined : result.error.issues[0]?.message;
};

export const validateWebsite = (value: string): string | undefined => {
  if (!value) return undefined; // Optional field
  const result = websiteSchema.safeParse(value);
  return result.success ? undefined : result.error.issues[0]?.message;
};

export const validateKvkNumber = (value: string): string | undefined => {
  if (!value) return undefined; // Optional field
  const result = companyRegistrationNumberSchema.safeParse(value);
  return result.success ? undefined : result.error.issues[0]?.message;
};

export const validateOfficePhone = (value: string): string | undefined => {
  if (!value) return undefined; // Optional field
  const result = contactPhoneSchema.safeParse(value);
  return result.success ? undefined : result.error.issues[0]?.message;
};

// ===== FULL FORM VALIDATORS =====
export const validateProfileForm = (formData: ProfileFormData): ValidationErrors => {
  const result = profileSchema.safeParse(formData);

  if (result.success) {
    return {};
  }

  // Convert Zod errors to our ValidationErrors format
  const errors: ValidationErrors = {};
  result.error.issues.forEach((issue) => {
    const field = issue.path[0] as string;
    if (!errors[field]) {
      errors[field] = issue.message;
    }
  });

  return errors;
};

// ===== FIELD VALIDATOR FACTORY =====
// Used for Input component's `validate` prop for real-time validation
export const createProfileFieldValidator = (fieldName: keyof ProfileFormData) => {
  return (value: any): string | undefined => {
    switch (fieldName) {
      case 'name':
        return validateName(value);
      case 'phone':
        return validatePhone(value);
      case 'gender':
        return validateGender(value);
      case 'dateOfBirth':
        return validateDateOfBirth(value);
      case 'companyName':
        return validateCompanyName(value);
      case 'website':
        return validateWebsite(value);
      case 'companyRegistrationNumber':
        return validateKvkNumber(value);
      case 'contactPhone':
        return validateOfficePhone(value);
      default:
        return undefined;
    }
  };
};

// ===== HELPER FUNCTIONS =====
export const hasValidationErrors = (errors: ValidationErrors): boolean => {
  return Object.values(errors).some((error) => error !== undefined);
};
