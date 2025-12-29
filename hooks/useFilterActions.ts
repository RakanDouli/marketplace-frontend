import { useSearchStore, useFiltersStore, useListingsStore } from "../stores";
import { convertToUSD, parsePrice, type Currency } from "../utils/currency";

/**
 * Custom hook for managing filter actions and applying filters to stores
 * Handles the coordination between different stores when filters change
 */
export const useFilterActions = (categorySlug: string | null) => {
  const {
    setFilter,
    setSpecFilter,
    clearAllFilters,
    getStoreFilters,
    getBackendFilters,
  } = useSearchStore();

  const { updateFiltersWithCascading } = useFiltersStore();
  const { fetchListingsByCategory, setPagination } = useListingsStore();

  // Common function to apply filters to stores after changes
  const applyFiltersToStores = async () => {
    if (!categorySlug) return;

    const backendFilters = {
      categoryId: categorySlug,
      ...getBackendFilters(),
    };
    await updateFiltersWithCascading(categorySlug, backendFilters);

    const storeFilters = { categoryId: categorySlug, ...getStoreFilters() };
    setPagination({ page: 1 });
    await fetchListingsByCategory(categorySlug, storeFilters, "grid");
  };

  // Handle spec/attribute change
  const handleSpecChange = async (attributeKey: string, value: any) => {
    if (!categorySlug) return;

    // All SELECTOR attributes go to specs
    // NOTE: Location will be extracted from specs and sent as top-level province in Filter.tsx submission
    setSpecFilter(attributeKey, value);

    // Apply filters with store coordination
    try {
      await applyFiltersToStores();
    } catch (error) {
      // Silently fail - filter may still apply on next render
    }
  };

  // Handle range filter apply (for numeric ranges like mileage, year, etc.)
  const handleApplyRangeFilter = async (
    attributeKey: string,
    localRangeInputs: Record<string, { min: string; max: string }>
  ) => {
    if (!categorySlug) return;

    try {
      // Apply the local range values to the store
      const local = localRangeInputs[attributeKey] || { min: "", max: "" };
      const minValue = local.min ? Number(local.min) : null;
      const maxValue = local.max ? Number(local.max) : null;
      const newValue = [minValue, maxValue].filter(
        (v) => v !== null
      ) as number[];

      if (newValue.length > 0) {
        setSpecFilter(attributeKey, newValue);
      } else {
        setSpecFilter(attributeKey, undefined);
      }

      // Apply filters with store coordination
      await applyFiltersToStores();
    } catch (error) {
      // Silently fail - filter may still apply on next render
    }
  };

  // Handle price filter apply (with currency conversion)
  const handleApplyPriceFilter = async (
    localPriceMin: string,
    localPriceMax: string,
    localCurrency: string
  ) => {
    if (!categorySlug) return;

    try {
      let minUSD: number | undefined;
      let maxUSD: number | undefined;

      // Convert prices to USD if provided
      if (localPriceMin && localPriceMin.trim() !== "") {
        const minMinor = parsePrice(localPriceMin);
        minUSD = await convertToUSD(minMinor, localCurrency as Currency);
      }
      if (localPriceMax && localPriceMax.trim() !== "") {
        const maxMinor = parsePrice(localPriceMax);
        maxUSD = await convertToUSD(maxMinor, localCurrency as Currency);
      }

      // Update filters
      setFilter("priceMinMinor", minUSD);
      setFilter("priceMaxMinor", maxUSD);
      setFilter("priceCurrency", localCurrency);

      // Apply filters with store coordination
      await applyFiltersToStores();
    } catch (error) {
      console.error("Error applying price filter:", error);
    }
  };

  // Handle search filter apply
  const handleApplySearchFilter = async (localSearchText: string) => {
    if (!categorySlug) return;

    try {
      // Update search filter in store
      const searchValue = localSearchText.trim() || undefined;
      setFilter("search", searchValue);

      // Apply filters with store coordination
      await applyFiltersToStores();
    } catch (error) {
      console.error("Error applying search filter:", error);
    }
  };

  // Handle clear all filters
  const handleClearAll = async () => {
    if (!categorySlug) return;

    clearAllFilters();

    // Apply cleared filters with store coordination
    try {
      await applyFiltersToStores();
    } catch (error) {
      // Silently fail - filters may still be cleared on next render
    }
  };

  return {
    handleSpecChange,
    handleApplyRangeFilter,
    handleApplyPriceFilter,
    handleApplySearchFilter,
    handleClearAll,
    applyFiltersToStores,
  };
};