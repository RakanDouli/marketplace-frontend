/**
 * Brand & Model validation utilities for admin dashboard with Zod
 * Provides client-side validation with Arabic error messages
 */

import { z } from 'zod';

export interface BrandFormData {
  name: string;
  externalId?: string;
  source?: string;
  status?: string;
  aliases?: string[];
}

export interface ModelFormData {
  name: string;
  externalId?: string;
  source?: string;
  status?: string;
  aliases?: string[];
}

export interface ValidationErrors {
  [key: string]: string | undefined;
}

// Zod schemas for Brand
const brandNameSchema = z.string()
  .min(1, 'اسم العلامة التجارية مطلوب')
  .min(2, 'اسم العلامة التجارية يجب أن يكون على الأقل حرفين')
  .max(100, 'اسم العلامة التجارية يجب أن يكون أقل من 100 حرف')
  .transform(val => val.trim());

const externalIdSchema = z.string()
  .max(255, 'المعرف الخارجي يجب أن يكون أقل من 255 حرف')
  .optional();

const sourceSchema = z.enum(['manual', 'sync'], {
  message: 'مصدر البيانات غير صحيح'
}).optional();

const statusSchema = z.enum(['active', 'archived'], {
  message: 'حالة العلامة التجارية غير صحيحة'
}).optional();

const aliasesSchema = z.array(z.string()
  .min(1, 'الاسم البديل لا يمكن أن يكون فارغاً')
  .max(100, 'الاسم البديل يجب أن يكون أقل من 100 حرف')
).refine(
  (aliases) => new Set(aliases).size === aliases.length,
  { message: 'لا يمكن أن تكون هناك أسماء بديلة مكررة' }
).optional();

const brandFormSchema = z.object({
  name: brandNameSchema,
  externalId: externalIdSchema,
  source: sourceSchema,
  status: statusSchema,
  aliases: aliasesSchema,
});

// Zod schemas for Model
const modelNameSchema = z.string()
  .min(1, 'اسم الموديل مطلوب')
  .min(2, 'اسم الموديل يجب أن يكون على الأقل حرفين')
  .max(100, 'اسم الموديل يجب أن يكون أقل من 100 حرف')
  .transform(val => val.trim());

const modelStatusSchema = z.enum(['active', 'archived'], {
  message: 'حالة الموديل غير صحيحة'
}).optional();

const modelFormSchema = z.object({
  name: modelNameSchema,
  externalId: externalIdSchema,
  source: sourceSchema,
  status: modelStatusSchema,
  aliases: aliasesSchema,
});

// Brand validation
export function validateBrandForm(formData: any): Record<string, string> {
  const result = brandFormSchema.safeParse(formData);

  if (result.success) {
    return {};
  }

  const errors: Record<string, string> = {};
  result.error.issues.forEach((issue) => {
    const field = issue.path.join('_');
    if (!errors[field]) {
      errors[field] = issue.message;
    }
  });

  return errors;
}

// Model validation
export function validateModelForm(formData: any): Record<string, string> {
  const result = modelFormSchema.safeParse(formData);

  if (result.success) {
    return {};
  }

  const errors: Record<string, string> = {};
  result.error.issues.forEach((issue) => {
    const field = issue.path.join('_');
    if (!errors[field]) {
      errors[field] = issue.message;
    }
  });

  return errors;
}

// Helper function to check if form has errors
export function hasValidationErrors(errors: Record<string, string>): boolean {
  return Object.keys(errors).length > 0;
}

// Field-level validation for real-time validation
export function createBrandFieldValidator(fieldName: string) {
  return (value: string) => {
    const tempFormData = { [fieldName]: value };
    const errors = validateBrandForm(tempFormData);
    return errors[fieldName];
  };
}

export function createModelFieldValidator(fieldName: string) {
  return (value: string) => {
    const tempFormData = { [fieldName]: value };
    const errors = validateModelForm(tempFormData);
    return errors[fieldName];
  };
}
