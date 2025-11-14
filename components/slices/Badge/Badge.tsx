import React from 'react';
import styles from './Badge.module.scss';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary';
  size?: 'small' | 'medium' | 'large';
}

const Badge: React.FC<BadgeProps> = ({ children, variant = 'primary', size = 'medium' }) => {
  return (
    <span className={`${styles.badge} ${styles[variant]} ${styles[size]}`}>
      {children}
    </span>
  );
};

export default Badge;
