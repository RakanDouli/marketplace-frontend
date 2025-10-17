/**
 * Role validation utilities for admin dashboard with Zod
 * Provides client-side validation with Arabic error messages
 */

import { z } from 'zod';

export interface RoleFormData {
  name: string;
  description: string;
}

export interface ValidationErrors {
  [key: string]: string | undefined;
}

// Zod schemas
const nameSchema = z.string()
  .min(1, 'اسم الدور مطلوب')
  .min(2, 'اسم الدور يجب أن يكون حرفين على الأقل')
  .max(50, 'اسم الدور يجب أن يكون أقل من 50 حرف')
  .regex(/^[\u0600-\u06FF\u0750-\u077Fa-zA-Z0-9\s_-]+$/, 'اسم الدور يجب أن يحتوي على أحرف وأرقام فقط')
  .transform(val => val.trim());

const descriptionSchema = z.string()
  .max(200, 'وصف الدور يجب أن يكون أقل من 200 حرف')
  .optional();

const roleFormSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
});

// Individual field validators
export const validateRoleName = (name: string): string | undefined => {
  const result = nameSchema.safeParse(name);
  if (!result.success) {
    return result.error.issues[0]?.message || 'اسم الدور غير صحيح';
  }
  return undefined;
};

export const validateRoleDescription = (description: string): string | undefined => {
  const result = descriptionSchema.safeParse(description);
  if (!result.success) {
    return result.error.issues[0]?.message || 'وصف الدور غير صحيح';
  }
  return undefined;
};

// Full form validation
export const validateRoleForm = (formData: RoleFormData): ValidationErrors => {
  const result = roleFormSchema.safeParse(formData);

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
export const createFieldValidator = (fieldName: keyof RoleFormData) => {
  return (value: string): string | undefined => {
    switch (fieldName) {
      case 'name':
        return validateRoleName(value);
      case 'description':
        return validateRoleDescription(value);
      default:
        return undefined;
    }
  };
};
