"use client";

import React, { useMemo } from "react";
import { Input } from "../../slices/Input/Input";
import { Text } from "../../slices";
import { useTranslation } from "../../../hooks";
import styles from "../Filter.module.scss";

export interface SelectOption {
  key: string;
  value: string;
  count?: number;
  /** Group key for optgroup display (e.g., modelId for variants) */
  groupKey?: string;
  /** Group label for optgroup display (e.g., modelName for variants) */
  groupLabel?: string;
  /** For models: true if this model has variants (renders as non-clickable header) */
  hasVariants?: boolean;
}

export interface SelectFilterProps {
  /** Attribute key for the filter */
  attributeKey: string;
  /** Display label for the filter */
  label: string;
  /** Available options */
  options: SelectOption[];
  /** Currently selected value */
  value: string;
  /** Callback when selection changes */
  onChange: (value: string | undefined) => void;
  /** Whether to show counts in options */
  showCounts?: boolean;
  /** Hide the label (when wrapped in Collapsible) */
  hideLabel?: boolean;
}

// Threshold for "long list" - hide zeros if more than this
const LONG_LIST_THRESHOLD = 10;

export const SelectFilter: React.FC<SelectFilterProps> = ({
  attributeKey,
  label,
  options,
  value,
  onChange,
  showCounts = true,
  hideLabel = false,
}) => {
  const { t } = useTranslation();

  // Check if options have groups (for variants grouped by model)
  const hasGroups = useMemo(() => {
    return options.some(opt => opt.groupKey && opt.groupLabel);
  }, [options]);

  // Check if this is a model selector with hasVariants options
  const hasModelVariants = useMemo(() => {
    return attributeKey === "modelId" && options.some(opt => opt.hasVariants === true);
  }, [attributeKey, options]);

  // Process options: for long lists, hide zeros and sort by count
  const processedOptions = useMemo(() => {
    const isLongList = options.length > LONG_LIST_THRESHOLD;

    let filtered = options;
    if (isLongList) {
      // Long list: hide zeros
      filtered = options.filter(opt => opt.count === undefined || opt.count > 0);
    }

    // If grouped, sort by group then by count within group
    if (hasGroups) {
      return filtered.sort((a, b) => {
        // First sort by group label
        const groupCompare = (a.groupLabel || '').localeCompare(b.groupLabel || '');
        if (groupCompare !== 0) return groupCompare;
        // Then by count descending within group
        return (b.count ?? 0) - (a.count ?? 0);
      });
    }

    // Non-grouped: sort by count descending
    if (isLongList) {
      return filtered.sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
    }

    return filtered;
  }, [options, hasGroups]);

  // Group options by groupKey for optgroup rendering
  const groupedOptions = useMemo(() => {
    if (!hasGroups) return null;

    const groups: Record<string, { label: string; options: SelectOption[] }> = {};

    processedOptions.forEach(opt => {
      const groupKey = opt.groupKey || '__ungrouped__';
      const groupLabel = opt.groupLabel || t("common.other");

      if (!groups[groupKey]) {
        groups[groupKey] = { label: groupLabel, options: [] };
      }
      groups[groupKey].options.push(opt);
    });

    return Object.values(groups);
  }, [processedOptions, hasGroups, t]);

  // Format option label with count
  const formatLabel = (opt: SelectOption) => {
    return showCounts && opt.count !== undefined
      ? `${opt.value} (${opt.count})`
      : opt.value;
  };

  // Render grouped select with native optgroup
  if (hasGroups && groupedOptions) {
    return (
      <div className={styles.filterField}>
        {!hideLabel && (
          <Text variant="small" className={styles.fieldLabel}>
            {label}
          </Text>
        )}
        <select
          className={styles.nativeSelect}
          value={value}
          onChange={(e) => onChange(e.target.value || undefined)}
        >
          <option value="">{t("search.selectOption")}</option>
          {groupedOptions.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.options.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {formatLabel(opt)}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
    );
  }

  // Render model select with hasVariants headers (non-clickable group headers)
  if (hasModelVariants) {
    return (
      <div className={styles.filterField}>
        {!hideLabel && (
          <Text variant="small" className={styles.fieldLabel}>
            {label}
          </Text>
        )}
        <select
          className={styles.nativeSelect}
          value={value}
          onChange={(e) => onChange(e.target.value || undefined)}
        >
          <option value="">{t("search.selectOption")}</option>
          {processedOptions.map((opt) => (
            opt.hasVariants ? (
              // Models with variants: non-clickable header style
              <option
                key={opt.key}
                value={opt.key}
                disabled
                className={styles.modelHeader}
              >
                {formatLabel(opt)}
              </option>
            ) : (
              // Models without variants: regular selectable option
              <option key={opt.key} value={opt.key}>
                {formatLabel(opt)}
              </option>
            )
          ))}
        </select>
      </div>
    );
  }

  // Render regular select (no groups)
  return (
    <div className={styles.filterField}>
      {!hideLabel && (
        <Text variant="small" className={styles.fieldLabel}>
          {label}
        </Text>
      )}
      <Input
        type="select"
        value={value}
        onChange={(e) => onChange(e.target.value || undefined)}
        options={[
          { value: "", label: t("search.selectOption") },
          ...processedOptions.map((option) => ({
            value: option.key,
            label: formatLabel(option),
          })),
        ]}
      />
    </div>
  );
};

export default SelectFilter;
