import React from 'react';
import { Input } from '@/components/slices/Input/Input';
import Text from '@/components/slices/Text/Text';
import type { Attribute } from '@/stores/createListingStore/types';
import { AttributeType } from '@/common/enums';
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
    case AttributeType.SELECTOR:
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

    case AttributeType.MULTI_SELECTOR:
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

    case AttributeType.RANGE:
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
    case AttributeType.TEXT:
      return (
        <Input
          type="text"
          {...commonProps}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case AttributeType.TEXTAREA:
      return (
        <Input
          type="textarea"
          rows={3}
          {...commonProps}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case AttributeType.NUMBER:
      return (
        <Input
          type="number"
          {...commonProps}
          onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : '')}
        />
      );

    case AttributeType.BOOLEAN:
      return (
        <Input
          type="boolean"
          label={attribute.name}
          checked={!!value}
          onChange={(e) => onChange((e.target as HTMLInputElement).checked)}
          error={error}
        />
      );

    case AttributeType.CURRENCY:
      return (
        <Input
          type="number"
          step="0.01"
          min="0"
          {...commonProps}
          onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : '')}
        />
      );

    case AttributeType.RANGE_SELECTOR:
      // RANGE_SELECTOR: For listing creation, user enters a single value (e.g., year, mileage)
      // The predefined options are ONLY used in filters (min/max dropdowns), not for data entry
      // Here we render a simple number input
      return (
        <Input
          type="text"
          {...commonProps}
          onChange={(e) => onChange(e.target.value)}
          pattern="[0-9]*"
          placeholder={`أدخل ${attribute.name}`}
        />
      );

    case AttributeType.DATE_RANGE:
      // DATE_RANGE: For listing creation, user enters a single date
      // The "range" aspect is only used in filters (from/to dates)
      return (
        <Input
          type="date"
          {...commonProps}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    default:
      console.warn(`Unknown attribute type: ${attribute.type}`);
      return null;
  }
};
