"use client";
import React, { useEffect, useState } from 'react';
import { Check, X, Send } from 'lucide-react';
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
        <Send size={18} className={styles.sendIcon} />
        {isLoading ? '' : children}
      </span>

      <Check size={24} className={styles.checkIcon} />
      <X size={24} className={styles.errorIcon} />
    </button>
  );
};

export default SubmitButton;
