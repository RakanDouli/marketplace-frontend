// GraphQL Request Cache and Deduplication
interface CacheEntry {
  data: any;
  timestamp: number;
  promise?: Promise<any>;
}

interface RequestKey {
  query: string;
  variables: any;
}

class GraphQLCache {
  private cache = new Map<string, CacheEntry>();
  private pendingRequests = new Map<string, Promise<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  private createKey(query: string, variables: any = {}): string {
    // Include viewType in cache key for view-specific optimization
    const normalizedQuery = query.replace(/\s+/g, ' ').trim();
    const keyData = { query: normalizedQuery, variables };

    // Log cache key creation for debugging
    if (variables?.filter?.viewType) {
      console.log(`🔑 GraphQL Cache: Creating cache key with viewType: ${variables.filter.viewType}`);
    }

    return JSON.stringify(keyData);
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > this.defaultTTL;
  }

  async request(query: string, variables: any = {}, options: { ttl?: number } = {}): Promise<any> {
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
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
      });

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