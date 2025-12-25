"use client";

import React from "react";
import { Input } from "../../slices/Input/Input";
import { Button, Text } from "../../slices";
import { useTranslation } from "../../../hooks";
import styles from "../Filter.module.scss";

export interface SearchFilterProps {
  /** Attribute key for the filter */
  attributeKey: string;
  /** Display label for the filter */
  label: string;
  /** Current search value */
  value: string;
  /** Callback when value changes */
  onChange: (value: string) => void;
  /** Callback when apply button is clicked */
  onApply: () => void;
  /** Whether the apply button should be disabled */
  applyDisabled?: boolean;
  /** Whether the filter is loading */
  isLoading?: boolean;
  /** Placeholder text */
  placeholder?: string;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({
  attributeKey,
  label,
  value,
  onChange,
  onApply,
  applyDisabled = false,
  isLoading = false,
  placeholder,
}) => {
  const { t } = useTranslation();

  return (
    <div className={styles.filterSection}>
      <Text variant="small" className={styles.sectionTitle}>
        {label}
      </Text>
      <div className={styles.rangeInputs}>
        <Input
          type="text"
          placeholder={placeholder || label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
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

export default SearchFilter;
