"use client";

import React, { useEffect, useState, useMemo } from "react";
import { notFound } from "next/navigation";
import Container from "../../../components/slices/Container/Container";
import Text from "../../../components/slices/Text/Text";
import Filter from "../../../components/Filter/Filter";
import ListingArea from "../../../components/ListingArea/ListingArea";
import { useCategoriesStore, useListingsStore } from "../../../stores";
import { useTranslation } from "../../../hooks/useTranslation";
import type { ListingData } from "../../../components/ListingArea/ListingArea";
import type { Category } from "../../../stores/types";
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
    setPagination
  } = useListingsStore();

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
      
      // Fetch current category by slug
      const category = await fetchCategoryBySlug(categorySlug);
      if (!category) {
        setCategoryNotFound(true);
        setIsCategoryLoading(false);
        return;
      }

      setCurrentCategory(category);
      setSelectedCategory(category);
      setIsCategoryLoading(false);
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

  // Load listings when category or parsed filters change
  useEffect(() => {
    if (!currentCategory) return;

    const loadListings = async () => {
      // Set pagination page before fetching
      setPagination({ page: parsedFilters.page });
      
      try {
        await fetchListingsByCategory(currentCategory.id, parsedFilters.filters);
      } catch (error) {
        console.error('Error loading listings:', error);
      }
    };

    loadListings();
  }, [currentCategory, parsedFilters, fetchListingsByCategory, setPagination]);

  // Convert store listings to component format
  const listingData: ListingData[] = (listings || []).map((listing) => ({
    id: listing.id,
    title: listing.title,
    price: `${listing.price.toLocaleString()}`,
    currency: listing.currency,
    firstRegistration: listing.createdAt ? new Date(listing.createdAt).getFullYear().toString() : "",
    mileage: "", // Add if available in specs
    fuelType: "", // Add if available in specs
    location: listing.location,
    sellerType: "private" as const,
    images: listing.images,
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

  const handlePageChange = (page: number) => {
    // Update URL with new page parameter
    const url = new URL(window.location.href);
    url.searchParams.set('page', page.toString());
    window.history.pushState({}, '', url.toString());
    
    // The useEffect will automatically handle the data fetching
    // when searchParams change, so no need to manually call fetchListingsByCategory
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
        <Text variant="h1">{currentCategory.nameAr || currentCategory.name}</Text>
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
          />
        </div>

        {/* Listings Area */}
        <div className={styles.listingsSection}>
          <ListingArea
            listings={listingData}
            loading={listingsLoading}
            onCardClick={handleCardClick}
            onCardLike={handleCardLike}
            onToggleFilters={handleToggleFilters}
            total={pagination.total}
            currentPage={pagination.page}
            totalPages={Math.ceil(pagination.total / pagination.limit)}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </Container>
  );
}