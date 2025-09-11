'use client';
import React, { useState, useEffect } from 'react';
import { Filter as FilterIcon, X } from 'lucide-react';
import { Aside, Text, Button } from '../slices';
import { useTranslation } from '../../hooks/useTranslation';
import { 
  getAllFilterData,
  getModelsByBrand, 
  getCitiesByProvince,
  type Attribute,
  type Brand,
  type Model,
  type FilterData
} from '../../lib/api/attributes';
import styles from './Filter.module.scss';

export interface FilterValues {
  // Standard filters
  priceMinMinor?: number;
  priceMaxMinor?: number;
  priceCurrency?: string;
  city?: string;
  province?: string;
  
  // Brand/Model
  brandId?: string;
  modelId?: string;
  
  // Dynamic attributes (stored in specs) - matches backend structure
  specs?: Record<string, {
    selected?: string | string[];
    value?: number;
    from?: number;
    to?: number;
    text?: string;
    amount?: number;
    currency?: string;
  }>;
  
  // Legacy support
  search?: string;
}

export interface FilterProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
  categorySlug?: string;
  onApplyFilters?: (filters: FilterValues) => void;
  initialValues?: FilterValues;
}

export const Filter: React.FC<FilterProps> = ({
  isOpen = true,
  onClose,
  className = '',
  categorySlug,
  onApplyFilters,
  initialValues = {},
}) => {
  const { t } = useTranslation();
  
  // Filter state
  const [filters, setFilters] = useState<FilterValues>(initialValues);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [provinces, setProvinces] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Load filter options from backend
  useEffect(() => {
    if (!categorySlug) return;
    
    const loadFilterData = async () => {
      setLoading(true);
      try {
        // Single GraphQL call to get all filter data
        const filterData = await getAllFilterData(categorySlug);
        
        setAttributes(filterData.attributes);
        setBrands(filterData.brands);
        setProvinces(filterData.provinces);
      } catch (error) {
        console.error('Failed to load filter data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadFilterData();
  }, [categorySlug]);
  
  // Update models when brand changes
  useEffect(() => {
    if (filters.brandId) {
      const loadModels = async () => {
        try {
          const modelsData = await getModelsByBrand(filters.brandId!);
          setModels(modelsData);
        } catch (error) {
          console.error('Failed to load models:', error);
          setModels([]);
        }
      };
      loadModels();
    } else {
      setModels([]);
    }
  }, [filters.brandId]);
  
  // Update cities when province changes
  useEffect(() => {
    if (filters.province) {
      const loadCities = async () => {
        try {
          const citiesData = await getCitiesByProvince(filters.province!);
          setCities(citiesData);
        } catch (error) {
          console.error('Failed to load cities:', error);
          setCities([]);
        }
      };
      loadCities();
    } else {
      setCities([]);
    }
  }, [filters.province]);
  
  const handleFilterChange = (key: keyof FilterValues, value: any) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      
      // Clear dependent filters
      if (key === 'brandId' && value !== prev.brandId) {
        newFilters.modelId = undefined;
      }
      if (key === 'province' && value !== prev.province) {
        newFilters.city = undefined;
      }
      
      return newFilters;
    });
  };
  
  const handleSpecChange = (attributeKey: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      specs: {
        ...prev.specs,
        [attributeKey]: value
      }
    }));
  };
  
  const handleClearAll = () => {
    setFilters({});
  };
  
  const handleApplyFilters = () => {
    onApplyFilters?.(filters);
    onClose?.();
  };
  return (
    <Aside isOpen={isOpen} className={`${styles.filterAside} ${className}`}>
      {/* Filter Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <FilterIcon size={20} />
          <Text variant="h4" className={styles.title}>
            Filters
          </Text>
        </div>
        
        {/* Close button for mobile */}
        <button 
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close filters"
        >
          <X size={20} />
        </button>
      </div>

      {/* Filter Content */}
      <div className={styles.filterContent}>
        {loading ? (
          <div className={styles.loading}>
            <Text>{t('common.loading')}</Text>
          </div>
        ) : (
          <>
            {/* Brand */}
            {brands.length > 0 && (
              <div className={styles.filterSection}>
                <Text variant="h4" className={styles.sectionTitle}>
                  {t('search.make')}
                </Text>
                <select
                  value={filters.brandId || ''}
                  onChange={(e) => handleFilterChange('brandId', e.target.value || undefined)}
                  className={styles.select}
                >
                  <option value="">{t('search.selectMake')}</option>
                  {brands.map(brand => (
                    <option key={brand.id} value={brand.id}>{brand.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Model */}
            {filters.brandId && models.length > 0 && (
              <div className={styles.filterSection}>
                <Text variant="h4" className={styles.sectionTitle}>
                  {t('search.model')}
                </Text>
                <select
                  value={filters.modelId || ''}
                  onChange={(e) => handleFilterChange('modelId', e.target.value || undefined)}
                  className={styles.select}
                >
                  <option value="">{t('search.selectModel')}</option>
                  {models.map(model => (
                    <option key={model.id} value={model.id}>{model.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Dynamic Attributes */}
            {attributes.map(attribute => (
              <div key={attribute.id} className={styles.filterSection}>
                <Text variant="h4" className={styles.sectionTitle}>
                  {attribute.nameAr || attribute.nameEn}
                </Text>
                
                {attribute.type === 'selector' && (
                  <select
                    value={filters.specs?.[attribute.key]?.selected || ''}
                    onChange={(e) => handleSpecChange(attribute.key, 
                      e.target.value ? { selected: e.target.value } : undefined
                    )}
                    className={styles.select}
                  >
                    <option value="">{t('search.selectOption')}</option>
                    {attribute.options.map(option => (
                      <option key={option.id} value={option.key}>
                        {option.valueAr || option.valueEn}
                      </option>
                    ))}
                  </select>
                )}

                {attribute.type === 'range' && (
                  <div className={styles.rangeInputs}>
                    <input
                      type="number"
                      placeholder={`${t('search.min')} ${attribute.config.unit || ''}`}
                      value={filters.specs?.[attribute.key]?.from || ''}
                      onChange={(e) => handleSpecChange(attribute.key, {
                        ...filters.specs?.[attribute.key],
                        from: e.target.value ? Number(e.target.value) : undefined
                      })}
                      className={styles.rangeInput}
                      min={attribute.config.min}
                      max={attribute.config.max}
                      step={attribute.config.step}
                    />
                    <input
                      type="number"
                      placeholder={`${t('search.max')} ${attribute.config.unit || ''}`}
                      value={filters.specs?.[attribute.key]?.to || ''}
                      onChange={(e) => handleSpecChange(attribute.key, {
                        ...filters.specs?.[attribute.key],
                        to: e.target.value ? Number(e.target.value) : undefined
                      })}
                      className={styles.rangeInput}
                      min={attribute.config.min}
                      max={attribute.config.max}
                      step={attribute.config.step}
                    />
                  </div>
                )}

                {attribute.type === 'currency' && (
                  <div className={styles.currencyInputs}>
                    <div className={styles.priceInputs}>
                      <input
                        type="number"
                        placeholder={t('search.minPrice')}
                        value={filters.priceMinMinor ? filters.priceMinMinor / 100 : ''}
                        onChange={(e) => handleFilterChange('priceMinMinor', 
                          e.target.value ? Number(e.target.value) * 100 : undefined
                        )}
                        className={styles.priceInput}
                      />
                      <input
                        type="number"
                        placeholder={t('search.maxPrice')}
                        value={filters.priceMaxMinor ? filters.priceMaxMinor / 100 : ''}
                        onChange={(e) => handleFilterChange('priceMaxMinor', 
                          e.target.value ? Number(e.target.value) * 100 : undefined
                        )}
                        className={styles.priceInput}
                      />
                    </div>
                    <select
                      value={filters.priceCurrency || attribute.config.defaultCurrency || 'USD'}
                      onChange={(e) => handleFilterChange('priceCurrency', e.target.value)}
                      className={styles.currencySelect}
                    >
                      {(attribute.config.currencies || ['USD', 'SYP', 'EUR']).map((currency: string) => (
                        <option key={currency} value={currency}>{currency}</option>
                      ))}
                    </select>
                  </div>
                )}

                {attribute.type === 'text' && (
                  <input
                    type="text"
                    placeholder={attribute.descriptionAr || attribute.descriptionEn}
                    value={filters.specs?.[attribute.key]?.text || ''}
                    onChange={(e) => handleSpecChange(attribute.key, 
                      e.target.value ? { text: e.target.value } : undefined
                    )}
                    className={styles.textInput}
                    maxLength={attribute.config.maxLength}
                  />
                )}
              </div>
            ))}

            {/* Location */}
            {provinces.length > 0 && (
              <div className={styles.filterSection}>
                <Text variant="h4" className={styles.sectionTitle}>
                  {t('search.location')}
                </Text>
                <select
                  value={filters.province || ''}
                  onChange={(e) => handleFilterChange('province', e.target.value || undefined)}
                  className={styles.select}
                >
                  <option value="">{t('search.selectProvince')}</option>
                  {provinces.map(province => (
                    <option key={province} value={province}>{province}</option>
                  ))}
                </select>
                
                {filters.province && cities.length > 0 && (
                  <select
                    value={filters.city || ''}
                    onChange={(e) => handleFilterChange('city', e.target.value || undefined)}
                    className={styles.select}
                  >
                    <option value="">{t('search.selectCity')}</option>
                    {cities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Search */}
            <div className={styles.filterSection}>
              <Text variant="h4" className={styles.sectionTitle}>
                {t('search.search')}
              </Text>
              <input
                type="text"
                placeholder={t('search.placeholder')}
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
                className={styles.searchInput}
              />
            </div>
          </>
        )}
      </div>

      {/* Filter Actions */}
      <div className={styles.actions}>
        <Button variant="outline" className={styles.clearButton} onClick={handleClearAll}>
          {t('search.clear')}
        </Button>
        <Button variant="primary" className={styles.applyButton} onClick={handleApplyFilters}>
          {t('search.applyFilters')}
        </Button>
      </div>
    </Aside>
  );
};

export default Filter;