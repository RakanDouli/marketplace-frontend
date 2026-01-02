import { useSearchStore, useFiltersStore } from "../stores";
import { AttributeType } from "../common/enums";

/**
 * Custom hook for managing dynamic attribute filters
 * Handles the logic for different attribute types (selector, multi_selector, range, etc.)
 */
export const useAttributeFilters = () => {
  const { appliedFilters } = useSearchStore();
  const { attributes } = useFiltersStore();

  // Get filtered attributes for rendering - use backend order (groupOrder already sorted by backend)
  const getFilterableAttributes = () => {
    const filtered = attributes
      .filter(
        (attr) =>
          attr.showInFilter && // Only show attributes marked for filters
          (attr.type === AttributeType.SELECTOR ||
            attr.type === AttributeType.MULTI_SELECTOR ||
            attr.type === AttributeType.RANGE ||
            attr.type === AttributeType.RANGE_SELECTOR ||
            attr.type === AttributeType.CURRENCY ||
            attr.type === AttributeType.TEXT) // Include TEXT type for search fields (uppercase from backend)
      );

    return filtered;
    // No sorting - backend already returns attributes in correct order
  };

  // Check if an option is selected for single selector
  const isOptionSelected = (attributeKey: string, optionKey: string) => {
    const currentSpec = appliedFilters.specs?.[attributeKey];
    return typeof currentSpec === "string" && currentSpec === optionKey;
  };

  // Check if an option is selected for multi selector
  const isOptionSelectedInMulti = (attributeKey: string, optionKey: string) => {
    const currentSpec = appliedFilters.specs?.[attributeKey];
    const currentSelected = Array.isArray(currentSpec)
      ? currentSpec
      : typeof currentSpec === "string"
      ? [currentSpec]
      : [];
    return currentSelected.includes(optionKey);
  };

  // Get currently selected options for multi selector
  const getSelectedOptions = (attributeKey: string): string[] => {
    const currentSpec = appliedFilters.specs?.[attributeKey];
    if (Array.isArray(currentSpec)) {
      return currentSpec;
    } else if (typeof currentSpec === "string") {
      return [currentSpec];
    } else {
      return [];
    }
  };

  // Check if selection is at limit for multi selector
  const isAtSelectionLimit = (attributeKey: string, maxSelections?: number) => {
    if (!maxSelections) return false;
    const selectedCount = getSelectedOptions(attributeKey).length;
    return selectedCount >= maxSelections;
  };

  // Check if option should be disabled (at limit and not selected)
  const shouldDisableOption = (
    attributeKey: string,
    optionKey: string,
    maxSelections?: number
  ) => {
    const isSelected = isOptionSelectedInMulti(attributeKey, optionKey);
    const isAtLimit = isAtSelectionLimit(attributeKey, maxSelections);
    return isAtLimit && !isSelected;
  };

  // Get current value for single selector
  const getSingleSelectorValue = (attributeKey: string): string => {
    const currentSpec = appliedFilters.specs?.[attributeKey];
    if (!currentSpec) return "";
    return typeof currentSpec === "string" ? currentSpec : "";
  };

  // Get selection counter text for multi selector
  const getSelectionCounterText = (
    attributeKey: string,
    maxSelections?: number
  ): string => {
    if (!maxSelections) return "";
    const selectedCount = getSelectedOptions(attributeKey).length;
    return `${selectedCount}/${maxSelections} selected`;
  };

  // Toggle selection for multi selector
  const toggleMultiSelection = (
    attributeKey: string,
    optionKey: string,
    currentSelected: string[]
  ): string[] | undefined => {
    const isSelected = currentSelected.includes(optionKey);

    let newSelected: string[];
    if (isSelected) {
      // Remove from selection
      newSelected = currentSelected.filter((key) => key !== optionKey);
    } else {
      // Add to selection
      newSelected = [...currentSelected, optionKey];
    }

    return newSelected.length > 0 ? newSelected : undefined;
  };

  // Handle checkbox change for multi selector
  const handleCheckboxChange = (
    attributeKey: string,
    optionKey: string,
    isChecked: boolean,
    currentSelected: string[]
  ): string[] | undefined => {
    let newSelected: string[];
    if (isChecked) {
      newSelected = [...currentSelected, optionKey];
    } else {
      newSelected = currentSelected.filter((key) => key !== optionKey);
    }

    return newSelected.length > 0 ? newSelected : undefined;
  };

  return {
    // Attribute filtering
    getFilterableAttributes,

    // Single selector helpers
    isOptionSelected,
    getSingleSelectorValue,

    // Multi selector helpers
    isOptionSelectedInMulti,
    getSelectedOptions,
    isAtSelectionLimit,
    shouldDisableOption,
    getSelectionCounterText,
    toggleMultiSelection,
    handleCheckboxChange,
  };
};