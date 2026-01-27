'use client';

import React from 'react';
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
}) => {
  const SelectComponent = creatable ? CreatableSelect : Select;

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
      placeholder={placeholder || 'اختر خيار...'}
      noOptionsMessage={() => "لا توجد نتائج"}
      loadingMessage={() => "جاري التحميل..."}
      formatCreateLabel={(inputValue) => `إضافة "${inputValue}"`}
      classNamePrefix="react-select"
      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
      menuPosition="fixed"
      styles={{
        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
      }}
    />
  );
};

export default SelectInputField;
