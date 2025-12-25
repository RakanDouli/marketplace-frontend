"use client";

import React from "react";
import { Input } from "../../slices/Input/Input";
import { Button, Text } from "../../slices";
import { useTranslation } from "../../../hooks";
import styles from "../Filter.module.scss";

export interface RangeFilterProps {
  /** Attribute key for the range filter */
  attributeKey: string;
  /** Display label for the filter */
  label: string;
  /** Min value */
  minValue: string;
  /** Max value */
  maxValue: string;
  /** Callback when min value changes */
  onMinChange: (value: string) => void;
  /** Callback when max value changes */
  onMaxChange: (value: string) => void;
  /** Callback when apply button is clicked */
  onApply: () => void;
  /** Whether the apply button should be disabled */
  applyDisabled?: boolean;
  /** Whether the filter is loading */
  isLoading?: boolean;
  /** Optional placeholder prefix */
  placeholderPrefix?: string;
}

export const RangeFilter: React.FC<RangeFilterProps> = ({
  attributeKey,
  label,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  onApply,
  applyDisabled = false,
  isLoading = false,
  placeholderPrefix,
}) => {
  const { t } = useTranslation();

  const minPlaceholder = placeholderPrefix
    ? `${t("search.min")} ${placeholderPrefix}`
    : `${t("search.min")} ${label}`;

  const maxPlaceholder = placeholderPrefix
    ? `${t("search.max")} ${placeholderPrefix}`
    : `${t("search.max")} ${label}`;

  return (
    <div className={styles.filterSection}>
      <Text variant="small" className={styles.sectionTitle}>
        {label}
      </Text>
      <div className={styles.rangeInputs}>
        <div className={styles.rangeInputFields}>
          <Input
            type="number"
            placeholder={minPlaceholder}
            value={minValue}
            onChange={(e) => onMinChange(e.target.value)}
            size="sm"
          />
          <Input
            type="number"
            placeholder={maxPlaceholder}
            value={maxValue}
            onChange={(e) => onMaxChange(e.target.value)}
            size="sm"
          />
        </div>
        <Button
          variant="primary"
          size="sm"
          loading={isLoading}
          disabled={applyDisabled}
          onClick={onApply}
          className={styles.applyButton}
        >
          {t("common.apply")}
        </Button>
      </div>
    </div>
  );
};

export default RangeFilter;
