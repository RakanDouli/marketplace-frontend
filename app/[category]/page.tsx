"use client";

import CategoryPageClient from "./CategoryPageClient";

interface CategoryPageProps {
  params: {
    category: string;
  };
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

// Client-side only component using Zustand stores
export default function CategoryPage({ params, searchParams }: CategoryPageProps) {
  return (
    <CategoryPageClient 
      categorySlug={params.category}
      searchParams={searchParams}
    />
  );
}
