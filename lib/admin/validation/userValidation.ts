/**
 * User validation utilities for admin dashboard with Zod
 * Provides client-side validation with Arabic error messages
 */

import { z } from 'zod';

export interface UserFormData {
  name: string;
  email: string;
  password?: string; // Optional for edit mode
  role: string;
  status: string;
}

export interface ValidationErrors {
  [key: string]: string | undefined;
}

// Zod schemas
const nameSchema = z.string()
  .min(1, 'اسم المستخدم مطلوب')
  .min(2, 'اسم المستخدم يجب أن يكون حرفين على الأقل')
  .max(100, 'اسم المستخدم يجب أن يكون أقل من 100 حرف')
  .regex(/^[\u0600-\u06FF\u0750-\u077Fa-zA-Z0-9\s.-]+$/, 'اسم المستخدم يجب أن يحتوي على أحرف وأرقام فقط')
  .transform(val => val.trim());

const emailSchema = z.string()
  .min(1, 'البريد الإلكتروني مطلوب')
  .email('البريد الإلكتروني غير صحيح')
  .max(255, 'البريد الإلكتروني يجب أن يكون أقل من 255 حرف')
  .transform(val => val.trim());

const passwordSchemaRequired = z.string()
  .min(1, 'كلمة المرور مطلوبة')
  .min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل')
  .max(128, 'كلمة المرور يجب أن تكون أقل من 128 حرف')
  .refine(
    (val) => /[A-Z]/.test(val) && /[a-z]/.test(val) && /\d/.test(val),
    'كلمة المرور يجب أن تحتوي على أحرف كبيرة وصغيرة وأرقام'
  );

const passwordSchemaOptional = z.string()
  .min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل')
  .max(128, 'كلمة المرور يجب أن تكون أقل من 128 حرف')
  .refine(
    (val) => !val || (/[A-Z]/.test(val) && /[a-z]/.test(val) && /\d/.test(val)),
    'كلمة المرور يجب أن تحتوي على أحرف كبيرة وصغيرة وأرقام'
  )
  .optional();

const roleSchema = z.string()
  .min(1, 'الدور مطلوب')
  .transform(val => val.trim());

const statusSchema = z.enum(['active', 'pending', 'banned'], {
  message: 'حالة المستخدم غير صحيحة'
});

// Full form schemas
const userFormCreateSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchemaRequired,
  role: roleSchema,
  status: statusSchema,
});

const userFormEditSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchemaOptional,
  role: roleSchema,
  status: statusSchema,
});

// Individual field validators
export const validateUserName = (name: string): string | undefined => {
  const result = nameSchema.safeParse(name);
  if (!result.success) {
    return result.error.issues[0]?.message || 'اسم المستخدم غير صحيح';
  }
  return undefined;
};

export const validateUserEmail = (email: string): string | undefined => {
  const result = emailSchema.safeParse(email);
  if (!result.success) {
    return result.error.issues[0]?.message || 'البريد الإلكتروني غير صحيح';
  }
  return undefined;
};

export const validateUserPassword = (password: string, isRequired: boolean = true): string | undefined => {
  const schema = isRequired ? passwordSchemaRequired : passwordSchemaOptional;
  const result = schema.safeParse(password);
  if (!result.success) {
    return result.error.issues[0]?.message || 'كلمة المرور غير صحيحة';
  }
  return undefined;
};

export const validateUserRole = (role: string): string | undefined => {
  const result = roleSchema.safeParse(role);
  if (!result.success) {
    return result.error.issues[0]?.message || 'الدور غير صحيح';
  }
  return undefined;
};

export const validateUserStatus = (status: string): string | undefined => {
  const result = statusSchema.safeParse(status);
  if (!result.success) {
    return result.error.issues[0]?.message || 'حالة المستخدم غير صحيحة';
  }
  return undefined;
};

// Full form validation
export const validateUserFormCreate = (formData: UserFormData): ValidationErrors => {
  const result = userFormCreateSchema.safeParse(formData);

  if (result.success) {
    return {};
  }

  const errors: ValidationErrors = {};
  result.error.issues.forEach((issue) => {
    const field = issue.path[0] as string;
    if (!errors[field]) {
      errors[field] = issue.message;
    }
  });

  return errors;
};

export const validateUserFormEdit = (formData: UserFormData): ValidationErrors => {
  const result = userFormEditSchema.safeParse(formData);

  if (result.success) {
    return {};
  }

  const errors: ValidationErrors = {};
  result.error.issues.forEach((issue) => {
    const field = issue.path[0] as string;
    if (!errors[field]) {
      errors[field] = issue.message;
    }
  });

  return errors;
};

// Helper to check if there are any errors
export const hasValidationErrors = (errors: ValidationErrors): boolean => {
  return Object.values(errors).some(error => error !== undefined);
};

// Real-time field validator for use with Input components
export const createUserFieldValidator = (fieldName: keyof UserFormData, mode: 'create' | 'edit' = 'create') => {
  return (value: string): string | undefined => {
    switch (fieldName) {
      case 'name':
        return validateUserName(value);
      case 'email':
        return validateUserEmail(value);
      case 'password':
        return validateUserPassword(value, mode === 'create');
      case 'role':
        return validateUserRole(value);
      case 'status':
        return validateUserStatus(value);
      default:
        return undefined;
    }
  };
};
