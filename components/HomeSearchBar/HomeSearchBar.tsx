'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useCategoriesStore } from '@/stores/categoriesStore';
import { useSearchStore } from '@/stores/searchStore';
import { useFiltersStore } from '@/stores/filtersStore';
import { Container, Button, Input } from '@/components/slices';
import styles from './HomeSearchBar.module.scss';

// Syrian provinces - fallback if not fetched from backend
const SYRIAN_PROVINCES = [
  { key: 'damascus', value: 'دمشق' },
  { key: 'aleppo', value: 'حلب' },
  { key: 'homs', value: 'حمص' },
  { key: 'hama', value: 'حماة' },
  { key: 'latakia', value: 'اللاذقية' },
  { key: 'tartous', value: 'طرطوس' },
  { key: 'daraa', value: 'درعا' },
  { key: 'sweida', value: 'السويداء' },
  { key: 'quneitra', value: 'القنيطرة' },
  { key: 'idlib', value: 'إدلب' },
  { key: 'raqqa', value: 'الرقة' },
  { key: 'deir_ez_zor', value: 'دير الزور' },
  { key: 'hasakah', value: 'الحسكة' },
  { key: 'rif_damascus', value: 'ريف دمشق' },
];

export const HomeSearchBar: React.FC = () => {
  const router = useRouter();
  const { categories } = useCategoriesStore();
  const { setFilter, setSpecFilter, clearAllFilters } = useSearchStore();
  const { attributes } = useFiltersStore();

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

  // Get location options from attributes or use fallback
  const locationAttribute = attributes.find(attr => attr.key === 'location');
  const locationOptions = locationAttribute?.options?.length
    ? locationAttribute.options
    : SYRIAN_PROVINCES;

  // Handle search submission
  const handleSearch = () => {
    // Category is required
    if (!selectedCategory) {
      // Focus on category dropdown or show error
      return;
    }

    // Clear previous filters
    clearAllFilters();

    // Set new filters
    if (searchTerm.trim()) {
      setFilter('search', searchTerm.trim());
    }

    if (selectedLocation) {
      setSpecFilter('location', selectedLocation);
    }

    // Navigate to category page
    router.push(`/${selectedCategory}`);
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Container paddingY="lg" background="transparent">
      <div className={styles.searchBar}>

        {/* Search Input */}
        <div className={styles.inputWrapper}>
          <Input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="ابحث عن سيارات، عقارات، وغيرها..."
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
              ...locationOptions.map((option: any) => ({
                value: option.key,
                label: option.value,
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
    </Container>
  );
};

export default HomeSearchBar;
