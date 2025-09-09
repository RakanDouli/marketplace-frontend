'use client';

import React from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { Button } from '@/components/slices/Button/Button';
import styles from './Header.module.scss';

export const LanguageSwitch: React.FC = () => {
  const { language, setLanguage, t } = useI18n();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className={styles.languageSwitch}
      aria-label={t('language.toggle')}
    >
      {language === 'en' ? 'العربية' : 'English'}
    </Button>
  );
};

export default LanguageSwitch;