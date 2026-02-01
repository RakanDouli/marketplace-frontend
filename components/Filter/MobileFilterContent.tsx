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
  }>;
}

export type MobileFilterScreen =
  | { type: 'list' }
  | { type: 'detail'; attribute: FilterAttribute }
  | { type: 'range-select'; attribute: FilterAttribute; field: 'min' | 'max' };

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
      if (!value) return null;
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

  // Render filter list screen
  const renderListScreen = () => (
    <div className={styles.listScreen}>
      {/* Filter list - header/footer handled by Aside */}
      <div className={styles.filterList}>
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

  return (
    <div className={styles.mobileFilterContent}>
      {/* Clear button - fixed under Aside header, only show on detail screen when filter has value */}
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

      <div className={styles.mobileFilterScrollArea}>
        <div className={`${styles.screenContainer} ${getAnimationClass()}`}>
          {screen.type === 'list' && renderListScreen()}
          {screen.type === 'detail' && renderDetailScreen(screen.attribute)}
          {screen.type === 'range-select' && renderRangeSelectScreen(screen.attribute, screen.field)}
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
