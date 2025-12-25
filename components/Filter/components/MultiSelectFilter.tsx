"use client";

import React, { useMemo } from "react";
import { Text } from "../../slices";
import styles from "../Filter.module.scss";

export interface MultiSelectOption {
  key: string;
  value: string;
  count?: number;
}

export interface MultiSelectFilterProps {
  /** Attribute key for the filter */
  attributeKey: string;
  /** Display label for the filter */
  label: string;
  /** Available options */
  options: MultiSelectOption[];
  /** Currently selected values */
  selected: string[];
  /** Callback when selection changes */
  onChange: (selected: string[]) => void;
  /** Maximum number of selections allowed */
  maxSelections?: number;
  /** Whether to show counts in options */
  showCounts?: boolean;
}

// Threshold for "long list" - hide zeros if more than this
const LONG_LIST_THRESHOLD = 10;

export const MultiSelectFilter: React.FC<MultiSelectFilterProps> = ({
  attributeKey,
  label,
  options,
  selected,
  onChange,
  maxSelections,
  showCounts = true,
}) => {
  const selectedArray = Array.isArray(selected) ? selected : [];

  // Process options: for long lists, hide zeros; for short lists, keep all but dim zeros
  const processedOptions = useMemo(() => {
    const isLongList = options.length > LONG_LIST_THRESHOLD;

    if (isLongList) {
      // Long list: hide zeros, sort by count descending
      return options
        .filter(opt => opt.count === undefined || opt.count > 0)
        .sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
    }

    // Short list: keep all, no sorting (preserve original order)
    return options;
  }, [options]);

  const isSelected = (key: string) => selectedArray.includes(key);

  const isDisabled = (key: string) => {
    if (!maxSelections) return false;
    return !isSelected(key) && selectedArray.length >= maxSelections;
  };

  const isEmpty = (count?: number) => count === 0;

  const handleChange = (key: string, checked: boolean) => {
    let newSelected: string[];
    if (checked) {
      newSelected = [...selectedArray, key];
    } else {
      newSelected = selectedArray.filter((k) => k !== key);
    }
    onChange(newSelected.length > 0 ? newSelected : []);
  };

  const getSelectionCounterText = () => {
    if (!maxSelections) return null;
    return `${selectedArray.length} / ${maxSelections}`;
  };

  return (
    <div className={styles.filterSection}>
      <Text variant="small" className={styles.sectionTitle}>
        {label}
      </Text>
      <div className={styles.checkboxGroup}>
        {maxSelections && (
          <div className={styles.selectionCounter}>
            <Text variant="xs">{getSelectionCounterText()}</Text>
          </div>
        )}

        {processedOptions.map((option) => {
          const optionSelected = isSelected(option.key);
          const optionDisabled = isDisabled(option.key);
          const optionEmpty = isEmpty(option.count);

          return (
            <label
              key={option.key}
              className={`${styles.checkboxOption} ${optionDisabled ? styles.disabled : ""} ${optionEmpty ? styles.empty : ""}`}
            >
              <input
                type="checkbox"
                checked={optionSelected}
                disabled={optionDisabled}
                onChange={(e) => {
                  if (optionDisabled) return;
                  handleChange(option.key, e.target.checked);
                }}
              />
              <span className={styles.checkboxLabel}>
                {option.value}
                {showCounts && option.count !== undefined && (
                  <span className={styles.optionCount}>({option.count})</span>
                )}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default MultiSelectFilter;
