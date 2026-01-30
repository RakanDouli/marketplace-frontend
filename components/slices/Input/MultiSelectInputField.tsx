'use client';

import React from 'react';
import Select from 'react-select';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface MultiSelectInputFieldProps {
  id: string;
  name: string;
  options: SelectOption[];
  value: SelectOption[];
  onChange: (newValue: any) => void;
  onFocus: () => void;
  onBlur: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
  'aria-label'?: string;
}

export const MultiSelectInputField: React.FC<MultiSelectInputFieldProps> = ({
  id,
  name,
  options,
  value,
  onChange,
  onFocus,
  onBlur,
  disabled,
  isLoading,
  placeholder,
  'aria-label': ariaLabel,
}) => {
  return (
    <Select
      instanceId={id}
      inputId={id}
      name={name}
      options={options}
      value={value}
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
      isDisabled={disabled}
      isLoading={isLoading}
      isSearchable={true}
      isMulti={true}
      placeholder={placeholder || 'اختر الخيارات...'}
      noOptionsMessage={() => "لا توجد نتائج"}
      loadingMessage={() => "جاري التحميل..."}
      classNamePrefix="react-select"
      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
      menuPosition="fixed"
      closeMenuOnSelect={false}
      aria-label={ariaLabel || placeholder || 'اختر الخيارات'}
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
      }}
    />
  );
};

export default MultiSelectInputField;
