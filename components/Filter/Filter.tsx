"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Filter as FilterIcon, X, RotateCcw } from "lucide-react";
import {
  SedanIcon,
  SuvIcon,
  HatchbackIcon,
  CoupeIcon,
  ConvertibleIcon,
  WagonIcon,
  PickupIcon,
} from "../icons/CarIcons";
import { Aside, Button } from "../slices";
import Text from "../slices/Text/Text";
import { Loading } from "../slices/Loading/Loading";
import { Input } from "../slices/Input/Input";
import {
  useTranslation,
  useFilterActions,
  useAttributeFilters
} from "../../hooks";
import {
  useFiltersStore,
  useListingsStore,
  useSearchStore,
} from "../../stores";
import {
  CURRENCY_LABELS,
} from "../../utils/currency";
import styles from "./Filter.module.scss";
import { AppliedFilters } from "../AppliedFilters/AppliedFilters";

// Car body type icons mapping with custom SVG icons
const getCarBodyTypeIcon = (key: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    sedan: <SedanIcon size={18} />,
    hatchback: <HatchbackIcon size={18} />,
    suv: <SuvIcon size={18} />,
    pickup: <PickupIcon size={18} />,
    coupe: <CoupeIcon size={18} />,
    convertible: <ConvertibleIcon size={18} />,
    wagon: <WagonIcon size={18} />,
    van: <WagonIcon size={18} />, // Using wagon icon for van
    truck: <PickupIcon size={18} />, // Using pickup icon for truck
  };
  return iconMap[key] || <SedanIcon size={18} />;
};

export interface FilterValues {
  // Standard filters
  priceMinMinor?: number;
  priceMaxMinor?: number;
  priceCurrency?: string;
  city?: string;
  province?: string;
  sellerType?: string;

  // Brand/Model
  brandId?: string;
  modelId?: string;

  // Dynamic attributes (stored in specs) - matches backend structure
  specs?: Record<
    string,
    | {
      selected?: string | string[];
      value?: number;
      from?: number;
      to?: number;
      text?: string;
      amount?: number;
      currency?: string;
    }
    | number[] // Support array format for range filters
  >;

  // Legacy support
  search?: string;
}

export interface FilterProps {
  className?: string;
}

export const Filter: React.FC<FilterProps> = ({ className = "" }) => {
  const { t } = useTranslation();
  const params = useParams();

  // Get categorySlug from URL params (self-sufficient)
  const categorySlug = params?.category as string;

  // Manage own visibility state (self-sufficient)
  const [isOpen, setIsOpen] = useState(false);

  // Custom hooks for filter management
  const filterActions = useFilterActions(categorySlug);
  const attributeFilters = useAttributeFilters();

  // Search store for draft functionality
  const {
    draftFilters,
    setDraftFilter,
    setDraftSpecFilter,
    applyDrafts,
    hasPriceDraftChanges,
    hasRangeDraftChanges,
    hasSearchDraftChanges,
  } = useSearchStore();

  // Note: isLoading already available from useFiltersStore above - reusing DRY

  // Store hooks
  const {
    isLoading: filtersLoading,
    fetchFilterData,
  } = useFiltersStore();
  const {
    pagination,
    isLoading: listingsLoading,
  } = useListingsStore();

  // Load filter data when category changes
  useEffect(() => {
    if (!categorySlug) return;
    fetchFilterData(categorySlug);
  }, [categorySlug, fetchFilterData]);

  // Helper functions for draft values
  const getDraftPriceMin = () => draftFilters.priceMinMinor ? (draftFilters.priceMinMinor / 100).toString() : "";
  const getDraftPriceMax = () => draftFilters.priceMaxMinor ? (draftFilters.priceMaxMinor / 100).toString() : "";
  const getDraftCurrency = () => draftFilters.priceCurrency || "USD";
  const getDraftSearch = () => draftFilters.search || "";

  const setDraftPriceMin = (value: string) => {
    const minorValue = value ? parseFloat(value) * 100 : undefined;
    setDraftFilter("priceMinMinor", minorValue || undefined);
  };

  const setDraftPriceMax = (value: string) => {
    const minorValue = value ? parseFloat(value) * 100 : undefined;
    setDraftFilter("priceMaxMinor", minorValue || undefined);
  };

  const setDraftCurrency = (value: string) => {
    setDraftFilter("priceCurrency", value);
  };

  const setDraftSearch = (value: string) => {
    setDraftFilter("search", value);
  };

  // Helper for range inputs
  const getDraftRangeValue = (attributeKey: string, field: 'min' | 'max') => {
    const value = draftFilters.specs?.[attributeKey];
    if (Array.isArray(value)) {
      return field === 'min' ? value[0]?.toString() || "" : value[1]?.toString() || "";
    }
    return "";
  };

  const updateDraftRangeInput = (attributeKey: string, field: 'min' | 'max', value: string) => {
    const currentValue = draftFilters.specs?.[attributeKey] || [undefined, undefined];
    const newValue = [...currentValue];
    const numValue = value ? parseFloat(value) : undefined;

    if (field === 'min') {
      newValue[0] = numValue;
    } else {
      newValue[1] = numValue;
    }

    // Remove undefined values and set to undefined if empty
    const cleanValue = newValue.filter(v => v !== undefined);
    setDraftSpecFilter(attributeKey, cleanValue.length > 0 ? newValue : undefined);
  };

  const {
    handleSpecChange,
    handleClearAll,
  } = filterActions;

  // Simplified apply handlers using draft functionality
  const handleApplyPriceFilter = () => {
    applyDrafts();
  };

  const handleApplySearchFilter = () => {
    applyDrafts();
  };

  const handleApplyRangeFilter = () => {
    applyDrafts();
  };

  const {
    getFilterableAttributes,
    isOptionSelectedInMulti,
    getSelectedOptions,
    shouldDisableOption,
    getSingleSelectorValue,
    getSelectionCounterText,
    toggleMultiSelection,
    handleCheckboxChange,
  } = attributeFilters;

  const totalResults = pagination.total;

  return (
    <>
      {/* Floating Filter Button for opening filters */}
      {!isOpen && (
        <Button
          className={styles.floatingFilterButton}
          onClick={() => setIsOpen(true)}
          variant="outline"
          aria-label={t("search.filters")}
        >
          <FilterIcon size={24} />
          {t("search.filters")}
        </Button>
      )}

    </>
  );
};

export default Filter;
