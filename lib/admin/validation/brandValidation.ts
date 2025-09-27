// Brand validation functions
export function validateBrandForm(formData: any): Record<string, string> {
  const errors: Record<string, string> = {};

  // Name validation
  if (!formData.name || formData.name.trim().length === 0) {
    errors.name = 'اسم العلامة التجارية مطلوب';
  } else if (formData.name.trim().length < 2) {
    errors.name = 'اسم العلامة التجارية يجب أن يكون على الأقل حرفين';
  } else if (formData.name.trim().length > 100) {
    errors.name = 'اسم العلامة التجارية يجب أن يكون أقل من 100 حرف';
  }

  // External ID validation (optional)
  if (formData.externalId && formData.externalId.length > 255) {
    errors.externalId = 'المعرف الخارجي يجب أن يكون أقل من 255 حرف';
  }

  // Source validation (case-insensitive)
  if (formData.source && !['manual', 'sync'].includes(formData.source.toLowerCase())) {
    errors.source = 'مصدر البيانات غير صحيح';
  }

  // Status validation (case-insensitive)
  if (formData.status && !['active', 'archived'].includes(formData.status.toLowerCase())) {
    errors.status = 'حالة العلامة التجارية غير صحيحة';
  }

  // Aliases validation
  if (formData.aliases && Array.isArray(formData.aliases)) {
    formData.aliases.forEach((alias: string, index: number) => {
      if (!alias || alias.trim().length === 0) {
        errors[`alias_${index}`] = `الاسم البديل ${index + 1} لا يمكن أن يكون فارغاً`;
      } else if (alias.length > 100) {
        errors[`alias_${index}`] = `الاسم البديل ${index + 1} يجب أن يكون أقل من 100 حرف`;
      }
    });

    // Check for duplicate aliases
    const uniqueAliases = [...new Set(formData.aliases)];
    if (uniqueAliases.length !== formData.aliases.length) {
      errors.aliases = 'لا يمكن أن تكون هناك أسماء بديلة مكررة';
    }
  }

  return errors;
}

// Model validation functions
export function validateModelForm(formData: any): Record<string, string> {
  const errors: Record<string, string> = {};

  // Name validation
  if (!formData.name || formData.name.trim().length === 0) {
    errors.name = 'اسم الموديل مطلوب';
  } else if (formData.name.trim().length < 2) {
    errors.name = 'اسم الموديل يجب أن يكون على الأقل حرفين';
  } else if (formData.name.trim().length > 100) {
    errors.name = 'اسم الموديل يجب أن يكون أقل من 100 حرف';
  }

  // External ID validation (optional)
  if (formData.externalId && formData.externalId.length > 255) {
    errors.externalId = 'المعرف الخارجي يجب أن يكون أقل من 255 حرف';
  }

  // Source validation (case-insensitive)
  if (formData.source && !['manual', 'sync'].includes(formData.source.toLowerCase())) {
    errors.source = 'مصدر البيانات غير صحيح';
  }

  // Status validation (case-insensitive)
  if (formData.status && !['active', 'archived'].includes(formData.status.toLowerCase())) {
    errors.status = 'حالة الموديل غير صحيحة';
  }

  // Aliases validation
  if (formData.aliases && Array.isArray(formData.aliases)) {
    formData.aliases.forEach((alias: string, index: number) => {
      if (!alias || alias.trim().length === 0) {
        errors[`alias_${index}`] = `الاسم البديل ${index + 1} لا يمكن أن يكون فارغاً`;
      } else if (alias.length > 100) {
        errors[`alias_${index}`] = `الاسم البديل ${index + 1} يجب أن يكون أقل من 100 حرف`;
      }
    });

    // Check for duplicate aliases
    const uniqueAliases = [...new Set(formData.aliases)];
    if (uniqueAliases.length !== formData.aliases.length) {
      errors.aliases = 'لا يمكن أن تكون هناك أسماء بديلة مكررة';
    }
  }

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