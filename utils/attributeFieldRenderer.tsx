'use client';

import { Input } from '@/components/slices/Input/Input';
import type { Attribute, AttributeConfig } from '@/stores/createListingStore/types';
import { AttributeType } from '@/common/enums';
import styles from './attributeFieldRenderer.module.scss';

interface AttributeFieldProps {
  attribute: Attribute;
  value: any;
  onChange: (value: any) => void;
  onBlur?: () => void;
  error?: string;
  /**
   * Suggested values from model_suggestions specs.
   * - If 1 value: Auto-selected, shows "تم التعبئة تلقائياً ✓" badge next to label
   * - If multiple values: Shows clickable chips next to label for quick selection
   * - All options remain visible in dropdown
   */
  suggestedValues?: (string | number)[];
}

/**
 * Get config value with fallback
 */
const getConfig = (attribute: Attribute): AttributeConfig => {
  return attribute.config || {};
};

/**
 * Render attribute field with optional suggestion chips
 */
export const renderAttributeField = ({
  attribute,
  value,
  onChange,
  onBlur,
  error,
  suggestedValues,
}: AttributeFieldProps): JSX.Element | null => {
  /**
   * Check if field was auto-filled (exactly 1 suggestion and value matches it)
   */
  const isAutoFilled = (): boolean => {
    if (!suggestedValues || !Array.isArray(suggestedValues) || suggestedValues.length !== 1) return false;
    return String(value).toLowerCase() === String(suggestedValues[0]).toLowerCase();
  };

  /**
   * Check if we have multiple suggestions to show as chips
   */
  const hasMultipleSuggestions = (): boolean => {
    if (!suggestedValues || !Array.isArray(suggestedValues) || suggestedValues.length <= 1) return false;
    // Also check that suggestions match actual options
    const suggestedSet = new Set(suggestedValues.map(v => String(v).toLowerCase()));
    const matchingOptions = attribute.options.filter(opt =>
      suggestedSet.has(String(opt.key).toLowerCase())
    );
    return matchingOptions.length > 1;
  };

  const commonProps = {
    label: attribute.name,
    value: value ?? '',
    error: error,
    onBlur: onBlur,
    helpText: undefined,
    required: attribute.validation === 'REQUIRED',
  };

  /**
   * Get all active options sorted by order.
   */
  const getAllOptions = () => {
    return attribute.options
      .filter(opt => opt.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  };

  /**
   * Get suggested options with their labels (for clickable chips)
   */
  const getSuggestedOptions = (): Array<{ key: string; label: string }> => {
    if (!suggestedValues || !Array.isArray(suggestedValues) || suggestedValues.length === 0) return [];

    const suggestedSet = new Set(suggestedValues.map(v => String(v).toLowerCase()));
    return attribute.options
      .filter(opt => suggestedSet.has(String(opt.key).toLowerCase()))
      .map(opt => ({ key: opt.key, label: opt.value }));
  };

  /**
   * Build custom label with chips or auto-fill badge
   */
  const buildLabelWithChips = (): React.ReactNode => {
    const suggestedOptions = getSuggestedOptions();
    const showChips = hasMultipleSuggestions();
    const autoFilled = isAutoFilled();

    return (
      <>
        <span>
          {attribute.name}
          {attribute.validation === 'REQUIRED' && <span className={styles.required}>*</span>}
        </span>

        {/* Show auto-fill badge OR suggestion chips */}
        {autoFilled ? (
          <span className={styles.autoFillBadge}>تم التعبئة تلقائياً ✓</span>
        ) : showChips ? (
          <span className={styles.chipsContainer}>
            {suggestedOptions.map((opt) => (
              <button
                key={opt.key}
                type="button"
                className={`${styles.suggestionChip} ${value === opt.key ? styles.selected : ''}`}
                onClick={() => onChange(opt.key)}
              >
                {opt.label}
              </button>
            ))}
          </span>
        ) : null}
      </>
    );
  };

  /**
   * Render dropdown with custom label containing chips
   */
  const renderDropdownWithChips = () => {
    const hasSuggestions = isAutoFilled() || hasMultipleSuggestions();

    return (
      <Input
        type="select"
        options={[
          { value: '', label: `-- اختر ${attribute.name} --` },
          ...getAllOptions().map(opt => ({
            value: opt.key,
            label: opt.value,
          }))
        ]}
        // Use custom ReactNode label if we have suggestions, otherwise use string label
        label={hasSuggestions ? buildLabelWithChips() : attribute.name}
        value={value ?? ''}
        error={error}
        onBlur={onBlur}
        required={attribute.validation === 'REQUIRED'}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  };

  /**
   * Render multi-select using react-select Input component
   * Used for MULTI_SELECTOR type (features, etc.)
   * Uses type="multiselect" which renders react-select with isMulti={true}
   * Returns array of selected option keys
   */
  const renderMultiSelect = () => {
    const allOptions = getAllOptions();
    const selectedValues: string[] = Array.isArray(value) ? value : [];

    // Build label with multi-select hint
    const labelWithHint = (
      <>
        {attribute.name}
        <span className={styles.multiSelectHint}>يمكن اختيار أكثر من خيار</span>
      </>
    );

    return (
      <Input
        type="multiselect"
        label={labelWithHint}
        options={allOptions.map(opt => ({
          value: opt.key,
          label: opt.value,
        }))}
        value={selectedValues}
        onChange={(e: any) => {
          // e.target.value is an array of selected keys from Input multiselect
          const selectedKeys = e.target?.value || [];
          onChange(selectedKeys);
        }}
        error={error}
        onBlur={onBlur}
        required={attribute.validation === 'REQUIRED'}
      />
    );
  };

  const config = getConfig(attribute);

  switch (attribute.type) {
    case AttributeType.SELECTOR:
      // Single-select dropdown
      return renderDropdownWithChips();

    case AttributeType.MULTI_SELECTOR:
      // Multi-select dropdown (returns array of selected keys)
      // Uses react-select with isMulti={true}
      return renderMultiSelect();

    case AttributeType.RANGE:
      // RANGE type = always input field (not dropdown)
      // Dropdowns with ranges are only for filters, not for form input
      // Config determines input behavior:
      // - dateFormat: 'year' → number input (4-digit year)
      // - expectedValue: 'number' → number input
      // - maxLength → text input with character limit
      // - min/max → number validation from config

      if (config.expectedValue === 'number' || config.dateFormat === 'year') {
        // Number input: year, mileage, engine_size, etc.
        return (
          <Input
            type="number"
            {...commonProps}
            min={config.min}
            max={config.max}
            onChange={(e) => onChange(e.target.value ? parseInt(e.target.value, 10) : '')}
            placeholder={`أدخل ${attribute.name}`}
          />
        );
      } else {
        // Text input with maxLength
        return (
          <Input
            type="text"
            {...commonProps}
            maxLength={config.maxLength}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`أدخل ${attribute.name}`}
          />
        );
      }

    case AttributeType.TEXT:
      return (
        <Input
          type="text"
          {...commonProps}
          maxLength={config.maxLength}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case AttributeType.TEXTAREA:
      return (
        <Input
          type="textarea"
          rows={3}
          {...commonProps}
          maxLength={config.maxLength}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case AttributeType.NUMBER:
      return (
        <Input
          type="number"
          {...commonProps}
          maxLength={config.maxLength}
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
      // RANGE_SELECTOR = input field in form, range filter in search
      // Config determines input behavior:
      // - dateFormat: 'year' → number input (4-digit year)
      // - expectedValue: 'number' → number input with min/max validation
      // - maxLength → text input with character limit
      // - min/max → number validation from config

      if (config.expectedValue === 'number' || config.dateFormat === 'year') {
        // Number input: year, mileage, etc.
        return (
          <Input
            type="number"
            {...commonProps}
            min={config.min}
            max={config.max}
            onChange={(e) => onChange(e.target.value ? parseInt(e.target.value, 10) : '')}
            placeholder={`أدخل ${attribute.name}`}
          />
        );
      } else {
        // Text input with maxLength (fallback)
        return (
          <Input
            type="text"
            {...commonProps}
            maxLength={config.maxLength}
            onChange={(e) => onChange(e.target.value)}
            pattern="[0-9]*"
            placeholder={`أدخل ${attribute.name}`}
          />
        );
      }

    case AttributeType.DATE_RANGE:
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
