// Report listing validation with Zod
import { z } from 'zod';

// ===== TYPES =====
export interface ReportFormData {
  reason: string;
  details?: string;
}

export interface ValidationErrors {
  [key: string]: string | undefined;
}

// ===== VALIDATION CONFIG - Single Source of Truth =====
export const ReportValidationConfig = {
  reason: {
    required: true,
  },
  details: {
    minLength: 0,
    maxLength: 1000,
  },
};

// ===== ZOD SCHEMAS =====

// Reason schema
const reasonSchema = z
  .string()
  .min(1, 'يرجى اختيار سبب البلاغ')
  .trim();

// Details schema (optional)
const detailsSchema = z
  .string()
  .max(ReportValidationConfig.details.maxLength, `التفاصيل يجب ألا تتجاوز ${ReportValidationConfig.details.maxLength} حرف`)
  .trim()
  .optional();

// ===== INDIVIDUAL FIELD VALIDATORS =====

export const validateReason = (value: string): string | undefined => {
  const result = reasonSchema.safeParse(value);
  return result.success ? undefined : result.error.issues[0]?.message;
};

export const validateDetails = (value: string | undefined): string | undefined => {
  const result = detailsSchema.safeParse(value);
  return result.success ? undefined : result.error.issues[0]?.message;
};

// ===== FORM VALIDATORS =====

export const validateReportForm = (data: ReportFormData): ValidationErrors => {
  const errors: ValidationErrors = {};

  const reasonError = validateReason(data.reason);
  if (reasonError) errors.reason = reasonError;

  if (data.details) {
    const detailsError = validateDetails(data.details);
    if (detailsError) errors.details = detailsError;
  }

  return errors;
};

// ===== HELPER FUNCTIONS =====

export const hasValidationErrors = (errors: ValidationErrors): boolean => {
  return Object.values(errors).some((error) => error !== undefined);
};
