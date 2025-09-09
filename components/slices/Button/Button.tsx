import React, { forwardRef } from 'react';
import styles from './Button.module.scss';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  children,
  className = '',
  ...props
}, ref) => {
  const isDisabled = loading || disabled;
  
  return (
    <button
      ref={ref}
      disabled={isDisabled}
      className={`${styles.button} ${styles[variant]} ${styles[size]} ${className} ${isDisabled ? styles.disabled : ''}`}
      {...props}
    >
      {loading ? (
        <>
          <span className={styles.spinner}></span>
          {children}
        </>
      ) : (
        <>
          {icon && <span className={styles.icon}>{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;