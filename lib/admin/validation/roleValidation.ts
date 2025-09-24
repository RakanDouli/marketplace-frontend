/**
 * Role validation utilities for admin dashboard
 * Provides client-side validation with Arabic error messages
 */

export interface RoleFormData {
  name: string;
  description: string;
}

export interface ValidationErrors {
  [key: string]: string | undefined;
}

/**
 * Validate role name field
 */
export const validateRoleName = (name: string): string | undefined => {
  if (!name || !name.trim()) {
    return 'اسم الدور مطلوب';
  }

  if (name.trim().length < 2) {
    return 'اسم الدور يجب أن يكون حرفين على الأقل';
  }

  if (name.trim().length > 50) {
    return 'اسم الدور يجب أن يكون أقل من 50 حرف';
  }

  // Check for valid characters (Arabic, English, numbers, spaces, underscores)
  const validNamePattern = /^[\u0600-\u06FF\u0750-\u077Fa-zA-Z0-9\s_-]+$/;
  if (!validNamePattern.test(name.trim())) {
    return 'اسم الدور يجب أن يحتوي على أحرف وأرقام فقط';
  }

  return undefined;
};

/**
 * Validate role description field
 */
export const validateRoleDescription = (description: string): string | undefined => {
  if (description && description.length > 200) {
    return 'وصف الدور يجب أن يكون أقل من 200 حرف';
  }

  return undefined;
};

/**
 * Validate entire role form
 */
export const validateRoleForm = (formData: RoleFormData): ValidationErrors => {
  const errors: ValidationErrors = {};

  // Validate name
  const nameError = validateRoleName(formData.name);
  if (nameError) {
    errors.name = nameError;
  }

  // Validate description
  const descriptionError = validateRoleDescription(formData.description);
  if (descriptionError) {
    errors.description = descriptionError;
  }

  return errors;
};

/**
 * Check if form has any validation errors
 */
export const hasValidationErrors = (errors: ValidationErrors): boolean => {
  return Object.values(errors).some(error => error !== undefined);
};

/**
 * Real-time field validator for use with Input components
 */
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