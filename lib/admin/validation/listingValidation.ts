/**
 * Listing validation utilities with Zod and Arabic error messages
 * Following the same pattern as userValidation.ts and roleValidation.ts
 */

import { z } from 'zod';

export interface ListingFormData {
  status: string;
}

export interface ValidationErrors {
  status?: string;
}

// Zod schema
const statusSchema = z.enum(
  ['draft', 'pending_approval', 'active', 'hidden', 'sold', 'sold_via_platform'],
  { message: 'حالة الإعلان المختارة غير صحيحة' }
);

const listingStatusFormSchema = z.object({
  status: statusSchema,
});

// Status validation
export const validateStatus = (status: string): string | undefined => {
  if (!status || !status.trim()) {
    return 'يجب اختيار حالة الإعلان';
  }
  const result = statusSchema.safeParse(status);
  if (!result.success) {
    return result.error.issues[0]?.message || 'حالة الإعلان غير صحيحة';
  }
  return undefined;
};

// Form-level validation for status change
export const validateListingStatusForm = (formData: ListingFormData): ValidationErrors => {
  const result = listingStatusFormSchema.safeParse(formData);

  if (result.success) {
    return {};
  }

  const errors: ValidationErrors = {};
  result.error.issues.forEach((issue) => {
    const field = issue.path[0] as keyof ValidationErrors;
    if (!errors[field]) {
      errors[field] = issue.message;
    }
  });

  return errors;
};

// Real-time field validator factory
export const createListingFieldValidator = (field: keyof ListingFormData) => {
  return (value: string): string | undefined => {
    switch (field) {
      case 'status':
        return validateStatus(value);
      default:
        return undefined;
    }
  };
};

// Helper to check if validation errors exist
export const hasValidationErrors = (errors: ValidationErrors): boolean => {
  return Object.keys(errors).length > 0;
};
