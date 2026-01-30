'use client';

import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectInputFieldProps {
  id: string;
  name: string;
  options: SelectOption[];
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
      classNamePrefix="react-select"
      menuPortalTarget={menuPortalTarget}
      menuPosition="fixed"
      aria-label={ariaLabel || placeholder || 'اختر خيار'}
      styles={{
        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
        // Prevent scroll chaining - stops page scroll when scrolling dropdown options
        menuList: (base) => ({
          ...base,
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
        }),
        // Prevent touch events on menu backdrop from scrolling page
        menu: (base) => ({
          ...base,
          touchAction: 'none',
        }),
        // Style disabled options as group headers
        option: (base, state) => ({
          ...base,
          ...(state.isDisabled && {
            fontWeight: 600,
            color: '#666',
            backgroundColor: '#f5f5f5',
            cursor: 'not-allowed',
          }),
        }),
      }}
    />
  );
};

export default SelectInputField;
