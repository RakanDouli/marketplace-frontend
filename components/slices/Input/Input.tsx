'use client';
import React, { forwardRef, useState, useId, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { formatNumberWithCommas, parseFormattedNumber } from "@/utils/formatNumber";
import { useCurrencyStore, type Currency, CURRENCY_SYMBOLS } from "@/stores/currencyStore";
import styles from "./Input.module.scss";

// Lazy load heavy components to reduce initial bundle size
const PhoneInputField = dynamic(() => import("./PhoneInputField"), {
  loading: () => <div className={styles.inputSkeleton} />,
  ssr: false,
});

const SelectInputField = dynamic(() => import("./SelectInputField"), {
  loading: () => <div className={styles.inputSkeleton} />,
  ssr: false,
});

const MultiSelectInputField = dynamic(() => import("./MultiSelectInputField"), {
  loading: () => <div className={styles.inputSkeleton} />,
  ssr: false,
});


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
  | "multiselect"
  | "switch"
  | "date"
  | "file"
  | "price";
  /** Input label - can be string or ReactNode for custom labels with chips/badges */
  label?: React.ReactNode;
  /** Optional badge to show inline with label (e.g., "✓ تلقائي") - only works when label is string */
  labelBadge?: string;
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
  /** Show success state (green border when field is valid and filled) */
  success?: boolean;
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
  /** Max length for text/textarea with character counter */
  maxLength?: number;
  /** Show character counter (auto-enabled when maxLength is set) */
  showCounter?: boolean;
  /** Icon to display inside the input (right side for RTL) */
  icon?: React.ReactNode;
  /** Use bordered style for select (full border instead of underline) */
  bordered?: boolean;
}

// Convert Arabic numerals (٠١٢٣٤٥٦٧٨٩) to English (0123456789)
const convertArabicToEnglish = (str: string): string => {
  const arabicNumerals = '٠١٢٣٤٥٦٧٨٩';
  return str.replace(/[٠-٩]/g, (d) => String(arabicNumerals.indexOf(d)));
};

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
      success = false,
      validate,
      compareWith,
      searchable = false,
      creatable = false,
      isLoading = false,
      onCreateOption,
      maxLength,
      showCounter,
      icon,
      bordered = false,
      labelBadge,
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
      success && !hasAnyError ? styles["input--success"] : "",
      isFocused ? styles["input--focused"] : "",
      icon ? styles["input--withIcon"] : "",
    ]
      .filter(Boolean)
      .join(" ");

    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);

    // Handle validation on change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      let value = e.target.value;
      const name = e.target.name;

      // Convert Arabic numerals (٠١٢٣٤٥٦٧٨٩) to English (0123456789) for all text-based inputs
      // This ensures users can type with Arabic keyboard but values are stored as English
      if (type === 'number' || type === 'text' || type === 'textarea' || type === 'tel' || type === 'date') {
        value = convertArabicToEnglish(value);
      }

      // Create a synthetic event with the (possibly converted) value and name
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value,
          name,
        },
      } as React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;

      // Run validation if provided
      if (validate) {
        const validationResult = validate(value);
        setValidationError(validationResult);
      }

      // Call original onChange
      if (props.onChange) {
        props.onChange(syntheticEvent);
      }
    };

    const renderInput = () => {
      // Price input with currency selector
      if (type === "price") {
        const { exchangeRates, getRate, preferredCurrency, setPreferredCurrency } = useCurrencyStore();
        const [selectedCurrency, setSelectedCurrency] = useState<Currency>(preferredCurrency);
        const [displayValue, setDisplayValue] = useState<string>('');

        // Sync local currency with global preferred currency when it changes externally
        useEffect(() => {
          setSelectedCurrency(preferredCurrency);
        }, [preferredCurrency]);

        // Convert USD dollars (from props.value) to display currency
        useEffect(() => {
          if (props.value) {
            const usdDollars = Number(props.value);

            if (selectedCurrency === 'USD') {
              const roundedAmount = Math.round(usdDollars);
              setDisplayValue(roundedAmount.toLocaleString('en-US'));
            } else {
              const rate = getRate('USD', selectedCurrency);
              const convertedAmount = usdDollars * rate;
              const roundedAmount = Math.round(convertedAmount);
              setDisplayValue(roundedAmount.toLocaleString('en-US'));
            }
          } else {
            setDisplayValue('');
          }
        }, [props.value, selectedCurrency, getRate]);

        const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          let inputValue = e.target.value;

          // Convert Arabic numerals to English first
          inputValue = convertArabicToEnglish(inputValue);

          // Remove commas for parsing
          const cleanValue = inputValue.replace(/,/g, '');

          // Only allow numbers and commas (after Arabic conversion)
          if (inputValue && !/^[\d,]*$/.test(inputValue)) {
            return; // Ignore invalid input (anything except digits and commas)
          }

          // Update display with formatted value
          if (cleanValue) {
            const formattedValue = parseInt(cleanValue).toLocaleString('en-US');
            setDisplayValue(formattedValue);
          } else {
            setDisplayValue('');
          }

          const amount = parseFloat(cleanValue);
          if (isNaN(amount) || amount <= 0) {
            // Call onChange with 0 for invalid input
            if (props.onChange) {
              const syntheticEvent = {
                target: { value: '0', name: props.name || generatedId }
              } as any;
              props.onChange(syntheticEvent);
            }
            return;
          }

          // Convert to USD dollars
          let usdDollars: number;
          if (selectedCurrency === 'USD') {
            usdDollars = amount;
          } else {
            const rate = getRate(selectedCurrency, 'USD');
            usdDollars = amount * rate;
          }

          const roundedDollars = Math.round(usdDollars);

          // Call onChange with USD dollars
          if (props.onChange) {
            const syntheticEvent = {
              target: { value: String(roundedDollars), name: props.name || generatedId }
            } as any;
            props.onChange(syntheticEvent);
          }
        };

        const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
          const newCurrency = e.target.value as Currency;
          setSelectedCurrency(newCurrency);
          // Sync with global currency store so the entire page updates
          setPreferredCurrency(newCurrency);
        };

        // Show conversion preview
        const usdDollars = Number(props.value) || 0;
        const conversionPreview = selectedCurrency !== 'USD'
          ? `≈ ${CURRENCY_SYMBOLS.USD}${usdDollars.toLocaleString('en-US')} USD`
          : '';

        return (
          <div className={styles.priceInputWrapper}>
            <div className={styles.priceInputFields}>
              <select
                value={selectedCurrency}
                onChange={handleCurrencyChange}
                className={styles.currencySelect}
                disabled={props.disabled}
                aria-label="اختر العملة"
              >
                <option value="SYP">{CURRENCY_SYMBOLS.SYP} SYP</option>
                <option value="EUR">{CURRENCY_SYMBOLS.EUR} EUR</option>
                <option value="USD">{CURRENCY_SYMBOLS.USD} USD</option>
              </select>
              <input
                ref={ref as React.RefObject<HTMLInputElement>}
                type="text"
                inputMode="numeric"
                className={inputClasses}
                value={displayValue}
                onChange={handlePriceChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                disabled={props.disabled}
                placeholder={props.placeholder}
                min="0"
                step="0.01"
                id={props.id || props.name || generatedId}
                name={props.name || props.id || generatedId}
              />
            </div>
            {conversionPreview && (
              <div className={styles.conversionPreview}>{conversionPreview}</div>
            )}
          </div>
        );
      }

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
            maxLength={maxLength}
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

        const selectWrapperClasses = [
          styles.selectWrapperBordered,
          success && !hasAnyError ? styles.selectSuccess : "",
        ].filter(Boolean).join(" ");

        return (
          <div className={selectWrapperClasses}>
            <SelectInputField
              id={selectProps.id || generatedId}
              name={selectProps.name || selectProps.id || generatedId}
              options={options}
              value={selectedOption || null}
              onChange={handleSelectChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              disabled={selectProps.disabled}
              isLoading={isLoading}
              searchable={searchable}
              creatable={creatable}
              onCreateOption={onCreateOption}
              placeholder={props.placeholder}
              aria-label={typeof label === 'string' ? label : undefined}
            />
          </div>
        );
      }

      // Multi-select dropdown (allows selecting multiple options)
      if (type === "multiselect") {
        const selectProps = props as React.SelectHTMLAttributes<HTMLSelectElement>;

        // Value should be an array of selected option keys
        const selectedValues: string[] = Array.isArray(selectProps.value)
          ? selectProps.value
          : (selectProps.value ? [String(selectProps.value)] : []);

        // Find all selected options
        const selectedOptions = options.filter(opt => selectedValues.includes(opt.value));

        const handleMultiSelectChange = (newValue: any) => {
          // newValue is an array of selected options
          const selectedKeys = newValue ? newValue.map((opt: any) => opt.value) : [];
          const syntheticEvent = {
            target: {
              value: selectedKeys,
              name: selectProps.name || selectProps.id || generatedId
            }
          } as any;
          handleChange(syntheticEvent);
        };

        const multiSelectWrapperClasses = [
          styles.selectWrapperBordered,
          success && !hasAnyError ? styles.selectSuccess : "",
        ].filter(Boolean).join(" ");

        return (
          <div className={multiSelectWrapperClasses}>
            <MultiSelectInputField
              id={selectProps.id || generatedId}
              name={selectProps.name || selectProps.id || generatedId}
              options={options}
              value={selectedOptions}
              onChange={handleMultiSelectChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              disabled={selectProps.disabled}
              isLoading={isLoading}
              placeholder={props.placeholder}
              aria-label={typeof label === 'string' ? label : undefined}
            />
          </div>
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
          <PhoneInputField
            value={phoneProps.value as string || ''}
            onChange={handlePhoneChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={phoneProps.disabled}
            id={phoneProps.id || phoneProps.name || generatedId}
            name={phoneProps.name || phoneProps.id || generatedId}
            aria-label={typeof label === 'string' ? label : 'رقم الهاتف'}
          />
        );
      }

      // Default: regular input (text, email, password, etc.)
      const inputProps = props as React.InputHTMLAttributes<HTMLInputElement>;

      const inputElement = (
        <input
          ref={ref as React.RefObject<HTMLInputElement>}
          type={type}
          className={inputClasses}
          maxLength={maxLength}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...inputProps}
          onChange={handleChange}
          id={inputProps.id || inputProps.name || generatedId}
          name={inputProps.name || inputProps.id || generatedId}
          inputMode={type === 'number' ? 'numeric' : undefined} // Mobile keyboard hint
        />
      );

      // Wrap with icon container if icon is provided
      if (icon) {
        return (
          <div className={styles.inputWithIcon}>
            <span className={styles.inputIcon}>{icon}</span>
            {inputElement}
          </div>
        );
      }

      return inputElement;
    };

    // Check if label is a simple string (for adding required asterisk and badge)
    const isStringLabel = typeof label === 'string';

    return (
      <div className={`${styles.inputWrapper} ${className}`}>
        {label && type !== "switch" && (
          <label
            htmlFor={props.id || props.name || generatedId}
            className={styles.label}
          >
            {isStringLabel ? (
              <>
                <span>
                  {label}
                  {props.required && <span className={styles.required}>*</span>}
                </span>
                {labelBadge && <span className={styles.labelBadge}>{labelBadge}</span>}
              </>
            ) : (
              // ReactNode label - render as-is (caller handles required asterisk, badges, chips)
              label
            )}
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

        {/* Character counter for text/textarea with maxLength */}
        {maxLength && (showCounter !== false) && (type === 'text' || type === 'textarea') && (
          <span className={styles.charCounter}>
            {String(props.value || '').length} / {maxLength}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
