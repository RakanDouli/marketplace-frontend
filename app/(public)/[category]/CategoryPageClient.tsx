"use client";

import React, { useEffect, useState, useMemo } from "react";
import { notFound } from "next/navigation";
import Container from "../../../components/slices/Container/Container";
import Text from "../../../components/slices/Text/Text";
import Filter from "../../../components/Filter/Filter";
import ListingArea from "../../../components/ListingArea/ListingArea";
import { Loading } from "../../../components/slices/Loading/Loading";
import {
  useCategoriesStore,
  useListingsStore,
  useFiltersStore,
  useSearchStore,
} from "../../../stores";
import type { SearchFilters } from "../../../stores/searchStore";
import { useTranslation } from "../../../hooks/useTranslation";
import type { Category } from "../../../stores/types";
import type { FilterValues } from "../../../components/Filter/Filter";
import type { SortOption } from "../../../components/slices/SortControls/SortControls";
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
}

export default function CategoryPageClient({
  categorySlug,
  searchParams,
}: CategoryPageClientProps) {
  const { t } = useTranslation();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [isCategoryLoading, setIsCategoryLoading] = useState(true);
  const [categoryNotFound, setCategoryNotFound] = useState(false);
  const [currentSort, setCurrentSort] = useState<SortOption>("createdAt_desc");
  const [isSorting, setIsSorting] = useState(false);

  // Use centralized search store instead of local filter state
  const {
    activeFilters,
    setFilters,
    getBackendFilters,
    getStoreFilters,
    clearAllFilters,
    setFromUrlParams,
    removeFilter,
    removeSpecFilter,
  } = useSearchStore();

  // Store hooks
  const {
    categories,
    isLoading: categoriesLoading,
    fetchCategories,
    fetchCategoryBySlug,
    setSelectedCategory,
  } = useCategoriesStore();

  const {
    listings,
    isLoading: listingsLoading,
    fetchListingsByCategory,
    pagination,
    setPagination,
    setSortFilter,
  } = useListingsStore();

  // Filters store for cascading updates
  const {
    updateFiltersWithCascading,
    fetchFilterData,
    attributes, // All specs (including brands/models) are in attributes now
  } = useFiltersStore();

  // Get totalResults from listings store (single source of truth)
  const totalResults = useListingsStore((state) => state.pagination.total);

  // Load categories once on mount
  useEffect(() => {
    if (categories.length === 0) {
      fetchCategories();
    }
  }, [fetchCategories, categories.length]);

  // Load category when route changes
  useEffect(() => {
    const loadCategory = async () => {
      setIsCategoryLoading(true);
      setCategoryNotFound(false);

      try {
        // Fetch current category by slug
        const category = await fetchCategoryBySlug(categorySlug);

        if (!category) {
          setCategoryNotFound(true);
          setIsCategoryLoading(false);
          return;
        }

        setCurrentCategory(category);
        setSelectedCategory(category);

        // Initialize filter data for the category
        fetchFilterData(categorySlug);

        setIsCategoryLoading(false);
      } catch (error) {
        console.error("Error loading category:", error);
        setCategoryNotFound(true);
        setIsCategoryLoading(false);
      }
    };

    loadCategory();
  }, [categorySlug, fetchCategoryBySlug, setSelectedCategory]);

  // Initialize search store from URL params
  useEffect(() => {
    if (Object.keys(searchParams).length > 0) {
      console.log(
        "🔗 CategoryPageClient: Initializing from URL params",
        searchParams
      );
      const urlParams = new URLSearchParams();

      // Add URL search params
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value) urlParams.set(key, value);
      });

      setFromUrlParams(urlParams);
    }
  }, [searchParams, setFromUrlParams]);

  // Memoize parsed filters to prevent unnecessary recalculations
  const parsedFilters = useMemo(
    () => ({
      page: searchParams.page ? parseInt(searchParams.page, 10) : 1,
      filters: {
        minPrice: searchParams.minPrice
          ? parseInt(searchParams.minPrice, 10)
          : undefined,
        maxPrice: searchParams.maxPrice
          ? parseInt(searchParams.maxPrice, 10)
          : undefined,
        location: searchParams.province || searchParams.city,
        search: searchParams.search,
      },
    }),
    [searchParams]
  );

  // Filter conversion functions are now handled by searchStore

  // Handle filter application with cascading updates using searchStore
  const handleApplyFilters = async (filterValues: FilterValues) => {
    console.log("🎯 ===== CATEGORY PAGE: handleApplyFilters START =====");
    console.log(
      "📋 CategoryPageClient: Raw filter values received:",
      JSON.stringify(filterValues, null, 2)
    );
    console.log(
      "📦 CategoryPageClient: Current searchStore state:",
      activeFilters
    );

    if (!currentCategory) return;

    try {
      // Step 1: Update search store with new filters
      console.log("🔄 Step 1: Updating search store...");
      setFilters(filterValues);

      // Step 2: Get backend filters for cascading
      console.log("🔄 Step 2: Getting backend filters for cascading...");
      const backendFilters = {
        categoryId: currentCategory.slug,
        ...getBackendFilters(),
      };

      // Step 3: Update cascading filters (this updates filter options based on selection)
      console.log("🔄 Step 3: Triggering cascading filter updates...");
      await updateFiltersWithCascading(currentCategory.slug, backendFilters);

      // Step 4: Get store filters and preserve current sort
      console.log("🔄 Step 4: Getting store filters for listings...");
      const storeFilters = {
        categoryId: currentCategory.slug,
        ...getStoreFilters(),
        sort: currentSort,
      };

      // Step 5: Reset pagination to page 1 when filters change
      setPagination({ page: 1 });

      // Step 6: Update listings area with new filters
      console.log("📊 Step 6: Refreshing listings with filters...");
      await fetchListingsByCategory(currentCategory.slug, storeFilters);

      // Step 7: Update URL to reflect new filters (optional, for better UX)
      const url = new URL(window.location.href);
      // Reset page to 1 when filters change
      url.searchParams.delete("page");
      window.history.pushState({}, "", url.toString());

      console.log("🎯 ===== CATEGORY PAGE: handleApplyFilters SUCCESS =====");
      console.log(
        "✅ CategoryPageClient: All stores coordinated successfully!"
      );
    } catch (error) {
      console.error("❌ Error applying cascading filters:", error);

      // Fallback: Just update listings without cascading
      const storeFilters = {
        categoryId: currentCategory.slug,
        ...getStoreFilters(),
        sort: currentSort,
      };
      setPagination({ page: 1 });
      fetchListingsByCategory(currentCategory.slug, storeFilters);
    }
  };

  // Load listings when category or parsed filters change
  useEffect(() => {
    if (!currentCategory) return;

    const loadListings = async () => {
      // Set pagination page before fetching
      setPagination({ page: parsedFilters.page });

      try {
        const filtersWithSort = { ...parsedFilters.filters, sort: currentSort };
        await fetchListingsByCategory(currentCategory.slug, filtersWithSort);
      } catch (error) {
        console.error("Error loading listings:", error);
      }
    };

    loadListings();
  }, [
    currentCategory,
    parsedFilters,
    currentSort,
    fetchListingsByCategory,
    setPagination,
  ]);

  // Data transformation now handled directly in ListingArea component

  const handleCardClick = (listingId: string) => {
    // TODO: Navigate to listing detail page
    console.log("Navigate to listing:", listingId);
  };

  const handleCardLike = (listingId: string, liked: boolean) => {
    // TODO: Update user favorites
    console.log("Toggle like:", listingId, liked);
  };

  const handleToggleFilters = () => {
    setFiltersOpen(!filtersOpen);
  };

  const handlePageChange = async (page: number) => {
    // Update pagination state immediately for better UX
    setPagination({ page });

    // Update URL with new page parameter
    const url = new URL(window.location.href);
    url.searchParams.set("page", page.toString());
    window.history.pushState({}, "", url.toString());

    // Fetch listings for new page with current filters and sort
    if (currentCategory) {
      const storeFilters = {
        categoryId: currentCategory.slug,
        ...getStoreFilters(),
        sort: currentSort,
      };
      try {
        await fetchListingsByCategory(currentCategory.slug, storeFilters);
      } catch (error) {
        console.error("Error loading listings for page:", page, error);
      }
    }
  };

  const handleRemoveFilter = async (filterKey: string) => {
    console.log("🗑️ CategoryPageClient: Removing filter", filterKey);

    if (!currentCategory) return;

    // Remove the specific filter using searchStore methods
    if (filterKey.startsWith("specs.")) {
      // Remove from specs object
      const specKey = filterKey.replace("specs.", "");
      removeSpecFilter(specKey);
    } else {
      // Remove from root level (includes brandId, modelId, price, location, etc.)
      removeFilter(filterKey as keyof SearchFilters);
    }

    // After removal, get the updated filters and refresh listings
    try {
      // Step 1: Get updated backend filters for cascading
      const backendFilters = {
        categoryId: currentCategory.slug,
        ...getBackendFilters(),
      };

      // Step 2: Update cascading filters (this updates filter options based on selection)
      await updateFiltersWithCascading(currentCategory.slug, backendFilters);

      // Step 3: Get updated store filters and refresh listings
      const storeFilters = {
        categoryId: currentCategory.slug,
        ...getStoreFilters(),
        sort: currentSort,
      };

      // Step 4: Reset pagination to page 1 when filters change
      setPagination({ page: 1 });

      // Step 5: Update listings area with new filters
      await fetchListingsByCategory(currentCategory.slug, storeFilters);

      console.log("✅ Filter removed and listings updated!");
    } catch (error) {
      console.error("❌ Error removing filter:", error);
    }
  };

  const handleClearAllFilters = async () => {
    console.log("🧹 CategoryPageClient: Clearing all filters");
    clearAllFilters();
    // Apply cleared filters from store
    await handleApplyFilters({});
  };

  const handleSortChange = async (sort: SortOption) => {
    setCurrentSort(sort);
    setIsSorting(true);
    console.log("Sort changed to:", sort);

    // Set sort in store and refetch listings
    setSortFilter(sort);

    if (currentCategory) {
      const storeFilters = {
        categoryId: currentCategory.slug,
        ...getStoreFilters(),
        sort: sort,
      };
      try {
        await fetchListingsByCategory(currentCategory.slug, storeFilters);
        console.log("✅ Listings updated with new sorting:", sort);
      } catch (error) {
        console.error("❌ Error applying sort:", error);
      }
    }

    setIsSorting(false);
  };

  // Check for 404 during render phase
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

  // This should never render if category is not found since notFound() would have been called
  if (!currentCategory) {
    return null;
  }

  return (
    <Container className={styles.categoryPage}>
      {/* Main Content */}
      <div className={styles.content}>
        {/* Filters Sidebar */}
        <div className={styles.filtersSection}>
          <Filter
            isOpen={filtersOpen}
            onClose={() => setFiltersOpen(false)}
            categorySlug={currentCategory.slug}
            onApplyFilters={handleApplyFilters}
            initialValues={activeFilters}
          />
        </div>

        {/* Listings Area */}
        <div className={styles.listingsSection}>
          <ListingArea
            onCardClick={handleCardClick}
            onCardLike={handleCardLike}
            onToggleFilters={handleToggleFilters}
          />
        </div>
      </div>
    </Container>
  );
}
