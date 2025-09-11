"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/hooks/useTranslation";

import { ThemeToggle, LanguageSwitch, Spacer } from "@/components/slices";
import styles from "./Header.module.scss";

export const Header: React.FC = () => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Handle scroll behavior - hide when scrolling down, show when scrolling up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Show header when at top or scrolling up
      if (currentScrollY < 10 || currentScrollY < lastScrollY) {
        setIsVisible(true);
      }
      // Hide header when scrolling down
      else if (currentScrollY > lastScrollY) {
        setIsVisible(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <>
      <Spacer />

      <header
        className={`${styles.header} ${
          isVisible ? styles.visible : styles.hidden
        }`}
      >
        <div className={styles.container}>
          {/* Logo */}
          <Link href="/" className={styles.logo}>
            <div className={styles.logoIcon}>🚗</div>
            <div className={styles.logoText}>
              <span className={styles.logoMain}>
                {t("seo.defaultTitle").split(" | ")[0]}
              </span>
              <span className={styles.logoSub}>Syrian Marketplace</span>
            </div>
          </Link>

          {/* Desktop Actions */}
          <div className={styles.actions}>
            <LanguageSwitch />
            <ThemeToggle />
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
