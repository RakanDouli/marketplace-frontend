"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

import { ThemeToggle, Spacer } from "@/components/slices";
import { UserMenu } from "@/components/UserMenu";
import { useChatStore } from "@/stores/chatStore";
import { useUserAuthStore } from "@/stores/userAuthStore";
import styles from "./Header.module.scss";
import { Container } from "../slices";
import { Preheader } from "../Preheader";

export const Header: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [showPreheader, setShowPreheader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { user } = useUserAuthStore();
  const { unreadCount, fetchUnreadCount, fetchMyThreads } = useChatStore();

  // Fetch unread count when user is logged in
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      // Poll every 30 seconds for new messages
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user, fetchUnreadCount]);

  // Handle scroll behavior - hide when scrolling down, show when scrolling up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Show/hide preheader only when at very top
      setShowPreheader(currentScrollY < 10);

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

  // Handle message icon click - always refresh threads
  const handleMessagesClick = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('📬 Message icon clicked - refreshing threads');

    // Always refresh threads
    fetchMyThreads();

    // Navigate to messages page (even if already there, will trigger re-render)
    router.push('/messages');
  };

  return (
    <>
      <Spacer />

      <header
        className={`${styles.header} ${isVisible ? styles.visible : styles.hidden} ${showPreheader ? styles.withPreheader : styles.compact}`}
      >
        {/* Preheader - always rendered, positioned at top */}
        <Preheader />

        {/* Main header content */}
        <Container paddingY="none">
          <div className={styles.container}>
            {/* Logo */}
            <Link href="/" className={styles.logo}>
              <div className={styles.logoIcon}>🚗</div>
              <div className={styles.logoText}>
                <span className={styles.logoSub}>Syrian Marketplace</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className={styles.nav}>
              <Link
                href="/user-subscriptions"
                className={`${styles.navLink} ${pathname === '/user-subscriptions' ? styles.active : ''}`}
              >
                باقات الاشتراك
              </Link>
              <Link
                href="/advertise"
                className={`${styles.navLink} ${pathname === '/advertise' ? styles.active : ''}`}
              >
                أعلن معنا
              </Link>
              <Link
                href="/contact"
                className={`${styles.navLink} ${pathname === '/contact' ? styles.active : ''}`}
              >
                اتصل بنا
              </Link>
            </nav>

            {/* Desktop Actions */}
            <div className={styles.actions}>
              {user && (
                <button
                  onClick={handleMessagesClick}
                  className={styles.messagesIcon}
                  aria-label="Messages"
                >
                  <MessageCircle size={20} />
                  {unreadCount > 0 && (
                    <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
                  )}
                </button>
              )}
              <UserMenu />
              <ThemeToggle />
            </div>
          </div>
        </Container>
      </header>
    </>
  );
};

export default Header;
