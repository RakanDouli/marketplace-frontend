// 🚀 PROGRESSIVE CATEGORY PAGE - Optimized for Syrian Internet
// This component demonstrates the progressive loading pattern for fast UX on slow connections

'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useProgressiveListingsStore } from '../../stores/listingsStore/listingsStore.progressive';
import { useProgressiveFiltersStore } from '../../stores/filtersStore/filtersStore.progressive';
import { useSearchStore } from '../../stores/searchStore';

// Loading skeleton components
import { ListingSkeleton } from '../Skeletons/ListingSkeleton';
import { FilterSkeleton } from '../Skeletons/FilterSkeleton';

// Main components
import { Filter } from '../Filter/Filter';
import { ListingsGrid } from '../Listings/ListingsGrid';
import { ListingsList } from '../Listings/ListingsList';
import { ConnectionIndicator } from '../UI/ConnectionIndicator';
import { ProgressiveLoader } from '../UI/ProgressiveLoader';

interface CategoryPageProgressiveProps {
  categorySlug: string;
}

export const CategoryPageProgressive: React.FC<CategoryPageProgressiveProps> = ({
  categorySlug
}) => {
  // 🚀 Progressive stores
  const {
    listings,
    isInitialLoading,
    isGridLoading,
    isListLoading,
    loadingPhase,
    connectionSpeed,
    viewType,
    pagination,
    loadCategoryPageProgressive,
    switchView,
    detectConnectionSpeed,
    clearExpiredCache,
  } = useProgressiveListingsStore();

  const {
    isLoadingEssential,
    isLoadingSecondary,
    loadEssentialFilters,
    optimizeForConnection,
    clearExpiredFilterCache,
  } = useProgressiveFiltersStore();

  const { filters: activeFilters } = useSearchStore();

  // 📱 Connection detection and optimization
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [showConnectionTips, setShowConnectionTips] = useState(false);

  // 🎯 MAIN LOADING EFFECT
  useEffect(() => {
    const loadCategoryWithOptimization = async () => {
      console.log("🚀 [CategoryPageProgressive] Starting category load...");

      try {
        // 1. Detect connection speed first
        const detectedSpeed = await detectConnectionSpeed();
        optimizeForConnection(detectedSpeed);

        // 2. Show connection tips for slow connections
        if (detectedSpeed === 'slow') {
          setShowConnectionTips(true);
        }

        // 3. Clear expired cache to free memory
        clearExpiredCache();
        clearExpiredFilterCache();

        // 4. Start progressive loading
        await Promise.all([
          loadCategoryPageProgressive(categorySlug),
          loadEssentialFilters(categorySlug)
        ]);

        setInitialLoadComplete(true);

      } catch (error) {
        console.error("❌ [CategoryPageProgressive] Failed to load category:", error);
      }
    };

    loadCategoryWithOptimization();
  }, [categorySlug]);

  // 🔄 VIEW SWITCHING HANDLER
  const handleViewSwitch = useCallback(async (newView: 'grid' | 'list') => {
    await switchView(newView);
  }, [switchView]);

  // 📱 RESPONSIVE LAYOUT BASED ON CONNECTION
  const layoutConfig = useMemo(() => {
    return {
      grid: {
        columns: connectionSpeed === 'slow' ? 2 : 3,
        itemsPerPage: connectionSpeed === 'slow' ? 10 : 20,
        showImages: true,
        imageQuality: connectionSpeed === 'slow' ? 'low' : 'medium',
      },
      list: {
        itemsPerPage: connectionSpeed === 'slow' ? 8 : 15,
        showPreviews: connectionSpeed !== 'slow',
        showDescriptions: connectionSpeed === 'fast',
      }
    };
  }, [connectionSpeed]);

  // 🎨 PROGRESSIVE RENDERING COMPONENTS
  const renderProgressiveContent = () => {
    // Phase 1: Initial skeleton
    if (loadingPhase === 'initial' && isInitialLoading) {
      return (
        <div className="category-page-progressive">
          <div className="filters-section">
            <FilterSkeleton count={6} />
          </div>
          <div className="listings-section">
            <ListingSkeleton
              count={layoutConfig.grid.itemsPerPage}
              layout={viewType}
            />
          </div>
        </div>
      );
    }

    // Phase 2: Basic content with progressive enhancements
    return (
      <div className="category-page-progressive">
        {/* Connection indicator for slow connections */}
        {showConnectionTips && (
          <ConnectionIndicator
            speed={connectionSpeed}
            onOptimize={() => optimizeForConnection('slow')}
          />
        )}

        {/* Progressive loading indicator */}
        <ProgressiveLoader
          phase={loadingPhase}
          isLoadingEssential={isLoadingEssential}
          isLoadingSecondary={isLoadingSecondary}
        />

        <div className="category-layout">
          {/* FILTERS SIDEBAR - Progressive loading */}
          <aside className="filters-sidebar">
            {isLoadingEssential ? (
              <FilterSkeleton count={6} />
            ) : (
              <Filter
                progressiveMode={true}
                connectionSpeed={connectionSpeed}
                showSecondaryFilters={loadingPhase === 'complete'}
              />
            )}
          </aside>

          {/* MAIN CONTENT AREA */}
          <main className="listings-content">
            {/* View switching controls */}
            <div className="view-controls">
              <ViewSwitcher
                currentView={viewType}
                onViewChange={handleViewSwitch}
                disabled={isGridLoading || isListLoading}
              />

              {/* Results count with loading state */}
              <div className="results-count">
                {pagination.total > 0 && (
                  <span>
                    {pagination.total.toLocaleString('ar-SY')} نتيجة
                  </span>
                )}
              </div>
            </div>

            {/* LISTINGS WITH PROGRESSIVE RENDERING */}
            <div className="listings-container">
              {renderListings()}
            </div>

            {/* PAGINATION */}
            {pagination.total > pagination.limit && (
              <Pagination
                current={pagination.page}
                total={pagination.total}
                pageSize={pagination.limit}
                connectionSpeed={connectionSpeed}
              />
            )}
          </main>
        </div>
      </div>
    );
  };

  // 📋 LISTINGS RENDERER
  const renderListings = () => {
    if (isGridLoading || isListLoading) {
      return (
        <ListingSkeleton
          count={layoutConfig[viewType].itemsPerPage}
          layout={viewType}
        />
      );
    }

    if (listings.length === 0 && initialLoadComplete) {
      return (
        <EmptyState
          categorySlug={categorySlug}
          hasFilters={Object.keys(activeFilters).length > 0}
        />
      );
    }

    // Render based on view type with connection optimizations
    if (viewType === 'grid') {
      return (
        <ListingsGrid
          listings={listings}
          config={layoutConfig.grid}
          progressiveImages={connectionSpeed === 'slow'}
          lazyLoad={true}
        />
      );
    }

    return (
      <ListingsList
        listings={listings}
        config={layoutConfig.list}
        showPreviews={layoutConfig.list.showPreviews}
        progressiveLoad={connectionSpeed === 'slow'}
      />
    );
  };

  return (
    <div className="category-page-progressive-wrapper">
      {renderProgressiveContent()}

      {/* Data usage indicator for slow connections */}
      {connectionSpeed === 'slow' && (
        <DataUsageIndicator />
      )}

      {/* Performance debug info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <PerformanceDebugPanel
          loadingPhase={loadingPhase}
          connectionSpeed={connectionSpeed}
          listingsCount={listings.length}
        />
      )}
    </div>
  );
};

// 🔄 VIEW SWITCHER COMPONENT
const ViewSwitcher: React.FC<{
  currentView: 'grid' | 'list';
  onViewChange: (view: 'grid' | 'list') => void;
  disabled: boolean;
}> = ({ currentView, onViewChange, disabled }) => (
  <div className="view-switcher">
    <button
      className={`view-btn ${currentView === 'grid' ? 'active' : ''}`}
      onClick={() => onViewChange('grid')}
      disabled={disabled}
      aria-label="عرض الشبكة"
    >
      <GridIcon />
    </button>
    <button
      className={`view-btn ${currentView === 'list' ? 'active' : ''}`}
      onClick={() => onViewChange('list')}
      disabled={disabled}
      aria-label="عرض القائمة"
    >
      <ListIcon />
    </button>
  </div>
);

// 📄 EMPTY STATE COMPONENT
const EmptyState: React.FC<{
  categorySlug: string;
  hasFilters: boolean;
}> = ({ categorySlug, hasFilters }) => (
  <div className="empty-state">
    <div className="empty-state-content">
      <h3>لا توجد نتائج</h3>
      {hasFilters ? (
        <p>جرب تعديل الفلاتر للحصول على نتائج أكثر</p>
      ) : (
        <p>لا توجد إعلانات في هذه الفئة حالياً</p>
      )}
    </div>
  </div>
);

// 📊 DATA USAGE INDICATOR
const DataUsageIndicator: React.FC = () => {
  const { estimateDataUsage } = useProgressiveListingsStore();
  const dataUsage = estimateDataUsage();

  return (
    <div className="data-usage-indicator">
      <span>استهلاك البيانات: {(dataUsage / 1024).toFixed(1)} KB</span>
    </div>
  );
};

// 🔧 PERFORMANCE DEBUG PANEL (development only)
const PerformanceDebugPanel: React.FC<{
  loadingPhase: string;
  connectionSpeed: string;
  listingsCount: number;
}> = ({ loadingPhase, connectionSpeed, listingsCount }) => (
  <div className="performance-debug">
    <h4>Performance Debug</h4>
    <ul>
      <li>Loading Phase: {loadingPhase}</li>
      <li>Connection: {connectionSpeed}</li>
      <li>Listings: {listingsCount}</li>
      <li>Timestamp: {new Date().toLocaleTimeString()}</li>
    </ul>
  </div>
);

// 📄 PAGINATION COMPONENT
const Pagination: React.FC<{
  current: number;
  total: number;
  pageSize: number;
  connectionSpeed: 'slow' | 'medium' | 'fast';
}> = ({ current, total, pageSize, connectionSpeed }) => {
  const totalPages = Math.ceil(total / pageSize);

  // Show fewer page numbers on slow connections
  const maxPageNumbers = connectionSpeed === 'slow' ? 5 : 10;

  return (
    <div className="pagination">
      {/* Pagination implementation */}
      <span>صفحة {current} من {totalPages}</span>
    </div>
  );
};

// 🎨 SIMPLE ICONS
const GridIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
  </svg>
);

const ListIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <rect x="3" y="5" width="18" height="2" />
    <rect x="3" y="11" width="18" height="2" />
    <rect x="3" y="17" width="18" height="2" />
  </svg>
);

export default CategoryPageProgressive;