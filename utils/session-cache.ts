// Shared session cache utility for coordinating data between stores
interface SessionEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface SharedSessionData {
  // Categories cache - shared between all stores
  categories?: {
    data: any[];
    categorySlug?: string;
    timestamp: number;
  };

  // Attributes cache per category - shared between filtersStore and searchStore
  attributes?: Record<string, {
    data: any[];
    timestamp: number;
  }>;

  // Aggregations cache - shared between filtersStore and listingsStore
  aggregations?: Record<string, {
    data: any;
    filterHash: string;
    timestamp: number;
  }>;
}

class SessionCacheManager {
  private sessionKey = 'marketplace_shared_cache';
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  private getSessionData(): SharedSessionData {
    if (typeof window === 'undefined') return {};

    try {
      const stored = sessionStorage.getItem(this.sessionKey);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.warn('Failed to load shared session data:', error);
      return {};
    }
  }

  private saveSessionData(data: SharedSessionData): void {
    if (typeof window === 'undefined') return;

    try {
      sessionStorage.setItem(this.sessionKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save shared session data:', error);
    }
  }

  // Categories management
  getCategories(): any[] | null {
    const sessionData = this.getSessionData();
    const categoriesCache = sessionData.categories;

    if (!categoriesCache) return null;

    // Check if expired (longer TTL for categories - they rarely change)
    const categoriesTTL = 30 * 60 * 1000; // 30 minutes
    if (Date.now() - categoriesCache.timestamp > categoriesTTL) {
      return null;
    }

    console.log('🔄 Restored categories from shared session cache');
    return categoriesCache.data;
  }

  setCategories(categories: any[]): void {
    const sessionData = this.getSessionData();
    sessionData.categories = {
      data: categories,
      timestamp: Date.now(),
    };
    this.saveSessionData(sessionData);
    console.log('💾 Saved categories to shared session cache');
  }

  // Attributes management per category
  getAttributes(categorySlug: string): any[] | null {
    const sessionData = this.getSessionData();
    const attributesCache = sessionData.attributes?.[categorySlug];

    if (!attributesCache) return null;

    // Check if expired
    if (Date.now() - attributesCache.timestamp > this.defaultTTL) {
      return null;
    }

    console.log(`🔄 Restored attributes for ${categorySlug} from shared session cache`);
    return attributesCache.data;
  }

  setAttributes(categorySlug: string, attributes: any[]): void {
    const sessionData = this.getSessionData();
    if (!sessionData.attributes) sessionData.attributes = {};

    sessionData.attributes[categorySlug] = {
      data: attributes,
      timestamp: Date.now(),
    };
    this.saveSessionData(sessionData);
    console.log(`💾 Saved attributes for ${categorySlug} to shared session cache`);
  }

  // Aggregations management with filter hash
  getAggregations(categorySlug: string, filterHash: string): any | null {
    const sessionData = this.getSessionData();
    const aggregationsCache = sessionData.aggregations?.[categorySlug];

    if (!aggregationsCache) return null;

    // Check if filter hash matches
    if (aggregationsCache.filterHash !== filterHash) {
      return null;
    }

    // Check if expired (shorter TTL for aggregations - they change frequently)
    const aggregationsTTL = 2 * 60 * 1000; // 2 minutes
    if (Date.now() - aggregationsCache.timestamp > aggregationsTTL) {
      return null;
    }

    console.log(`🔄 Restored aggregations for ${categorySlug} from shared session cache`);
    return aggregationsCache.data;
  }

  setAggregations(categorySlug: string, filterHash: string, aggregations: any): void {
    const sessionData = this.getSessionData();
    if (!sessionData.aggregations) sessionData.aggregations = {};

    sessionData.aggregations[categorySlug] = {
      data: aggregations,
      filterHash,
      timestamp: Date.now(),
    };
    this.saveSessionData(sessionData);
    console.log(`💾 Saved aggregations for ${categorySlug} to shared session cache`);
  }

  // Create a hash from filter object for cache keying
  createFilterHash(filters: any): string {
    // Create a consistent hash from filter values
    const filterString = JSON.stringify(filters, Object.keys(filters).sort());
    return btoa(filterString).slice(0, 16); // Use base64 of first 16 chars for compact hash
  }

  // Clear all shared session data
  clear(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(this.sessionKey);
    }
    console.log('🧹 Cleared all shared session cache');
  }

  // Clear specific category data
  clearCategory(categorySlug: string): void {
    const sessionData = this.getSessionData();

    // Clear category-specific attributes
    if (sessionData.attributes) {
      delete sessionData.attributes[categorySlug];
    }

    // Clear category-specific aggregations
    if (sessionData.aggregations) {
      delete sessionData.aggregations[categorySlug];
    }

    this.saveSessionData(sessionData);
    console.log(`🧹 Cleared shared session cache for category: ${categorySlug}`);
  }

  // Get cache statistics
  getStats(): {
    categories: boolean;
    attributesCount: number;
    aggregationsCount: number;
    totalSize: number;
  } {
    const sessionData = this.getSessionData();

    return {
      categories: !!sessionData.categories,
      attributesCount: Object.keys(sessionData.attributes || {}).length,
      aggregationsCount: Object.keys(sessionData.aggregations || {}).length,
      totalSize: typeof window !== 'undefined' ?
        (sessionStorage.getItem(this.sessionKey)?.length || 0) : 0,
    };
  }
}

// Export singleton instance
export const sessionCache = new SessionCacheManager();

// Convenience functions for common patterns
export function cacheCategories(categories: any[]): void {
  sessionCache.setCategories(categories);
}

export function getCachedCategories(): any[] | null {
  return sessionCache.getCategories();
}

export function cacheAttributesForCategory(categorySlug: string, attributes: any[]): void {
  sessionCache.setAttributes(categorySlug, attributes);
}

export function getCachedAttributesForCategory(categorySlug: string): any[] | null {
  return sessionCache.getAttributes(categorySlug);
}

export function cacheAggregationsForCategory(
  categorySlug: string,
  filters: any,
  aggregations: any
): void {
  const filterHash = sessionCache.createFilterHash(filters);
  sessionCache.setAggregations(categorySlug, filterHash, aggregations);
}

export function getCachedAggregationsForCategory(
  categorySlug: string,
  filters: any
): any | null {
  const filterHash = sessionCache.createFilterHash(filters);
  return sessionCache.getAggregations(categorySlug, filterHash);
}

export function clearCacheForCategory(categorySlug: string): void {
  sessionCache.clearCategory(categorySlug);
}

export function clearAllCache(): void {
  sessionCache.clear();
}

export function getCacheStats() {
  return sessionCache.getStats();
}