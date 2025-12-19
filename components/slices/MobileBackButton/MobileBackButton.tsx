'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import styles from './MobileBackButton.module.scss';

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
  return (
    <div className={`${styles.mobileHeader} ${className}`}>
      <div className={styles.headerBar}>
        <button
          type="button"
          className={styles.backButton}
          onClick={onClick}
          aria-label="الرجوع"
        >
          <ArrowLeft size={24} />
        </button>
        {title && <h1 className={styles.title}>{title}</h1>}
      </div>
    </div>
  );
};

export default MobileBackButton;
