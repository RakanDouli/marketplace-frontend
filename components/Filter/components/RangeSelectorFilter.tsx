"use client";

import React, { useState, useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { Input } from "../../slices/Input/Input";
import { Button, Text } from "../../slices";
import { useTranslation } from "../../../hooks";
import styles from "../Filter.module.scss";

export interface RangeSelectorOption {
  key: string;
  value: string;
  count?: number;
}

export interface RangeSelectorFilterProps {
  /** Attribute key for the filter */
  attributeKey: string;
  /** Display label for the filter */
  label: string;
  /** Available options for selection */
  options: RangeSelectorOption[];
  /** Currently selected min value */
  minValue: string;
  /** Currently selected max value */
  maxValue: string;
  /** Callback when min value changes */
  onMinChange: (value: string | undefined) => void;
  /** Callback when max value changes */
  onMaxChange: (value: string | undefined) => void;
  /** Callback when reset is triggered (clears both at once) */
  onReset?: () => void;
  /** Total result count for this filter */
  resultCount?: number;
}

export const RangeSelectorFilter: React.FC<RangeSelectorFilterProps> = ({
  label,
  options,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  onReset,
  resultCount,
}) => {
  const { t } = useTranslation();

  const hasSelection = minValue || maxValue;

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Use onReset if provided (clears both at once + fetches once)
    if (onReset) {
      onReset();
    } else {
      // Fallback: clear both values separately
      onMinChange(undefined);
      onMaxChange(undefined);
    }
  };

  // Get options for min selector - filter out values greater than maxValue if set
  const minOptions = [
    { value: "", label: t("search.min") },
    ...options
      .filter((option) => {
        if (!maxValue) return true;
        // Compare as numbers if possible, otherwise as strings
        const optionNum = parseFloat(option.key);
        const maxNum = parseFloat(maxValue);
        if (!isNaN(optionNum) && !isNaN(maxNum)) {
          return optionNum <= maxNum;
        }
        return option.key <= maxValue;
      })
      .map((option) => ({
        value: option.key,
        label: option.value,
      })),
  ];

  // Get options for max selector - filter out values less than minValue if set
  const maxOptions = [
    { value: "", label: t("search.max") },
    ...options
      .filter((option) => {
        if (!minValue) return true;
        // Compare as numbers if possible, otherwise as strings
        const optionNum = parseFloat(option.key);
        const minNum = parseFloat(minValue);
        if (!isNaN(optionNum) && !isNaN(minNum)) {
          return optionNum >= minNum;
        }
        return option.key >= minValue;
      })
      .map((option) => ({
        value: option.key,
        label: option.value,
      })),
  ];

  return (
    <div className={styles.filterField}>
      <Text variant="small" className={styles.fieldLabel}>
        {label}
      </Text>
      {/* Result count and reset button row */}
      {hasSelection && (
        <div className={styles.rangeResultRow}>
          {resultCount !== undefined && (
            <Text variant="small" color="secondary">
              {resultCount} {t("search.results")}
            </Text>
          )}
          <button
            type="button"
            className={styles.resetButtonInline}
            onClick={handleReset}
            aria-label="إعادة تعيين"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      )}

      <div className={styles.rangeSelectorInputs}>
        <Input
          type="select"
          value={minValue || ""}
          onChange={(e) => {
            onMinChange(e.target.value || undefined);
          }}
          options={minOptions}
          size="sm"
        />
        <Input
          type="select"
          value={maxValue || ""}
          onChange={(e) => {
            onMaxChange(e.target.value || undefined);
          }}
          options={maxOptions}
          size="sm"
        />
      </div>
    </div>
  );
};

export default RangeSelectorFilter;
