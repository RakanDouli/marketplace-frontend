'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { FiArrowLeftCircle } from 'react-icons/fi';
import styles from './MobileBackButton.module.scss';
import Text from '../Text/Text';
import Input from '../Input/Input';
import Button from '../Button/Button';

export interface MobileBackButtonProps {
  /** Click handler for the back button */
  onClick: () => void;
  /** Title to display in the header (used when showSearch is false) */
  title?: string;
  /** Enable search mode - shows search input instead of title */
  showSearch?: boolean;
  /** Search value (controlled) */
  searchValue?: string;
  /** Search value change handler */
  onSearchChange?: (value: string) => void;
  /** Search submit handler (on Enter key) */
  onSearchSubmit?: () => void;
  /** Placeholder for search input */
  searchPlaceholder?: string;
  /** Additional CSS class */
  className?: string;
}

export const MobileBackButton: React.FC<MobileBackButtonProps> = ({
  onClick,
  title,
  showSearch = false,
  searchValue = '',
  onSearchChange,
  onSearchSubmit,
  searchPlaceholder = 'ابحث...',
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const lastScrollY = useRef(0);

  // Handle scroll behavior - Optimized for Chrome mobile
  // Uses scroll accumulator for stable detection, synced with BottomNav
  useEffect(() => {
    let ticking = false;
    let scrollAccumulator = 0;
    const SCROLL_THRESHOLD = 50; // Same threshold as BottomNav for sync

    const handleScroll = () => {
      if (ticking) return;

      ticking = true;
      requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const scrollDelta = currentScrollY - lastScrollY.current;

        // Accumulate scroll distance for more stable detection
        scrollAccumulator += scrollDelta;

        // Always show when near top
        if (currentScrollY < 50) {
          setIsVisible(true);
          scrollAccumulator = 0;
        }
        // Show when scrolling up significantly
        else if (scrollAccumulator < -SCROLL_THRESHOLD) {
          setIsVisible(true);
          scrollAccumulator = 0;
        }
        // Hide when scrolling down significantly
        else if (scrollAccumulator > SCROLL_THRESHOLD) {
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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearchSubmit) {
      onSearchSubmit();
    }
  };

  return (
    <>
      <div className={`${styles.mobileHeader} ${className} ${isVisible ? styles.visible : styles.hidden}`}>
        <div className={styles.headerBar}>
          {showSearch ? (
            <div className={styles.searchWrapper}>
              {/* Search button on the right side (start in RTL) - away from back button */}
              {(isFocused || searchValue) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSearchSubmit}
                  icon={<Search size={18} />}
                  aria-label="بحث"
                />
              )}
              <Input
                type="search"
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={searchPlaceholder}
                icon={<Search size={18} />}
                className={styles.searchInput}
                aria-label="بحث"
              />
            </div>
          ) : (
            title && <Text variant='h4' className={styles.title}>{title}</Text>
          )}

          <button
            type="button"
            className={styles.backButton}
            onClick={onClick}
            aria-label="الرجوع"
          >
            <FiArrowLeftCircle size={24} />
          </button>
        </div>
      </div>
      {/* Spacer to prevent content from going under the fixed header on mobile */}
      <div className={styles.spacer} />
    </>
  );
};

export default MobileBackButton;
