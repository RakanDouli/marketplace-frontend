import React from 'react';
import { Input } from '@/components/slices/Input/Input';
import Text from '@/components/slices/Text/Text';
import type { Attribute } from '@/stores/createListingStore/types';
import styles from './attributeFieldRenderer.module.scss';

interface RenderAttributeFieldProps {
  attribute: Attribute;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}

export const renderAttributeField = ({
  attribute,
  value,
  onChange,
  error,
}: RenderAttributeFieldProps): JSX.Element | null => {
  const commonProps = {
    label: attribute.name, // Arabic label from backend
    value: value ?? '',
    error: error,
    helpText: undefined, // Can add description field to attribute if needed
    required: attribute.validation === 'REQUIRED', // Input component will add asterisk automatically via SCSS
  };

  switch (attribute.type) {
    case 'SELECTOR':
      return (
        <Input
          type="select"
          options={[
            { value: '', label: `-- اختر ${attribute.name} --` },
            ...attribute.options
              .filter(opt => opt.isActive)
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map(opt => ({
                value: opt.key,
                label: opt.value, // Arabic label
              }))
          ]}
          {...commonProps}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'MULTI_SELECTOR':
      // For listing creation, MULTI_SELECTOR is rendered as a regular SELECTOR
      // (A specific item has ONE value, not multiple)
      // MULTI_SELECTOR is only used in filters (e.g., "show cars with 1.6L OR 2.0L")
      return (
        <Input
          type="select"
          options={[
            { value: '', label: `-- اختر ${attribute.name} --` },
            ...attribute.options
              .filter(opt => opt.isActive)
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map(opt => ({
                value: opt.key,
                label: opt.value,
              }))
          ]}
          {...commonProps}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'RANGE':
      // RANGE type can have two behaviors:
      // 1. NO OPTIONS → Free text/number input (e.g., year: "2018", mileage: "50000")
      // 2. WITH OPTIONS → Selector dropdown (rare, but supported)
      
      if (attribute.options && attribute.options.length > 0) {
        // Has predefined options → render as dropdown
        return (
          <Input
            type="select"
            options={[
              { value: '', label: `-- اختر ${attribute.name} --` },
              ...attribute.options
                .filter(opt => opt.isActive)
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map(opt => ({
                  value: opt.key,
                  label: opt.value,
                }))
            ]}
            {...commonProps}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      } else {
        // No options → free text input for number (e.g., year, mileage)
        return (
          <Input
            type="text"
            {...commonProps}
            onChange={(e) => onChange(e.target.value)}
            pattern="[0-9]*"
            placeholder={`أدخل ${attribute.name}`}
          />
        );
      }
    case 'TEXT':
      return (
        <Input
          type="text"
          {...commonProps}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'TEXTAREA':
      return (
        <Input
          type="textarea"
          rows={3}
          {...commonProps}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'NUMBER':
      return (
        <Input
          type="number"
          {...commonProps}
          onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : '')}
        />
      );

    case 'BOOLEAN':
      return (
        <Input
          type="boolean"
          label={attribute.name}
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          error={error}
        />
      );

    case 'CURRENCY':
      return (
        <Input
          type="number"
          step="0.01"
          min="0"
          {...commonProps}
          onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : '')}
        />
      );

    default:
      console.warn(`Unknown attribute type: ${attribute.type}`);
      return null;
  }
};
