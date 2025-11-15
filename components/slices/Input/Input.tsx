'use client';
import React, { forwardRef, useState, useId, useRef, useEffect } from "react";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { formatNumberWithCommas, parseFormattedNumber } from "@/utils/formatNumber";
import { useCurrencyStore, type Currency, CURRENCY_SYMBOLS } from "@/stores/currencyStore";
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
  | "file"
  | "price";
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
      // Price input with currency selector
      if (type === "price") {
        const { exchangeRates, getRate } = useCurrencyStore();
        const [selectedCurrency, setSelectedCurrency] = useState<Currency>("SYP");
        const [displayValue, setDisplayValue] = useState<string>('');

        // Convert USD cents (from props.value) to display currency
        useEffect(() => {
          if (props.value) {
            const usdCents = Number(props.value);
            const usdDollars = usdCents / 100;

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
          const inputValue = e.target.value;

          // Remove commas for parsing
          const cleanValue = inputValue.replace(/,/g, '');

          // Only allow numbers
          if (cleanValue && !/^\d+$/.test(cleanValue)) {
            return; // Ignore invalid input
          }

          setDisplayValue(inputValue);

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

          // Convert to USD cents
          let usdDollars: number;
          if (selectedCurrency === 'USD') {
            usdDollars = amount;
          } else {
            const rate = getRate(selectedCurrency, 'USD');
            usdDollars = amount * rate;
          }

          const usdCents = Math.round(usdDollars * 100);

          // Call onChange with USD cents
          if (props.onChange) {
            const syntheticEvent = {
              target: { value: String(usdCents), name: props.name || generatedId }
            } as any;
            props.onChange(syntheticEvent);
          }
        };

        const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
          setSelectedCurrency(e.target.value as Currency);
        };

        // Show conversion preview
        const usdCents = Number(props.value) || 0;
        const usdDollars = usdCents / 100;
        const roundedUSD = Math.round(usdDollars);
        const conversionPreview = selectedCurrency !== 'USD'
          ? `≈ ${CURRENCY_SYMBOLS.USD}${roundedUSD.toLocaleString('en-US')} USD`
          : '';

        return (
          <div className={styles.priceInputWrapper}>
            <div className={styles.priceInputFields}>
              <select
                value={selectedCurrency}
                onChange={handleCurrencyChange}
                className={styles.currencySelect}
                disabled={props.disabled}
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

        return (
          <div className={styles.selectWrapper}>
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
              classNamePrefix="react-select"
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
