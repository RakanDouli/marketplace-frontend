'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import styles from './MobileBackButton.module.scss';
import Text from '../Text/Text';

export interface MobileBackButtonProps {
  /** Click handler for the back button */
  onClick: () => void;
  /** Title to display in the header */
  title?: string;
  /** Additional CSS class */
  className?: string;
}

export const MobileBackButton: React.FC<MobileBackButtonProps> = ({
  onClick,
  title,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY.current;

      // Show when near top or scrolling up
      if (currentScrollY < 50 || scrollDelta < -5) {
        setIsVisible(true);
      }
      // Hide when scrolling down
      else if (scrollDelta > 5) {
        setIsVisible(false);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <div className={`${styles.mobileHeader} ${className} ${isVisible ? styles.visible : styles.hidden}`}>
        <div className={styles.headerBar}>
          {title && <Text variant='h4' className={styles.title}>{title}</Text>}

          <button
            type="button"
            className={styles.backButton}
            onClick={onClick}
            aria-label="الرجوع"
          >
            <ArrowLeft size={24} />
          </button>
        </div>
      </div>
      {/* Spacer to prevent content from going under the fixed header on mobile */}
      <div className={styles.spacer} />
    </>
  );
};

export default MobileBackButton;
