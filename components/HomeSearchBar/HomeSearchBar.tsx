'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useCategoriesStore } from '@/stores/categoriesStore';
import { useSearchStore } from '@/stores/searchStore';
import { useMetadataStore } from '@/stores/metadataStore';
import { Button, Input } from '@/components/slices';
import styles from './HomeSearchBar.module.scss';

export const HomeSearchBar: React.FC = () => {
  const router = useRouter();
  const { categories } = useCategoriesStore();
  const { setFilter, setSpecFilter, clearAllFilters } = useSearchStore();
  const { provinces, fetchLocationMetadata } = useMetadataStore();

  // Local state for form inputs
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Get active categories only
  const activeCategories = categories.filter(cat => cat.isActive);

  // Auto-select first category if only one exists
  useEffect(() => {
    if (activeCategories.length === 1 && !selectedCategory) {
      setSelectedCategory(activeCategories[0].slug);
    }
  }, [activeCategories, selectedCategory]);

  // Fetch provinces if not loaded
  useEffect(() => {
    if (provinces.length === 0) {
      fetchLocationMetadata();
    }
  }, [provinces.length, fetchLocationMetadata]);

  // Handle search submission
  const handleSearch = () => {
    // Category is required
    if (!selectedCategory) {
      // Focus on category dropdown or show error
      return;
    }

    // Clear previous filters
    clearAllFilters();

    // Build URL with query params for SSR
    const params = new URLSearchParams();

    if (searchTerm.trim()) {
      params.set('search', searchTerm.trim());
      setFilter('search', searchTerm.trim());
    }

    if (selectedLocation) {
      params.set('province', selectedLocation);
      setSpecFilter('location', selectedLocation);
    }

    // Navigate to category page with query params
    const queryString = params.toString();
    const url = queryString ? `/${selectedCategory}?${queryString}` : `/${selectedCategory}`;
    router.push(url);
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <section className={styles.heroSection}>
      {/* Hero Image with full rounded corners */}
      <div className={styles.heroImageWrapper}>
        <img
          src="/images/cars1.jpg"
          alt="Hero"
          className={styles.heroImage}
        />
      </div>

      {/* Search Bar - positioned below image */}
      <div className={styles.searchBar}>
        {/* Search Input */}
        <div className={styles.inputWrapper}>
          <Input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="ابحث عن ما تريد..."
            aria-label="بحث"
            icon={<Search size={18} />}
          />
        </div>

        {/* Category Dropdown */}
        <div className={styles.selectWrapper}>
          <Input
            type="select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            options={[
              { value: '', label: 'اختر الفئة' },
              ...activeCategories.map((category) => ({
                value: category.slug,
                label: category.nameAr || category.name,
              })),
            ]}
            aria-label="اختر الفئة"
          />
        </div>

        {/* Location Dropdown */}
        <div className={styles.selectWrapper}>
          <Input
            type="select"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            options={[
              { value: '', label: 'كل المحافظات' },
              ...provinces.map((province) => ({
                value: province.key,
                label: province.nameAr,
              })),
            ]}
            aria-label="اختر المحافظة"
          />
        </div>

        {/* Search Button */}
        <Button
          variant="primary"
          onClick={handleSearch}
          disabled={!selectedCategory}
          icon={<Search size={20} />}
          className={styles.searchButton}
        >
          بحث
        </Button>
      </div>
    </section>
  );
};

export default HomeSearchBar;
