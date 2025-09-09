'use client';

import { useState, useEffect } from 'react';
import { Container } from '@/components/slices';
import FilterSidebar from '@/components/forms/FilterSidebar/FilterSidebar';
import ListingCard from '@/components/cards/ListingCard/ListingCard';
import { useI18n } from '@/contexts/I18nContext';
import { Search, Grid3X3, List, Loader2 } from 'lucide-react';
import { Listing, ListingFilterInput } from '@/types/listing';

export default function CarsPage() {
  const { t, language } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ListingFilterInput>({});
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch listings from GraphQL API
  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            query GetListings($limit: Float, $offset: Float) {
              listingsSearch(limit: $limit, offset: $offset) {
                id
                title
                prices {
                  value
                  currency
                }
                city
                country
                status
                allowBidding
                biddingStartPrice
                brandId
                modelId
                imageKeys
                createdAt
                updatedAt
              }
              listingsCount
            }
          `,
          variables: {
            limit: 12,
            offset: 0,
          }
        })
      });

      const result = await response.json();
      
      if (result.data) {
        setListings(result.data.listingsSearch || []);
        setTotalCount(result.data.listingsCount || 0);
      } else if (result.errors) {
        setError('Failed to load listings');
        console.error('GraphQL errors:', result.errors);
      }
    } catch (err) {
      setError('Network error');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleFiltersChange = (newFilters: ListingFilterInput) => {
    setFilters(newFilters);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchListings();
  };

  return (
    <div className="py-6">
      <Container outer>
        <Container inner>
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {language === 'ar' ? 'السيارات للبيع' : 'Cars for Sale'}
            </h1>
            
            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder={language === 'ar' ? 'ابحث عن سيارة...' : 'Search for a car...'}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </form>
          </div>

          {/* Main Layout: Sidebar + Content */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Filter Sidebar */}
            <div className="w-full lg:w-auto">
              <FilterSidebar onFiltersChange={handleFiltersChange} />
            </div>

            {/* Main Content */}
            <div className="flex-1">
              {/* Results Header */}
              <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-4">
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-lg font-medium text-gray-900 dark:text-white">
                        {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                      </span>
                    </div>
                  ) : (
                    <span className="text-lg font-medium text-gray-900 dark:text-white">
                      {language === 'ar' 
                        ? `${listings.length} من ${totalCount}+ سيارة` 
                        : `${listings.length} of ${totalCount}+ cars`}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    <Grid3X3 className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Error State */}
              {error && (
                <div className="text-center py-8">
                  <p className="text-red-600 dark:text-red-400">
                    {language === 'ar' ? 'خطأ في تحميل البيانات' : 'Error loading data'}
                  </p>
                  <button 
                    onClick={() => fetchListings()}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
                  </button>
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg h-80"></div>
                  ))}
                </div>
              )}

              {/* Listings Grid */}
              {!loading && !error && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {listings.map((listing: Listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                    />
                  ))}
                </div>
              )}

              {/* No Results */}
              {!loading && !error && listings.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    {language === 'ar' ? 'لا توجد نتائج' : 'No results found'}
                  </p>
                </div>
              )}

              {/* Pagination */}
              <div className="mt-8 flex justify-center">
                <div className="flex items-center gap-2">
                  <button className="px-4 py-2 text-gray-500 dark:text-gray-400">
                    {language === 'ar' ? 'السابق' : 'Previous'}
                  </button>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md">1</button>
                  <button className="px-4 py-2 text-gray-500 dark:text-gray-400">2</button>
                  <button className="px-4 py-2 text-gray-500 dark:text-gray-400">3</button>
                  <button className="px-4 py-2 text-gray-500 dark:text-gray-400">
                    {language === 'ar' ? 'التالي' : 'Next'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Container>
    </div>
  );
}