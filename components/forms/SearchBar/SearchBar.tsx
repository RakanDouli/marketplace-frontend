'use client';

import React, { useState, useCallback } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { useNotificationStore } from '@/store';
import { Button } from '@/components/slices/Button/Button';
import styles from './SearchBar.module.scss';

interface SearchBarProps {
  onSearch?: (filters: any) => void;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  className = ''
}) => {
  const { t, language } = useI18n();
  const { addNotification } = useNotificationStore();
  
  const [localFilters, setLocalFilters] = useState({
    search: '',
    categoryId: '',
    minPrice: '',
    maxPrice: '',
    condition: '',
    location: ''
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleInputChange = useCallback((field: string, value: string) => {
    setLocalFilters(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleSearch = useCallback(() => {
    const cleanFilters = Object.entries(localFilters).reduce((acc, [key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        acc[key] = key.includes('Price') ? Number(value) : value;
      }
      return acc;
    }, {} as any);

    addNotification({
      type: 'info',
      title: t('search.search'),
      message: language === 'ar'
        ? 'قريباً.. وظيفة البحث قيد التطوير'
        : 'Search functionality coming soon!',
    });

    onSearch?.(cleanFilters);
  }, [localFilters, onSearch, addNotification, t]);

  const handleReset = useCallback(() => {
    const resetFilters = {
      search: '',
      categoryId: '',
      minPrice: '',
      maxPrice: '',
      condition: '',
      location: ''
    };
    
    setLocalFilters(resetFilters);
    addNotification({
      type: 'success',
      title: t('search.clear'),
      message: language === 'ar'
        ? 'تم مسح المرشحات بنجاح'
        : 'Filters cleared successfully',
    });
    onSearch?.({});
  }, [onSearch, addNotification, t]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  const conditions = [
    { value: 'NEW', label: 'New / جديد' },
    { value: 'USED', label: 'Used / مستعمل' },
    { value: 'EXCELLENT', label: 'Excellent / ممتاز' },
    { value: 'GOOD', label: 'Good / جيد' },
    { value: 'FAIR', label: 'Fair / متوسط' },
    { value: 'POOR', label: 'Poor / يحتاج صيانة' }
  ];

  const popularLocations = [
    'Damascus / دمشق',
    'Aleppo / حلب', 
    'Homs / حمص',
    'Hama / حماة',
    'Latakia / اللاذقية',
    'Tartous / طرطوس',
    'Daraa / درعا',
    'As-Suwayda / السويداء',
    'Quneitra / القنيطرة',
    'Deir ez-Zor / دير الزور',
    'Ar-Raqqah / الرقة',
    'Al-Hasakah / الحسكة',
    'Idlib / إدلب',
    'Damascus Countryside / ريف دمشق'
  ];

  const categories = [
    'Sedans / سيدان',
    'SUVs / دفع رباعي',
    'Hatchback / هاتشباك',
    'Trucks / شاحنات',
    'Motorcycles / دراجات نارية'
  ];

  return (
    <div className={`${styles.searchContainer} ${className}`}>
      <div className={styles.mainSearch}>
        <div className={styles.searchInputGroup}>
          <input
            type="text"
            placeholder={t('search.placeholder')}
            value={localFilters.search}
            onChange={(e) => handleInputChange('search', e.target.value)}
            onKeyPress={handleKeyPress}
            className={styles.searchInput}
          />
          <Button
            type="button"
            onClick={handleSearch}
            variant="primary"
            size="md"
            className={styles.searchButton}
            aria-label={t('search.search')}
          >
            🔍
          </Button>
        </div>

        <Button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          variant="ghost"
          size="sm"
          className={styles.advancedToggle}
        >
          {showAdvanced ? 'Hide Filters / إخفاء الفلاتر' : t('search.filters')}
          <span className={`${styles.arrow} ${showAdvanced ? styles.arrowUp : ''}`}>
            ▼
          </span>
        </Button>
      </div>

      {showAdvanced && (
        <div className={styles.advancedFilters}>
          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              <label htmlFor="category" className={styles.label}>{t('search.make')}</label>
              <select
                id="category"
                value={localFilters.categoryId}
                onChange={(e) => handleInputChange('categoryId', e.target.value)}
                className={styles.select}
              >
                <option value="">All Categories / جميع الفئات</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label htmlFor="condition" className={styles.label}>{t('search.condition')}</label>
              <select
                id="condition"
                value={localFilters.condition}
                onChange={(e) => handleInputChange('condition', e.target.value)}
                className={styles.select}
              >
                <option value="">All Conditions / جميع الحالات</option>
                {conditions.map(condition => (
                  <option key={condition.value} value={condition.value}>
                    {condition.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label htmlFor="location" className={styles.label}>{t('search.location')}</label>
              <select
                id="location"
                value={localFilters.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className={styles.select}
              >
                <option value="">All Locations / جميع المحافظات</option>
                {popularLocations.map(location => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              <label htmlFor="minPrice" className={styles.label}>{t('search.priceRange')} (Min)</label>
              <input
                id="minPrice"
                type="number"
                placeholder="0 USD / 0 دولار"
                value={localFilters.minPrice}
                onChange={(e) => handleInputChange('minPrice', e.target.value)}
                className={styles.input}
                min="0"
              />
            </div>

            <div className={styles.filterGroup}>
              <label htmlFor="maxPrice" className={styles.label}>{t('search.priceRange')} (Max)</label>
              <input
                id="maxPrice"
                type="number"
                placeholder="No limit / بدون حد أقصى"
                value={localFilters.maxPrice}
                onChange={(e) => handleInputChange('maxPrice', e.target.value)}
                className={styles.input}
                min="0"
              />
            </div>
          </div>

          <div className={styles.filterActions}>
            <Button
              type="button"
              onClick={handleSearch}
              variant="primary"
              size="md"
              className={styles.applyButton}
            >
              {t('search.search')}
            </Button>
            <Button
              type="button"
              onClick={handleReset}
              variant="ghost"
              size="md"
              className={styles.resetButton}
            >
              {t('search.clear')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;