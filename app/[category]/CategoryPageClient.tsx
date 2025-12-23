"use client";

import React, { useEffect, useState, useRef } from "react";
import { notFound, useRouter } from "next/navigation";
import Container from "../../components/slices/Container/Container";
import Filter from "../../components/Filter/Filter";
import ListingArea from "../../components/ListingArea/ListingArea";
import { Loading } from "../../components/slices/Loading/Loading";
import { MobileBackButton } from "../../components/slices";
import { MobileFilterBar } from "../../components/MobileFilterBar";
import {
  useCategoriesStore,
  useFiltersStore,
} from "../../stores";
import type { Category } from "../../types/listing";
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

  const { fetchFilterData } = useFiltersStore();

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

      // Initialize filter data with search params
      fetchFilterData(categorySlug);

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
      {/* Mobile Header - only visible on mobile */}
      <MobileBackButton onClick={handleBack} title={currentCategory.nameAr} />

      {/* Mobile Filter Bar - below MobileBackButton, only visible on mobile */}
      <MobileFilterBar onFilterClick={() => setIsFilterOpen(true)} />

      {/* <div className={styles.categoryPage}> */}
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
      {/* </div> */}
    </Container>
  );
}