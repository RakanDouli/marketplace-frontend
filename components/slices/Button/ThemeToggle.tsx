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
      <Button variant="ghost" size="sm" disabled>
        <Moon size={16} />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className={styles.themeToggle}
      aria-label={t("theme.toggle")}
    >
      {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
    </Button>
  );
};

export default ThemeToggle;
