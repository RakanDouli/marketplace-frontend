'use client';

import React from 'react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

interface PhoneInputFieldProps {
  value: string;
  onChange: (value: string | undefined) => void;
  onFocus: () => void;
  onBlur: () => void;
  disabled?: boolean;
  id: string;
  name: string;
}

export const PhoneInputField: React.FC<PhoneInputFieldProps> = ({
  value,
  onChange,
  onFocus,
  onBlur,
  disabled,
  id,
  name,
}) => {
  return (
    <PhoneInput
      defaultCountry="SY"
      international
      value={value}
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
      disabled={disabled}
      id={id}
      name={name}
    />
  );
};

export default PhoneInputField;
