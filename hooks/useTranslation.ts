import { useContext } from 'react';
import { getNestedValue, interpolate, Language, translations } from '../utils/i18n';
import { LanguageContext } from '../contexts/LanguageContext';

export function useTranslation() {
  const { language } = useContext(LanguageContext);
  
  const t = (key: string, variables?: Record<string, string | number>): string => {
    const translation = getNestedValue(translations[language], key);
    return variables ? interpolate(translation, variables) : translation;
  };

  return { t, language };
}

export function useLanguage() {
  return useContext(LanguageContext);
}