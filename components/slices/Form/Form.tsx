'use client';
import React, { forwardRef, FormEvent, ReactNode } from 'react';
import { Text } from '../Text/Text';
import styles from './Form.module.scss';

export interface FormProps extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> {
  /** Form-level error message (e.g., from API) */
  error?: string;
  /** Success message */
  success?: string;
  /** Custom submit handler - receives FormData */
  onSubmit?: (e: FormEvent<HTMLFormElement>) => void | Promise<void>;
  /** Children (Input components, buttons, etc.) */
  children: ReactNode;
  /** Custom class name */
  className?: string;
}

export const Form = forwardRef<HTMLFormElement, FormProps>(
  (
    {
      error,
      success,
      onSubmit,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    // Handle form submission
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (onSubmit) {
        await onSubmit(e);
      }
    };

    return (
      <form
        ref={ref}
        onSubmit={handleSubmit}
        className={`${styles.form} ${className}`.trim()}
        {...props}
      >
        {/* Form-level error */}
        {error && (
          <div className={styles.formError}>
            <Text variant="small" className={styles.errorText}>
              ⚠️ {error}
            </Text>
          </div>
        )}

        {/* Form-level success */}
        {success && (
          <div className={styles.formSuccess}>
            <Text variant="small" className={styles.successText}>
              ✓ {success}
            </Text>
          </div>
        )}

        {/* Form fields - Input components handle their own validation */}
        {children}
      </form>
    );
  }
);

Form.displayName = 'Form';

export default Form;
