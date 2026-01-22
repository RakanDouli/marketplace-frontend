'use client';

import React from 'react';
import Link from 'next/link';
import { LogoIcon } from './LogoIcon';
import styles from './Logo.module.scss';

export interface LogoProps {
  /** Show text next to icon */
  showText?: boolean;
  /** Text color variant */
  textColor?: 'primary' | 'secondary' | 'text' | 'text-inverse' | 'text-light';
  /** Icon background color (icon is always white/text-light) */
  iconBg?: 'primary' | 'secondary' | 'text';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Custom class name */
  className?: string;
  /** Link href (default: /) */
  href?: string;
  /** Disable link (just render as div) */
  asDiv?: boolean;
  /** Hide text on mobile screens */
  hideTextOnMobile?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  showText = true,
  textColor = 'primary',
  iconBg = 'primary',
  size = 'md',
  className = '',
  href = '/',
  asDiv = false,
  hideTextOnMobile = false,
}) => {
  const textClasses = `${styles.text} ${styles[`textColor_${textColor}`]} ${styles[`size_${size}`]} ${hideTextOnMobile ? styles.hideOnMobile : ''}`;

  const content = (
    <>
      <div className={`${styles.iconWrapper} ${styles[`iconBg_${iconBg}`]} ${styles[`size_${size}`]}`}>
        <LogoIcon className={styles.icon} />
      </div>
      {showText && (
        <span className={textClasses}>
          <span className={styles.textArabic}>شام باي</span>
          <span className={styles.textEnglish}>SHAMBAY</span>
        </span>
      )}
    </>
  );

  const combinedClassName = `${styles.logo} ${className}`.trim();

  if (asDiv) {
    return <div className={combinedClassName}>{content}</div>;
  }

  return (
    <Link href={href} className={combinedClassName}>
      {content}
    </Link>
  );
};

export default Logo;
