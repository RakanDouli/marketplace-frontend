// Authentication form validation with Zod
import { z } from 'zod';
import type { AccountType } from '@/stores/userAuthStore/types';

// ===== TYPES =====
export interface SignupFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  accountType: AccountType;
  acceptTerms: boolean;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface ValidationErrors {
  [key: string]: string | undefined;
}

// ===== VALIDATION CONFIG - Single Source of Truth =====
export const AuthValidationConfig = {
  name: {
    minLength: 2,
    maxLength: 100,
  },
  email: {
    maxLength: 255,
  },
  password: {
    minLength: 8,
    maxLength: 128,
  },
};

// ===== ZOD SCHEMAS =====

// Name schema
const nameSchema = z
  .string()
  .min(1, 'الاسم مطلوب')
  .min(AuthValidationConfig.name.minLength, `الاسم يجب أن يكون ${AuthValidationConfig.name.minLength} أحرف على الأقل`)
  .max(AuthValidationConfig.name.maxLength, `الاسم يجب ألا يتجاوز ${AuthValidationConfig.name.maxLength} حرف`)
  .trim();

// Email schema
const emailSchema = z
  .string()
  .min(1, 'البريد الإلكتروني مطلوب')
  .email('البريد الإلكتروني غير صحيح')
  .max(AuthValidationConfig.email.maxLength, `البريد الإلكتروني يجب ألا يتجاوز ${AuthValidationConfig.email.maxLength} حرف`)
  .trim();

// Password schema
const passwordSchema = z
  .string()
  .min(1, 'كلمة المرور مطلوبة')
  .min(AuthValidationConfig.password.minLength, `كلمة المرور يجب أن تكون ${AuthValidationConfig.password.minLength} أحرف على الأقل`)
  .max(AuthValidationConfig.password.maxLength, `كلمة المرور يجب ألا تتجاوز ${AuthValidationConfig.password.maxLength} حرف`);

// Signup form schema (with password confirmation and terms)
const signupSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'تأكيد كلمة المرور مطلوب'),
    accountType: z.string(),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'يرجى الموافقة على الشروط والأحكام',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'كلمة المرور غير متطابقة',
    path: ['confirmPassword'],
  });

// Login form schema
const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
});

// ===== INDIVIDUAL FIELD VALIDATORS =====
export const validateName = (name: string): string | undefined => {
  const result = nameSchema.safeParse(name);
  return result.success ? undefined : result.error.issues[0]?.message;
};

export const validateEmail = (email: string): string | undefined => {
  const result = emailSchema.safeParse(email);
  return result.success ? undefined : result.error.issues[0]?.message;
};

export const validatePassword = (password: string): string | undefined => {
  const result = passwordSchema.safeParse(password);
  return result.success ? undefined : result.error.issues[0]?.message;
};

export const validateConfirmPassword = (
  confirmPassword: string,
  password: string
): string | undefined => {
  if (!confirmPassword) return 'تأكيد كلمة المرور مطلوب';
  if (confirmPassword !== password) return 'كلمة المرور غير متطابقة';
  return undefined;
};

// ===== FULL FORM VALIDATORS =====
export const validateSignupForm = (formData: SignupFormData): ValidationErrors => {
  const result = signupSchema.safeParse(formData);

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

export const validateLoginForm = (formData: LoginFormData): ValidationErrors => {
  const result = loginSchema.safeParse(formData);

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
// Field validator factory for Signup form
export const createSignupFieldValidator = (
  field: keyof SignupFormData,
  password?: string
) => {
  return (value: any): string | undefined => {
    switch (field) {
      case 'name':
        return validateName(value);
      case 'email':
        return validateEmail(value);
      case 'password':
        return validatePassword(value);
      case 'confirmPassword':
        return validateConfirmPassword(value, password || '');
      default:
        return undefined;
    }
  };
};

// Field validator factory for Login form
export const createLoginFieldValidator = (field: keyof LoginFormData) => {
  return (value: any): string | undefined => {
    switch (field) {
      case 'email':
        return validateEmail(value);
      case 'password':
        // For login, we only check if password is provided (not length)
        return value ? undefined : 'كلمة المرور مطلوبة';
      default:
        return undefined;
    }
  };
};

// ===== HELPER FUNCTIONS =====
export const hasValidationErrors = (errors: ValidationErrors): boolean => {
  return Object.keys(errors).some((key) => errors[key] !== undefined);
};
