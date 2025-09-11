import enTranslations from '../locales/en.json';
import arTranslations from '../locales/ar.json';

export type Language = 'en' | 'ar';

export const languages = {
  en: { name: 'English', nativeName: 'English', dir: 'ltr' },
  ar: { name: 'Arabic', nativeName: 'العربية', dir: 'rtl' },
} as const;

export const translations = {
  en: enTranslations,
  ar: arTranslations,
} as const;

export type TranslationKeys = typeof enTranslations;

// Utility to get nested translation values
export function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((current, key) => current?.[key], obj) || path;
}

// Template string interpolation
export function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return values[key]?.toString() || match;
  });
}

// Format numbers for Arabic locale
export function formatNumber(num: number, locale: Language): string {
  if (locale === 'ar') {
    // Arabic-Indic digits
    return num.toLocaleString('ar-EG');
  }
  return num.toLocaleString('en-US');
}

// Format currency
export function formatCurrency(amount: number, currency: string = 'USD', locale: Language): string {
  const formatter = new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  return formatter.format(amount);
}

// Format dates
export function formatDate(date: Date, locale: Language): string {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

// RTL/LTR utilities
export function getDirection(locale: Language): 'ltr' | 'rtl' {
  return languages[locale].dir;
}

export function isRTL(locale: Language): boolean {
  return getDirection(locale) === 'rtl';
}