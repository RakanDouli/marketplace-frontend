"use client";
import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, Check, Trash2 } from "lucide-react";
import { Text, Button } from "../slices";
import { IconGridSelector } from "../IconGridSelector";
import { useSearchStore } from "../../stores";
import { Input } from "../slices/Input/Input";
import type { Attribute } from "../../types/listing";
import styles from "./MobileFilterContent.module.scss";

// Extend Attribute with processedOptions for filtering
interface FilterAttribute extends Attribute {
  processedOptions?: Array<{
    key: string;
    value: string;
    count?: number;
    /** Group key for optgroup display (e.g., modelId for variants) */
    groupKey?: string;
    /** Group label for optgroup display (e.g., modelName for variants) */
    groupLabel?: string;
    /** For models: true if this model has variants (renders as non-clickable header) */
    hasVariants?: boolean;
    /** For variantId filter: true if this is a model without variants (from modelId aggregation) */
    isModelWithoutVariants?: boolean;
  }>;
}

export type MobileFilterScreen =
  | { type: 'list' }
  | { type: 'detail'; attribute: FilterAttribute }
  | { type: 'range-select'; attribute: FilterAttribute; field: 'min' | 'max' }
  | { type: 'brand' }
  | { type: 'model' };

// Brand/Model data for dedicated filter
interface BrandModelData {
  brandOptions: Array<{ key: string; value: string; count?: number }>;
  modelVariantOptions: Array<{
    key: string;
    value: string;
    count?: number;
    modelId?: string;
    modelName?: string;
    isModelWithoutVariants?: boolean;
  }>;
  selectedBrandId?: string;
  selectedModelId?: string;
  selectedVariantId?: string;
  brandLabel?: string;
  modelLabel?: string;
}

interface MobileFilterContentProps {
  attributes: FilterAttribute[];
  categorySlug: string;
  screen: MobileFilterScreen;
  onScreenChange: (screen: MobileFilterScreen) => void;
  totalResults: number;
  onFilterChange: (key: string, value: any) => void;
  onPriceChange: (min?: number, max?: number) => void;
  onApply: () => void;
  onClear: () => void;
  isLoading?: boolean;
  // Brand/Model dedicated filter
  brandModelData?: BrandModelData;
  onBrandChange?: (brandId: string | undefined) => void;
  onModelVariantChange?: (value: { modelId?: string; variantId?: string }) => void;
}

// Price range type
interface PriceRange {
  label: string;
  min?: number;
  max?: number;
}

// Generate price ranges based on category
function getPriceRanges(categorySlug: string): PriceRange[] {
  const isVehicle = categorySlug?.includes("car") || categorySlug?.includes("vehicle");
  const isRealEstate = categorySlug?.includes("real") || categorySlug?.includes("estate");

  if (isVehicle) {
    return [
      { label: "أقل من 5,000$", max: 5000 },
      { label: "5,000$ - 10,000$", min: 5000, max: 10000 },
      { label: "10,000$ - 20,000$", min: 10000, max: 20000 },
      { label: "20,000$ - 50,000$", min: 20000, max: 50000 },
      { label: "50,000$ - 100,000$", min: 50000, max: 100000 },
      { label: "أكثر من 100,000$", min: 100000 },
    ];
  }

  if (isRealEstate) {
    return [
      { label: "أقل من 50,000$", max: 50000 },
      { label: "50,000$ - 100,000$", min: 50000, max: 100000 },
      { label: "100,000$ - 200,000$", min: 100000, max: 200000 },
      { label: "200,000$ - 500,000$", min: 200000, max: 500000 },
      { label: "أكثر من 500,000$", min: 500000 },
    ];
  }

  // Default ranges
  return [
    { label: "أقل من 100$", max: 100 },
    { label: "100$ - 500$", min: 100, max: 500 },
    { label: "500$ - 1,000$", min: 500, max: 1000 },
    { label: "1,000$ - 5,000$", min: 1000, max: 5000 },
    { label: "أكثر من 5,000$", min: 5000 },
  ];
}

export const MobileFilterContent: React.FC<MobileFilterContentProps> = ({
  attributes,
  categorySlug,
  screen,
  onScreenChange,
  totalResults,
  onFilterChange,
  onPriceChange,
  onApply,
  onClear,
  isLoading,
  brandModelData,
  onBrandChange,
  onModelVariantChange,
}) => {
  const { draftFilters, appliedFilters } = useSearchStore();
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [isAnimating, setIsAnimating] = useState(false);
  const prevScreenRef = useRef(screen);

  // Track screen changes for animation direction
  useEffect(() => {
    const prevScreen = prevScreenRef.current;
    const currentScreen = screen;

    // Determine direction based on screen depth
    const getScreenDepth = (s: MobileFilterScreen) => {
      if (s.type === 'list') return 0;
      if (s.type === 'detail') return 1;
      if (s.type === 'range-select') return 2;
      return 0;
    };

    const prevDepth = getScreenDepth(prevScreen);
    const currentDepth = getScreenDepth(currentScreen);

    // Only animate if screen actually changed
    if (prevDepth !== currentDepth) {
      if (currentDepth > prevDepth) {
        setDirection('forward');
      } else {
        setDirection('backward');
      }

      // Trigger animation
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      prevScreenRef.current = screen;
      return () => clearTimeout(timer);
    }

    prevScreenRef.current = screen;
  }, [screen]);

  // Navigation with direction
  const navigateToDetail = (attribute: FilterAttribute) => {
    onScreenChange({ type: 'detail', attribute });
  };

  // Get current value display for list item (check both draft and applied filters)
  const getValueDisplay = (attribute: FilterAttribute): string | null => {
    // Price filter
    if (attribute.type === "CURRENCY") {
      const min = draftFilters.priceMinMinor ?? appliedFilters.priceMinMinor;
      const max = draftFilters.priceMaxMinor ?? appliedFilters.priceMaxMinor;
      if (min && max) return `${min} - ${max}`;
      if (min) return `من ${min}`;
      if (max) return `حتى ${max}`;
      return null;
    }

    // Range filters
    if (attribute.type === "RANGE" || attribute.type === "RANGE_SELECTOR") {
      const value = draftFilters.specs?.[attribute.key] ?? appliedFilters.specs?.[attribute.key];
      if (Array.isArray(value)) {
        const [min, max] = value;
        if (min && max) return `${min} - ${max}`;
        if (min) return `من ${min}`;
        if (max) return `حتى ${max}`;
      }
      return null;
    }

    // Selector filters
    if (attribute.type === "SELECTOR") {
      const value = draftFilters.specs?.[attribute.key] ?? appliedFilters.specs?.[attribute.key];
      if (!value) {
        // For variantId, also check if a model without variants is selected (stored as modelId)
        if (attribute.key === "variantId") {
          const modelIdValue = draftFilters.specs?.modelId ?? appliedFilters.specs?.modelId;
          if (modelIdValue) {
            // Find the model option by checking model_<uuid> key
            const option = attribute.processedOptions?.find(o => o.key === `model_${modelIdValue}`);
            return option?.value || null;
          }
        }
        return null;
      }
      const option = attribute.processedOptions?.find(o => o.key === value);
      return option?.value || null;
    }

    // Multi-selector filters
    if (attribute.type === "MULTI_SELECTOR") {
      const value = draftFilters.specs?.[attribute.key] ?? appliedFilters.specs?.[attribute.key];
      if (!value || !Array.isArray(value) || value.length === 0) return null;
      if (value.length === 1) {
        const option = attribute.processedOptions?.find(o => o.key === value[0]);
        return option?.value || null;
      }
      return `${value.length} محدد`;
    }

    return null;
  };

  // Handle option selection for SELECTOR type
  const handleSelectorSelect = (attribute: FilterAttribute, optionKey: string) => {
    const currentValue = draftFilters.specs?.[attribute.key] ?? appliedFilters.specs?.[attribute.key];
    // Toggle: if already selected, deselect
    if (currentValue === optionKey) {
      onFilterChange(attribute.key, undefined);
    } else {
      onFilterChange(attribute.key, optionKey);
    }
    // Return to filter list after selection (with small delay for visual feedback)
    setTimeout(() => {
      onScreenChange({ type: 'list' });
    }, 150);
  };

  // Handle option selection for MULTI_SELECTOR type
  const handleMultiSelectorToggle = (attribute: FilterAttribute, optionKey: string) => {
    const currentValue = (draftFilters.specs?.[attribute.key] ?? appliedFilters.specs?.[attribute.key]) as string[] | undefined;
    const currentArray = Array.isArray(currentValue) ? currentValue : [];

    if (currentArray.includes(optionKey)) {
      // Remove
      const newValue = currentArray.filter(k => k !== optionKey);
      onFilterChange(attribute.key, newValue.length > 0 ? newValue : undefined);
    } else {
      // Add
      onFilterChange(attribute.key, [...currentArray, optionKey]);
    }
  };

  // Get display value for brand
  const getBrandDisplayValue = (): string | null => {
    if (!brandModelData?.selectedBrandId) return null;
    const brand = brandModelData.brandOptions.find(b => b.key === brandModelData.selectedBrandId);
    return brand?.value || null;
  };

  // Get display value for model/variant
  const getModelDisplayValue = (): string | null => {
    if (!brandModelData) return null;

    // Check variant first
    if (brandModelData.selectedVariantId) {
      const variant = brandModelData.modelVariantOptions.find(
        v => v.key === brandModelData.selectedVariantId && !v.isModelWithoutVariants
      );
      return variant?.value || null;
    }

    // Check model
    if (brandModelData.selectedModelId) {
      const model = brandModelData.modelVariantOptions.find(
        m => m.key === brandModelData.selectedModelId && m.isModelWithoutVariants
      );
      return model?.value || null;
    }

    return null;
  };

  // Render filter list screen
  const renderListScreen = () => (
    <div className={styles.listScreen}>
      {/* Filter list - header/footer handled by Aside */}
      <div className={styles.filterList}>
        {/* Brand/Model filters - at the top */}
        {brandModelData && (
          <>
            {/* Brand */}
            <button
              type="button"
              className={styles.filterItem}
              onClick={() => onScreenChange({ type: 'brand' })}
            >
              <div className={styles.filterItemContent}>
                <Text variant="h4" className={styles.filterName}>
                  {brandModelData.brandLabel || "الماركة"}
                </Text>
                {getBrandDisplayValue() && (
                  <Text variant="small" className={styles.filterValue}>
                    {getBrandDisplayValue()}
                  </Text>
                )}
              </div>
              <ChevronLeft size={20} className={styles.chevron} />
            </button>

            {/* Model - only show if brand is selected */}
            {brandModelData.selectedBrandId && brandModelData.modelVariantOptions.length > 0 && (
              <button
                type="button"
                className={styles.filterItem}
                onClick={() => onScreenChange({ type: 'model' })}
              >
                <div className={styles.filterItemContent}>
                  <Text variant="h4" className={styles.filterName}>
                    {brandModelData.modelLabel || "الموديل"}
                  </Text>
                  {getModelDisplayValue() && (
                    <Text variant="small" className={styles.filterValue}>
                      {getModelDisplayValue()}
                    </Text>
                  )}
                </div>
                <ChevronLeft size={20} className={styles.chevron} />
              </button>
            )}
          </>
        )}

        {/* Other dynamic filters */}
        {attributes.map((attribute) => {
          const valueDisplay = getValueDisplay(attribute);

          return (
            <button
              key={attribute.id}
              type="button"
              className={styles.filterItem}
              onClick={() => navigateToDetail(attribute)}
            >
              <div className={styles.filterItemContent}>
                <Text variant="h4" className={styles.filterName}>
                  {attribute.name}
                </Text>
                {valueDisplay && (
                  <Text variant="small" className={styles.filterValue}>
                    {valueDisplay}
                  </Text>
                )}
              </div>
              <ChevronLeft size={20} className={styles.chevron} />
            </button>
          );
        })}
      </div>
    </div>
  );

  // Render detail screen for a specific filter
  // Check if a specific filter has a value
  const hasFilterValue = (attribute: FilterAttribute): boolean => {
    if (attribute.type === "CURRENCY") {
      return !!(draftFilters.priceMinMinor ?? appliedFilters.priceMinMinor ?? draftFilters.priceMaxMinor ?? appliedFilters.priceMaxMinor);
    }
    const value = draftFilters.specs?.[attribute.key] ?? appliedFilters.specs?.[attribute.key];
    if (Array.isArray(value)) {
      return value.length > 0 && value.some(v => v !== undefined);
    }
    return value !== undefined && value !== null && value !== '';
  };

  // Clear a specific filter
  const clearFilter = (attribute: FilterAttribute) => {
    if (attribute.type === "CURRENCY") {
      onPriceChange(undefined, undefined);
    } else {
      onFilterChange(attribute.key, undefined);
    }
  };

  const renderDetailScreen = (attribute: FilterAttribute) => {
    return (
      <div className={styles.detailScreen}>
        {/* Options list */}
        <div className={styles.optionsList}>
          {renderFilterOptions(attribute)}
        </div>
      </div>
    );
  };

  // Navigate to range select screen (min or max)
  const navigateToRangeSelect = (attribute: FilterAttribute, field: 'min' | 'max') => {
    onScreenChange({ type: 'range-select', attribute, field });
  };

  // Get display value for range field
  const getRangeFieldDisplay = (attribute: FilterAttribute, field: 'min' | 'max'): string | null => {
    if (attribute.type === "CURRENCY") {
      const value = field === 'min'
        ? (draftFilters.priceMinMinor ?? appliedFilters.priceMinMinor)
        : (draftFilters.priceMaxMinor ?? appliedFilters.priceMaxMinor);
      return value ? `${value}$` : null;
    }

    const rangeValue = (draftFilters.specs?.[attribute.key] ?? appliedFilters.specs?.[attribute.key]) as number[] | undefined;
    if (!rangeValue) return null;

    const value = field === 'min' ? rangeValue[0] : rangeValue[1];
    if (value === undefined) return null;

    // Find the label from processedOptions if available
    const option = attribute.processedOptions?.find(o => parseFloat(o.key) === value);
    return option?.value || value.toString();
  };

  // Render options based on filter type
  const renderFilterOptions = (attribute: FilterAttribute) => {
    // CURRENCY - Price filter (show sub-menu)
    if (attribute.type === "CURRENCY") {
      const minDisplay = getRangeFieldDisplay(attribute, 'min');
      const maxDisplay = getRangeFieldDisplay(attribute, 'max');

      return (
        <div className={styles.rangeSubMenu}>
          <button
            type="button"
            className={styles.filterItem}
            onClick={() => navigateToRangeSelect(attribute, 'min')}
          >
            <div className={styles.filterItemContent}>
              <Text variant="h4" className={styles.filterName}>من</Text>
              {minDisplay && (
                <Text variant="small" className={styles.filterValue}>{minDisplay}</Text>
              )}
            </div>
            <ChevronLeft size={20} className={styles.chevron} />
          </button>
          <button
            type="button"
            className={styles.filterItem}
            onClick={() => navigateToRangeSelect(attribute, 'max')}
          >
            <div className={styles.filterItemContent}>
              <Text variant="h4" className={styles.filterName}>إلى</Text>
              {maxDisplay && (
                <Text variant="small" className={styles.filterValue}>{maxDisplay}</Text>
              )}
            </div>
            <ChevronLeft size={20} className={styles.chevron} />
          </button>
        </div>
      );
    }

    // RANGE_SELECTOR - Range with predefined options (show sub-menu)
    if (attribute.type === "RANGE_SELECTOR" && attribute.processedOptions) {
      const minDisplay = getRangeFieldDisplay(attribute, 'min');
      const maxDisplay = getRangeFieldDisplay(attribute, 'max');

      return (
        <div className={styles.rangeSubMenu}>
          <button
            type="button"
            className={styles.filterItem}
            onClick={() => navigateToRangeSelect(attribute, 'min')}
          >
            <div className={styles.filterItemContent}>
              <Text variant="paragraph" className={styles.filterName}>من</Text>
              {minDisplay && (
                <Text variant="small" className={styles.filterValue}>{minDisplay}</Text>
              )}
            </div>
            <ChevronLeft size={20} className={styles.chevron} />
          </button>
          <button
            type="button"
            className={styles.filterItem}
            onClick={() => navigateToRangeSelect(attribute, 'max')}
          >
            <div className={styles.filterItemContent}>
              <Text variant="paragraph" className={styles.filterName}>إلى</Text>
              {maxDisplay && (
                <Text variant="small" className={styles.filterValue}>{maxDisplay}</Text>
              )}
            </div>
            <ChevronLeft size={20} className={styles.chevron} />
          </button>
        </div>
      );
    }

    // RANGE - Custom min/max inputs (show sub-menu)
    if (attribute.type === "RANGE") {
      const minDisplay = getRangeFieldDisplay(attribute, 'min');
      const maxDisplay = getRangeFieldDisplay(attribute, 'max');

      return (
        <div className={styles.rangeSubMenu}>
          <button
            type="button"
            className={styles.filterItem}
            onClick={() => navigateToRangeSelect(attribute, 'min')}
          >
            <div className={styles.filterItemContent}>
              <Text variant="paragraph" className={styles.filterName}>من</Text>
              {minDisplay && (
                <Text variant="small" className={styles.filterValue}>{minDisplay}</Text>
              )}
            </div>
            <ChevronLeft size={20} className={styles.chevron} />
          </button>
          <button
            type="button"
            className={styles.filterItem}
            onClick={() => navigateToRangeSelect(attribute, 'max')}
          >
            <div className={styles.filterItemContent}>
              <Text variant="paragraph" className={styles.filterName}>إلى</Text>
              {maxDisplay && (
                <Text variant="small" className={styles.filterValue}>{maxDisplay}</Text>
              )}
            </div>
            <ChevronLeft size={20} className={styles.chevron} />
          </button>
        </div>
      );
    }

    // SELECTOR - Single select
    if (attribute.type === "SELECTOR" && attribute.processedOptions) {
      const currentValue = (draftFilters.specs?.[attribute.key] ?? appliedFilters.specs?.[attribute.key]) as string | undefined;
      // For variantId filter, also get modelId to check if a model without variants is selected
      const modelIdValue = attribute.key === "variantId"
        ? (draftFilters.specs?.modelId ?? appliedFilters.specs?.modelId) as string | undefined
        : undefined;

      // Special handling for body_type with icons
      if (attribute.key === "body_type") {
        const selected = currentValue ? [currentValue] : [];
        // Filter out options with count of 0
        const visibleOptions = attribute.processedOptions.filter(opt => opt.count !== 0);
        return (
          <IconGridSelector
            selected={selected}
            onChange={(newSelected) => {
              onFilterChange(attribute.key, newSelected[0] || undefined);
              // Return to filter list after selection (with small delay for visual feedback)
              setTimeout(() => {
                onScreenChange({ type: 'list' });
              }, 150);
            }}
            iconBasePath="/images/car-types"
            options={visibleOptions.map((opt) => ({
              key: opt.key,
              label: opt.value,
              count: opt.count,
            }))}
          />
        );
      }

      // For brand filter, show all options so user can switch brands without clearing
      // For other filters, hide options with count of 0
      const visibleOptions = attribute.key === 'brandId'
        ? attribute.processedOptions
        : attribute.processedOptions.filter(opt => opt.count !== 0);

      // Check if options have groups (for variants grouped by model)
      const hasGroups = visibleOptions.some(opt => opt.groupKey && opt.groupLabel);
      // Check if we have models without variants (merged into variantId)
      const hasModelsWithoutVariants = visibleOptions.some(opt => opt.isModelWithoutVariants);

      // Group options if they have groupKey/groupLabel (variants grouped by model)
      // Also handle models without variants as standalone options
      if (hasGroups || hasModelsWithoutVariants) {
        const groups: Record<string, { label: string; options: typeof visibleOptions }> = {};
        const standaloneModels: typeof visibleOptions = [];

        visibleOptions.forEach(opt => {
          // Models without variants go to standalone list (no group header)
          if (opt.isModelWithoutVariants) {
            standaloneModels.push(opt);
          } else if (opt.groupKey && opt.groupLabel) {
            // Variants are grouped by model
            const groupKey = opt.groupKey;
            const groupLabel = opt.groupLabel;

            if (!groups[groupKey]) {
              groups[groupKey] = { label: groupLabel, options: [] };
            }
            groups[groupKey].options.push(opt);
          } else {
            // Fallback: ungrouped options
            if (!groups['__ungrouped__']) {
              groups['__ungrouped__'] = { label: 'أخرى', options: [] };
            }
            groups['__ungrouped__'].options.push(opt);
          }
        });

        const groupedOptions = Object.values(groups);

        return (
          <div className={styles.selectorOptions}>
            {/* First: Models without variants (standalone, no header) */}
            {standaloneModels.map((option) => {
              // For model options (model_<uuid>), check against modelIdValue
              const isSelected = option.isModelWithoutVariants
                ? option.key === `model_${modelIdValue}`
                : currentValue === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  className={`${styles.optionItem} ${isSelected ? styles.selected : ''}`}
                  onClick={() => handleSelectorSelect(attribute, option.key)}
                >
                  <div className={styles.optionContent}>
                    <Text variant="paragraph">{option.value}</Text>
                    {option.count !== undefined && (
                      <Text variant="small" className={styles.optionCount}>
                        ({option.count})
                      </Text>
                    )}
                  </div>
                  <span className={styles.checkIconContainer}>
                    {isSelected && <Check size={18} className={styles.checkIcon} />}
                  </span>
                </button>
              );
            })}

            {/* Then: Variants grouped by model */}
            {groupedOptions.map((group, groupIndex) => (
              <div key={`${groupIndex}-${group.label}`}>
                {/* Group header */}
                <div className={styles.groupHeader}>
                  <Text variant="h4" className={styles.groupHeaderText}>
                    {group.label}
                  </Text>
                </div>
                {/* Group options */}
                {group.options.map((option) => {
                  const isSelected = currentValue === option.key;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      className={`${styles.optionItem} ${isSelected ? styles.selected : ''}`}
                      onClick={() => handleSelectorSelect(attribute, option.key)}
                    >
                      <div className={styles.optionContent}>
                        <Text variant="paragraph">{option.value}</Text>
                        {option.count !== undefined && (
                          <Text variant="small" className={styles.optionCount}>
                            ({option.count})
                          </Text>
                        )}
                      </div>
                      <span className={styles.checkIconContainer}>
                        {isSelected && <Check size={18} className={styles.checkIcon} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        );
      }

      // Check if this is modelId with hasVariants (models that have variants are non-clickable headers)
      const hasModelVariants = attribute.key === 'modelId' && visibleOptions.some(opt => opt.hasVariants === true);

      if (hasModelVariants) {
        return (
          <div className={styles.selectorOptions}>
            {visibleOptions.map((option) => {
              const isSelected = currentValue === option.key;

              // Models with variants are non-clickable headers
              if (option.hasVariants) {
                return (
                  <div key={option.key} className={styles.groupHeader}>
                    <Text variant="h4" className={styles.groupHeaderText}>
                      {option.value}
                      {option.count !== undefined && ` (${option.count})`}
                    </Text>
                  </div>
                );
              }

              // Models without variants are clickable
              return (
                <button
                  key={option.key}
                  type="button"
                  className={`${styles.optionItem} ${isSelected ? styles.selected : ''}`}
                  onClick={() => handleSelectorSelect(attribute, option.key)}
                >
                  <div className={styles.optionContent}>
                    <Text variant="paragraph">{option.value}</Text>
                    {option.count !== undefined && (
                      <Text variant="small" className={styles.optionCount}>
                        ({option.count})
                      </Text>
                    )}
                  </div>
                  <span className={styles.checkIconContainer}>
                    {isSelected && <Check size={18} className={styles.checkIcon} />}
                  </span>
                </button>
              );
            })}
          </div>
        );
      }

      // Regular flat list (no groups)
      return (
        <div className={styles.selectorOptions}>
          {visibleOptions.map((option) => {
            const isSelected = currentValue === option.key;
            return (
              <button
                key={option.key}
                type="button"
                className={`${styles.optionItem} ${isSelected ? styles.selected : ''}`}
                onClick={() => handleSelectorSelect(attribute, option.key)}
              >
                <div className={styles.optionContent}>
                  <Text variant="paragraph">{option.value}</Text>
                  {option.count !== undefined && (
                    <Text variant="small" className={styles.optionCount}>
                      ({option.count})
                    </Text>
                  )}
                </div>
                <span className={styles.checkIconContainer}>
                  {isSelected && <Check size={18} className={styles.checkIcon} />}
                </span>
              </button>
            );
          })}
        </div>
      );
    }

    // MULTI_SELECTOR - Multiple select
    if (attribute.type === "MULTI_SELECTOR" && attribute.processedOptions) {
      const currentValue = (draftFilters.specs?.[attribute.key] ?? appliedFilters.specs?.[attribute.key]) as string[] | undefined;
      const currentArray = Array.isArray(currentValue) ? currentValue : [];

      // Special handling for body_type with icons
      if (attribute.key === "body_type") {
        // Filter out options with count of 0
        const visibleOptions = attribute.processedOptions.filter(opt => opt.count !== 0);
        return (
          <IconGridSelector
            selected={currentArray}
            onChange={(newSelected) => {
              onFilterChange(attribute.key, newSelected.length > 0 ? newSelected : undefined);
            }}
            iconBasePath="/images/car-types"
            options={visibleOptions.map((opt) => ({
              key: opt.key,
              label: opt.value,
              count: opt.count,
            }))}
          />
        );
      }

      // Filter out options with count of 0
      const visibleOptions = attribute.processedOptions.filter(opt => opt.count !== 0);

      return (
        <div className={styles.multiSelectorOptions}>
          {visibleOptions.map((option) => {
            const isSelected = currentArray.includes(option.key);
            return (
              <button
                key={option.key}
                type="button"
                className={`${styles.optionItem} ${isSelected ? styles.selected : ''}`}
                onClick={() => handleMultiSelectorToggle(attribute, option.key)}
              >
                <div className={styles.optionContent}>
                  <Text variant="paragraph">{option.value}</Text>
                  {option.count !== undefined && (
                    <Text variant="small" className={styles.optionCount}>
                      ({option.count})
                    </Text>
                  )}
                </div>
                <div className={styles.checkbox}>
                  {isSelected && <Check size={14} />}
                </div>
              </button>
            );
          })}
        </div>
      );
    }

    return null;
  };

  // Render range select screen (third level - actual options for min or max)
  const renderRangeSelectScreen = (attribute: FilterAttribute, field: 'min' | 'max') => {
    // CURRENCY - Price options
    if (attribute.type === "CURRENCY") {
      const ranges = getPriceRanges(categorySlug);
      const currentValue = field === 'min' ? draftFilters.priceMinMinor : draftFilters.priceMaxMinor;

      // Generate options from ranges (extract unique min or max values)
      const options = field === 'min'
        ? ranges.filter(r => r.min !== undefined).map(r => ({ value: r.min!, label: `${r.min!.toLocaleString()}$` }))
        : ranges.filter(r => r.max !== undefined).map(r => ({ value: r.max!, label: `${r.max!.toLocaleString()}$` }));

      // Remove duplicates and sort
      const uniqueOptions = Array.from(new Map(options.map(o => [o.value, o])).values())
        .sort((a, b) => a.value - b.value);

      return (
        <div className={styles.detailScreen}>
          <div className={styles.optionsList}>
            <div className={styles.selectorOptions}>
              {/* Clear option */}
              <button
                type="button"
                className={`${styles.optionItem} ${currentValue === undefined ? styles.selected : ''}`}
                onClick={() => {
                  if (field === 'min') {
                    onPriceChange(undefined, draftFilters.priceMaxMinor);
                  } else {
                    onPriceChange(draftFilters.priceMinMinor, undefined);
                  }
                  // Return to detail screen after selection (with small delay for visual feedback)
                  setTimeout(() => {
                    onScreenChange({ type: 'detail', attribute });
                  }, 150);
                }}
              >
                <div className={styles.optionContent}>
                  <Text variant="paragraph">الكل</Text>
                </div>
                <span className={styles.checkIconContainer}>
                  {currentValue === undefined && <Check size={18} className={styles.checkIcon} />}
                </span>
              </button>

              {uniqueOptions.map((option) => {
                const isSelected = currentValue === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`${styles.optionItem} ${isSelected ? styles.selected : ''}`}
                    onClick={() => {
                      if (field === 'min') {
                        onPriceChange(option.value, draftFilters.priceMaxMinor);
                      } else {
                        onPriceChange(draftFilters.priceMinMinor, option.value);
                      }
                      // Return to detail screen after selection (with small delay for visual feedback)
                      setTimeout(() => {
                        onScreenChange({ type: 'detail', attribute });
                      }, 150);
                    }}
                  >
                    <div className={styles.optionContent}>
                      <Text variant="paragraph">{option.label}</Text>
                    </div>
                    <span className={styles.checkIconContainer}>
                      {isSelected && <Check size={18} className={styles.checkIcon} />}
                    </span>
                  </button>
                );
              })}

              {/* Custom input */}
              <div className={styles.customInputSection}>
                <Text variant="small" className={styles.customRangeLabel}>قيمة مخصصة</Text>
                <Input
                  type="number"
                  placeholder={field === 'min' ? "الحد الأدنى" : "الحد الأقصى"}
                  value={currentValue?.toString() || ''}
                  onChange={(e) => {
                    const value = e.target.value ? parseFloat(e.target.value) : undefined;
                    if (field === 'min') {
                      onPriceChange(value, draftFilters.priceMaxMinor);
                    } else {
                      onPriceChange(draftFilters.priceMinMinor, value);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      );
    }

    // RANGE_SELECTOR - Predefined options
    if (attribute.type === "RANGE_SELECTOR" && attribute.processedOptions) {
      const currentValue = (draftFilters.specs?.[attribute.key] ?? appliedFilters.specs?.[attribute.key]) as number[] | undefined;
      const currentFieldValue = field === 'min' ? currentValue?.[0] : currentValue?.[1];

      return (
        <div className={styles.detailScreen}>
          <div className={styles.optionsList}>
            <div className={styles.selectorOptions}>
              {/* Clear option */}
              <button
                type="button"
                className={`${styles.optionItem} ${currentFieldValue === undefined ? styles.selected : ''}`}
                onClick={() => {
                  const newValue = field === 'min'
                    ? [undefined, currentValue?.[1]]
                    : [currentValue?.[0], undefined];
                  if (newValue[0] === undefined && newValue[1] === undefined) {
                    onFilterChange(attribute.key, undefined);
                  } else {
                    onFilterChange(attribute.key, newValue);
                  }
                  // Return to detail screen after selection (with small delay for visual feedback)
                  setTimeout(() => {
                    onScreenChange({ type: 'detail', attribute });
                  }, 150);
                }}
              >
                <div className={styles.optionContent}>
                  <Text variant="paragraph">الكل</Text>
                </div>
                <span className={styles.checkIconContainer}>
                  {currentFieldValue === undefined && <Check size={18} className={styles.checkIcon} />}
                </span>
              </button>

              {attribute.processedOptions.map((option) => {
                const numValue = parseFloat(option.key);
                const isSelected = currentFieldValue === numValue;
                return (
                  <button
                    key={option.key}
                    type="button"
                    className={`${styles.optionItem} ${isSelected ? styles.selected : ''}`}
                    onClick={() => {
                      const newValue = field === 'min'
                        ? [numValue, currentValue?.[1]]
                        : [currentValue?.[0], numValue];
                      onFilterChange(attribute.key, newValue);
                      // Return to detail screen after selection (with small delay for visual feedback)
                      setTimeout(() => {
                        onScreenChange({ type: 'detail', attribute });
                      }, 150);
                    }}
                  >
                    <div className={styles.optionContent}>
                      <Text variant="paragraph">{option.value}</Text>
                    </div>
                    <span className={styles.checkIconContainer}>
                      {isSelected && <Check size={18} className={styles.checkIcon} />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    // RANGE - Custom input
    if (attribute.type === "RANGE") {
      const currentValue = (draftFilters.specs?.[attribute.key] ?? appliedFilters.specs?.[attribute.key]) as number[] | undefined;
      const currentFieldValue = field === 'min' ? currentValue?.[0] : currentValue?.[1];

      return (
        <div className={styles.detailScreen}>
          <div className={styles.optionsList}>
            <div className={styles.rangeInputSection}>
              <Text variant="h4" className={styles.rangeInputLabel}>
                {field === 'min' ? 'أدخل الحد الأدنى' : 'أدخل الحد الأقصى'}
              </Text>
              <Input
                type="number"
                placeholder={field === 'min' ? "الحد الأدنى" : "الحد الأقصى"}
                value={currentFieldValue?.toString() || ''}
                onChange={(e) => {
                  const value = e.target.value ? parseFloat(e.target.value) : undefined;
                  const newValue = field === 'min'
                    ? [value, currentValue?.[1]]
                    : [currentValue?.[0], value];
                  if (newValue[0] === undefined && newValue[1] === undefined) {
                    onFilterChange(attribute.key, undefined);
                  } else {
                    onFilterChange(attribute.key, newValue);
                  }
                }}
              />
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  // Get animation class based on direction
  const getAnimationClass = () => {
    if (!isAnimating) return '';
    return direction === 'forward' ? styles.slideInFromLeft : styles.slideInFromRight;
  };

  // Render brand selection screen
  const renderBrandScreen = () => {
    if (!brandModelData) return null;

    return (
      <div className={styles.detailScreen}>
        <div className={styles.optionsList}>
          <div className={styles.selectorOptions}>
            {brandModelData.brandOptions.map((brand) => {
              const isSelected = brandModelData.selectedBrandId === brand.key;
              return (
                <button
                  key={brand.key}
                  type="button"
                  className={`${styles.optionItem} ${isSelected ? styles.selected : ''}`}
                  onClick={() => {
                    if (onBrandChange) {
                      onBrandChange(isSelected ? undefined : brand.key);
                    }
                    setTimeout(() => onScreenChange({ type: 'list' }), 150);
                  }}
                >
                  <div className={styles.optionContent}>
                    <Text variant="paragraph">{brand.value}</Text>
                    {brand.count !== undefined && (
                      <Text variant="small" className={styles.optionCount}>
                        ({brand.count})
                      </Text>
                    )}
                  </div>
                  <span className={styles.checkIconContainer}>
                    {isSelected && <Check size={18} className={styles.checkIcon} />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Render model/variant selection screen
  const renderModelScreen = () => {
    if (!brandModelData) return null;

    // Group variants by model, separate standalone models
    const standaloneModels = brandModelData.modelVariantOptions.filter(opt => opt.isModelWithoutVariants);
    const variants = brandModelData.modelVariantOptions.filter(opt => !opt.isModelWithoutVariants);

    // Group variants by modelId
    const variantGroups: Record<string, { label: string; options: typeof variants }> = {};
    variants.forEach(v => {
      if (v.modelId && v.modelName) {
        if (!variantGroups[v.modelId]) {
          variantGroups[v.modelId] = { label: v.modelName, options: [] };
        }
        variantGroups[v.modelId].options.push(v);
      }
    });

    const handleModelVariantSelect = (key: string, isModel: boolean) => {
      if (onModelVariantChange) {
        if (isModel) {
          // Check if already selected
          const isSelected = brandModelData.selectedModelId === key;
          onModelVariantChange(isSelected ? {} : { modelId: key });
        } else {
          const isSelected = brandModelData.selectedVariantId === key;
          onModelVariantChange(isSelected ? {} : { variantId: key });
        }
      }
      setTimeout(() => onScreenChange({ type: 'list' }), 150);
    };

    return (
      <div className={styles.detailScreen}>
        <div className={styles.optionsList}>
          <div className={styles.selectorOptions}>
            {/* Standalone models (no variants) */}
            {standaloneModels.map((model) => {
              const isSelected = brandModelData.selectedModelId === model.key;
              return (
                <button
                  key={model.key}
                  type="button"
                  className={`${styles.optionItem} ${isSelected ? styles.selected : ''}`}
                  onClick={() => handleModelVariantSelect(model.key, true)}
                >
                  <div className={styles.optionContent}>
                    <Text variant="paragraph">{model.value}</Text>
                    {model.count !== undefined && (
                      <Text variant="small" className={styles.optionCount}>
                        ({model.count})
                      </Text>
                    )}
                  </div>
                  <span className={styles.checkIconContainer}>
                    {isSelected && <Check size={18} className={styles.checkIcon} />}
                  </span>
                </button>
              );
            })}

            {/* Variants grouped by model */}
            {Object.entries(variantGroups).map(([modelId, group]) => (
              <div key={modelId}>
                <div className={styles.groupHeader}>
                  <Text variant="h4" className={styles.groupHeaderText}>
                    {group.label}
                  </Text>
                </div>
                {group.options.map((variant) => {
                  const isSelected = brandModelData.selectedVariantId === variant.key;
                  return (
                    <button
                      key={variant.key}
                      type="button"
                      className={`${styles.optionItem} ${isSelected ? styles.selected : ''}`}
                      onClick={() => handleModelVariantSelect(variant.key, false)}
                    >
                      <div className={styles.optionContent}>
                        <Text variant="paragraph">{variant.value}</Text>
                        {variant.count !== undefined && (
                          <Text variant="small" className={styles.optionCount}>
                            ({variant.count})
                          </Text>
                        )}
                      </div>
                      <span className={styles.checkIconContainer}>
                        {isSelected && <Check size={18} className={styles.checkIcon} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Check if brand/model has value (for clear button)
  const hasBrandModelValue = (type: 'brand' | 'model'): boolean => {
    if (!brandModelData) return false;
    if (type === 'brand') return !!brandModelData.selectedBrandId;
    return !!(brandModelData.selectedModelId || brandModelData.selectedVariantId);
  };

  // Clear brand/model filter
  const clearBrandModelFilter = (type: 'brand' | 'model') => {
    if (type === 'brand' && onBrandChange) {
      onBrandChange(undefined);
    } else if (type === 'model' && onModelVariantChange) {
      onModelVariantChange({});
    }
  };

  return (
    <div className={styles.mobileFilterContent}>
      {/* Clear button - for detail screen */}
      {screen.type === 'detail' && hasFilterValue(screen.attribute) && (
        <div className={styles.detailHeader}>
          <Button
            variant="link"
            onClick={() => clearFilter(screen.attribute)}
            icon={<Trash2 size={14} />}
            size="sm"
          >
            مسح الاختيار
          </Button>
        </div>
      )}

      {/* Clear button - for brand screen */}
      {screen.type === 'brand' && hasBrandModelValue('brand') && (
        <div className={styles.detailHeader}>
          <Button
            variant="link"
            onClick={() => clearBrandModelFilter('brand')}
            icon={<Trash2 size={14} />}
            size="sm"
          >
            مسح الاختيار
          </Button>
        </div>
      )}

      {/* Clear button - for model screen */}
      {screen.type === 'model' && hasBrandModelValue('model') && (
        <div className={styles.detailHeader}>
          <Button
            variant="link"
            onClick={() => clearBrandModelFilter('model')}
            icon={<Trash2 size={14} />}
            size="sm"
          >
            مسح الاختيار
          </Button>
        </div>
      )}

      <div className={styles.mobileFilterScrollArea}>
        <div className={`${styles.screenContainer} ${getAnimationClass()}`}>
          {screen.type === 'list' && renderListScreen()}
          {screen.type === 'detail' && renderDetailScreen(screen.attribute)}
          {screen.type === 'range-select' && renderRangeSelectScreen(screen.attribute, screen.field)}
          {screen.type === 'brand' && renderBrandScreen()}
          {screen.type === 'model' && renderModelScreen()}
        </div>
      </div>

      {/* Sticky footer with clear and apply buttons */}
      <div className={styles.stickyFooter}>
        <Button
          variant="outline"
          className={styles.clearButton}
          onClick={onClear}
          icon={<Trash2 size={14} />}
          size="sm"
        >
          مسح الكل
        </Button>
        <Button
          variant="primary"
          className={styles.applyButton}
          onClick={onApply}
          loading={isLoading}
          size="sm"
        >
          عرض النتائج
          <span className={styles.resultCount}>({totalResults})</span>
        </Button>
      </div>
    </div>
  );
};

export default MobileFilterContent;
