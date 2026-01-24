'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, LayoutGrid } from 'lucide-react';
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
  const [showMobileDropdown, setShowMobileDropdown] = useState<boolean>(false);

  const activeCategories = categories.filter(cat => cat.isActive);
  const selectedCategoryObj = activeCategories.find(cat => cat.slug === selectedCategory);

  useEffect(() => {
    if (activeCategories.length === 1 && !selectedCategory) {
      setSelectedCategory(activeCategories[0].slug);
    }
  }, [activeCategories, selectedCategory]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (provinces.length === 0) {
      fetchLocationMetadata();
    }
  }, [provinces.length]);

  const handleSearch = () => {
    if (!selectedCategory) {
      setCategoryError(true);
      setShakeKey(prev => prev + 1);
      // On mobile, show the dropdown when search is clicked without category
      setShowMobileDropdown(true);
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


  return (
    <div className={styles.searchBarWrapper}>
      <Container paddingY="none">
        {/* Desktop Search Bar */}
        <div className={styles.desktopSearchBar}>
          <div className={styles.inputWrapper}>
            <Input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
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

        {/* Mobile Search Bar - Simple layout like listing page */}
        <div className={styles.mobileSearchBar}>
          <div className={styles.mobileInputWrapper}>
            <Input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="ابحث..."
              icon={<Search size={18} />}
            />
          </div>

          <button
            className={`${styles.selectedCategoryIcon} ${!selectedCategoryObj ? styles.empty : ''}`}
            onClick={() => setShowMobileDropdown(true)}
            aria-label={selectedCategoryObj ? "تغيير الفئة" : "اختر الفئة"}
          >
            {selectedCategoryObj?.icon ? (
              <span dangerouslySetInnerHTML={{ __html: selectedCategoryObj.icon }} />
            ) : (
              <LayoutGrid size={18} />
            )}
          </button>

          <Button
            variant="primary"
            onClick={handleSearch}
            icon={<Search size={18} />}
            className={styles.mobileSearchButton}
            aria-label="بحث"
          />
        </div>

        {/* Mobile Category Dropdown - Shows when clicking search without category */}
        {showMobileDropdown && (
          <div className={styles.mobileDropdown}>
            <div className={styles.dropdownHeader}>
              <span>اختر الفئة</span>
              <button
                className={styles.closeButton}
                onClick={() => setShowMobileDropdown(false)}
              >
                ✕
              </button>
            </div>
            <div className={styles.dropdownOptions}>
              {activeCategories.map((category) => (
                <button
                  key={category.slug}
                  className={`${styles.dropdownOption} ${selectedCategory === category.slug ? styles.selected : ''}`}
                  onClick={() => {
                    setSelectedCategory(category.slug);
                    setCategoryError(false);
                    setShowMobileDropdown(false);
                  }}
                >
                  {category.icon && (
                    <span
                      className={styles.categoryIcon}
                      dangerouslySetInnerHTML={{ __html: category.icon }}
                    />
                  )}
                  <span>{category.nameAr || category.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
};

export default HomeSearchBar;
