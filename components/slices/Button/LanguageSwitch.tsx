"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Languages } from "lucide-react";
import { useLanguage } from "@/hooks/useTranslation";
import { useTranslation } from "@/hooks/useTranslation";
import { languages, Language } from "@/utils/i18n";
import { Button } from "@/components/slices/Button/Button";
import styles from "./Button.module.scss";

export const LanguageSwitch: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang);
    setIsOpen(false);
  };

  const currentLanguage = languages[language];

  return (
    <div className={styles.languageSelector} ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={styles.languageTrigger}
        aria-label={t("language.toggle")}
        aria-expanded={isOpen}
      >
        <Languages size={16} />

        <ChevronDown
          size={14}
          className={`${styles.chevron} ${isOpen ? styles.open : ""}`}
        />
      </Button>

      {isOpen && (
        <div className={styles.languageDropdown}>
          {Object.entries(languages).map(([langCode, langInfo]) => (
            <button
              key={langCode}
              className={`${styles.languageOption} ${
                langCode === language ? styles.active : ""
              }`}
              onClick={() => handleLanguageSelect(langCode as Language)}
              dir={langInfo.dir}
            >
              <span className={styles.languageName}>{langInfo.nativeName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitch;
