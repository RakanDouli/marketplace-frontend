// 'use client';

// import { useState, useEffect } from 'react';
// import { Container } from '@/components/slices';
// // import FilterSidebar from '@/components/forms/FilterSidebar/FilterSidebar';
// // import ListingCard from '@/components/cards/ListingCard/ListingCard';
// import { useTranslation, useLanguage } from '@/hooks/useTranslation';
// import { Search, Grid3X3, List, Loader2 } from 'lucide-react';
// import { Listing, ListingFilterInput } from '@/types/listing';

// export default function CarsPage() {
//   const { t } = useTranslation();
//   const { language } = useLanguage();
//   const [searchQuery, setSearchQuery] = useState('');
//   const [filters, setFilters] = useState<ListingFilterInput>({});
//   const [listings, setListings] = useState<Listing[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [totalCount, setTotalCount] = useState(0);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage] = useState(12);
//   const [totalPages, setTotalPages] = useState(1);
//   const [aggregations, setAggregations] = useState(null);
//   const [staticData, setStaticData] = useState(null);

//   // Fetch listings from GraphQL API
//   const fetchListings = async () => {
//     try {
//       console.log('🚀 Starting fetchListings with filters:', filters);
//       console.log('📡 About to execute combined GetCarsPageData query');
//       setLoading(true);
//       setError(null);

//       const response = await fetch('http://localhost:4000/graphql', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           query: `
//             query GetCarsPageData($filter: ListingFilterInput, $brandFilter: ListingFilterInput, $limit: Float, $offset: Float) {
//               listingsSearch(filter: $filter, limit: $limit, offset: $offset) {
//                 id
//                 title
//                 prices {
//                   value
//                   currency
//                 }
//                 city
//                 country
//                 status
//                 allowBidding
//                 biddingStartPrice
//                 brandId
//                 modelId
//                 imageKeys
//                 createdAt
//                 updatedAt
//               }

//               filteredCount: listingsAggregations(filter: $filter) {
//                 totalResults
//               }

//               allBrands: listingsAggregations {
//                 brands {
//                   value
//                   count
//                 }
//               }

//               brandModels: listingsAggregations(filter: $brandFilter) {
//                 models {
//                   value
//                   count
//                 }
//               }

//               filterCounts: listingsAggregations(filter: $filter) {
//                 attributes {
//                   field
//                   options {
//                     value
//                     count
//                   }
//                 }
//               }

//               categories {
//                 id
//                 name
//                 slug
//               }
//               categoryAttributes(categoryId: "ec1b1b11-47bf-4a97-a4ee-84750919a73c") {
//                 id
//                 key
//                 label
//                 type
//                 options
//                 required
//                 filterable
//                 searchable
//                 unit
//                 sortOrder
//               }
//             }
//           `,
//           variables: {
//             filter: filters,
//             brandFilter: filters.make ? { make: filters.make } : {},
//             limit: itemsPerPage,
//             offset: (currentPage - 1) * itemsPerPage,
//           }
//         })
//       });

//       const result = await response.json();
//       console.log('🎯 COMBINED QUERY RESPONSE:', result);
//       console.log('🔍 Response data keys:', result.data ? Object.keys(result.data) : 'NO DATA');
//       console.log('📊 listingsSearch count:', result.data?.listingsSearch?.length || 'NONE');

//       if (result.data) {
//         // Update listings
//         const fetchedListings = result.data.listingsSearch || [];
//         console.log('📋 Fetched listings:', fetchedListings.length, 'items:', fetchedListings);
//         setListings(fetchedListings);

//         // Update count from filtered results
//         const count = result.data.filteredCount?.totalResults || 0;
//         setTotalCount(count);
//         setTotalPages(Math.ceil(count / itemsPerPage));

//         // Combine aggregation data for FilterSidebar
//         const aggregationsData = {
//           totalResults: count,
//           // All brands (for display)
//           brands: result.data.allBrands?.brands || [],
//           // Models for selected brand only
//           models: result.data.brandModels?.models || [],
//           // Filter counts for attributes
//           attributes: result.data.filterCounts?.attributes || []
//         };
//         setAggregations(aggregationsData);

//         // Cache static data (categories and attributes) on first load
//         if (result.data.categories && result.data.categoryAttributes && !staticData) {
//           setStaticData({
//             categories: result.data.categories,
//             categoryAttributes: result.data.categoryAttributes.filter(attr => attr.filterable)
//               .sort((a, b) => a.sortOrder - b.sortOrder)
//           });
//         }

//         console.log(`Marktplaats-style filtering - Filtered count: ${count}, All brands: ${aggregationsData.brands.length}, Models for selected brand: ${aggregationsData.models.length}`);
//         console.log('Full GraphQL response:', JSON.stringify(result.data, null, 2));
//       } else if (result.errors) {
//         setError('Failed to load listings');
//         console.error('GraphQL errors:', result.errors);
//       }
//     } catch (err) {
//       setError('Network error');
//       console.error('Fetch error:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchListings();
//   }, []);

//   // Refetch listings when page changes
//   useEffect(() => {
//     fetchListings();
//   }, [currentPage]);

//   // Debounced/accumulative search - wait for user to finish filtering before fetching
//   useEffect(() => {
//     const timeoutId = setTimeout(() => {
//       console.log('Debounced filter change - refetching with:', filters);
//       if (currentPage === 1) {
//         // If already on page 1, fetch directly since setCurrentPage won't trigger
//         fetchListings();
//       } else {
//         // If not on page 1, reset to page 1 (will trigger fetchListings via currentPage useEffect)
//         setCurrentPage(1);
//       }
//     }, 300); // 300ms debounce for fluid/accumulative search

//     return () => clearTimeout(timeoutId);
//   }, [filters]);

//   const handleFiltersChange = (newFilters: ListingFilterInput) => {
//     console.log('Filters updated:', newFilters);
//     setFilters(newFilters);
//   };

//   const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setSearchQuery(e.target.value);
//   };

//   const handleSearchSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     fetchListings();
//   };

//   return (
//     <div className="py-6">
//       <Container outer>
//         <Container inner>
//           {/* Page Header */}
//           <div className="mb-6">
//             <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
//               {language === 'ar' ? 'السيارات للبيع' : 'Cars for Sale'}
//             </h1>

//             {/* Search Bar */}
//             <form onSubmit={handleSearchSubmit} className="relative mb-4">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//               <input
//                 type="text"
//                 value={searchQuery}
//                 onChange={handleSearchChange}
//                 placeholder={language === 'ar' ? 'ابحث عن سيارة...' : 'Search for a car...'}
//                 className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               />
//             </form>
//           </div>

//           {/* Main Layout: Sidebar + Content */}
//           <div className="flex flex-col lg:flex-row gap-6">
//             {/* Filter Sidebar */}
//             <div className="w-full lg:w-auto">
//               <FilterSidebar
//                 onFiltersChange={handleFiltersChange}
//                 aggregations={aggregations}
//                 staticData={staticData}
//                 loading={loading}
//               />
//             </div>

//             {/* Main Content */}
//             <div className="flex-1">
//               {/* Results Header */}
//               <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
//                 <div className="flex items-center gap-4">
//                   {loading ? (
//                     <div className="flex items-center gap-2">
//                       <Loader2 className="w-4 h-4 animate-spin" />
//                       <span className="text-lg font-medium text-gray-900 dark:text-white">
//                         {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
//                       </span>
//                     </div>
//                   ) : (
//                     <span className="text-lg font-medium text-gray-900 dark:text-white">
//                       {language === 'ar'
//                         ? `عرض ${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, totalCount)} من ${totalCount} سيارة`
//                         : `Showing ${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, totalCount)} of ${totalCount} cars`}
//                     </span>
//                   )}
//                 </div>

//                 <div className="flex items-center gap-2">
//                   <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
//                     <Grid3X3 className="w-5 h-5" />
//                   </button>
//                   <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
//                     <List className="w-5 h-5" />
//                   </button>
//                 </div>
//               </div>

//               {/* Error State */}
//               {error && (
//                 <div className="text-center py-8">
//                   <p className="text-red-600 dark:text-red-400">
//                     {language === 'ar' ? 'خطأ في تحميل البيانات' : 'Error loading data'}
//                   </p>
//                   <button
//                     onClick={() => fetchListings()}
//                     className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
//                   >
//                     {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
//                   </button>
//                 </div>
//               )}

//               {/* Loading State */}
//               {loading && (
//                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
//                   {[...Array(6)].map((_, i) => (
//                     <div key={i} className="bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg h-80"></div>
//                   ))}
//                 </div>
//               )}

//               {/* Listings Grid */}
//               {!loading && !error && (
//                 <>
//                   {console.log('🎨 Rendering listings grid:', { loading, error, listingsCount: listings.length })}
//                   <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
//                     {listings.map((listing: Listing) => {
//                       console.log('🔍 Rendering listing:', listing.id, listing.title);
//                       return (
//                         <ListingCard
//                           key={listing.id}
//                           listing={listing}
//                         />
//                       );
//                     })}
//                   </div>
//                 </>
//               )}

//               {/* No Results */}
//               {!loading && !error && listings.length === 0 && (
//                 <div className="text-center py-8">
//                   <p className="text-gray-500 dark:text-gray-400">
//                     {language === 'ar' ? 'لا توجد نتائج' : 'No results found'}
//                   </p>
//                 </div>
//               )}

//               {/* Pagination */}
//               {totalPages > 1 && (
//                 <div className="mt-8 flex justify-center">
//                   <div className="flex items-center gap-2">
//                     {/* Previous Button */}
//                     <button
//                       onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
//                       disabled={currentPage === 1}
//                       className={`px-4 py-2 rounded-md ${
//                         currentPage === 1
//                           ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
//                           : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
//                       }`}
//                     >
//                       {language === 'ar' ? 'السابق' : 'Previous'}
//                     </button>

//                     {/* Page Numbers */}
//                     {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
//                       let pageNum;
//                       if (totalPages <= 5) {
//                         pageNum = i + 1;
//                       } else if (currentPage <= 3) {
//                         pageNum = i + 1;
//                       } else if (currentPage >= totalPages - 2) {
//                         pageNum = totalPages - 4 + i;
//                       } else {
//                         pageNum = currentPage - 2 + i;
//                       }

//                       return (
//                         <button
//                           key={pageNum}
//                           onClick={() => setCurrentPage(pageNum)}
//                           className={`px-4 py-2 rounded-md ${
//                             currentPage === pageNum
//                               ? 'bg-blue-600 text-white'
//                               : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
//                           }`}
//                         >
//                           {pageNum}
//                         </button>
//                       );
//                     })}

//                     {/* Next Button */}
//                     <button
//                       onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
//                       disabled={currentPage === totalPages}
//                       className={`px-4 py-2 rounded-md ${
//                         currentPage === totalPages
//                           ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
//                           : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
//                       }`}
//                     >
//                       {language === 'ar' ? 'التالي' : 'Next'}
//                     </button>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
//         </Container>
//       </Container>
//     </div>
//   );
// }
