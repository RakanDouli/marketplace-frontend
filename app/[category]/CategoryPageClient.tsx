"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { notFound, useRouter } from "next/navigation";
import { Search } from "lucide-react";
import Container from "../../components/slices/Container/Container";
import ListingArea from "../../components/ListingArea/ListingArea";
import { Loading } from "../../components/slices/Loading/Loading";
import { MobileBackButton, Input, Button } from "../../components/slices";

// Dynamic imports for code-splitting - reduces unused JS on initial load
const Filter = dynamic(() => import("../../components/Filter/Filter"), {
  ssr: false,
  loading: () => <div style={{ minHeight: 400 }} />
});

const MobileFilterBar = dynamic(
  () => import("../../components/MobileFilterBar").then(mod => mod.MobileFilterBar),
  { ssr: false }
);
import {
  useCategoriesStore,
  useFiltersStore,
  useSearchStore,
  useListingsStore,
} from "../../stores";
import type { Category, Attribute } from "../../types/listing";
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
}

export default function CategoryPageClient({
  categorySlug,
  searchParams,
  initialAttributes,
  initialTotalResults,
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
    getStoreFilters,
    getBackendFilters,
  } = useSearchStore();

  const { fetchListingsByCategory, setPagination } = useListingsStore();
  const { updateFiltersWithCascading } = useFiltersStore();

  // Local search state for controlled input
  const [localSearch, setLocalSearch] = useState(appliedFilters.search || '');

  // Sync local search with store on mount and when store changes
  useEffect(() => {
    setLocalSearch(appliedFilters.search || '');
  }, [appliedFilters.search]);

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
        // Hydrate store with SSR data - no API call needed!
        hydrateFromSSR(categorySlug, initialAttributes, initialTotalResults || 0);
      } else {
        // Fallback to client-side fetch
        fetchFilterData(categorySlug);
      }

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

  // Handle back navigation
  const handleBack = () => {
    router.push('/');
  };

  return (
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

      {/* Desktop Search Bar - only visible on desktop */}
      <div className={styles.desktopSearchBar}>
        <div className={styles.inputWrapper}>
          <Input
            type="search"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
            placeholder={`ابحث في ${currentCategory.nameAr}...`}
            aria-label="بحث"
            icon={<Search size={18} />}
          />
        </div>
        <Button
          variant="primary"
          onClick={handleSearchSubmit}
          icon={<Search size={20} />}
        >
          بحث
        </Button>
      </div>

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
  );
}
