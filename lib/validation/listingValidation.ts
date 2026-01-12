/**
 * Listing validation utilities with Zod
 * Provides client-side validation with Arabic error messages
 * Used for user create/edit listing (not admin)
 */

import { z } from 'zod';
import { AttributeType } from '@/common/enums';

export interface ListingFormData {
  title: string;
  description?: string;
  priceMinor: number;
  allowBidding: boolean;
  biddingStartPrice?: number;
  images: any[];
  videoUrl?: string;
  location: {
    province: string;
    city?: string;
    area?: string;
    link?: string;
  };
  specs: Record<string, any>;
}

export interface ValidationErrors {
  [key: string]: string | undefined;
}

// Validation Config - Single source of truth for validation rules
export const ListingValidationConfig = {
  title: {
    minLength: 5,
    maxLength: 100,
  },
  description: {
    maxLength: 2000,
  },
  price: {
    min: 1, // Minimum 1 (0 is not valid)
  },
  images: {
    min: 1, // Minimum 1 image required
    max: 20, // Maximum from subscription
  },
  videoUrl: {
    maxLength: 500,
  },
  location: {
    provinceRequired: true,
  },
};

// Zod schemas
const titleSchema = z.string()
  .min(ListingValidationConfig.title.minLength, `عنوان الإعلان يجب أن يكون ${ListingValidationConfig.title.minLength} أحرف على الأقل`)
  .max(ListingValidationConfig.title.maxLength, `عنوان الإعلان يجب أن يكون أقل من ${ListingValidationConfig.title.maxLength} حرف`)
  .transform(val => val.trim());

const descriptionSchema = z.string()
  .max(ListingValidationConfig.description.maxLength, `الوصف يجب أن يكون أقل من ${ListingValidationConfig.description.maxLength} حرف`)
  .optional();

const priceMinorSchema = z.number()
  .min(ListingValidationConfig.price.min, 'السعر مطلوب ويجب أن يكون أكبر من صفر');

const imagesSchema = z.array(z.any())
  .min(ListingValidationConfig.images.min, `يجب إضافة ${ListingValidationConfig.images.min} صورة على الأقل`)
  .max(ListingValidationConfig.images.max, `يجب ألا تتجاوز عدد الصور ${ListingValidationConfig.images.max}`);

// Individual field validators
export const validateTitle = (title: string): string | undefined => {
  const result = titleSchema.safeParse(title);
  if (!result.success) {
    return result.error.issues[0]?.message || 'عنوان الإعلان غير صحيح';
  }
  return undefined;
};

export const validateDescription = (description: string): string | undefined => {
  const result = descriptionSchema.safeParse(description);
  if (!result.success) {
    return result.error.issues[0]?.message || 'الوصف غير صحيح';
  }
  return undefined;
};

export const validatePriceMinor = (price: number): string | undefined => {
  const result = priceMinorSchema.safeParse(price);
  if (!result.success) {
    return result.error.issues[0]?.message || 'السعر غير صحيح';
  }
  return undefined;
};

export const validateImages = (images: any[]): string | undefined => {
  const result = imagesSchema.safeParse(images);
  if (!result.success) {
    return result.error.issues[0]?.message || 'الصور غير صحيحة';
  }
  return undefined;
};

export const validateVideoUrl = (url: string): string | undefined => {
  if (!url || url.trim() === '') return undefined; // Empty is OK

  try {
    new URL(url);
    if (url.length > ListingValidationConfig.videoUrl.maxLength) {
      return 'رابط الفيديو طويل جداً';
    }
    return undefined;
  } catch {
    return 'رابط الفيديو غير صحيح';
  }
};

export const validateProvince = (province: string): string | undefined => {
  if (!province || !province.trim()) {
    return 'المحافظة مطلوبة';
  }
  return undefined;
};

// Full form validation - Manual field-by-field validation to avoid Zod runtime errors
export const validateListingForm = (formData: Partial<ListingFormData>): ValidationErrors => {
  const errors: ValidationErrors = {};

  // 1. Validate title
  if (formData.title !== undefined) {
    const titleError = validateTitle(formData.title);
    if (titleError) errors.title = titleError;
  } else {
    errors.title = 'عنوان الإعلان مطلوب';
  }

  // 2. Validate description (optional)
  if (formData.description) {
    const descError = validateDescription(formData.description);
    if (descError) errors.description = descError;
  }

  // 3. Validate price
  if (formData.priceMinor !== undefined) {
    const priceError = validatePriceMinor(formData.priceMinor);
    if (priceError) errors.priceMinor = priceError;
  } else {
    errors.priceMinor = 'السعر مطلوب';
  }

  // 4. Validate images
  if (formData.images) {
    const imagesError = validateImages(formData.images);
    if (imagesError) errors.images = imagesError;
  } else {
    errors.images = `يجب إضافة ${ListingValidationConfig.images.min} صورة على الأقل`;
  }

  // 5. Validate video URL (optional)
  if (formData.videoUrl) {
    const videoError = validateVideoUrl(formData.videoUrl);
    if (videoError) errors.videoUrl = videoError;
  }

  // 6. Validate location
  if (formData.location?.province) {
    const provinceError = validateProvince(formData.location.province);
    if (provinceError) errors['location.province'] = provinceError;
  } else {
    errors['location.province'] = 'المحافظة مطلوبة';
  }

  // 7. Validate bidding fields
  // biddingStartPrice can be 0 (allow free bidding), so only check if undefined/null
  if (formData.allowBidding && (formData.biddingStartPrice === undefined || formData.biddingStartPrice === null || formData.biddingStartPrice < 0)) {
    errors.biddingStartPrice = 'سعر البداية للمزايدة مطلوب عند تفعيل المزايدة';
  }

  return errors;
};

// Real-time field validator for use with Input components
export const createListingFieldValidator = (fieldName: keyof ListingFormData | string) => {
  return (value: any): string | undefined => {
    switch (fieldName) {
      case 'title':
        return validateTitle(value);
      case 'description':
        return validateDescription(value);
      case 'priceMinor':
        return validatePriceMinor(value);
      case 'images':
        return validateImages(value);
      case 'videoUrl':
        return validateVideoUrl(value);
      case 'location.province':
        return validateProvince(value);
      default:
        return undefined;
    }
  };
};

// Helper to check if there are any errors
export const hasValidationErrors = (errors: ValidationErrors): boolean => {
  return Object.values(errors).some(error => error !== undefined && error !== '');
};

/**
 * Config-based field validation
 * Uses the config JSONB field from attribute for validation rules
 */
export interface AttributeConfig {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  maxSelections?: number;
  expectedValue?: 'string' | 'number' | 'array' | 'date' | 'boolean';
  dateFormat?: 'year' | 'month' | 'day' | 'full';
  dataSource?: string;
  pattern?: string;
}

/**
 * Validate a field value using attribute config
 * Used for title, description, and dynamic attribute fields
 */
export const validateFieldWithConfig = (
  value: any,
  fieldName: string,
  config: AttributeConfig,
  required: boolean = false
): string | undefined => {
  // Check required
  if (required) {
    if (value === undefined || value === null || value === '' ||
        (Array.isArray(value) && value.length === 0)) {
      return `${fieldName} مطلوب`;
    }
  }

  // Skip validation if empty and not required
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const strValue = typeof value === 'string' ? value.trim() : String(value);

  // minLength validation
  if (config.minLength !== undefined && strValue.length < config.minLength) {
    return `${fieldName} يجب أن يكون ${config.minLength} أحرف على الأقل`;
  }

  // maxLength validation
  if (config.maxLength !== undefined && strValue.length > config.maxLength) {
    return `${fieldName} يجب أن يكون أقل من ${config.maxLength} حرف`;
  }

  // Number min validation
  if (config.min !== undefined && typeof value === 'number') {
    if (value < config.min) {
      return `${fieldName} يجب أن يكون ${config.min} على الأقل`;
    }
  }

  // Number max validation
  if (config.max !== undefined && typeof value === 'number') {
    if (value > config.max) {
      return `${fieldName} يجب أن يكون أقل من ${config.max}`;
    }
  }

  // Array maxSelections validation
  if (config.maxSelections !== undefined && Array.isArray(value)) {
    if (value.length > config.maxSelections) {
      return `${fieldName} يجب ألا يتجاوز ${config.maxSelections} خيارات`;
    }
  }

  return undefined;
};

// Validate dynamic attribute based on attribute type, validation rules, and config
export const validateAttribute = (
  value: any,
  attribute: {
    key: string;
    name: string;
    validation: 'REQUIRED' | 'OPTIONAL';
    type: string;
    maxSelections?: number;
    config?: AttributeConfig;
  }
): string | undefined => {
  const isRequired = attribute.validation === 'REQUIRED';
  const config = attribute.config || {};

  // Required validation
  if (isRequired) {
    if (value === undefined || value === null || value === '' ||
        (Array.isArray(value) && value.length === 0)) {
      return `${attribute.name} مطلوب`;
    }
  }

  // Skip further validation if empty and not required
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  // Config-based validation (minLength, maxLength, maxSelections)
  const configError = validateFieldWithConfig(value, attribute.name, {
    ...config,
    maxSelections: attribute.maxSelections || config.maxSelections,
  }, false); // Don't check required again
  if (configError) return configError;

  // Type-specific validation
  switch (attribute.type) {
    case AttributeType.SELECTOR:
      if (typeof value !== 'string' || !value.trim()) {
        return `${attribute.name} غير صحيح`;
      }
      break;

    case AttributeType.MULTI_SELECTOR:
      // For listings: MULTI_SELECTOR stores array of selected options
      // Accept array format
      if (Array.isArray(value)) {
        const maxSel = attribute.maxSelections || config.maxSelections;
        if (maxSel && value.length > maxSel) {
          return `${attribute.name} يجب ألا يتجاوز ${maxSel} خيارات`;
        }
      } else if (typeof value !== 'string' || !value.trim()) {
        // Single value mode (backwards compatibility)
        return `${attribute.name} غير صحيح`;
      }
      break;

    case AttributeType.RANGE:
      // RANGE has two use cases:
      // 1. Listing creation/editing: single value (string or number) - e.g., year: "2018"
      // 2. Filtering: {min, max} object - e.g., year: {min: 2015, max: 2020}

      // Accept single value (string or number)
      if (typeof value === 'string' || typeof value === 'number') {
        // Valid: single value for listing data
        break;
      }

      // OR accept {min, max} object (for filter compatibility)
      if (typeof value === 'object' && value !== null) {
        if (!value.min && !value.max) {
          return `${attribute.name} غير صحيح`;
        }
        if (value.min && value.max && parseFloat(value.min) > parseFloat(value.max)) {
          return `${attribute.name}: القيمة الدنيا يجب أن تكون أصغر من القيمة القصوى`;
        }
        break;
      }

      // Neither single value nor valid object
      return `${attribute.name} غير صحيح`;

    case AttributeType.NUMBER:
      if (isNaN(Number(value))) {
        return `${attribute.name} يجب أن يكون رقماً`;
      }
      break;

    case AttributeType.TEXT:
      if (typeof value !== 'string') {
        return `${attribute.name} غير صحيح`;
      }
      break;
  }

  return undefined;
};
