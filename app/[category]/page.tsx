"use client";

import { use } from "react";
import CategoryPageClient from "./CategoryPageClient";

interface CategoryPageProps {
  params: Promise<{
    category: string;
  }>;
  searchParams: Promise<{
    page?: string;
    brand?: string;
    model?: string;
    minPrice?: string;
    maxPrice?: string;
    province?: string;
    city?: string;
    search?: string;
  }>;
}

// Client-side only component using Zustand stores
export default function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { category } = use(params);
  const resolvedSearchParams = use(searchParams);

  return (
    <CategoryPageClient
      categorySlug={category}
      searchParams={resolvedSearchParams}
    />
  );
}
