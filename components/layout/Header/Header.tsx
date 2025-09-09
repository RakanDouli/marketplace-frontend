'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/contexts/I18nContext';
import { useNotificationStore } from '@/store';
import { ThemeToggle, Button } from '@/components/slices';
import LanguageSwitch from './LanguageSwitch';
import styles from './Header.module.scss';

export const Header: React.FC = () => {
  const pathname = usePathname();
  const { t } = useI18n();
  const { addNotification } = useNotificationStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Mock user state for now - will be replaced with auth store later
  const user = null;

  const handleLogout = () => {
    addNotification({
      type: 'success',
      title: t('auth.logoutSuccess'),
      message: t('auth.logout'),
    });
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const isActivePath = (path: string) => {
    return pathname === path || pathname.startsWith(path + '/');
  };

  const navigation = [
    { name: t('nav.home'), href: '/' },
    { name: t('nav.listings'), href: '/listings' },
    { name: 'Categories', href: '/categories' }, // Will add to translations
    ...(user ? [
      { name: 'My Bids', href: '/dashboard/bids' },
      { name: 'My Listings', href: '/dashboard/listings' }
    ] : [])
  ];

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Logo */}
        <Link href="/" className={styles.logo} onClick={closeMobileMenu}>
          <div className={styles.logoIcon}>
            🚗
          </div>
          <div className={styles.logoText}>
            <span className={styles.logoMain}>{t('seo.defaultTitle').split(' | ')[0]}</span>
            <span className={styles.logoSub}>Syrian Marketplace</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className={styles.nav}>
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navLink} ${isActivePath(item.href) ? styles.active : ''}`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className={styles.actions}>
          <LanguageSwitch />
          <ThemeToggle />
          
          {user ? (
            <div className={styles.userMenu}>
              <div className={styles.userInfo}>
                {user.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={`${user.firstName} ${user.lastName}`}
                    width={32}
                    height={32}
                    className={styles.avatar}
                  />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                )}
                <span className={styles.userName}>
                  {user.firstName} {user.lastName}
                </span>
              </div>
              <div className={styles.userActions}>
                <Link href="/dashboard" className={styles.dashboardLink}>
                  {t('nav.dashboard')}
                </Link>
                <Link href="/listings/new">
                  <Button variant="primary" size="sm">
                    {t('nav.sell')}
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleLogout}
                >
                  {t('nav.logout')}
                </Button>
              </div>
            </div>
          ) : (
            <div className={styles.authButtons}>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">
                  {t('nav.login')}
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button variant="primary" size="sm">
                  {t('nav.register')}
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className={styles.mobileMenuButton}
          onClick={toggleMobileMenu}
          aria-label="فتح القائمة"
        >
          <div className={`${styles.hamburger} ${isMobileMenuOpen ? styles.hamburgerOpen : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.mobileMenuOpen : ''}`}>
        <nav className={styles.mobileNav}>
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.mobileNavLink} ${isActivePath(item.href) ? styles.active : ''}`}
              onClick={closeMobileMenu}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className={styles.mobileActions}>
          <div className={styles.mobileControls}>
            <LanguageSwitch />
            <ThemeToggle />
          </div>
          
          {user ? (
            <>
              <div className={styles.mobileUserInfo}>
                {user.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={`${user.firstName} ${user.lastName}`}
                    width={40}
                    height={40}
                    className={styles.avatar}
                  />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                )}
                <span className={styles.userName}>
                  {user.firstName} {user.lastName}
                </span>
              </div>
              
              <div className={styles.mobileUserActions}>
                <Link href="/dashboard" onClick={closeMobileMenu}>
                  <Button variant="ghost" size="md" className={styles.fullWidth}>
                    لوحة التحكم
                  </Button>
                </Link>
                <Link href="/listings/new" onClick={closeMobileMenu}>
                  <Button variant="primary" size="md" className={styles.fullWidth}>
                    أضف إعلان
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  size="md" 
                  onClick={handleLogout}
                  className={styles.fullWidth}
                >
                  تسجيل الخروج
                </Button>
              </div>
            </>
          ) : (
            <div className={styles.mobileAuthButtons}>
              <Link href="/auth/login" onClick={closeMobileMenu}>
                <Button variant="ghost" size="md" className={styles.fullWidth}>
                  تسجيل الدخول
                </Button>
              </Link>
              <Link href="/auth/register" onClick={closeMobileMenu}>
                <Button variant="primary" size="md" className={styles.fullWidth}>
                  إنشاء حساب
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className={styles.overlay} 
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}
    </header>
  );
};

export default Header;