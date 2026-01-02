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
}

// Threshold for "long list" - hide zeros if more than this
const LONG_LIST_THRESHOLD = 10;

export const SelectFilter: React.FC<SelectFilterProps> = ({
  label,
  options,
  value,
  onChange,
  showCounts = true,
}) => {
  const { t } = useTranslation();

  // Process options: for long lists, hide zeros and sort by count
  const processedOptions = useMemo(() => {
    const isLongList = options.length > LONG_LIST_THRESHOLD;

    if (isLongList) {
      // Long list: hide zeros, sort by count descending
      return options
        .filter(opt => opt.count === undefined || opt.count > 0)
        .sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
    }

    // Short list: keep all (can't dim in native select, but counts show)
    return options;
  }, [options]);

  return (
    <div className={styles.filterField}>
      <Text variant="small" className={styles.fieldLabel}>
        {label}
      </Text>
      <Input
        type="select"
        value={value}
        onChange={(e) => onChange(e.target.value || undefined)}
        options={[
          { value: "", label: t("search.selectOption") },
          ...processedOptions.map((option) => ({
            value: option.key,
            label: showCounts && option.count !== undefined
              ? `${option.value} (${option.count})`
              : option.value,
          })),
        ]}
      />
    </div>
  );
};

export default SelectFilter;
