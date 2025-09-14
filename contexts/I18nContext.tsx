"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  Language,
  translations,
  getNestedValue,
  interpolate,
  getDirection,
} from "@/utils/i18n";

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
  direction: "ltr" | "rtl";
  isRTL: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
  defaultLanguage?: Language;
}

export function I18nProvider({
  children,
  defaultLanguage = "ar",
}: I18nProviderProps) {
  const [language, setLanguage] = useState<Language>(defaultLanguage);

  // Load saved language from localStorage on client side
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLanguage = localStorage.getItem("language") as Language;
      if (savedLanguage && (savedLanguage === "en" || savedLanguage === "ar")) {
        setLanguage(savedLanguage);
      }
    }
  }, []);

  // Save language to localStorage and update document attributes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("language", language);
      document.documentElement.lang = language;
      document.documentElement.dir = getDirection(language);

      // Update font family based on language
      if (language === "ar") {
        document.body.style.fontFamily =
          "Cairo, Segoe UI, Tahoma, Geneva, Verdana, sans-serif";
      } else {
        document.body.style.fontFamily =
          "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif";
      }
    }
  }, [language]);

  const t = (key: string, values?: Record<string, string | number>): string => {
    const translation = getNestedValue(translations[language], key);

    if (values) {
      return interpolate(translation, values);
    }

    return translation;
  };

  const direction = getDirection(language);
  const isRTL = direction === "rtl";

  const value: I18nContextType = {
    language,
    setLanguage,
    t,
    direction,
    isRTL,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
