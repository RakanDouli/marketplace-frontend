"use client";

import React, { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import Container from "../../components/slices/Container/Container";
import Filter from "../../components/Filter/Filter";
import ListingArea from "../../components/ListingArea/ListingArea";
import { Loading } from "../../components/slices/Loading/Loading";
import {
  useCategoriesStore,
  useFiltersStore,
} from "../../stores";
import type { Category } from "../../stores/types";
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
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [isCategoryLoading, setIsCategoryLoading] = useState(true);
  const [categoryNotFound, setCategoryNotFound] = useState(false);

  // Store hooks - minimal usage, let components handle their own store coordination
  const {
    categories,
    isLoading: categoriesLoading,
    fetchCategories,
    getCategoryBySlug,
    setSelectedCategory,
  } = useCategoriesStore();

  const { fetchFilterData, setFilters } = useFiltersStore();

  // Simple category initialization - let stores handle the rest
  useEffect(() => {
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
    };

    initializePage();
  }, [categorySlug, categories.length, categoriesLoading, getCategoryBySlug, setSelectedCategory, fetchFilterData]);


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

  return (
    <Container className={styles.categoryPage}>
      {/* Main Content */}
      <div className={styles.content}>
        {/* Filters Sidebar */}
        <div className={styles.filtersSection}>
          <Filter />
        </div>

        {/* Listings Area */}
        <div className={styles.listingsSection}>
          <ListingArea />
        </div>
      </div>
    </Container>
  );
}