'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useCategoriesStore } from '@/stores/categoriesStore';
import { useSearchStore } from '@/stores/searchStore';
import { useMetadataStore } from '@/stores/metadataStore';
import { Button, Input, Container } from '@/components/slices';
import styles from './HomeSearchBar.module.scss';

export const HomeSearchBar: React.FC = () => {
  const router = useRouter();
  const { categories } = useCategoriesStore();
  const { setFilter, setSpecFilter, clearAllFilters } = useSearchStore();
  const { provinces, fetchLocationMetadata } = useMetadataStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryError, setCategoryError] = useState<boolean>(false);
  const [shakeKey, setShakeKey] = useState<number>(0);

  const activeCategories = categories.filter(cat => cat.isActive);

  useEffect(() => {
    if (activeCategories.length === 1 && !selectedCategory) {
      setSelectedCategory(activeCategories[0].slug);
    }
  }, [activeCategories, selectedCategory]);

  useEffect(() => {
    if (provinces.length === 0) {
      fetchLocationMetadata();
    }
  }, [provinces.length, fetchLocationMetadata]);

  const handleSearch = () => {
    if (!selectedCategory) {
      setCategoryError(true);
      setShakeKey(prev => prev + 1); // Increment to re-trigger animation
      return;
    }

    setCategoryError(false);
    clearAllFilters();

    const params = new URLSearchParams();

    if (searchTerm.trim()) {
      params.set('search', searchTerm.trim());
      setFilter('search', searchTerm.trim());
    }

    if (selectedLocation) {
      params.set('province', selectedLocation);
      setSpecFilter('location', selectedLocation);
    }

    const queryString = params.toString();
    const url = queryString ? `/${selectedCategory}?${queryString}` : `/${selectedCategory}`;
    router.push(url);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className={styles.searchBarWrapper}>
      <Container paddingY="none">
        <div className={styles.searchBar}>
          <div className={styles.inputWrapper}>
            <Input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="ابحث عن ما تريد..."
              icon={<Search size={18} />}
            />
          </div>

          <span className={styles.separator} />

          <div key={shakeKey} className={`${styles.selectWrapper} ${categoryError ? styles.error : ''} ${categoryError ? styles.shake : ''}`}>
            <Input
              type="select"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                if (e.target.value) setCategoryError(false);
              }}
              options={[
                { value: '', label: 'اختر الفئة' },
                ...activeCategories.map((category) => ({
                  value: category.slug,
                  label: category.nameAr || category.name,
                })),
              ]}
            />
          </div>

          <span className={styles.separator} />

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
            />
          </div>

          <Button
            variant="outline"
            onClick={handleSearch}
            icon={<Search size={20} />}
            className={styles.searchButton}
            aria-label="بحث"
          />
        </div>
      </Container>
    </div>
  );
};

export default HomeSearchBar;
