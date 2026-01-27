'use client';

import { useEffect, useRef } from 'react';
import { useCategoriesStore } from '@/stores/categoriesStore';
import { Category } from '@/stores/types';

interface CategoriesProviderProps {
  categories: Category[];
  children: React.ReactNode;
}

/**
 * CategoriesProvider - Hydrates the categories store with server-fetched data
 *
 * This provider receives categories fetched server-side in the root layout
 * and immediately hydrates the Zustand store, making categories available
 * to ALL components instantly without any client-side fetch.
 *
 * Benefits:
 * - No loading flash for category-dependent components
 * - Single fetch at root level (not multiple fetches per page)
 * - Store is ready before any component mounts
 */
export function CategoriesProvider({ categories, children }: CategoriesProviderProps) {
  const hasHydrated = useRef(false);
  const setCategories = useCategoriesStore((state) => state.setCategories);
  const setInitialized = useCategoriesStore((state) => state.setInitialized);

  // Hydrate store immediately on first render (before children mount)
  // Using useEffect with empty deps ensures this runs once on client
  useEffect(() => {
    if (!hasHydrated.current && categories.length > 0) {
      setCategories(categories);
      setInitialized(true);
      hasHydrated.current = true;
    }
  }, [categories, setCategories, setInitialized]);

  return <>{children}</>;
}

export default CategoriesProvider;
