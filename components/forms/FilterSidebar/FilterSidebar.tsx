'use client';

import React, { useState, useEffect } from 'react';
import { 
  Car, 
  Calendar, 
  DollarSign, 
  Fuel, 
  MapPin, 
  Settings2,
  ChevronDown 
} from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import styles from './FilterSidebar.module.scss';

interface Brand {
  id: string;
  name: string;
  slug: string;
}

interface Model {
  id: string;
  name: string;
  slug: string;
  brandId: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface CategoryAttribute {
  id: string;
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'multi_select' | 'boolean' | 'range';
  options?: string[] | null;
  required: boolean;
  filterable: boolean;
  searchable: boolean;
  unit?: string | null;
  sortOrder: number;
}

interface FilterCount {
  value: string;
  count: number;
}

interface FilterAggregation {
  field: string;
  options: FilterCount[];
  totalCount: number;
}

interface SearchAggregations {
  attributes: FilterAggregation[];
  brands?: FilterCount[];
  models?: FilterCount[];
  totalResults: number;
}

interface FilterSidebarProps {
  onFiltersChange: (filters: any) => void;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({ onFiltersChange }) => {
  const { t, language } = useI18n();
  const [aggregations, setAggregations] = useState<SearchAggregations | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryAttributes, setCategoryAttributes] = useState<CategoryAttribute[]>([]);
  const [currentCategoryId, setCurrentCategoryId] = useState<string>('');
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<any>({});

  // Fetch categories and set up initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // Get categories first
        const categoriesResponse = await fetch('http://localhost:4000/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `query GetCategories {
              categories {
                id
                name
                slug
              }
            }`
          })
        });
        
        const categoriesResult = await categoriesResponse.json();
        if (categoriesResult.data?.categories) {
          setCategories(categoriesResult.data.categories);
          
          // Find car category (assuming we're in car marketplace)
          const carCategory = categoriesResult.data.categories.find((cat: Category) => 
            cat.slug === 'car' || cat.name.toLowerCase() === 'car'
          );
          
          if (carCategory) {
            setCurrentCategoryId(carCategory.id);
            
            // Fetch brands for car category
            const brandsResponse = await fetch('http://localhost:4000/graphql', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                query: `query GetBrands($categoryId: String!) {
                  brands(categoryId: $categoryId) {
                    id
                    name
                    slug
                  }
                }`,
                variables: { categoryId: carCategory.id }
              })
            });
            
            const brandsResult = await brandsResponse.json();
            if (brandsResult.data?.brands) {
              setBrands(brandsResult.data.brands);
            }
            
            // Fetch category attributes for car category
            const attributesResponse = await fetch('http://localhost:4000/graphql', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                query: `query GetCategoryAttributes($categoryId: String!) {
                  categoryAttributes(categoryId: $categoryId) {
                    id
                    key
                    label
                    type
                    options
                    required
                    filterable
                    searchable
                    unit
                    sortOrder
                  }
                }`,
                variables: { categoryId: carCategory.id }
              })
            });
            
            const attributesResult = await attributesResponse.json();
            if (attributesResult.data?.categoryAttributes) {
              // Sort by sortOrder and filter only filterable attributes
              const filterableAttributes = attributesResult.data.categoryAttributes
                .filter((attr: CategoryAttribute) => attr.filterable)
                .sort((a: CategoryAttribute, b: CategoryAttribute) => a.sortOrder - b.sortOrder);
              setCategoryAttributes(filterableAttributes);
            }
          }
        }
        
        // Also fetch aggregations for counts
        await fetchAggregations();
      } catch (error) {
        console.error('Error fetching initial data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, []);

  // Fetch aggregations when filters change
  useEffect(() => {
    if (Object.keys(filters).length > 0) {
      fetchAggregations();
    }
  }, [filters]);

  const fetchAggregations = async () => {
    try {
      const response = await fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `query GetListingsAggregations($filter: ListingFilterInput) {
            listingsAggregations(filter: $filter) {
              attributes {
                field
                options {
                  value
                  count
                }
                totalCount
              }
              totalResults
            }
          }`,
          variables: {
            filter: filters
          }
        })
      });
      
      const result = await response.json();
      if (result.data?.listingsAggregations) {
        setAggregations(result.data.listingsAggregations);
      }
    } catch (error) {
      console.error('Error fetching aggregations:', error);
    }
  };

  // Fetch models when brand is selected
  useEffect(() => {
    const fetchModels = async () => {
      if (!selectedBrandId) {
        setModels([]);
        setSelectedModelId('');
        return;
      }
      
      try {
        const response = await fetch('http://localhost:4000/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `query GetModels($brandId: String!) {
              models(brandId: $brandId) {
                id
                name
                slug
                brandId
              }
            }`,
            variables: { brandId: selectedBrandId }
          })
        });
        
        const result = await response.json();
        if (result.data?.models) {
          setModels(result.data.models);
        }
      } catch (error) {
        console.error('Error fetching models:', error);
      }
    };
    
    fetchModels();
  }, [selectedBrandId]);

  // Update filters and notify parent
  const updateFilter = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  // Get aggregation by field name
  const getAggregation = (fieldName: string) => {
    return aggregations?.attributes.find(attr => attr.field === fieldName);
  };

  // Render attribute filter based on category attribute definition
  const renderAttributeFilter = (attribute: CategoryAttribute) => {
    const aggregation = getAggregation(attribute.key);
    
    // If it's a select type with predefined options, use those
    if (attribute.type === 'select' && attribute.options && attribute.options.length > 0) {
      return (
        <div key={attribute.id} className={styles.filterSection}>
          <div className={styles.filterHeader}>
            <Settings2 className={styles.filterIcon} />
            <h3 className={styles.filterTitle}>{attribute.label}</h3>
          </div>
          <div className={styles.filterContent}>
            {attribute.options.map((option) => (
              <label key={option} className={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  className={styles.checkbox}
                  checked={filters[attribute.key] === option}
                  onChange={(e) => updateFilter(attribute.key, e.target.checked ? option : undefined)}
                />
                <span className={styles.checkboxText}>
                  {option}
                </span>
              </label>
            ))}
          </div>
        </div>
      );
    }
    
    // If we have aggregation data from search results, use that (with counts)
    if (aggregation && aggregation.options.length > 0) {
      return (
        <div key={attribute.id} className={styles.filterSection}>
          <div className={styles.filterHeader}>
            <Settings2 className={styles.filterIcon} />
            <h3 className={styles.filterTitle}>{attribute.label}</h3>
          </div>
          <div className={styles.filterContent}>
            {aggregation.options.map((option) => (
              <label key={option.value} className={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  className={styles.checkbox}
                  checked={filters[attribute.key] === option.value}
                  onChange={(e) => updateFilter(attribute.key, e.target.checked ? option.value : undefined)}
                />
                <span className={styles.checkboxText}>
                  {option.value} ({option.count})
                </span>
              </label>
            ))}
          </div>
        </div>
      );
    }
    
    // For other types or no data available, return null
    return null;
  };

  // Render dynamic filter section
  const renderFilterSection = (
    title: string, 
    icon: React.ReactNode, 
    fieldName: string, 
    filterKey: string
  ) => {
    const aggregation = getAggregation(fieldName);
    if (!aggregation || aggregation.options.length === 0) return null;

    return (
      <div className={styles.filterSection}>
        <div className={styles.filterHeader}>
          {icon}
          <h3 className={styles.filterTitle}>{title}</h3>
        </div>
        <div className={styles.filterContent}>
          {aggregation.options.map((option) => (
            <label key={option.value} className={styles.checkboxLabel}>
              <input 
                type="checkbox" 
                className={styles.checkbox}
                checked={filters[filterKey] === option.value}
                onChange={(e) => updateFilter(filterKey, e.target.checked ? option.value : undefined)}
              />
              <span className={styles.checkboxText}>
                {option.value} ({option.count})
              </span>
            </label>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <Settings2 className={styles.headerIcon} />
        <h2 className={styles.title}>
          {language === 'ar' ? 'تصفية النتائج' : 'Filter Results'}
        </h2>
      </div>

      {loading ? (
        <div className={styles.loadingText}>
          {language === 'ar' ? 'جاري التحميل...' : 'Loading filters...'}
        </div>
      ) : (
        <>
          {/* Brand Filter - dropdown selector */}
          <div className={styles.filterSection}>
            <div className={styles.filterHeader}>
              <Car className={styles.filterIcon} />
              <h3 className={styles.filterTitle}>
                {language === 'ar' ? 'الماركة' : 'Brand'}
              </h3>
            </div>
            <div className={styles.filterContent}>
              <select 
                className={styles.brandSelect}
                value={selectedBrandId}
                onChange={(e) => {
                  const brandId = e.target.value;
                  setSelectedBrandId(brandId);
                  setSelectedModelId(''); // Reset model when brand changes
                  
                  // Find the brand name from the brands array
                  const selectedBrand = brands.find(b => b.id === brandId);
                  updateFilter('make', selectedBrand ? selectedBrand.name : undefined);
                  updateFilter('model', undefined); // Clear model filter
                }}
              >
                <option value="">
                  {language === 'ar' ? 'اختر الماركة' : 'Select Brand'}
                </option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Model Filter - dropdown selector (disabled until brand selected) */}
          <div className={styles.filterSection}>
            <div className={styles.filterHeader}>
              <Settings2 className={styles.filterIcon} />
              <h3 className={styles.filterTitle}>
                {language === 'ar' ? 'الطراز' : 'Model'}
              </h3>
            </div>
            <div className={styles.filterContent}>
              <select 
                className={styles.modelSelect}
                value={selectedModelId}
                disabled={!selectedBrandId}
                onChange={(e) => {
                  const modelId = e.target.value;
                  setSelectedModelId(modelId);
                  
                  // Find the model name from the models array
                  const selectedModel = models.find(m => m.id === modelId);
                  updateFilter('model', selectedModel ? selectedModel.name : undefined);
                }}
              >
                <option value="">
                  {!selectedBrandId 
                    ? (language === 'ar' ? 'اختر الماركة أولاً' : 'Select Brand First')
                    : (language === 'ar' ? 'اختر الطراز' : 'Select Model')
                  }
                </option>
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dynamic attribute filters from category attributes */}
          {categoryAttributes.map((attribute) => renderAttributeFilter(attribute))}

          {/* City Filter - from aggregations */}
          {renderFilterSection(
            language === 'ar' ? 'المدينة' : 'City',
            <MapPin className={styles.filterIcon} />,
            'city',
            'city'
          )}

          {/* Price Range */}
          <div className={styles.filterSection}>
            <div className={styles.filterHeader}>
              <DollarSign className={styles.filterIcon} />
              <h3 className={styles.filterTitle}>
                {language === 'ar' ? 'السعر' : 'Price Range'}
              </h3>
            </div>
            <div className={styles.filterContent}>
              <div className={styles.priceInputs}>
                <input 
                  type="number" 
                  placeholder={language === 'ar' ? 'من' : 'Min'} 
                  className={styles.priceInput}
                  value={filters.priceMinMinor || ''}
                  onChange={(e) => updateFilter('priceMinMinor', e.target.value ? parseInt(e.target.value) : undefined)}
                />
                <span className={styles.priceSeparator}>-</span>
                <input 
                  type="number" 
                  placeholder={language === 'ar' ? 'إلى' : 'Max'} 
                  className={styles.priceInput}
                  value={filters.priceMaxMinor || ''}
                  onChange={(e) => updateFilter('priceMaxMinor', e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>
            </div>
          </div>

          {/* Year Range */}
          <div className={styles.filterSection}>
            <div className={styles.filterHeader}>
              <Calendar className={styles.filterIcon} />
              <h3 className={styles.filterTitle}>
                {language === 'ar' ? 'سنة الصنع' : 'Year'}
              </h3>
            </div>
            <div className={styles.filterContent}>
              <div className={styles.yearInputs}>
                <input 
                  type="number" 
                  placeholder={language === 'ar' ? 'من' : 'From'} 
                  className={styles.yearInput}
                  min="1990"
                  max="2025"
                  value={filters.yearMin || ''}
                  onChange={(e) => updateFilter('yearMin', e.target.value ? parseInt(e.target.value) : undefined)}
                />
                <span className={styles.yearSeparator}>-</span>
                <input 
                  type="number" 
                  placeholder={language === 'ar' ? 'إلى' : 'To'} 
                  className={styles.yearInput}
                  min="1990"
                  max="2025"
                  value={filters.yearMax || ''}
                  onChange={(e) => updateFilter('yearMax', e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FilterSidebar;