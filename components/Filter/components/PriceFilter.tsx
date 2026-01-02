"use client";

import React, { useMemo, useEffect, useRef } from "react";
import { RotateCcw } from "lucide-react";
import { Input } from "../../slices/Input/Input";
import { Text } from "../../slices";
import { useTranslation } from "../../../hooks";
import { useCurrencyStore, CURRENCY_SYMBOLS } from "../../../stores/currencyStore";
import styles from "../Filter.module.scss";

export interface PriceFilterProps {
  /** Display label for the filter */
  label: string;
  /** Min price value (in user's preferred currency) */
  minValue: string;
  /** Max price value (in user's preferred currency) */
  maxValue: string;
  /** Category key to determine price ranges */
  categoryKey?: string;
  /** Callback when min value changes (sends value in user's currency) */
  onMinChange: (value: string | undefined) => void;
  /** Callback when max value changes (sends value in user's currency) */
  onMaxChange: (value: string | undefined) => void;
  /** Callback when currency changes */
  onCurrencyChange?: (currency: string) => void;
  /** Total result count for this filter */
  resultCount?: number;
  /** Callback when apply is triggered */
  onApply?: () => void;
}

/**
 * Generate price options based on category type
 * Returns array of USD values
 */
function generatePriceOptions(categoryKey?: string): number[] {
  const options: number[] = [];

  // Determine category type
  const isVehicle = categoryKey?.includes("car") || categoryKey?.includes("vehicle") || categoryKey?.includes("سيار");
  const isRealEstate = categoryKey?.includes("real") || categoryKey?.includes("estate") || categoryKey?.includes("عقار") || categoryKey?.includes("property");

  if (isVehicle) {
    // CARS: Max 300,000
    // 1000 to 20000 by 1000s
    for (let i = 1000; i <= 20000; i += 1000) {
      options.push(i);
    }
    // 25000 to 100000 by 5000s
    for (let i = 25000; i <= 100000; i += 5000) {
      options.push(i);
    }
    // 120000 to 200000 by 20000s
    for (let i = 120000; i <= 200000; i += 20000) {
      options.push(i);
    }
    // 250000 to 300000 by 50000s
    for (let i = 250000; i <= 300000; i += 50000) {
      options.push(i);
    }
  } else if (isRealEstate) {
    // REAL ESTATE: Max 1,000,000
    // 5000 to 50000 by 5000s
    for (let i = 5000; i <= 50000; i += 5000) {
      options.push(i);
    }
    // 60000 to 200000 by 10000s
    for (let i = 60000; i <= 200000; i += 10000) {
      options.push(i);
    }
    // 250000 to 500000 by 50000s
    for (let i = 250000; i <= 500000; i += 50000) {
      options.push(i);
    }
    // 600000 to 1000000 by 100000s
    for (let i = 600000; i <= 1000000; i += 100000) {
      options.push(i);
    }
  } else {
    // OTHERS (electronics, furniture, etc.): Lower values
    // 100 to 1000 by 100s
    for (let i = 100; i <= 1000; i += 100) {
      options.push(i);
    }
    // 1500 to 5000 by 500s
    for (let i = 1500; i <= 5000; i += 500) {
      options.push(i);
    }
    // 6000 to 10000 by 1000s
    for (let i = 6000; i <= 10000; i += 1000) {
      options.push(i);
    }
    // 15000 to 50000 by 5000s (for expensive items)
    for (let i = 15000; i <= 50000; i += 5000) {
      options.push(i);
    }
  }

  return options;
}

export const PriceFilter: React.FC<PriceFilterProps> = ({
  label,
  minValue,
  maxValue,
  categoryKey,
  onMinChange,
  onMaxChange,
  onCurrencyChange,
  resultCount,
  onApply,
}) => {
  const { t } = useTranslation();
  const { preferredCurrency, getRate } = useCurrencyStore();

  const hasSelection = minValue || maxValue;
  const isFirstRender = useRef(true);

  // Get exchange rate from USD to preferred currency
  const rate = getRate("USD", preferredCurrency);
  const currencySymbol = CURRENCY_SYMBOLS[preferredCurrency];

  // Generate price options based on category and currency
  const priceOptions = useMemo(() => {
    const baseOptions = generatePriceOptions(categoryKey);

    // Calculate zero multiplier based on rate magnitude
    // If rate > 2, find the nearest power of 10 (e.g., rate=10234 → multiplier=10000)
    let zeroMultiplier = 1;
    if (rate > 2) {
      const magnitude = Math.floor(Math.log10(rate));
      zeroMultiplier = Math.pow(10, magnitude);
    }

    return baseOptions.map((usdValue) => {
      const displayValue = usdValue * zeroMultiplier;
      // Format with thousand separators
      const formattedValue = displayValue.toLocaleString("en-US");

      return {
        key: String(displayValue), // Store display value in user's currency
        value: `${formattedValue} ${currencySymbol}`,
      };
    });
  }, [categoryKey, rate, currencySymbol]);

  // Re-apply filter when currency changes (if there's an active selection)
  useEffect(() => {
    // Skip first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // If user has price selected and currency changes, refresh results
    if (hasSelection && onApply) {
      onApply();
    }
  }, [preferredCurrency]); // Only trigger on currency change

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMinChange(undefined);
    onMaxChange(undefined);
    if (onApply) {
      onApply();
    }
  };

  // Get options for min selector - filter out values greater than maxValue if set
  const minOptions = [
    { value: "", label: t("search.min") },
    ...priceOptions
      .filter((option) => {
        if (!maxValue) return true;
        return parseFloat(option.key) <= parseFloat(maxValue);
      })
      .map((option) => ({
        value: option.key,
        label: option.value,
      })),
  ];

  // Get options for max selector - filter out values less than minValue if set
  const maxOptions = [
    { value: "", label: t("search.max") },
    ...priceOptions
      .filter((option) => {
        if (!minValue) return true;
        return parseFloat(option.key) >= parseFloat(minValue);
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
            // Send currency along with price value
            if (onCurrencyChange) onCurrencyChange(preferredCurrency);
            if (onApply) onApply();
          }}
          options={minOptions}
          size="sm"
        />
        <Input
          type="select"
          value={maxValue || ""}
          onChange={(e) => {
            onMaxChange(e.target.value || undefined);
            // Send currency along with price value
            if (onCurrencyChange) onCurrencyChange(preferredCurrency);
            if (onApply) onApply();
          }}
          options={maxOptions}
          size="sm"
        />
      </div>
    </div>
  );
};

export default PriceFilter;
