'use client';

import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import styles from './Input.module.scss';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  count?: number;
}

/**
 * Grouped options format for react-select.
 * Used for Sahibinden-style grouped dropdowns.
 */
interface GroupedOption {
  label: string;
  options: SelectOption[];
}

interface SelectInputFieldProps {
  id: string;
  name: string;
  options: SelectOption[] | GroupedOption[];
  value: SelectOption | null;
  onChange: (newValue: any) => void;
  onFocus: () => void;
  onBlur: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  searchable?: boolean;
  creatable?: boolean;
  onCreateOption?: (inputValue: string) => void;
  placeholder?: string;
  'aria-label'?: string;
}

export const SelectInputField: React.FC<SelectInputFieldProps> = ({
  id,
  name,
  options,
  value,
  onChange,
  onFocus,
  onBlur,
  disabled,
  isLoading,
  searchable,
  creatable,
  onCreateOption,
  placeholder,
  'aria-label': ariaLabel,
}) => {
  const SelectComponent = creatable ? CreatableSelect : Select;

  // Use state to set menuPortalTarget only after mount to avoid hydration mismatch
  const [menuPortalTarget, setMenuPortalTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setMenuPortalTarget(document.body);
  }, []);

  return (
    <SelectComponent
      instanceId={id}
      inputId={id}
      name={name}
      options={options}
      value={value}
      onChange={onChange}
      onCreateOption={creatable ? onCreateOption : undefined}
      onFocus={onFocus}
      onBlur={onBlur}
      isDisabled={disabled}
      isLoading={isLoading}
      isSearchable={searchable}
      isOptionDisabled={(option: SelectOption) => option.disabled === true}
      placeholder={placeholder || 'اختر خيار...'}
      noOptionsMessage={() => "لا توجد نتائج"}
      loadingMessage={() => "جاري التحميل..."}
      formatCreateLabel={(inputValue) => `إضافة "${inputValue}"`}
      formatOptionLabel={(option: SelectOption) => (
        <div className={styles.selectOptionRow}>
          <span className={styles.selectOptionLabel}>{option.label}</span>
          {option.count !== undefined && (
            <span className={styles.selectOptionCount}>{option.count}</span>
          )}
        </div>
      )}
      classNamePrefix="react-select"
      menuPortalTarget={menuPortalTarget}
      menuPosition="fixed"
      aria-label={ariaLabel || placeholder || 'اختر خيار'}
      styles={{
        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
        // Control (input field) styling
        control: (base) => ({
          ...base,
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
          minHeight: '44px',
          '&:hover': {
            borderColor: 'var(--primary)',
          },
        }),
        // Style disabled options as group headers
        option: (base, state) => ({
          ...base,
          ...(state.isDisabled && {
            fontWeight: 600,
            color: '#666',
            backgroundColor: 'var(--bg)',
            cursor: 'not-allowed',
          }),
        }),
        // Menu dropdown styling
        menu: (base) => ({
          ...base,
          backgroundColor: 'var(--bg)',
          borderColor: 'var(--border)',
        }),
        menuList: (base) => ({
          ...base,
          backgroundColor: 'var(--bg)',
        }),
        singleValue: (base) => ({
          ...base,
          color: 'var(--text)',
        }),
        input: (base) => ({
          ...base,
          color: 'var(--text)',
        }),
        placeholder: (base) => ({
          ...base,
          color: 'var(--text-muted)',
        }),
      }}
    />
  );
};

export default SelectInputField;
