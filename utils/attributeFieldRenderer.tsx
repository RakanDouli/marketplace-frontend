'use client';

import { Input } from '@/components/slices/Input/Input';
import type { Attribute } from '@/stores/createListingStore/types';
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
    if (!suggestedValues || suggestedValues.length !== 1) return false;
    return String(value).toLowerCase() === String(suggestedValues[0]).toLowerCase();
  };

  /**
   * Check if we have multiple suggestions to show as chips
   */
  const hasMultipleSuggestions = (): boolean => {
    if (!suggestedValues || suggestedValues.length <= 1) return false;
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
    if (!suggestedValues || suggestedValues.length === 0) return [];

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

  switch (attribute.type) {
    case AttributeType.SELECTOR:
    case AttributeType.MULTI_SELECTOR:
      return renderDropdownWithChips();

    case AttributeType.RANGE:
      if (attribute.options && attribute.options.length > 0) {
        return renderDropdownWithChips();
      } else {
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
