"use client";

import React, { useEffect, useLayoutEffect, useState, useRef, useCallback, useMemo } from "react";
import { notFound, useRouter } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import Container from "../../../components/slices/Container/Container";
import Filter from "../../../components/Filter/Filter";
import ListingArea from "../../../components/ListingArea/ListingArea";
import { Loading } from "../../../components/slices/Loading/Loading";
import { MobileBackButton, Input, Button, Text } from "../../../components/slices";
import { MobileFilterBar } from "../../../components/MobileFilterBar";
import { MobileCatalogSelector } from "../../../components/MobileCatalogSelector";
import {
  useCategoriesStore,
  useFiltersStore,
  useSearchStore,
  useListingsStore,
} from "../../../stores";
import { useIsMobile } from "../../../hooks";
import { getListingTypeLabel } from "../../../utils/categoryRouting";
import { ListingType } from "../../../common/enums";
import type { Category, Attribute, Listing } from "../../../types/listing";
import styles from "./CategoryListings.module.scss";

interface CategoryListingsClientProps {
  categorySlug: string;
  listingType: ListingType;
  listingTypeSlug: string; // "sell" or "rent"
  searchParams: {
    page?: string;
    brand?: string;
    brandId?: string; // UUID for brand selection
    variantId?: string; // UUID for variant selection (skipping model)
    minPrice?: string;
    maxPrice?: string;
    province?: string;
    city?: string;
    search?: string;
    showListings?: string; // "true" to skip mobile selector (Show All)
  };
  // SSR props - pre-fetched on server
  initialAttributes?: Attribute[];
  initialTotalResults?: number;
  initialListings?: Listing[];
}

export default function CategoryListingsClient({
  categorySlug,
  listingType,
  listingTypeSlug,
  searchParams,
  initialAttributes,
  initialTotalResults,
  initialListings,
}: CategoryListingsClientProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [isCategoryLoading, setIsCategoryLoading] = useState(true);
  const [categoryNotFound, setCategoryNotFound] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const initializedRef = useRef(false);

  // Mobile drill-down state
  const hasBrandId = !!searchParams.brandId;
  const hasVariantId = !!searchParams.variantId;

  // Use ref to "lock in" showListings=true once it's set
  // This prevents race conditions where re-renders temporarily lose the searchParam
  const showListingsLockedRef = useRef(false);
  const showListingsFromUrl = searchParams.showListings?.toString().trim().toLowerCase() === "true";

  // Lock in showListings when URL has it
  if (showListingsFromUrl) {
    showListingsLockedRef.current = true;
  }

  // Reset the lock when user navigates back to brand selector (no params at all)
  // This happens when user clicks back from listings to go back to brand selection
  const hasNoFilterParams = !hasBrandId && !hasVariantId && !showListingsFromUrl;
  if (hasNoFilterParams && showListingsLockedRef.current) {
    // User navigated back to base URL - reset the lock
    showListingsLockedRef.current = false;
  }

  const showListingsExplicitly = showListingsLockedRef.current;

  // Extract brand options from initialAttributes for mobile selector
  // Note: processedOptions is added by SSR code, not in the Attribute type
  const brandOptions = useMemo(() => {
    if (!initialAttributes) return [];
    const brandAttr = initialAttributes.find((attr) => attr.key === "brandId") as any;
    const options = brandAttr?.processedOptions || brandAttr?.options || [];
    return options.map((opt: any) => ({
      id: opt.key || opt.id,
      name: opt.value,
      count: opt.count,
    }));
  }, [initialAttributes]);

  // Check if category has brand/model attributes (for mobile drill-down)
  const hasBrandAttribute = brandOptions.length > 0;

  // Determine mobile selector step
  // Only show drill-down for categories with brand attributes
  // - No brandId and not "showListings" → show brand selector
  // - Has brandId but no variantId and not "showListings" → show variant selector
  // - Has both or "showListings" → show listings
  const mobileSelectorStep = useMemo(() => {
    // Skip drill-down for categories without brand attributes
    if (!hasBrandAttribute) return null;
    if (showListingsExplicitly) return null; // User chose "Show All"
    if (!hasBrandId) return "brand";
    if (!hasVariantId) return "variant";
    return null; // Both selected, show listings
  }, [hasBrandAttribute, hasBrandId, hasVariantId, showListingsExplicitly]);

  // Extract variant options for selected brand (include modelName for grouping)
  const variantOptions = useMemo(() => {
    if (!initialAttributes || !searchParams.brandId) return [];
    const variantAttr = initialAttributes.find((attr) => attr.key === "variantId") as any;
    const options = variantAttr?.processedOptions || variantAttr?.options || [];
    return options.map((opt: any) => ({
      id: opt.key || opt.id,
      name: opt.value,
      count: opt.count,
      modelName: opt.groupLabel || opt.modelName, // Include model name for grouping
    }));
  }, [initialAttributes, searchParams.brandId]);

  // Get selected brand name for display
  const selectedBrandName = useMemo(() => {
    if (!searchParams.brandId || !brandOptions.length) return "";
    const brand = brandOptions.find((b: { id: string; name: string }) => b.id === searchParams.brandId);
    return brand?.name || "";
  }, [searchParams.brandId, brandOptions]);

  // Store hooks - minimal usage, let components handle their own store coordination
  const {
    categories,
    isLoading: categoriesLoading,
    fetchCategories,
    getCategoryBySlug,
    setSelectedCategory,
  } = useCategoriesStore();

  const { fetchFilterData, hydrateFromSSR, currentCategorySlug } = useFiltersStore();

  // Search store for search functionality
  const {
    appliedFilters,
    setFilter,
    setSpecFilter,
    getStoreFilters,
    getBackendFilters,
  } = useSearchStore();

  const { fetchListingsByCategory, setPagination, hydrateFromSSR: hydrateListingsFromSSR } = useListingsStore();
  const { updateFiltersWithCascading } = useFiltersStore();

  // Local search state for controlled input - initialize from URL params if available
  const [localSearch, setLocalSearch] = useState(searchParams.search || appliedFilters.search || '');

  // Track previous values to re-hydrate when URL params change (including brandId/modelId)
  const lastHydratedRef = useRef<string | null>(null);
  // Include filter params in key so hydration re-runs when they change
  const currentKey = `${categorySlug}-${listingType}-${searchParams.brandId || ''}-${searchParams.variantId || ''}-${searchParams.showListings || ''}`;

  // Hydrate stores from URL params using useLayoutEffect (runs before paint, after render)
  // This ensures data is set early but avoids "setState during render" errors
  useLayoutEffect(() => {
    // Re-hydrate if this is first render OR if any key param changed
    if (lastHydratedRef.current === currentKey) {
      return;
    }
    lastHydratedRef.current = currentKey;

    // 1. Hydrate searchStore from URL params so filters show as applied
    if (searchParams.search) {
      setFilter('search', searchParams.search);
    }
    if (searchParams.province) {
      setSpecFilter('location', searchParams.province);
    }
    if (searchParams.minPrice) {
      setFilter('priceMinMinor', parseInt(searchParams.minPrice, 10));
    }
    if (searchParams.maxPrice) {
      setFilter('priceMaxMinor', parseInt(searchParams.maxPrice, 10));
    }

    // Hydrate brand/variant filters from URL (mobile selector flow)
    // Also clear filters that are no longer in URL (for back navigation)
    if (searchParams.brandId) {
      setSpecFilter('brandId', searchParams.brandId);
    } else {
      // Clear brandId if not in URL (user navigated back)
      setSpecFilter('brandId', undefined);
    }
    if (searchParams.variantId) {
      setSpecFilter('variantId', searchParams.variantId);
    } else {
      // Clear variantId if not in URL (user navigated back or changed brand)
      setSpecFilter('variantId', undefined);
    }

    // 2. Set listingType filter
    setFilter('listingType', listingType);

    // 3. Hydrate listings store with SSR data (including 0 results)
    // This prevents ListingArea from fetching again
    if (initialListings !== undefined) {
      hydrateListingsFromSSR(categorySlug, initialListings || [], initialTotalResults || 0, listingType);
    }
  }, [currentKey, categorySlug, listingType, searchParams, initialListings, initialTotalResults, setFilter, setSpecFilter, hydrateListingsFromSSR]);

  // Sync local search with store when store changes (for in-page searches)
  useEffect(() => {
    // Only sync if no URL search param (avoid overwriting URL-based search)
    if (!searchParams.search && appliedFilters.search) {
      setLocalSearch(appliedFilters.search);
    }
  }, [appliedFilters.search, searchParams.search]);

  // Handle search submit
  const handleSearchSubmit = useCallback(async () => {
    if (!currentCategorySlug) return;

    // Update search filter
    setFilter('search', localSearch.trim() || undefined);

    // Trigger listing refresh
    try {
      const backendFilters = { categoryId: currentCategorySlug, listingType, ...getBackendFilters() };
      await updateFiltersWithCascading(currentCategorySlug, backendFilters);

      const storeFilters = { categoryId: currentCategorySlug, listingType, ...getStoreFilters() };
      setPagination({ page: 1 });
      await fetchListingsByCategory(currentCategorySlug, storeFilters, 'grid');
    } catch (error) {
      console.error('Error applying search:', error);
    }
  }, [localSearch, currentCategorySlug, listingType, setFilter, getBackendFilters, getStoreFilters, updateFiltersWithCascading, setPagination, fetchListingsByCategory]);

  // Track last initialized key to detect navigation between listing types
  const lastInitializedKeyRef = useRef<string | null>(null);
  const initKey = `${categorySlug}-${listingType}`;

  // Simple category initialization - let stores handle the rest
  useEffect(() => {
    // Reset initialization if category/listingType changed
    if (lastInitializedKeyRef.current !== initKey) {
      initializedRef.current = false;
    }

    // Prevent re-initialization on function reference changes
    if (initializedRef.current && currentCategory) {
      return;
    }

    const initializePage = async () => {
      // Ensure categories are loaded
      if (categories.length === 0 && !categoriesLoading) {
        await fetchCategories();
        return;
      }

      if (categories.length === 0) {
        setIsCategoryLoading(true);
        setCategoryNotFound(false);
        return;
      }

      // Find category
      setIsCategoryLoading(true);
      setCategoryNotFound(false);

      const category = getCategoryBySlug(categorySlug);

      if (!category) {
        setCategoryNotFound(true);
        setIsCategoryLoading(false);
        return;
      }

      setCurrentCategory(category);
      setSelectedCategory(category);

      // HYBRID SSR: Use server-fetched data if available, otherwise fetch client-side
      if (initialAttributes && initialAttributes.length > 0) {
        // Hydrate filters store with SSR data - no API call needed!
        hydrateFromSSR(categorySlug, initialAttributes, initialTotalResults || 0);
      } else {
        // Fallback to client-side fetch for filters - include listingType!
        fetchFilterData(categorySlug, listingType);
      }

      // NOTE: Listings hydration is now done SYNCHRONOUSLY above (before useEffect)
      // This prevents race condition where ListingArea refetches without filters

      setIsCategoryLoading(false);
      initializedRef.current = true;
      lastInitializedKeyRef.current = initKey;
    };

    initializePage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySlug, listingType, categories.length, categoriesLoading]);


  // Check for 404
  if (categoryNotFound) {
    notFound();
  }

  // Loading state
  if (isCategoryLoading) {
    return (
      <Container>
        <div className={styles.loading}>
          <Loading type="svg" />
        </div>
      </Container>
    );
  }

  if (!currentCategory) {
    return null;
  }

  // Handle back navigation
  // On mobile with filters: go back through drill-down (variant → brand → category)
  // On desktop or no filters: go to category preloader or categories page
  const handleBack = () => {
    // Mobile drill-down back navigation
    if (isMobile) {
      if (searchParams.variantId && searchParams.brandId) {
        // Has both filters: go back to variant selector (keep brand, remove variant)
        router.push(`/${categorySlug}/${listingTypeSlug}?brandId=${searchParams.brandId}`);
        return;
      }
      if (searchParams.brandId && !searchParams.variantId) {
        // Has brand only: go back to brand selector (remove brand)
        router.push(`/${categorySlug}/${listingTypeSlug}`);
        return;
      }
      if (searchParams.showListings === "true") {
        // Came from "Show All" button: go back to selector
        router.push(`/${categorySlug}/${listingTypeSlug}`);
        return;
      }
    }

    // Default navigation (desktop or no mobile filters)
    const supportedTypes = currentCategory.supportedListingTypes || [ListingType.SALE];
    if (supportedTypes.length > 1) {
      router.push(`/${categorySlug}`);
    } else {
      router.push('/categories');
    }
  };

  const typeLabel = getListingTypeLabel(listingType);

  // Show mobile catalog selector if on mobile and user hasn't selected brand/variant yet
  if (isMobile && mobileSelectorStep) {
    return (
      <MobileCatalogSelector
        step={mobileSelectorStep}
        categorySlug={categorySlug}
        listingType={listingTypeSlug}
        categoryNameAr={currentCategory.nameAr}
        options={mobileSelectorStep === "brand" ? brandOptions : variantOptions}
        selectedBrandId={searchParams.brandId}
        selectedBrandName={selectedBrandName}
        totalCount={initialTotalResults}
        isLoading={isCategoryLoading}
      />
    );
  }

  return (
    <>
      {/* Desktop Search Bar - at top of page, outside container */}
      <div className={styles.searchBarWrapper}>
        <div className={styles.desktopSearchBar}>
          <div className={styles.inputWrapper}>
            <Input
              type="search"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
              placeholder={`ابحث في ${currentCategory.nameAr} ${typeLabel}...`}
              aria-label="بحث"
              icon={<Search size={18} />}
            />
          </div>
          <Button
            variant="primary"
            onClick={handleSearchSubmit}
            icon={<Search size={20} />}
            className={styles.searchButton}
            aria-label="بحث"
            disabled={!localSearch.trim()}
          />
        </div>
      </div>

      <Container className={styles.categoryPage}>
        {/* Mobile Header with Search - only visible on mobile */}
        <MobileBackButton
          onClick={handleBack}
          showSearch
          searchValue={localSearch}
          onSearchChange={setLocalSearch}
          onSearchSubmit={handleSearchSubmit}
          searchPlaceholder={`ابحث في ${currentCategory.nameAr} ${typeLabel}...`}
        />

        {/* Listing Type Badge */}
        <div className={styles.typeHeader}>
          <Button
            variant="outline"
            className={styles.tabletFilterButton}
            onClick={() => setIsFilterOpen(true)}
            icon={<SlidersHorizontal size={20} />}
          >
            الفلاتر
          </Button>
          <Text variant="h2" className={styles.pageTitle}>
            {currentCategory.nameAr} <span className={styles.typeBadge}>{typeLabel}</span>
          </Text>
          {/* Tablet Filter Button - only shows between lg and md */}

        </div>

        {/* Mobile Filter Bar - below MobileBackButton, only visible on mobile */}
        <MobileFilterBar onFilterClick={() => setIsFilterOpen(true)} />

        {/* Main Content */}
        <div className={styles.content}>
          {/* Filters Sidebar */}
          <div className={styles.filtersSection}>
            <Filter
              isOpen={isFilterOpen}
              onOpenChange={setIsFilterOpen}
            />
          </div>

          {/* Listings Area */}
          <div className={styles.listingsSection}>
            <ListingArea listingType={listingType} listingTypeSlug={listingTypeSlug} />
          </div>
        </div>
      </Container>
    </>
  );
}
