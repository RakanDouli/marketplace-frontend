/**
 * Listing validation utilities with Zod
 * Provides client-side validation with Arabic error messages
 * Used for user create/edit listing (not admin)
 */

import { z } from 'zod';

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

// Validate dynamic attribute based on attribute config
export const validateAttribute = (
  value: any,
  attribute: {
    key: string;
    name: string;
    validation: 'REQUIRED' | 'OPTIONAL';
    type: string;
    maxSelections?: number;
  }
): string | undefined => {
  // Required validation
  if (attribute.validation === 'REQUIRED') {
    if (value === undefined || value === null || value === '' ||
        (Array.isArray(value) && value.length === 0)) {
      return `${attribute.name} مطلوب`;
    }
  }

  // Type-specific validation
  if (value !== undefined && value !== null && value !== '') {
    switch (attribute.type) {
      case 'SELECTOR':
        if (typeof value !== 'string' || !value.trim()) {
          return `${attribute.name} غير صحيح`;
        }
        break;

      case 'MULTI_SELECTOR':
        if (!Array.isArray(value)) {
          return `${attribute.name} غير صحيح`;
        }
        if (attribute.maxSelections && value.length > attribute.maxSelections) {
          return `${attribute.name} يجب ألا يتجاوز ${attribute.maxSelections} خيارات`;
        }
        break;

      case 'RANGE':
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
        break;

      case 'NUMBER':
        if (isNaN(Number(value))) {
          return `${attribute.name} يجب أن يكون رقماً`;
        }
        break;

      case 'TEXT':
        if (typeof value !== 'string') {
          return `${attribute.name} غير صحيح`;
        }
        break;
    }
  }

  return undefined;
};
