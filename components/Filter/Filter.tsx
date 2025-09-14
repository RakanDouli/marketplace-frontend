"use client";
import React, { useState, useEffect } from "react";
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
import { Aside, Text, Button } from "../slices";
import { Loading } from "../slices/Loading/Loading";
import { Input } from "../slices/Input/Input";
import { useTranslation } from "../../hooks/useTranslation";
import { useFiltersStore } from "../../stores";
import styles from "./Filter.module.scss";

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

  // Brand/Model
  brandId?: string;
  modelId?: string;

  // Dynamic attributes (stored in specs) - matches backend structure
  specs?: Record<
    string,
    {
      selected?: string | string[];
      value?: number;
      from?: number;
      to?: number;
      text?: string;
      amount?: number;
      currency?: string;
    }
  >;

  // Legacy support
  search?: string;
}

export interface FilterProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
  categorySlug?: string;
  onApplyFilters?: (filters: FilterValues) => void;
  initialValues?: FilterValues;
}

export const Filter: React.FC<FilterProps> = ({
  isOpen = true,
  onClose,
  className = "",
  categorySlug,
  onApplyFilters,
  initialValues = {},
}) => {
  const { t } = useTranslation();

  // Filter state
  const [filters, setFilters] = useState<FilterValues>(initialValues);

  // Store hooks
  const {
    attributes, // All specs (including brands/models) are in attributes now
    provinces,
    cities,
    isLoading,
    isLoadingCounts,
    error,
    fetchFilterData,
    fetchCities,
    updateFiltersWithCascading,
  } = useFiltersStore();

  // Load filter data when category changes
  useEffect(() => {
    if (!categorySlug) return;
    fetchFilterData(categorySlug);
  }, [categorySlug, fetchFilterData]);

  // Models are now handled through dynamic attributes with cascading counts
  // No separate fetching needed - everything updates through updateFiltersWithCascading

  // Update cities when province changes
  useEffect(() => {
    if (filters.province) {
      fetchCities(filters.province);
    }
  }, [filters.province, fetchCities]);

  const handleFilterChange = (key: keyof FilterValues, value: any) => {
    const newFilters = { ...filters, [key]: value };

    // Clear dependent filters
    if (key === "brandId" && value !== filters.brandId) {
      newFilters.modelId = undefined;
    }
    if (key === "province" && value !== filters.province) {
      newFilters.city = undefined;
    }

    setFilters(newFilters);

    // Apply filters immediately when user changes them
    onApplyFilters?.(newFilters);
  };

  const handleSpecChange = (attributeKey: string, value: any) => {
    const newFilters = {
      ...filters,
      specs: {
        ...filters.specs,
        [attributeKey]: value,
      },
    };

    setFilters(newFilters);

    // Apply filters immediately when user changes them
    onApplyFilters?.(newFilters);
  };

  const handleClearAll = () => {
    const clearedFilters = {};
    setFilters(clearedFilters);
    // Apply cleared filters immediately
    onApplyFilters?.(clearedFilters);
  };

  return (
    <Aside isOpen={isOpen} className={`${styles.filterAside} ${className}`}>
      {/* Filter Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <Text variant="small" className={styles.title}>
            التصنيفات
          </Text>
          <FilterIcon size={20} />
        </div>

        <div className={styles.headerActions}>
          {/* Reset button */}
          <button
            className={styles.resetButton}
            onClick={handleClearAll}
            aria-label={t("search.clear")}
            title={t("search.clear")}
          >
            <RotateCcw size={18} />
          </button>

          {/* Close button for mobile */}
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close filters"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Filter Content */}
      <div className={styles.filterContent}>
        {isLoading && (
          <div className={styles.loading}>
            <Loading type="svg" />
            <Text>{t("common.loading")}</Text>
          </div>
        )}
        {!isLoading && (
          <>
            {/* Brand and Model are now handled through dynamic attributes below */}

            {/* Dynamic Attributes - Now using Arabic-only data from backend */}
            {attributes
              .filter(
                (attr) =>
                  attr.type === "SELECTOR" ||
                  attr.type === "MULTI_SELECTOR" ||
                  attr.type === "RANGE" ||
                  attr.type === "CURRENCY"
              )
              .map((attribute) => {
                return (
                  <div key={attribute.id} className={styles.filterSection}>
                    <Text variant="small" className={styles.sectionTitle}>
                      {attribute.name}
                    </Text>

                    {(attribute.type === "SELECTOR" ||
                      attribute.type === "MULTI_SELECTOR") &&
                      attribute.processedOptions && (
                        <>
                          {attribute.key === "body_type" ? (
                            // Special icon-based selector for car body types
                            <div className={styles.iconSelector}>
                              {attribute.processedOptions.map((option) => (
                                <button
                                  key={option.key}
                                  type="button"
                                  className={`${styles.iconOption} ${
                                    (() => {
                                      const currentSelected =
                                        filters.specs?.[attribute.key]
                                          ?.selected;
                                      return Array.isArray(currentSelected)
                                        ? currentSelected.includes(option.key)
                                        : currentSelected === option.key;
                                    })()
                                      ? styles.selected
                                      : ""
                                  }`}
                                  onClick={() => {
                                    const currentSelected =
                                      filters.specs?.[attribute.key]?.selected;
                                    let newSelected: string[] = [];

                                    // Handle multiple selections
                                    if (Array.isArray(currentSelected)) {
                                      newSelected = currentSelected.includes(
                                        option.key
                                      )
                                        ? currentSelected.filter(
                                            (key) => key !== option.key
                                          )
                                        : [...currentSelected, option.key];
                                    } else if (currentSelected === option.key) {
                                      newSelected = [];
                                    } else {
                                      newSelected = currentSelected
                                        ? [currentSelected, option.key]
                                        : [option.key];
                                    }

                                    handleSpecChange(
                                      attribute.key,
                                      newSelected.length > 0
                                        ? { selected: newSelected }
                                        : undefined
                                    );
                                  }}
                                >
                                  {getCarBodyTypeIcon(option.key)}
                                  <span className={styles.optionLabel}>
                                    {option.value}
                                    {option.count !== undefined && (
                                      <span className={styles.optionCount}>
                                        ({option.count})
                                      </span>
                                    )}
                                  </span>
                                </button>
                              ))}
                            </div>
                          ) : (
                            // Regular dropdown for other selectors
                            <Input
                              type="select"
                              value={
                                filters.specs?.[attribute.key]?.selected || ""
                              }
                              onChange={(e) =>
                                handleSpecChange(
                                  attribute.key,
                                  e.target.value
                                    ? { selected: e.target.value }
                                    : undefined
                                )
                              }
                              options={[
                                { value: "", label: t("search.selectOption") },
                                ...attribute.processedOptions.map((option) => ({
                                  value: option.key,
                                  label: `${option.value}${
                                    option.count !== undefined
                                      ? ` (${option.count})`
                                      : ""
                                  }`,
                                })),
                              ]}
                            />
                          )}
                        </>
                      )}

                    {(attribute.type === "RANGE" ||
                      attribute.type === "CURRENCY") && (
                      <div className={styles.rangeInputs}>
                        <Input
                          type="number"
                          placeholder={`${t("search.min")} ${attribute.name}`}
                          value={filters.specs?.[attribute.key]?.from || ""}
                          onChange={(e) =>
                            handleSpecChange(attribute.key, {
                              ...filters.specs?.[attribute.key],
                              from: e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            })
                          }
                          size="sm"
                        />
                        <Input
                          type="number"
                          placeholder={`${t("search.max")} ${attribute.name}`}
                          value={filters.specs?.[attribute.key]?.to || ""}
                          onChange={(e) =>
                            handleSpecChange(attribute.key, {
                              ...filters.specs?.[attribute.key],
                              to: e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            })
                          }
                          size="sm"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            {/* Search */}
            <div className={styles.filterSection}>
              <Text variant="small" className={styles.sectionTitle}>
                {t("search.search")}
              </Text>
              <Input
                type="search"
                placeholder={t("search.placeholder")}
                value={filters.search || ""}
                onChange={(e) =>
                  handleFilterChange("search", e.target.value || undefined)
                }
              />
            </div>

            {/* Price Filter */}
            <div className={styles.filterSection}>
              <Text variant="small" className={styles.sectionTitle}>
                {t("search.priceRange")}
              </Text>
              <div className={styles.currencyInputs}>
                <div className={styles.priceInputs}>
                  <Input
                    type="number"
                    placeholder={t("search.minPrice")}
                    value={
                      filters.priceMinMinor ? filters.priceMinMinor / 100 : ""
                    }
                    onChange={(e) =>
                      handleFilterChange(
                        "priceMinMinor",
                        e.target.value
                          ? Number(e.target.value) * 100
                          : undefined
                      )
                    }
                    size="sm"
                  />
                  <Input
                    type="number"
                    placeholder={t("search.maxPrice")}
                    value={
                      filters.priceMaxMinor ? filters.priceMaxMinor / 100 : ""
                    }
                    onChange={(e) =>
                      handleFilterChange(
                        "priceMaxMinor",
                        e.target.value
                          ? Number(e.target.value) * 100
                          : undefined
                      )
                    }
                    size="sm"
                  />
                </div>
                <Input
                  type="select"
                  value={filters.priceCurrency || "USD"}
                  onChange={(e) =>
                    handleFilterChange("priceCurrency", e.target.value)
                  }
                  size="sm"
                  options={[
                    { value: "USD", label: "USD" },
                    { value: "SYP", label: "SYP" },
                    { value: "EUR", label: "EUR" },
                  ]}
                />
              </div>
            </div>

            {/* Location */}
            {provinces.length > 0 && (
              <div className={styles.filterSection}>
                <Text variant="small" className={styles.sectionTitle}>
                  {t("search.location")}
                </Text>
                <Input
                  type="select"
                  value={filters.province || ""}
                  onChange={(e) =>
                    handleFilterChange("province", e.target.value || undefined)
                  }
                  options={[
                    { value: "", label: t("search.selectProvince") },
                    ...provinces.map((province) => ({
                      value: province,
                      label: province,
                    })),
                  ]}
                />

                {filters.province && cities.length > 0 && (
                  <Input
                    type="select"
                    value={filters.city || ""}
                    onChange={(e) =>
                      handleFilterChange("city", e.target.value || undefined)
                    }
                    options={[
                      { value: "", label: t("search.selectCity") },
                      ...cities.map((city) => ({
                        value: city,
                        label: city,
                      })),
                    ]}
                  />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Aside>
  );
};

export default Filter;
