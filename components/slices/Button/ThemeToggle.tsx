"use client";

import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "./Button";
import styles from "./Button.module.scss";

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme, mounted } = useTheme();
  const { t } = useTranslation();

  if (!mounted) {
    return (
      <Button variant="secondary" size="sm" disabled icon={<Moon size={18} />} />
    );
  }

  return (
    <Button
      variant="outline"
      onClick={toggleTheme}
      className={styles.themeToggle}
      aria-label={t("theme.toggle")}
      icon={theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
    />
  );
};

export default ThemeToggle;
