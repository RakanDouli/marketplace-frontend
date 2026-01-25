"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { notFound, useRouter } from "next/navigation";
import { Search } from "lucide-react";
import Container from "../../components/slices/Container/Container";
import Filter from "../../components/Filter/Filter";
import ListingArea from "../../components/ListingArea/ListingArea";
import { Loading } from "../../components/slices/Loading/Loading";
import { MobileBackButton, Input, Button } from "../../components/slices";
import { MobileFilterBar } from "../../components/MobileFilterBar";
import {
  useCategoriesStore,
  useFiltersStore,
  useSearchStore,
  useListingsStore,
} from "../../stores";
import type { Category, Attribute, Listing } from "../../types/listing";
import styles from "./CategoryPage.module.scss";

interface CategoryPageClientProps {
  categorySlug: string;
  searchParams: {
    page?: string;
    brand?: string;
    model?: string;
    minPrice?: string;
    maxPrice?: string;
    province?: string;
    city?: string;
    search?: string;
  };
  // SSR props - pre-fetched on server
  initialAttributes?: Attribute[];
  initialTotalResults?: number;
  initialListings?: Listing[];
}

export default function CategoryPageClient({
  categorySlug,
  searchParams,
  initialAttributes,
  initialTotalResults,
  initialListings,
}: CategoryPageClientProps) {
  const router = useRouter();
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [isCategoryLoading, setIsCategoryLoading] = useState(true);
  const [categoryNotFound, setCategoryNotFound] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const initializedRef = useRef(false);

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

  // SYNCHRONOUS hydration (runs during render, not in useEffect)
  // This ensures data is set BEFORE ListingArea's useEffect runs
  const ssrHydratedRef = useRef(false);
  if (!ssrHydratedRef.current) {
    ssrHydratedRef.current = true;

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

    // 2. Hydrate listings store with SSR data (including 0 results)
    // This prevents ListingArea from fetching again
    if (initialListings !== undefined) {
      hydrateListingsFromSSR(categorySlug, initialListings || [], initialTotalResults || 0);
    }
  }

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
      const backendFilters = { categoryId: currentCategorySlug, ...getBackendFilters() };
      await updateFiltersWithCascading(currentCategorySlug, backendFilters);

      const storeFilters = { categoryId: currentCategorySlug, ...getStoreFilters() };
      setPagination({ page: 1 });
      await fetchListingsByCategory(currentCategorySlug, storeFilters, 'grid');
    } catch (error) {
      console.error('Error applying search:', error);
    }
  }, [localSearch, currentCategorySlug, setFilter, getBackendFilters, getStoreFilters, updateFiltersWithCascading, setPagination, fetchListingsByCategory]);

  // Simple category initialization - let stores handle the rest
  useEffect(() => {
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
        // Fallback to client-side fetch for filters
        fetchFilterData(categorySlug);
      }

      // NOTE: Listings hydration is now done SYNCHRONOUSLY above (before useEffect)
      // This prevents race condition where ListingArea refetches without filters

      setIsCategoryLoading(false);
      initializedRef.current = true;
    };

    initializePage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySlug, categories.length, categoriesLoading]);


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

  // Handle back navigation - goes to categories page
  const handleBack = () => {
    router.push('/categories');
  };

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
              placeholder={`ابحث في ${currentCategory.nameAr}...`}
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
          searchPlaceholder={`ابحث في ${currentCategory.nameAr}...`}
        />

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
          <ListingArea />
        </div>
      </div>
      </Container>
    </>
  );
}
