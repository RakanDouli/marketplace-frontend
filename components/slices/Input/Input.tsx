'use client';
import React, { forwardRef, useState, useId } from "react";
import styles from "./Input.module.scss";

export interface InputProps
  extends Omit<
    React.InputHTMLAttributes<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
    "size"
  > {
  /** Input type */
  type?:
    | "text"
    | "email"
    | "password"
    | "number"
    | "tel"
    | "url"
    | "search"
    | "textarea"
    | "boolean"
    | "select"
    | "date"
    | "file";
  /** Input label */
  label?: string;
  /** Error message */
  error?: string;
  /** Help text */
  helpText?: string;
  /** Input variant */
  variant?: "default" | "outline" | "filled";
  /** Input size */
  size?: "sm" | "md" | "lg";
  /** Options for select */
  options?: Array<{ value: string; label: string; disabled?: boolean }>;
  /** Additional CSS classes */
  className?: string;
  /** Textarea rows */
  rows?: number;
  /** Show error state */
  hasError?: boolean;
  /** Validation function for real-time validation */
  validate?: (value: string) => string | undefined;
}

export const Input = forwardRef<
  HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  InputProps
>(
  (
    {
      type = "text",
      label,
      error,
      helpText,
      variant = "default",
      size = "md",
      options = [],
      className = "",
      rows = 4,
      hasError = false,
      validate,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [validationError, setValidationError] = useState<string | undefined>();
    const generatedId = useId();

    // Priority: external error > validation error
    const displayError = error || validationError;
    const hasAnyError = hasError || !!displayError;

    const inputClasses = [
      styles.input,
      styles[`input--${variant}`],
      styles[`input--${size}`],
      hasAnyError ? styles["input--error"] : "",
      isFocused ? styles["input--focused"] : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);

    // Handle validation on change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = e.target.value;

      // Run validation if provided
      if (validate) {
        const validationResult = validate(value);
        setValidationError(validationResult);
      }

      // Call original onChange
      if (props.onChange) {
        props.onChange(e as any);
      }
    };

    const renderInput = () => {
      if (type === "boolean") {
        const checkboxProps = props as React.InputHTMLAttributes<HTMLInputElement>;
        return (
          <input
            ref={ref as React.RefObject<HTMLInputElement>}
            type="checkbox"
            className={`${inputClasses} ${styles.checkbox}`}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...checkboxProps}
            onChange={handleChange}
            id={checkboxProps.id || checkboxProps.name || generatedId}
            name={checkboxProps.name || checkboxProps.id || generatedId}
          />
        );
      }

      if (type === "textarea") {
        const textareaProps = props as React.TextareaHTMLAttributes<HTMLTextAreaElement>;
        return (
          <textarea
            ref={ref as React.RefObject<HTMLTextAreaElement>}
            className={inputClasses}
            rows={rows}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...textareaProps}
            onChange={handleChange}
            id={textareaProps.id || textareaProps.name || generatedId}
            name={textareaProps.name || textareaProps.id || generatedId}
          />
        );
      }

      if (type === "select") {
        const selectProps = props as React.SelectHTMLAttributes<HTMLSelectElement>;
        return (
          <select
            ref={ref as React.RefObject<HTMLSelectElement>}
            className={inputClasses}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...selectProps}
            onChange={handleChange}
            id={selectProps.id || selectProps.name || generatedId}
            name={selectProps.name || selectProps.id || generatedId}
          >
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
        );
      }

      const inputProps = props as React.InputHTMLAttributes<HTMLInputElement>;
      return (
        <input
          ref={ref as React.RefObject<HTMLInputElement>}
          type={type}
          className={inputClasses}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...inputProps}
          onChange={handleChange}
          id={inputProps.id || inputProps.name || generatedId}
          name={inputProps.name || inputProps.id || generatedId}
        />
      );
    };

    return (
      <div className={styles.inputGroup}>
        {label && (
          <label
            className={styles.label}
            htmlFor={props.id || props.name || generatedId}
          >
            {label}
          </label>
        )}

        <div className={styles.inputContainer}>{renderInput()}</div>

        {displayError && <div className={styles.error}>{displayError}</div>}

        {helpText && !displayError && (
          <div className={styles.helpText}>{helpText}</div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
