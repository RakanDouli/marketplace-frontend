// Chat message validation with Zod
import { z } from 'zod';

// ===== TYPES =====
export interface ChatMessageFormData {
  message: string;
}

export interface ValidationErrors {
  [key: string]: string | undefined;
}

// ===== VALIDATION CONFIG - Single Source of Truth =====
export const ChatValidationConfig = {
  message: {
    minLength: 1,
    maxLength: 1000,
  },
};

// ===== ZOD SCHEMAS =====

// Message schema
const messageSchema = z
  .string()
  .min(ChatValidationConfig.message.minLength, 'الرسالة مطلوبة')
  .max(ChatValidationConfig.message.maxLength, `الرسالة يجب ألا تتجاوز ${ChatValidationConfig.message.maxLength} حرف`)
  .trim();

// ===== INDIVIDUAL FIELD VALIDATORS =====

export const validateMessage = (value: string): string | undefined => {
  const result = messageSchema.safeParse(value);
  return result.success ? undefined : result.error.errors[0]?.message;
};

// ===== FORM VALIDATORS =====

export const validateChatMessageForm = (data: ChatMessageFormData): ValidationErrors => {
  const errors: ValidationErrors = {};

  const messageError = validateMessage(data.message);
  if (messageError) errors.message = messageError;

  return errors;
};

// ===== HELPER FUNCTIONS =====

export const hasValidationErrors = (errors: ValidationErrors): boolean => {
  return Object.values(errors).some((error) => error !== undefined);
};
