"use client";

import { useTranslation } from "../../hooks/useTranslation";
import { useSearchStore, useFiltersStore, useListingsStore } from "../../stores";
import { Button } from "../slices";
import { Text } from "../slices";
import styles from "./AppliedFilters.module.scss";

export function AppliedFilters() {
  const { t } = useTranslation();

  // Get filters and handlers from stores
  const { appliedFilters: filters, removeFilter, removeSpecFilter, clearAllFilters, getStoreFilters, getBackendFilters } = useSearchStore();
  const { attributes, updateFiltersWithCascading, currentCategorySlug } = useFiltersStore();
  const { fetchListingsByCategory, setPagination } = useListingsStore();

  // Handle filter removal with store coordination
  const handleRemoveFilter = async (filterKey: string) => {
    if (!currentCategorySlug) return;

    // Remove the specific filter using searchStore methods
    if (filterKey.startsWith("specs.")) {
      const specKey = filterKey.replace("specs.", "");
      removeSpecFilter(specKey);
    } else if (filterKey === "price") {
      // Special handling for price filter - remove all price-related filters
      removeFilter("priceMinMinor");
      removeFilter("priceMaxMinor");
      removeFilter("priceCurrency");
    } else {
      removeFilter(filterKey as any);
    }

    // Update cascading filters and refresh listings
    try {
      const backendFilters = { categoryId: currentCategorySlug, ...getBackendFilters() };
      await updateFiltersWithCascading(currentCategorySlug, backendFilters);

      const storeFilters = { categoryId: currentCategorySlug, ...getStoreFilters() };
      setPagination({ page: 1 });
      await fetchListingsByCategory(currentCategorySlug, storeFilters, "grid");
    } catch (error) {
      console.error("❌ Error removing filter:", error);
    }
  };

  // Handle clear all filters with store coordination
  const handleClearAllFilters = async () => {
    if (!currentCategorySlug) return;

    clearAllFilters();

    try {
      const backendFilters = { categoryId: currentCategorySlug, ...getBackendFilters() };
      await updateFiltersWithCascading(currentCategorySlug, backendFilters);

      const storeFilters = { categoryId: currentCategorySlug, ...getStoreFilters() };
      setPagination({ page: 1 });
      await fetchListingsByCategory(currentCategorySlug, storeFilters, "grid");
    } catch (error) {
      console.error("❌ Error clearing filters:", error);
    }
  };

  // console.log("🏷️ AppliedFilters: Using filters from searchStore", filters);

  // Helper function to get display name for attribute values
  const getAttributeDisplayName = (attributeKey: string, value: any) => {
    const attribute = attributes.find((attr) => attr.key === attributeKey);

    // Handle arrays
    if (Array.isArray(value)) {
      // For multi-select attributes, show as comma-separated values
      if (
        attribute &&
        (attribute.type === "MULTI_SELECTOR" ||
          attributeKey === "body_type" ||
          attributeKey === "engine_size")
      ) {
        const optionsToSearch =
          (attribute as any).processedOptions || attribute.options || [];
        const displayValues = value.map((val) => {
          const option = optionsToSearch.find((opt: any) => opt.key === val);
          return option ? option.value : val;
        });
        return displayValues.join(", ");
      }
      // For range filters - format as "min - max"
      else {
        return value.join(" - ");
      }
    }

    if (!attribute) {
      return value;
    }

    // Use processedOptions if available (for brandId/modelId), otherwise use options
    const optionsToSearch =
      (attribute as any).processedOptions || attribute.options || [];

    // For brandId/modelId, find the option with matching key and return its value (readable name)
    if (attributeKey === "brandId" || attributeKey === "modelId") {
      const option = optionsToSearch.find((opt: any) => opt.key === value);
      if (!option) {
        return value;
      }
      return option.value;
    }

    // For other attributes, check if there are options to match
    if (optionsToSearch && optionsToSearch.length > 0) {
      const option = optionsToSearch.find(
        (opt: any) => opt.key === value || opt.value === value
      );
      if (option) {
        return option.value;
      }
    }

    // Return the value as-is if no matching option found
    return value;
  };

  // Collect all active filters
  const activeFilters: Array<{ key: string; label: string; value: any }> = [];

  // Add spec filters
  if (filters.specs) {
    Object.entries(filters.specs).forEach(([specKey, specValue]) => {
      if (specValue != null && specValue !== "") {
        // Handle case where specValue is an object with 'selected' property
        let actualValue = specValue;
        if (typeof specValue === "object" && specValue.selected !== undefined) {
          actualValue = specValue.selected;
        }

        // Skip if the actual value is empty or null
        if (actualValue == null || actualValue === "") {
          return;
        }

        const attribute = attributes.find((attr) => attr.key === specKey);
        const displayName = getAttributeDisplayName(specKey, actualValue);
        activeFilters.push({
          key: `specs.${specKey}`,
          label: attribute?.name || specKey,
          value: displayName,
        });
      }
    });
  }

  // Add price filters - price is in dollars
  if (filters.priceMinMinor || filters.priceMaxMinor) {
    const currency = filters.priceCurrency || "USD";
    const min = filters.priceMinMinor
      ? filters.priceMinMinor.toLocaleString()
      : "";
    const max = filters.priceMaxMinor
      ? filters.priceMaxMinor.toLocaleString()
      : "";

    let priceLabel = "";
    if (min && max) {
      priceLabel = `${min} - ${max} ${currency}`;
    } else if (min) {
      priceLabel = `> ${min} ${currency}`;
    } else if (max) {
      priceLabel = `< ${max} ${currency}`;
    }

    if (priceLabel) {
      activeFilters.push({
        key: "price",
        label: t("search.price"),
        value: priceLabel,
      });
    }
  }

  // Add location filters (legacy support - these should be in specs.location now)
  if (filters.province) {
    activeFilters.push({
      key: "province",
      label: t("search.province"),
      value: filters.province,
    });
  }

  if (filters.city) {
    activeFilters.push({
      key: "city",
      label: t("search.city"),
      value: filters.city,
    });
  }

  // Add account type filter (using backend data)
  if (filters.accountType) {
    const accountTypeAttribute = attributes.find((attr) => attr.key === "accountType");
    const displayValue = getAttributeDisplayName("accountType", filters.accountType);

    activeFilters.push({
      key: "accountType",
      label: accountTypeAttribute?.name || "نوع الحساب",
      value: displayValue,
    });
  }

  // Add search filter
  if (filters.search) {
    activeFilters.push({
      key: "search",
      label: t("search.searchTerm"),
      value: filters.search,
    });
  }

  // Add sort filter (show if any sort is selected)
  if (filters.sort) {
    const sortLabels: Record<string, string> = {
      createdAt_asc: t("search.sortByOldest"),
      createdAt_desc: t("search.sortByNewest"),
      priceMinor_asc: t("search.sortByPriceLow"),
      priceMinor_desc: t("search.sortByPriceHigh"),
    };

    activeFilters.push({
      key: "sort",
      label: t("search.sortBy"),
      value: sortLabels[filters.sort] || filters.sort,
    });
  }

  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className={styles.appliedFilters}>
      <div className={styles.filtersList}>
        {activeFilters.map((filter) => (
          <div key={filter.key} className={styles.filterTag}>
            <Text variant="small" className={styles.filterValue}>
              {filter.value}
            </Text>
            <button
              onClick={() => handleRemoveFilter(filter.key)}
              className={styles.removeButton}
              aria-label={t("search.removeFilter")}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      {/* <div className={styles.header}> */}
      {activeFilters.length > 0 && (
        <span onClick={handleClearAllFilters} className={styles.clearAll}>
          {t("search.clearAllFilters")}
        </span>
      )}
      {/* </div> */}
    </div>
  );
}
