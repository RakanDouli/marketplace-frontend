// Authentication form validation with Zod
import { z } from 'zod';
import type { AccountType } from '@/stores/userAuthStore/types';

export interface SignupFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  accountType: AccountType;
  acceptTerms: boolean;
}

export interface ValidationErrors {
  [key: string]: string | undefined;
}

// Zod schema for signup form
const signupSchema = z.object({
  name: z.string()
    .min(1, 'الاسم مطلوب')
    .min(2, 'الاسم يجب أن يكون حرفين على الأقل')
    .trim(),
  email: z.string()
    .min(1, 'البريد الإلكتروني مطلوب')
    .email('البريد الإلكتروني غير صحيح')
    .trim(),
  password: z.string()
    .min(1, 'كلمة المرور مطلوبة')
    .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
  confirmPassword: z.string()
    .min(1, 'تأكيد كلمة المرور مطلوب'),
  accountType: z.string(),
  acceptTerms: z.boolean()
    .refine(val => val === true, {
      message: 'يرجى الموافقة على الشروط والأحكام',
    }),
}).refine(data => data.password === data.confirmPassword, {
  message: 'كلمة المرور غير متطابقة',
  path: ['confirmPassword'],
});

// Individual field validators (for Input component validate prop)
export const validateName = (name: string): string | undefined => {
  const result = z.string().min(1, 'الاسم مطلوب').min(2, 'الاسم يجب أن يكون حرفين على الأقل').safeParse(name);
  if (!result.success) {
    return result.error.issues[0]?.message || 'الاسم غير صحيح';
  }
  return undefined;
};

export const validateEmail = (email: string): string | undefined => {
  const result = z.string().min(1, 'البريد الإلكتروني مطلوب').email('البريد الإلكتروني غير صحيح').safeParse(email);
  if (!result.success) {
    return result.error.issues[0]?.message || 'البريد الإلكتروني غير صحيح';
  }
  return undefined;
};

export const validatePassword = (password: string): string | undefined => {
  const result = z.string().min(1, 'كلمة المرور مطلوبة').min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل').safeParse(password);
  if (!result.success) {
    return result.error.issues[0]?.message || 'كلمة المرور غير صحيحة';
  }
  return undefined;
};

export const validateConfirmPassword = (confirmPassword: string, password: string): string | undefined => {
  if (!confirmPassword) return 'تأكيد كلمة المرور مطلوب';
  if (confirmPassword !== password) return 'كلمة المرور غير متطابقة';
  return undefined;
};

// Full form validation using Zod schema
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

// Field validator factory for Input component
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

// Helper to check if there are any errors
export const hasValidationErrors = (errors: ValidationErrors): boolean => {
  return Object.keys(errors).some((key) => errors[key] !== undefined);
};
