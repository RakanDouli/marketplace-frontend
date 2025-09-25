'use client';
import React, { forwardRef, useState, useId, useRef, useEffect } from "react";
import styles from "./Input.module.scss";

interface CustomSelectProps {
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  inputClasses: string;
  onFocus: () => void;
  onBlur: () => void;
  onChange: (e: any) => void;
  generatedId: string;
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  name?: string;
  id?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  inputClasses,
  onFocus,
  onBlur,
  onChange,
  generatedId,
  value = '',
  placeholder = 'اختر خيار...',
  disabled = false,
  name,
  id
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        onBlur();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onBlur]);

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen) {
      onFocus();
    } else {
      onBlur();
    }
  };

  const handleOptionClick = (optionValue: string) => {
    if (disabled) return;

    setSelectedValue(optionValue);
    setIsOpen(false);
    onBlur();

    // Create synthetic event for onChange
    const syntheticEvent = {
      target: {
        value: optionValue,
        name: name || id || generatedId
      }
    };
    onChange(syntheticEvent);
  };

  const selectedOption = options.find(opt => opt.value === selectedValue);
  const displayValue = selectedOption?.label || placeholder;

  return (
    <div ref={dropdownRef} className={styles.customSelectWrapper}>
      {/* Hidden input for form submission */}
      <input
        type="hidden"
        name={name || id || generatedId}
        value={selectedValue}
      />

      {/* Custom select trigger */}
      <div
        className={`${inputClasses} ${styles.customSelectTrigger} ${isOpen ? styles.open : ''}`}
        onClick={handleToggle}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle();
          }
        }}
      >
        <span className={selectedValue ? '' : styles.placeholder}>
          {displayValue}
        </span>
        <div className={`${styles.selectArrow} ${isOpen ? styles.open : ''}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {/* Custom dropdown */}
      {isOpen && (
        <div className={styles.customSelectDropdown}>
          {options.map((option) => (
            <div
              key={option.value}
              className={`${styles.customSelectOption} ${
                option.value === selectedValue ? styles.selected : ''
              } ${option.disabled ? styles.disabled : ''}`}
              onClick={() => !option.disabled && handleOptionClick(option.value)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

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
        return <CustomSelect
          options={options}
          inputClasses={inputClasses}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          generatedId={generatedId}
          {...(props as React.SelectHTMLAttributes<HTMLSelectElement>)}
        />;
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
