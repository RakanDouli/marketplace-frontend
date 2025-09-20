"use client";

import React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

import { ThemeToggle } from "@/components/slices";
import styles from "./Header.module.scss";

interface HeaderProps {
  onToggleSidebar?: () => void;
  showMenuButton?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  showMenuButton = false
}) => {
  const { t } = useTranslation();

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Menu Button for Mobile */}
        {showMenuButton && onToggleSidebar && (
          <button
            className={styles.menuButton}
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
          >
            <Menu size={24} />
          </button>
        )}

        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <div className={styles.logoIcon}>🚗</div>
          <div className={styles.logoText}>
            <span className={styles.logoSub}>Syrian Marketplace</span>
          </div>
        </Link>

        {/* Desktop Actions */}
        <div className={styles.actions}>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default Header;
