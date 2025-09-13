"use client";

import React, { useEffect, useState, useMemo } from "react";
import { notFound } from "next/navigation";
import Container from "../../../components/slices/Container/Container";
import Text from "../../../components/slices/Text/Text";
import Filter from "../../../components/Filter/Filter";
import ListingArea from "../../../components/ListingArea/ListingArea";
import { useCategoriesStore, useListingsStore, useFiltersStore } from "../../../stores";
import { useTranslation } from "../../../hooks/useTranslation";
import type { ListingData } from "../../../components/ListingArea/ListingArea";
import type { Category } from "../../../stores/types";
import type { FilterValues } from "../../../components/Filter/Filter";
import type { SortOption } from "../../../components/SortControls/SortControls";
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
  const [currentFilters, setCurrentFilters] = useState<FilterValues>({});
  const [currentSort, setCurrentSort] = useState<SortOption>('createdAt_desc');
  const [isSorting, setIsSorting] = useState(false);

  // Store hooks
  const { 
    categories, 
    isLoading: categoriesLoading, 
    fetchCategories, 
    fetchCategoryBySlug,
    setSelectedCategory 
  } = useCategoriesStore();
  
  const { 
    listings, 
    isLoading: listingsLoading, 
    fetchListingsByCategory,
    pagination,
    setPagination,
    setSortFilter
  } = useListingsStore();
  
  // Filters store for cascading updates
  const { 
    updateFiltersWithCascading,
    fetchFilterData,
    attributes // All specs (including brands/models) are in attributes now
  } = useFiltersStore();

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
        console.error('Error loading category:', error);
        setCategoryNotFound(true);
        setIsCategoryLoading(false);
      }
    };
    
    loadCategory();
  }, [categorySlug, fetchCategoryBySlug, setSelectedCategory]);

  // Memoize parsed filters to prevent unnecessary recalculations
  const parsedFilters = useMemo(() => ({
    page: searchParams.page ? parseInt(searchParams.page, 10) : 1,
    filters: {
      minPrice: searchParams.minPrice ? parseInt(searchParams.minPrice, 10) : undefined,
      maxPrice: searchParams.maxPrice ? parseInt(searchParams.maxPrice, 10) : undefined,
      location: searchParams.province || searchParams.city,
      search: searchParams.search,
    }
  }), [searchParams]);

  // Convert FilterValues to backend aggregation format (dynamic specs approach)
  const convertFiltersForBackend = (filterValues: FilterValues) => {
    const backendFilters: any = {
      categoryId: categorySlug // Use categoryId instead of hardcoded category enum
    };
    
    // All attribute filters go into specs object (dynamic approach)
    if (filterValues.specs && Object.keys(filterValues.specs).length > 0) {
      const specs: Record<string, any> = {};
      
      Object.entries(filterValues.specs).forEach(([key, value]) => {
        if (value.selected) {
          specs[key] = Array.isArray(value.selected) ? value.selected[0] : value.selected;
        }
      });
      
      if (Object.keys(specs).length > 0) {
        backendFilters.specs = specs;
      }
    }
    
    console.log('🔄 Backend filters for cascading (dynamic):', backendFilters);
    return backendFilters;
  };

  // Convert FilterValues to listingsStore format (pure dynamic approach)
  const convertFiltersForStore = (filterValues: FilterValues) => {
    const storeFilters: any = {
      categoryId: categorySlug // Set category for filtering
    };
    
    // Price filters (both formats for compatibility)
    if (filterValues.priceMinMinor) {
      storeFilters.minPrice = filterValues.priceMinMinor / 100; // Convert minor to major currency
      storeFilters.priceMinMinor = filterValues.priceMinMinor; // Also send minor format
    }
    if (filterValues.priceMaxMinor) {
      storeFilters.maxPrice = filterValues.priceMaxMinor / 100;
      storeFilters.priceMaxMinor = filterValues.priceMaxMinor;
    }
    if (filterValues.priceCurrency) {
      storeFilters.priceCurrency = filterValues.priceCurrency;
    }
    
    // Location filters
    if (filterValues.province) {
      storeFilters.location = filterValues.province;
      storeFilters.province = filterValues.province;
    }
    if (filterValues.city) {
      storeFilters.location = filterValues.city; // City overrides province
      storeFilters.city = filterValues.city;
    }
    
    // Search filter
    if (filterValues.search) {
      storeFilters.search = filterValues.search;
    }
    
    // Initialize specs object for dynamic attributes (including brand/model)
    const specs: Record<string, any> = {};
    
    // Brand and Model filters now go into specs object (unified system)
    if (filterValues.brandId) {
      specs.brandId = filterValues.brandId;
      storeFilters.brandId = filterValues.brandId; // Keep for backward compatibility
    }
    if (filterValues.modelId) {
      specs.modelId = filterValues.modelId;
      storeFilters.modelId = filterValues.modelId; // Keep for backward compatibility
    }
    
    // All other dynamic attribute filters go into specs object
    if (filterValues.specs && Object.keys(filterValues.specs).length > 0) {
      Object.entries(filterValues.specs).forEach(([key, value]) => {
        if (value?.selected) {
          const selectedValue = Array.isArray(value.selected) ? value.selected[0] : value.selected;
          specs[key] = selectedValue;
        }
      });
    }
    
    // Add specs to storeFilters if any specs exist
    if (Object.keys(specs).length > 0) {
      storeFilters.specs = specs;
    }
    
    console.log('📊 Store filters for listings (dynamic):', storeFilters);
    return storeFilters;
  };

  // Handle filter application with cascading updates
  const handleApplyFilters = async (filterValues: FilterValues) => {
    console.log('🎯 Applying filters with cascading:', filterValues);
    setCurrentFilters(filterValues);
    
    if (!currentCategory) return;
    
    try {
      // Step 1: Convert filters for backend aggregation (cascading)
      const backendFilters = convertFiltersForBackend(filterValues);
      
      // Step 2: Update cascading filters (this updates filter options based on selection)
      console.log('🔄 Triggering cascading filter updates...');
      await updateFiltersWithCascading(currentCategory.slug, backendFilters);
      
      // Step 3: Convert filters for listings store and preserve current sort
      const storeFilters = { ...convertFiltersForStore(filterValues), sort: currentSort };
      
      // Step 4: Reset pagination to page 1 when filters change
      setPagination({ page: 1 });
      
      // Step 5: Update listings area with new filters
      console.log('📊 Refreshing listings with filters...');
      await fetchListingsByCategory(currentCategory.slug, storeFilters);
      
      // Step 6: Update URL to reflect new filters (optional, for better UX)
      const url = new URL(window.location.href);
      // Reset page to 1 when filters change
      url.searchParams.delete('page');
      window.history.pushState({}, '', url.toString());
      
      console.log('✅ Cascading filters and listings updated!');
    } catch (error) {
      console.error('❌ Error applying cascading filters:', error);
      
      // Fallback: Just update listings without cascading
      const storeFilters = { ...convertFiltersForStore(filterValues), sort: currentSort };
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
        console.error('Error loading listings:', error);
      }
    };

    loadListings();
  }, [currentCategory, parsedFilters, currentSort, fetchListingsByCategory, setPagination]);

  // Convert store listings to component format
  const listingData: ListingData[] = (listings || []).map((listing) => ({
    id: listing.id,
    title: listing.title,
    price: listing.prices?.[0]?.value || `${(listing.priceMinor / 100).toLocaleString()}`,
    currency: listing.prices?.[0]?.currency || 'USD',
    firstRegistration: listing.createdAt ? new Date(listing.createdAt).getFullYear().toString() : "",
    mileage: "", // Add if available in specs
    fuelType: "", // Add if available in specs
    location: listing.city || "",
    sellerType: "private" as const,
    images: listing.imageKeys || [],
  }));

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
    url.searchParams.set('page', page.toString());
    window.history.pushState({}, '', url.toString());
    
    // Fetch listings for new page with current filters and sort
    if (currentCategory) {
      const storeFilters = { ...convertFiltersForStore(currentFilters), sort: currentSort };
      try {
        await fetchListingsByCategory(currentCategory.slug, storeFilters);
      } catch (error) {
        console.error('Error loading listings for page:', page, error);
      }
    }
  };

  const handleRemoveFilter = async (filterKey: string) => {
    const updatedFilters = { ...currentFilters };
    
    // Remove the specific filter
    if (filterKey === 'brandId' || filterKey === 'modelId') {
      // Remove brand/model from root level
      delete updatedFilters[filterKey as keyof FilterValues];
    } else if (filterKey.startsWith('specs.')) {
      // Remove from specs object
      const specKey = filterKey.replace('specs.', '');
      if (updatedFilters.specs) {
        delete updatedFilters.specs[specKey];
        if (Object.keys(updatedFilters.specs).length === 0) {
          delete updatedFilters.specs;
        }
      }
    } else {
      // Remove from root level
      delete updatedFilters[filterKey as keyof FilterValues];
    }
    
    // Apply the updated filters
    await handleApplyFilters(updatedFilters);
  };

  const handleClearAllFilters = async () => {
    const clearedFilters: FilterValues = {};
    await handleApplyFilters(clearedFilters);
  };

  const handleSortChange = async (sort: SortOption) => {
    setCurrentSort(sort);
    setIsSorting(true);
    console.log('Sort changed to:', sort);
    
    // Set sort in store and refetch listings
    setSortFilter(sort);
    
    if (currentCategory) {
      const storeFilters = convertFiltersForStore(currentFilters);
      try {
        await fetchListingsByCategory(currentCategory.slug, storeFilters);
        console.log('✅ Listings updated with new sorting:', sort);
      } catch (error) {
        console.error('❌ Error applying sort:', error);
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
          <Text variant="h2">Loading category...</Text>
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
      {/* Category Header */}
      <div className={styles.header}>
        <Text variant="h1">{currentCategory.name}</Text>
        <Text variant="paragraph" className={styles.subtitle}>
          {t('category.totalListings', { count: pagination.total })}
        </Text>
      </div>

      {/* Main Content */}
      <div className={styles.content}>
        {/* Filters Sidebar */}
        <div className={styles.filtersSection}>
          <Filter 
            isOpen={filtersOpen} 
            onClose={() => setFiltersOpen(false)}
            categorySlug={currentCategory.slug}
            onApplyFilters={handleApplyFilters}
            initialValues={currentFilters}
          />
        </div>

        {/* Listings Area */}
        <div className={styles.listingsSection}>
          <ListingArea
            listings={listingData}
            loading={listingsLoading}
            countLoading={listingsLoading && !isSorting}
            onCardClick={handleCardClick}
            onCardLike={handleCardLike}
            onToggleFilters={handleToggleFilters}
            total={pagination.total}
            currentPage={pagination.page}
            totalPages={Math.ceil(pagination.total / pagination.limit)}
            onPageChange={handlePageChange}
            appliedFilters={currentFilters}
            totalResults={pagination.total}
            currentSort={currentSort}
            onRemoveFilter={handleRemoveFilter}
            onClearAllFilters={handleClearAllFilters}
            onSortChange={handleSortChange}
            attributes={attributes}
          />
        </div>
      </div>
    </Container>
  );
}