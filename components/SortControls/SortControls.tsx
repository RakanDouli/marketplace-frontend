"use client";

import { useTranslation } from "../../hooks/useTranslation";
import styles from "./SortControls.module.scss";

export type SortOption =
  | "createdAt_desc"
  | "createdAt_asc"
  | "priceMinor_asc"
  | "priceMinor_desc";

export interface SortControlsProps {
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export function SortControls({ currentSort, onSortChange }: SortControlsProps) {
  const { t } = useTranslation();

  const sortOptions: Array<{ value: SortOption; label: string }> = [
    { value: "createdAt_desc", label: t("search.sortByNewest") },
    { value: "createdAt_asc", label: t("search.sortByOldest") },
    { value: "priceMinor_asc", label: t("search.sortByPriceLow") },
    { value: "priceMinor_desc", label: t("search.sortByPriceHigh") },
  ];

  return (
    <div className={styles.sortControls}>
      <label htmlFor="sort-select" className={styles.label}>
        {t("search.sortBy")}
      </label>
      <select
        id="sort-select"
        value={currentSort}
        onChange={(e) => onSortChange(e.target.value as SortOption)}
        className={styles.select}
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
