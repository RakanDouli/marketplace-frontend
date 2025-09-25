"use client";

import { useTranslation } from "../../../hooks/useTranslation";
import { Input } from "../Input/Input";
import styles from "./SortControls.module.scss";

export type SortOption =
  | "createdAt_desc"
  | "createdAt_asc"
  | "priceMinor_asc"
  | "priceMinor_desc";

export interface SortControlsProps {
  currentSort: SortOption | "";
  onSortChange: (sort: SortOption) => void;
}

export function SortControls({ currentSort, onSortChange }: SortControlsProps) {
  const { t } = useTranslation();

  const sortOptions: Array<{ value: SortOption | ""; label: string; disabled?: boolean }> = [
    { value: "createdAt_desc", label: t("search.sortByNewest") },
    { value: "createdAt_asc", label: t("search.sortByOldest") },
    { value: "priceMinor_asc", label: t("search.sortByPriceLow") },
    { value: "priceMinor_desc", label: t("search.sortByPriceHigh") },
  ];

  return (
    <div className={styles.sortControls}>
      <Input
        type="select"
        id="sort-select"
        value={currentSort}
        onChange={(e) => {
          const value = e.target.value;
          if (value !== "") {
            onSortChange(value as SortOption);
          }
        }}
        options={sortOptions}
        placeholder={t("search.sortBy")}
      />
    </div>
  );
}
