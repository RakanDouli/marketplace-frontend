"use client";

import React, { useMemo, useState } from "react";
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
// Maximum options to show before "show more"
const INITIAL_VISIBLE_OPTIONS = 4;

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
  const [showAll, setShowAll] = useState(false);

  // Process options: for long lists, hide zeros; for short lists, keep all but dim zeros
  const processedOptions = useMemo(() => {
    const isLongList = options.length > LONG_LIST_THRESHOLD;

    if (isLongList) {
      // Long list: hide zeros (no sorting - preserve original order)
      return options.filter(opt => opt.count === undefined || opt.count > 0);
    }

    // Short list: keep all, no sorting (preserve original order)
    return options;
  }, [options]);

  // Get visible options based on showAll state
  const visibleOptions = useMemo(() => {
    if (showAll || processedOptions.length <= INITIAL_VISIBLE_OPTIONS) {
      return processedOptions;
    }
    return processedOptions.slice(0, INITIAL_VISIBLE_OPTIONS);
  }, [processedOptions, showAll]);

  const hasMoreOptions = processedOptions.length > INITIAL_VISIBLE_OPTIONS;

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
    <div className={styles.filterField}>
      <Text variant="small" className={styles.fieldLabel}>
        {label}
      </Text>
      <div className={styles.checkboxGroup}>
        {maxSelections && (
          <div className={styles.selectionCounter}>
            <Text variant="xs">{getSelectionCounterText()}</Text>
          </div>
        )}

        {visibleOptions.map((option) => {
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
                <span className={styles.optionValue}>{option.value}</span>
                {showCounts && option.count !== undefined && (
                  <span className={styles.optionCount}>({option.count})</span>
                )}
              </span>
            </label>
          );
        })}

        {/* Show more/less button */}
        {hasMoreOptions && (
          <button
            type="button"
            className={styles.showMoreButton}
            onClick={() => setShowAll(!showAll)}
          >
            {showAll
              ? "عرض أقل"
              : `عرض المزيد (${processedOptions.length - INITIAL_VISIBLE_OPTIONS})`}
          </button>
        )}
      </div>
    </div>
  );
};

export default MultiSelectFilter;
