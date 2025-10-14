// GraphQL Request Cache and Deduplication (In-Memory Only)
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number; // Custom TTL per entry in milliseconds
  promise?: Promise<any>;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
}

class GraphQLCache {
  private cache = new Map<string, CacheEntry>();
  private pendingRequests = new Map<string, Promise<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  private createKey(query: string, variables: any = {}): string {
    // Include viewType in cache key for view-specific optimization
    const normalizedQuery = query.replace(/\s+/g, " ").trim();

    // Sort variables for consistent cache keys and normalize critical pagination/filter params
    const normalizedVariables = this.normalizeVariables(variables);
    const keyData = { query: normalizedQuery, variables: normalizedVariables };

    // // Log cache key creation for debugging
    // if (variables?.filter?.viewType) {
    //   console.log(
    //     `🔑 GraphQL Cache: Creating cache key with viewType: ${variables.filter.viewType}`
    //   );
    // }

    return JSON.stringify(keyData);
  }

  private normalizeVariables(variables: any): any {
    if (!variables) return {};

    // Create a deep copy and normalize key fields that affect caching
    const normalized = JSON.parse(JSON.stringify(variables));

    // Sort filter keys for consistent cache keys
    if (normalized.filter) {
      const sortedFilter: any = {};
      Object.keys(normalized.filter)
        .sort()
        .forEach((key) => {
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
    const ttl = entry.ttl || this.defaultTTL;
    return Date.now() - entry.timestamp > ttl;
  }

  async request(query: string, variables: any = {}, options?: CacheOptions): Promise<any> {
    const key = this.createKey(query, variables);
    const ttl = options?.ttl || this.defaultTTL;

    // console.log(
    //   `🔍 GraphQL Cache: Checking cache for key: ${key.substring(0, 100)}...`
    // );

    // Check if we have a valid cached response
    const cached = this.cache.get(key);
    if (cached && !this.isExpired(cached)) {
      // console.log(`✅ GraphQL Cache: Cache HIT for ${key.substring(0, 50)}...`);
      return cached.data;
    }

    // Check if there's already a pending request for this exact query
    const pending = this.pendingRequests.get(key);
    if (pending) {
      // console.log(
      //   `⏳ GraphQL Cache: Request DEDUP for ${key.substring(0, 50)}...`
      // );
      return pending;
    }

    // // Make the actual request
    // console.log(
    //   `🚀 GraphQL Cache: Making new request for ${key.substring(0, 50)}...`
    // );
    const requestPromise = this.makeRequest(query, variables);

    // Store the pending promise to deduplicate concurrent requests
    this.pendingRequests.set(key, requestPromise);

    try {
      const data = await requestPromise;

      // Cache the successful response with custom TTL
      const cacheEntry: CacheEntry = {
        data,
        timestamp: Date.now(),
        ttl, // Store custom TTL with this entry
      };
      this.cache.set(key, cacheEntry);

      // console.log(
      //   `✅ GraphQL Cache: Cached response for ${key.substring(0, 50)}...`
      // );
      return data;
    } catch (error) {
      // console.error(
      //   `❌ GraphQL Cache: Request failed for ${key.substring(0, 50)}...`,
      //   error
      // );
      throw error;
    } finally {
      // Remove from pending requests
      this.pendingRequests.delete(key);
    }
  }

  private async makeRequest(query: string, variables: any = {}): Promise<any> {
    const endpoint =
      process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ||
      "http://localhost:4000/graphql";

    // Get auth token from Supabase
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Try to get the auth token if user is logged in
    if (typeof window !== 'undefined') {
      try {
        const { supabase } = await import('../lib/supabase');
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
      } catch (error) {
        // Ignore errors - public queries will still work without auth
        console.warn('Could not get auth token:', error);
      }
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
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
  }

  // Selective cache invalidation for filter/pagination changes
  invalidateByPattern(pattern: string): void {
    const keysToDelete: string[] = [];

    for (const [key] of Array.from(this.cache.entries())) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => {
      this.cache.delete(key);
      // console.log(
      //   `🗑️ GraphQL Cache: Invalidated cache for pattern "${pattern}": ${key.substring(
      //     0,
      //     50
      //   )}...`
      // );
    });
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
if (typeof window !== "undefined") {
  setInterval(() => {
    graphqlCache.cleanup();
    // console.log("🧹 GraphQL Cache: Cleanup completed", graphqlCache.getStats());
  }, 5 * 60 * 1000);
}

// Wrapper function for easy use
export async function cachedGraphQLRequest(
  query: string,
  variables?: any,
  options?: CacheOptions
): Promise<any> {
  return graphqlCache.request(query, variables, options);
}

// Clear cache function for development/debugging
export function clearGraphQLCache(): void {
  graphqlCache.clear();
  // console.log("🧹 GraphQL Cache: Manually cleared all cache");
}

// Invalidate cache by pattern for filter/pagination changes
export function invalidateGraphQLCache(pattern: string): void {
  graphqlCache.invalidateByPattern(pattern);
  // console.log(`🗑️ GraphQL Cache: Invalidated cache for pattern: ${pattern}`);
}
