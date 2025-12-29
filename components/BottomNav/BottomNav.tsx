'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageCircle, Plus, User, Menu, X, Megaphone, Crown, Phone } from 'lucide-react';
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
const NAV_ITEMS_COUNT = 5; // 4 nav items + 1 menu button

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

  // Handle scroll behavior
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;

      ticking = true;
      requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const scrollDelta = currentScrollY - lastScrollY.current;

        if (currentScrollY < 100) {
          setIsVisible(true);
        } else if (scrollDelta < -15) {
          setIsVisible(true);
        } else if (scrollDelta > 15) {
          setIsVisible(false);
        }

        lastScrollY.current = currentScrollY;
        ticking = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track browse-related paths (only category/listing pages)
  useEffect(() => {
    // Only save paths for category pages (from store)
    const firstSegment = pathname.split('/')[1];
    const isBrowsePath = categorySlugs.includes(firstSegment);

    if (isBrowsePath) {
      lastBrowsePathRef.current = pathname;
    }
  }, [pathname, categorySlugs]);

  const homeHref = lastBrowsePathRef.current || '/';

  const navItems: NavItem[] = [
    {
      id: 'home',
      icon: <Home size={24} />,
      href: homeHref,
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
    {
      id: 'profile',
      icon: <User size={24} />,
      href: '/dashboard',
      requiresAuth: true,
    },
  ];

  const menuItems = [
    { icon: <Megaphone size={20} />, label: 'أعلن معنا', href: '/advertise' },
    { icon: <Crown size={20} />, label: 'باقات الاشتراك', href: '/user-subscriptions' },
    { icon: <Phone size={20} />, label: 'تواصل معنا', href: '/contact' },
  ];

  const handleCurrencyChange = (currency: Currency) => {
    setPreferredCurrency(currency);
  };

  const isActive = (id: string, href: string) => {
    if (id === 'home') {
      // Home is active on homepage OR any category/listing page
      const firstSegment = pathname.split('/')[1];
      const isBrowsePath = categorySlugs.includes(firstSegment);
      return pathname === '/' || isBrowsePath;
    }
    if (id === 'profile') {
      return pathname === '/dashboard' || pathname === '/dashboard/';
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
              className={`${styles.navItem} ${itemIsActive ? styles.active : ''}`}
              onClick={handleClick}
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
