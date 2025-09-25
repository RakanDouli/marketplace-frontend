// Listing validation utilities with Arabic error messages
// Following the same pattern as userValidation.ts and roleValidation.ts

export interface ListingFormData {
  status: string;
}

export interface ValidationErrors {
  status?: string;
}

// Status validation
export const validateStatus = (status: string): string | undefined => {
  if (!status || !status.trim()) {
    return 'يجب اختيار حالة الإعلان';
  }

  const validStatuses = ['draft', 'pending_approval', 'active', 'hidden', 'sold', 'sold_via_platform'];
  if (!validStatuses.includes(status)) {
    return 'حالة الإعلان المختارة غير صحيحة';
  }

  return undefined;
};


// Form-level validation for status change
export const validateListingStatusForm = (formData: ListingFormData): ValidationErrors => {
  const errors: ValidationErrors = {};

  const statusError = validateStatus(formData.status);
  if (statusError) errors.status = statusError;

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