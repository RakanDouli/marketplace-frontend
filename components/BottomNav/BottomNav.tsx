'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageCircle, Plus, User, Menu, X, Megaphone, Crown, Phone } from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { useCurrencyStore, CURRENCY_SYMBOLS, CURRENCY_LABELS, type Currency } from '@/stores/currencyStore';
import { ThemeToggle } from '@/components/slices';
import styles from './BottomNav.module.scss';

interface NavItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  href: string;
  badge?: number;
  requiresAuth?: boolean;
}

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const { user, openAuthModal } = useUserAuthStore();
  const { unreadCount } = useChatStore();
  const { preferredCurrency, setPreferredCurrency } = useCurrencyStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const lastBrowsePathRef = useRef<string | null>(null);

  // Handle scroll behavior - hide when scrolling down, show when scrolling up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY.current;

      // Show nav when at top or scrolling up
      if (currentScrollY < 50 || scrollDelta < -5) {
        setIsVisible(true);
      }
      // Hide nav when scrolling down
      else if (scrollDelta > 5) {
        setIsVisible(false);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track browse-related paths (category pages and listing detail pages)
  useEffect(() => {
    const nonBrowsePaths = ['/dashboard', '/messages', '/advertise', '/user-subscriptions', '/contact', '/mock-payment'];
    const isNonBrowsePath = pathname === '/' || nonBrowsePaths.some(path =>
      pathname === path || pathname.startsWith(path + '/')
    );

    // If we're on a browse-related page (category or listing detail), save it
    if (!isNonBrowsePath && pathname.length > 1) {
      lastBrowsePathRef.current = pathname;
    }
  }, [pathname]);

  // Smart home href - returns to last browsed page or home
  const homeHref = lastBrowsePathRef.current || '/';

  const navItems: NavItem[] = [
    {
      id: 'home',
      icon: <Home size={22} />,
      label: 'الرئيسية',
      href: homeHref,
    },
    {
      id: 'sell',
      icon: <Plus size={24} />,
      label: 'بيع',
      href: '/dashboard/listings/create',
      requiresAuth: true,
    },
    {
      id: 'messages',
      icon: <MessageCircle size={22} />,
      label: 'رسائل',
      href: '/messages',
      badge: unreadCount > 0 ? unreadCount : undefined,
      requiresAuth: true,
    },
    {
      id: 'profile',
      icon: <User size={22} />,
      label: 'حسابي',
      href: '/dashboard',
      requiresAuth: true,
    },
  ];

  const menuItems = [
    {
      icon: <Megaphone size={20} />,
      label: 'أعلن معنا',
      href: '/advertise',
    },
    {
      icon: <Crown size={20} />,
      label: 'باقات الاشتراك',
      href: '/user-subscriptions',
    },
    {
      icon: <Phone size={20} />,
      label: 'تواصل معنا',
      href: '/contact',
    },
  ];

  const handleCurrencyChange = (currency: Currency) => {
    setPreferredCurrency(currency);
  };

  const isActive = (id: string, href: string) => {
    // Home - active on home OR any browse-related page (category/listing detail)
    if (id === 'home') {
      const nonBrowsePaths = ['/dashboard', '/messages', '/advertise', '/user-subscriptions', '/contact', '/mock-payment'];
      const isOnNonBrowsePage = nonBrowsePaths.some(path =>
        pathname === path || pathname.startsWith(path + '/')
      );
      return pathname === '/' || (!isOnNonBrowsePage && pathname.length > 1);
    }
    // Profile - exact /dashboard match (not sub-routes)
    if (id === 'profile') {
      return pathname === '/dashboard' || pathname === '/dashboard/';
    }
    // For other paths, use startsWith
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className={`${styles.bottomNav} ${isVisible ? styles.visible : styles.hidden}`}>
        {navItems.map((item) => {
          // If requires auth and user not logged in, show login modal
          const needsAuth = item.requiresAuth && !user;

          const handleClick = (e: React.MouseEvent) => {
            if (needsAuth) {
              e.preventDefault();
              openAuthModal('login');
            }
          };

          return (
            <Link
              key={item.id}
              href={needsAuth ? '#' : item.href}
              className={`${styles.navItem} ${isActive(item.id, item.href) ? styles.active : ''}`}
              onClick={handleClick}
            >
              <span className={styles.iconWrapper}>
                {item.icon}
                {item.badge && item.badge > 0 && (
                  <span className={styles.badge}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </span>
              <span className={styles.label}>{item.label}</span>
            </Link>
          );
        })}

        {/* Menu Button */}
        <button
          className={`${styles.navItem} ${styles.menuButton} ${isMenuOpen ? styles.active : ''}`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <span className={styles.iconWrapper}>
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </span>
          <span className={styles.label}>المزيد</span>
        </button>
      </nav>

      {/* Menu Overlay */}
      {isMenuOpen && (
        <div className={styles.menuOverlay} onClick={() => setIsMenuOpen(false)}>
          <div className={styles.menuPanel} onClick={(e) => e.stopPropagation()}>
            {/* Menu Header */}
            <div className={styles.menuHeader}>
              <span>المزيد</span>
              <button onClick={() => setIsMenuOpen(false)} className={styles.closeButton}>
                <X size={20} />
              </button>
            </div>

            {/* Menu Items */}
            <div className={styles.menuItems}>
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={styles.menuItem}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            {/* Divider */}
            <div className={styles.divider} />

            {/* Currency Selector */}
            <div className={styles.settingsSection}>
              <span className={styles.settingsLabel}>العملة</span>
              <div className={styles.currencyButtons}>
                {(['USD', 'EUR', 'SYP'] as Currency[]).map((currency) => (
                  <button
                    key={currency}
                    className={`${styles.currencyButton} ${preferredCurrency === currency ? styles.activeCurrency : ''}`}
                    onClick={() => handleCurrencyChange(currency)}
                  >
                    {CURRENCY_SYMBOLS[currency]} {CURRENCY_LABELS[currency]}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Toggle */}
            <div className={styles.settingsSection}>
              <span className={styles.settingsLabel}>المظهر</span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BottomNav;
