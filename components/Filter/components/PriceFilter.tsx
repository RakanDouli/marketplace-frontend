"use client";

import React from "react";
import { Input } from "../../slices/Input/Input";
import { Button, Text } from "../../slices";
import { useTranslation } from "../../../hooks";
import { CURRENCY_LABELS } from "../../../utils/currency";
import styles from "../Filter.module.scss";

export interface PriceFilterProps {
  /** Display label for the filter */
  label: string;
  /** Min price value */
  minValue: string;
  /** Max price value */
  maxValue: string;
  /** Current currency */
  currency: string;
  /** Callback when min value changes */
  onMinChange: (value: string) => void;
  /** Callback when max value changes */
  onMaxChange: (value: string) => void;
  /** Callback when currency changes */
  onCurrencyChange: (currency: string) => void;
  /** Callback when apply button is clicked */
  onApply: () => void;
  /** Whether the apply button should be disabled */
  applyDisabled?: boolean;
  /** Whether the filter is loading */
  isLoading?: boolean;
}

export const PriceFilter: React.FC<PriceFilterProps> = ({
  label,
  minValue,
  maxValue,
  currency,
  onMinChange,
  onMaxChange,
  onCurrencyChange,
  onApply,
  applyDisabled = false,
  isLoading = false,
}) => {
  const { t } = useTranslation();

  return (
    <div className={styles.filterSection}>
      <Text variant="small" className={styles.sectionTitle}>
        {label}
      </Text>
      <div className={styles.rangeInputs}>
        <div className={styles.rangeInputFields}>
          <Input
            type="number"
            placeholder={t("search.minPrice")}
            value={minValue}
            onChange={(e) => onMinChange(e.target.value)}
            size="sm"
          />
          <Input
            type="number"
            placeholder={t("search.maxPrice")}
            value={maxValue}
            onChange={(e) => onMaxChange(e.target.value)}
            size="sm"
          />
        </div>
        <Input
          type="select"
          value={currency}
          onChange={(e) => onCurrencyChange(e.target.value)}
          size="sm"
          options={[
            { value: "USD", label: CURRENCY_LABELS.USD },
            { value: "SYP", label: CURRENCY_LABELS.SYP },
            { value: "EUR", label: CURRENCY_LABELS.EUR },
          ]}
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

export default PriceFilter;
