'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageCircle, Plus, User, Menu, X, Megaphone, Crown, Phone, Search } from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { useCategoriesStore } from '@/stores/categoriesStore';
import { useCurrencyStore, CURRENCY_SYMBOLS, CURRENCY_LABELS, type Currency } from '@/stores/currencyStore';
import { Button, ThemeToggle } from '@/components/slices';
import styles from './BottomNav.module.scss';

interface NavItem {
  id: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
  requiresAuth?: boolean;
}

const ANIMATION_DURATION = 300; // ms - match CSS animation duration

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const { user, openAuthModal } = useUserAuthStore();
  const { unreadCount } = useChatStore();
  const { preferredCurrency, setPreferredCurrency } = useCurrencyStore();
  const { categories } = useCategoriesStore();

  // Get category slugs dynamically from store
  const categorySlugs = categories.map(cat => cat.slug);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRenderMenu, setShouldRenderMenu] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const lastBrowsePathRef = useRef<string | null>(null);

  // Handle menu open/close with animation
  useEffect(() => {
    if (isMenuOpen) {
      setShouldRenderMenu(true);
      setIsClosing(false);
    } else if (shouldRenderMenu) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRenderMenu(false);
        setIsClosing(false);
      }, ANIMATION_DURATION);
      return () => clearTimeout(timer);
    }
  }, [isMenuOpen, shouldRenderMenu]);

  // Handle scroll behavior - Optimized for Chrome mobile
  useEffect(() => {
    let ticking = false;
    let scrollAccumulator = 0;
    const SCROLL_THRESHOLD = 50;

    const handleScroll = () => {
      if (ticking) return;

      ticking = true;
      requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const scrollDelta = currentScrollY - lastScrollY.current;

        scrollAccumulator += scrollDelta;

        if (currentScrollY < 50) {
          setIsVisible(true);
          scrollAccumulator = 0;
        } else if (scrollAccumulator < -SCROLL_THRESHOLD) {
          setIsVisible(true);
          scrollAccumulator = 0;
        } else if (scrollAccumulator > SCROLL_THRESHOLD) {
          setIsVisible(false);
          scrollAccumulator = 0;
        }

        lastScrollY.current = currentScrollY;
        ticking = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track browse-related paths (category/listing pages) for memory feature
  useEffect(() => {
    const firstSegment = pathname.split('/')[1];
    const isBrowsePath = categorySlugs.includes(firstSegment);

    if (isBrowsePath) {
      lastBrowsePathRef.current = pathname;
    }
  }, [pathname, categorySlugs]);

  // Search button uses memory - goes to last browse path or /categories
  const searchHref = lastBrowsePathRef.current || '/categories';

  const navItems: NavItem[] = [
    {
      id: 'home',
      icon: <Home size={24} />,
      href: '/',
    },
    {
      id: 'search',
      icon: <Search size={24} />,
      href: searchHref,
    },
    {
      id: 'sell',
      icon: <Plus size={26} />,
      href: '/dashboard/listings/create',
      requiresAuth: true,
    },
    {
      id: 'messages',
      icon: <MessageCircle size={24} />,
      href: '/messages',
      badge: unreadCount > 0 ? unreadCount : undefined,
      requiresAuth: true,
    },
  ];

  const menuItems = [
    { icon: <User size={20} />, label: 'حسابي', href: '/dashboard', requiresAuth: true },
    { icon: <Megaphone size={20} />, label: 'أعلن معنا', href: '/advertise' },
    { icon: <Crown size={20} />, label: 'باقات الاشتراك', href: '/user-subscriptions' },
    { icon: <Phone size={20} />, label: 'تواصل معنا', href: '/contact' },
  ];

  const handleCurrencyChange = (currency: Currency) => {
    setPreferredCurrency(currency);
  };

  const isActive = (id: string, href: string) => {
    if (id === 'home') {
      return pathname === '/';
    }
    if (id === 'search') {
      // Search is active on /categories OR any category/listing page
      const firstSegment = pathname.split('/')[1];
      const isBrowsePath = categorySlugs.includes(firstSegment);
      return pathname === '/categories' || isBrowsePath;
    }
    return pathname.startsWith(href);
  };

  // Calculate active index for sliding indicator
  const getActiveIndex = (): number => {
    if (isMenuOpen) return 4; // Menu is last item
    for (let i = 0; i < navItems.length; i++) {
      if (isActive(navItems[i].id, navItems[i].href)) {
        return i;
      }
    }
    return 0; // Default to home
  };

  const activeIndex = getActiveIndex();

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className={`${styles.bottomNav} ${isVisible ? styles.visible : styles.hidden}`}>
        {/* Sliding Indicator */}
        <div
          className={styles.indicator}
          style={{
            transform: `translateX(calc(${activeIndex} * -100%))`,
          }}
        />

        {navItems.map((item, index) => {
          const needsAuth = item.requiresAuth && !user;
          const itemIsActive = isActive(item.id, item.href);

          // If auth required but not logged in, render button instead of Link
          if (needsAuth) {
            return (
              <button
                key={item.id}
                type="button"
                className={`${styles.navItem} ${itemIsActive ? styles.active : ''}`}
                onClick={() => openAuthModal('login')}
                data-index={index}
              >
                <span className={styles.iconWrapper}>
                  {item.icon}
                  {item.badge && item.badge > 0 && (
                    <span className={styles.badge}>
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`${styles.navItem} ${itemIsActive ? styles.active : ''}`}
              data-index={index}
            >
              <span className={styles.iconWrapper}>
                {item.icon}
                {item.badge && item.badge > 0 && (
                  <span className={styles.badge}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </span>
            </Link>
          );
        })}

        {/* Menu Button */}
        <button
          className={`${styles.navItem} ${styles.menuButton} ${isMenuOpen ? styles.active : ''}`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          data-index={4}
        >
          <span className={styles.iconWrapper}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </span>
        </button>
      </nav>

      {/* Menu Overlay */}
      {shouldRenderMenu && (
        <div className={`${styles.menuOverlay} ${isClosing ? styles.closing : ''}`} onClick={() => setIsMenuOpen(false)}>
          <div className={`${styles.menuPanel} ${isClosing ? styles.closing : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.menuHeader}>
              <span>المزيد</span>
              <Button
                variant='outline'
                onClick={() => setIsMenuOpen(false)}
                className={styles.closeButton}
                aria-label="Close modal"
                type="button"
                icon={<X size={20} />}
              />
            </div>

            <div className={styles.menuItems}>
              {menuItems.map((item) => {
                const needsAuth = item.requiresAuth && !user;

                if (needsAuth) {
                  return (
                    <button
                      key={item.href}
                      type="button"
                      className={styles.menuItem}
                      onClick={() => {
                        setIsMenuOpen(false);
                        openAuthModal('login');
                      }}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={styles.menuItem}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className={styles.divider} />

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
