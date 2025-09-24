/**
 * User validation utilities for admin dashboard
 * Provides client-side validation with Arabic error messages
 */

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

/**
 * Validate user name field
 */
export const validateUserName = (name: string): string | undefined => {
  if (!name || !name.trim()) {
    return 'اسم المستخدم مطلوب';
  }

  if (name.trim().length < 2) {
    return 'اسم المستخدم يجب أن يكون حرفين على الأقل';
  }

  if (name.trim().length > 100) {
    return 'اسم المستخدم يجب أن يكون أقل من 100 حرف';
  }

  // Check for valid characters (Arabic, English, numbers, spaces)
  const validNamePattern = /^[\u0600-\u06FF\u0750-\u077Fa-zA-Z0-9\s.-]+$/;
  if (!validNamePattern.test(name.trim())) {
    return 'اسم المستخدم يجب أن يحتوي على أحرف وأرقام فقط';
  }

  return undefined;
};

/**
 * Validate email field
 */
export const validateUserEmail = (email: string): string | undefined => {
  if (!email || !email.trim()) {
    return 'البريد الإلكتروني مطلوب';
  }

  // Basic email validation
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email.trim())) {
    return 'البريد الإلكتروني غير صحيح';
  }

  if (email.length > 255) {
    return 'البريد الإلكتروني يجب أن يكون أقل من 255 حرف';
  }

  return undefined;
};

/**
 * Validate password field
 */
export const validateUserPassword = (password: string, isRequired: boolean = true): string | undefined => {
  if (!password || !password.trim()) {
    if (isRequired) {
      return 'كلمة المرور مطلوبة';
    }
    return undefined; // Optional for edit mode
  }

  if (password.length < 6) {
    return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
  }

  if (password.length > 128) {
    return 'كلمة المرور يجب أن تكون أقل من 128 حرف';
  }

  // Check for basic password strength
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
    return 'كلمة المرور يجب أن تحتوي على أحرف كبيرة وصغيرة وأرقام';
  }

  return undefined;
};

/**
 * Validate role field
 */
export const validateUserRole = (role: string): string | undefined => {
  if (!role || !role.trim()) {
    return 'الدور مطلوب';
  }

  return undefined;
};

/**
 * Validate status field
 */
export const validateUserStatus = (status: string): string | undefined => {
  if (!status || !status.trim()) {
    return 'حالة المستخدم مطلوبة';
  }

  const validStatuses = ['active', 'pending', 'banned'];
  if (!validStatuses.includes(status)) {
    return 'حالة المستخدم غير صحيحة';
  }

  return undefined;
};

/**
 * Validate entire user form for create mode
 */
export const validateUserFormCreate = (formData: UserFormData): ValidationErrors => {
  const errors: ValidationErrors = {};

  // Validate name
  const nameError = validateUserName(formData.name);
  if (nameError) errors.name = nameError;

  // Validate email
  const emailError = validateUserEmail(formData.email);
  if (emailError) errors.email = emailError;

  // Validate password (required for create)
  const passwordError = validateUserPassword(formData.password || '', true);
  if (passwordError) errors.password = passwordError;

  // Validate role
  const roleError = validateUserRole(formData.role);
  if (roleError) errors.role = roleError;

  // Validate status
  const statusError = validateUserStatus(formData.status);
  if (statusError) errors.status = statusError;

  return errors;
};

/**
 * Validate entire user form for edit mode
 */
export const validateUserFormEdit = (formData: UserFormData): ValidationErrors => {
  const errors: ValidationErrors = {};

  // Validate name
  const nameError = validateUserName(formData.name);
  if (nameError) errors.name = nameError;

  // Validate email
  const emailError = validateUserEmail(formData.email);
  if (emailError) errors.email = emailError;

  // Validate password (optional for edit)
  if (formData.password && formData.password.trim()) {
    const passwordError = validateUserPassword(formData.password, false);
    if (passwordError) errors.password = passwordError;
  }

  // Validate role
  const roleError = validateUserRole(formData.role);
  if (roleError) errors.role = roleError;

  // Validate status
  const statusError = validateUserStatus(formData.status);
  if (statusError) errors.status = statusError;

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