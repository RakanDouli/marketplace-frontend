"use client";
import React, { useEffect, useState } from 'react';
import styles from './SubmitButton.module.scss';

export interface SubmitButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  isLoading?: boolean;
  isSuccess?: boolean;
  isError?: boolean;
  resetDelay?: number; // Delay in ms before resetting state (default: 3000ms)
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({
  children = 'Submit',
  onClick,
  variant = 'primary',
  disabled = false,
  type = 'submit',
  className = '',
  isLoading = false,
  isSuccess = false,
  isError = false,
  resetDelay = 3000,
}) => {
  const [internalSuccess, setInternalSuccess] = useState(false);
  const [internalError, setInternalError] = useState(false);

  // Auto-reset success/error states after delay
  useEffect(() => {
    if (isSuccess) {
      setInternalSuccess(true);
      const timer = setTimeout(() => {
        setInternalSuccess(false);
      }, resetDelay);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, resetDelay]);

  useEffect(() => {
    if (isError) {
      setInternalError(true);
      const timer = setTimeout(() => {
        setInternalError(false);
      }, resetDelay);
      return () => clearTimeout(timer);
    }
  }, [isError, resetDelay]);

  const buttonClass = [
    styles.submitButton,
    variant !== 'primary' ? styles[`submitButton--${variant}`] : '',
    isLoading ? styles.loading : '',
    internalSuccess ? styles.success : '',
    internalError ? styles.error : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={buttonClass}
      onClick={onClick}
      disabled={disabled || isLoading}
    >
      <span className={styles.text}>
        {isLoading ? '' : children}
      </span>

      <svg
        className={styles.checkIcon}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
      >
        <path d="M0 11c2.761.575 6.312 1.688 9 3.438 3.157-4.23 8.828-8.187 15-11.438-5.861 5.775-10.711 12.328-14 18.917-2.651-3.766-5.547-7.271-10-10.917z" />
      </svg>

      <svg
        className={styles.errorIcon}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
      >
        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
};

export default SubmitButton;