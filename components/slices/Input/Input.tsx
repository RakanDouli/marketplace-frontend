'use client';
import React, { forwardRef, useState, useId, useRef, useEffect } from "react";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { formatNumberWithCommas, parseFormattedNumber } from "@/utils/formatNumber";
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
  | "switch"
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
  /** Value to compare against (for password confirmation) */
  compareWith?: string;
  /** Enable search for select (uses react-select) */
  searchable?: boolean;
  /** Enable create new option for select (uses react-select creatable) */
  creatable?: boolean;
  /** Loading state for select */
  isLoading?: boolean;
  /** Callback when creating a new option (for creatable selects) */
  onCreateOption?: (inputValue: string) => void;
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
      compareWith,
      searchable = false,
      creatable = false,
      isLoading = false,
      onCreateOption,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [validationError, setValidationError] = useState<string | undefined>();
    const generatedId = useId();

    // Re-validate when compareWith changes (for password confirmation)
    useEffect(() => {
      if (compareWith !== undefined && validate && props.value) {
        const validationResult = validate(String(props.value));
        setValidationError(validationResult);
      }
    }, [compareWith, validate, props.value]);

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
      let value = e.target.value;

      // For number inputs, parse and format with commas
      if (type === 'number') {
        // Remove existing commas
        const numericValue = parseFormattedNumber(value);

        // Format back with commas (display value)
        const formattedValue = numericValue > 0 ? formatNumberWithCommas(numericValue) : '';

        // Update the synthetic event with the numeric value (for parent onChange)
        e.target.value = String(numericValue);
      }

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

      if (type === "switch") {
        const switchProps = props as React.InputHTMLAttributes<HTMLInputElement>;
        const isChecked = Boolean(switchProps.checked) || switchProps.value === 'true' || Boolean(switchProps.value);

        const handleSwitchClick = (e: React.MouseEvent) => {
          if (switchProps.disabled) return;

          // Prevent event bubbling to parent elements (important for sortable lists)
          e.preventDefault();
          e.stopPropagation();

          const syntheticEvent = {
            target: {
              checked: !isChecked,
              value: !isChecked,
              name: switchProps.name || switchProps.id || generatedId,
              type: 'checkbox'
            } as unknown as HTMLInputElement,
            preventDefault: () => {
              // No-op for synthetic event
            },
            stopPropagation: () => {
              // No-op for synthetic event
            }
          } as unknown as React.ChangeEvent<HTMLInputElement>;

          handleChange(syntheticEvent);
        };

        return (
          <div className={styles.switchContainer} onClick={handleSwitchClick}>
            <input
              ref={ref as React.RefObject<HTMLInputElement>}
              type="checkbox"
              className={styles.switchInput}
              checked={isChecked}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onChange={() => { }} // Prevent default checkbox behavior
              id={switchProps.id || switchProps.name || generatedId}
              name={switchProps.name || switchProps.id || generatedId}
              disabled={switchProps.disabled}
              tabIndex={-1} // Remove from tab order since container handles click
            />
            <div className={`${styles.switchTrack} ${isChecked ? styles.switchTrackOn : styles.switchTrackOff}`}>
              <div className={`${styles.switchThumb} ${isChecked ? styles.switchThumbOn : styles.switchThumbOff}`} />
            </div>
          </div>
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

        // ALWAYS use react-select for ALL selects
        const SelectComponent = creatable ? CreatableSelect : Select;
        const selectedOption = options.find(opt => opt.value === String(selectProps.value || ''));

        const handleSelectChange = (newValue: any) => {
          const syntheticEvent = {
            target: {
              value: newValue?.value || '',
              name: selectProps.name || selectProps.id || generatedId
            }
          } as any;
          handleChange(syntheticEvent);
        };

        const handleCreate = (inputValue: string) => {
          if (onCreateOption) {
            onCreateOption(inputValue);
          }
        };

        // Get CSS variables from document
        const getColor = (varName: string) => {
          if (typeof window === 'undefined') return undefined;
          return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
        };

        const primaryColor = getColor('--primary');
        const borderColor = getColor('--border');
        const surfaceColor = getColor('--surface');

        const customStyles = {
          control: (base: any, state: any) => ({
            ...base,
            minHeight: '44px',
            borderColor: state.isFocused ? primaryColor : borderColor,
            boxShadow: state.isFocused ? `0 0 0 3px ${primaryColor}1a` : 'none',
            '&:hover': {
              borderColor: primaryColor,
            },
          }),
          option: (base: any, state: any) => ({
            ...base,
            backgroundColor: state.isSelected ? primaryColor : state.isFocused ? surfaceColor : 'transparent',
            color: state.isSelected ? 'white' : 'inherit',
          }),
        };

        return (
          <SelectComponent
            instanceId={selectProps.id || generatedId}
            inputId={selectProps.id || generatedId}
            name={selectProps.name || selectProps.id || generatedId}
            options={options}
            value={selectedOption || null}
            onChange={handleSelectChange}
            onCreateOption={creatable ? handleCreate : undefined}
            onFocus={handleFocus}
            onBlur={handleBlur}
            isDisabled={selectProps.disabled}
            isLoading={isLoading}
            isSearchable={searchable}
            placeholder='اختر خيار...'
            noOptionsMessage={() => "لا توجد نتائج"}
            loadingMessage={() => "جاري التحميل..."}
            formatCreateLabel={(inputValue) => `إضافة "${inputValue}"`}
            styles={customStyles}
          />
        );
      }

      // Phone input with international formatting
      if (type === "tel") {
        const phoneProps = props as React.InputHTMLAttributes<HTMLInputElement>;

        const handlePhoneChange = (value: string | undefined) => {
          const syntheticEvent = {
            target: {
              value: value || '',
              name: phoneProps.name || phoneProps.id || generatedId
            }
          } as any;
          handleChange(syntheticEvent);
        };

        return (
          <PhoneInput
            defaultCountry="SY"
            international
            value={phoneProps.value as string || ''}
            onChange={handlePhoneChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={phoneProps.disabled}
            className={inputClasses}
            id={phoneProps.id || phoneProps.name || generatedId}
            name={phoneProps.name || phoneProps.id || generatedId}
          />
        );
      }

      // Default: regular input (text, email, password, etc.)
      const inputProps = props as React.InputHTMLAttributes<HTMLInputElement>;

      // For number inputs, format the displayed value with commas
      let displayValue: string | number | readonly string[] | undefined = inputProps.value;
      if (type === 'number' && inputProps.value && !Array.isArray(inputProps.value)) {
        displayValue = formatNumberWithCommas(inputProps.value as string | number);
      }

      return (
        <input
          ref={ref as React.RefObject<HTMLInputElement>}
          type={type === 'number' ? 'text' : type} // Use text input for formatted numbers
          className={inputClasses}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...inputProps}
          value={displayValue}
          onChange={handleChange}
          id={inputProps.id || inputProps.name || generatedId}
          name={inputProps.name || inputProps.id || generatedId}
          inputMode={type === 'number' ? 'numeric' : undefined} // Mobile keyboard hint
        />
      );
    };

    return (
      <div className={`${styles.inputWrapper} ${className}`}>
        {label && type !== "switch" && (
          <label
            htmlFor={props.id || props.name || generatedId}
            className={styles.label}
          >
            {label}
            {props.required && <span className={styles.required}>*</span>}
          </label>
        )}

        {type === "switch" && label ? (
          <div className={styles.switchWrapper}>
            <label
              htmlFor={props.id || props.name || generatedId}
              className={styles.switchLabel}
            >
              {label}
            </label>
            {renderInput()}
          </div>
        ) : (
          renderInput()
        )}

        {displayError && (
          <span className={styles.errorText}>{displayError}</span>
        )}

        {helpText && !displayError && (
          <span className={styles.helpText}>{helpText}</span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
