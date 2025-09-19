// GraphQL Request Cache and Deduplication with Session Storage
interface CacheEntry {
  data: any;
  timestamp: number;
  promise?: Promise<any>;
}

interface SessionCacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

interface RequestKey {
  query: string;
  variables: any;
}

class GraphQLCache {
  private cache = new Map<string, CacheEntry>();
  private pendingRequests = new Map<string, Promise<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes
  private sessionStorageKey = 'marketplace_graphql_cache';

  private createKey(query: string, variables: any = {}): string {
    // Include viewType in cache key for view-specific optimization
    const normalizedQuery = query.replace(/\s+/g, ' ').trim();

    // Sort variables for consistent cache keys and normalize critical pagination/filter params
    const normalizedVariables = this.normalizeVariables(variables);
    const keyData = { query: normalizedQuery, variables: normalizedVariables };

    // Log cache key creation for debugging
    if (variables?.filter?.viewType) {
      console.log(`🔑 GraphQL Cache: Creating cache key with viewType: ${variables.filter.viewType}`);
    }

    return JSON.stringify(keyData);
  }

  private normalizeVariables(variables: any): any {
    if (!variables) return {};

    // Create a deep copy and normalize key fields that affect caching
    const normalized = JSON.parse(JSON.stringify(variables));

    // Sort filter keys for consistent cache keys
    if (normalized.filter) {
      const sortedFilter: any = {};
      Object.keys(normalized.filter).sort().forEach(key => {
        sortedFilter[key] = normalized.filter[key];
      });
      normalized.filter = sortedFilter;
    }

    // Ensure pagination params are included in cache key
    if (normalized.offset !== undefined) {
      normalized.offset = Number(normalized.offset);
    }
    if (normalized.limit !== undefined) {
      normalized.limit = Number(normalized.limit);
    }

    return normalized;
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > this.defaultTTL;
  }

  private loadFromSessionStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = sessionStorage.getItem(this.sessionStorageKey);
      if (!stored) return;

      const sessionCache: Record<string, SessionCacheEntry> = JSON.parse(stored);
      const now = Date.now();

      // Load valid entries from session storage
      Object.entries(sessionCache).forEach(([key, entry]) => {
        if (now - entry.timestamp < entry.ttl) {
          this.cache.set(key, {
            data: entry.data,
            timestamp: entry.timestamp,
          });
          console.log(`🔄 Restored from session: ${key.substring(0, 50)}...`);
        }
      });
    } catch (error) {
      console.warn('Failed to load cache from session storage:', error);
    }
  }

  private saveToSessionStorage(key: string, entry: CacheEntry, ttl: number): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = sessionStorage.getItem(this.sessionStorageKey);
      const sessionCache: Record<string, SessionCacheEntry> = stored ? JSON.parse(stored) : {};

      sessionCache[key] = {
        data: entry.data,
        timestamp: entry.timestamp,
        ttl: ttl,
      };

      sessionStorage.setItem(this.sessionStorageKey, JSON.stringify(sessionCache));
      console.log(`💾 Saved to session: ${key.substring(0, 50)}...`);
    } catch (error) {
      console.warn('Failed to save cache to session storage:', error);
    }
  }

  async request(query: string, variables: any = {}, options: { ttl?: number } = {}): Promise<any> {
    // Load from session storage on first request
    if (this.cache.size === 0) {
      this.loadFromSessionStorage();
    }

    const key = this.createKey(query, variables);
    const ttl = options.ttl || this.defaultTTL;

    console.log(`🔍 GraphQL Cache: Checking cache for key: ${key.substring(0, 100)}...`);

    // Check if we have a valid cached response
    const cached = this.cache.get(key);
    if (cached && !this.isExpired(cached)) {
      console.log(`✅ GraphQL Cache: Cache HIT for ${key.substring(0, 50)}...`);
      return cached.data;
    }

    // Check if there's already a pending request for this exact query
    const pending = this.pendingRequests.get(key);
    if (pending) {
      console.log(`⏳ GraphQL Cache: Request DEDUP for ${key.substring(0, 50)}...`);
      return pending;
    }

    // Make the actual request
    console.log(`🚀 GraphQL Cache: Making new request for ${key.substring(0, 50)}...`);
    const requestPromise = this.makeRequest(query, variables);

    // Store the pending promise to deduplicate concurrent requests
    this.pendingRequests.set(key, requestPromise);

    try {
      const data = await requestPromise;

      // Cache the successful response
      const cacheEntry = {
        data,
        timestamp: Date.now(),
      };
      this.cache.set(key, cacheEntry);

      // Save to session storage for persistence across page refreshes
      this.saveToSessionStorage(key, cacheEntry, ttl);

      console.log(`✅ GraphQL Cache: Cached response for ${key.substring(0, 50)}...`);
      return data;
    } catch (error) {
      console.error(`❌ GraphQL Cache: Request failed for ${key.substring(0, 50)}...`, error);
      throw error;
    } finally {
      // Remove from pending requests
      this.pendingRequests.delete(key);
    }
  }

  private async makeRequest(query: string, variables: any = {}): Promise<any> {
    const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    return result.data;
  }

  // Clear expired entries
  cleanup(): void {
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
      }
    }
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();

    // Clear session storage as well
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(this.sessionStorageKey);
    }
  }

  // Selective cache invalidation for filter/pagination changes
  invalidateByPattern(pattern: string): void {
    const keysToDelete: string[] = [];

    for (const [key] of Array.from(this.cache.entries())) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      this.cache.delete(key);
      console.log(`🗑️ GraphQL Cache: Invalidated cache for pattern "${pattern}": ${key.substring(0, 50)}...`);
    });

    // Also clear from session storage
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem(this.sessionStorageKey);
        if (stored) {
          const sessionCache: Record<string, SessionCacheEntry> = JSON.parse(stored);
          const filteredCache: Record<string, SessionCacheEntry> = {};

          Object.entries(sessionCache).forEach(([key, entry]) => {
            if (!key.includes(pattern)) {
              filteredCache[key] = entry;
            }
          });

          sessionStorage.setItem(this.sessionStorageKey, JSON.stringify(filteredCache));
        }
      } catch (error) {
        console.warn('Failed to invalidate session storage cache:', error);
      }
    }
  }

  // Get cache stats
  getStats(): { size: number; pending: number } {
    return {
      size: this.cache.size,
      pending: this.pendingRequests.size,
    };
  }
}

// Global cache instance
export const graphqlCache = new GraphQLCache();

// Auto cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    graphqlCache.cleanup();
    console.log('🧹 GraphQL Cache: Cleanup completed', graphqlCache.getStats());
  }, 5 * 60 * 1000);
}

// Wrapper function for easy use
export async function cachedGraphQLRequest(
  query: string,
  variables?: any,
  options?: { ttl?: number }
): Promise<any> {
  return graphqlCache.request(query, variables, options);
}

// Clear cache function for development/debugging
export function clearGraphQLCache(): void {
  graphqlCache.clear();
  console.log('🧹 GraphQL Cache: Manually cleared all cache');
}

// Invalidate cache by pattern for filter/pagination changes
export function invalidateGraphQLCache(pattern: string): void {
  graphqlCache.invalidateByPattern(pattern);
  console.log(`🗑️ GraphQL Cache: Invalidated cache for pattern: ${pattern}`);
}