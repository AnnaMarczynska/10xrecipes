/**
 * Browser-based caching layer for API responses.
 *
 * Caches GET results in localStorage with 24-hour TTL.
 * Automatically invalidates expired entries and handles quota errors gracefully.
 *
 * Note: Only cache GET requests. Invalidate cache after writes (POST/PUT/DELETE).
 *
 * @example
 * // In API client:
 * const cacheKey = getCacheKey('allergens');
 * return await getCachedOrFetch(cacheKey, async () => {
 *   const response = await axiosInstance.get('/allergens');
 *   return response.data.data;
 * });
 *
 * @example
 * // After write, invalidate cache:
 * await axiosInstance.post('/allergens', { name: 'Peanuts' });
 * clearCache(getCacheKey('allergens'));
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Retrieve value from cache if it exists and hasn't expired.
 * Automatically removes expired entries.
 *
 * @param key Cache key (e.g., 'recipe_detail_123')
 * @returns Cached value or null if not found or expired
 */
export function getCached<T>(key: string): T | null {
  try {
    const entry = localStorage.getItem(key);
    if (!entry) return null;

    const cached: CacheEntry<T> = JSON.parse(entry);
    const now = Date.now();

    // Check if cache is still valid
    if (now - cached.timestamp > CACHE_TTL) {
      localStorage.removeItem(key);
      return null;
    }

    return cached.data;
  } catch (error) {
    // If cache is corrupted, remove it
    localStorage.removeItem(key);
    return null;
  }
}

/**
 * Store value in cache with current timestamp.
 * If localStorage quota exceeded, clears all cache and retries once.
 *
 * @param key Cache key (e.g., 'recipe_detail_123')
 * @param data Data to cache (will be JSON serialized)
 */
export function setCached<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (error) {
    // If quota exceeded, clear old cache entries and retry once
    if (error instanceof DOMException && error.code === 22) {
      localStorage.clear();
      try {
        localStorage.setItem(key, JSON.stringify({data, timestamp: Date.now()}));
      } catch (retryError) {
        console.error('Failed to cache after clearing storage:', retryError);
      }
    } else {
      console.warn('Failed to cache data:', error);
    }
  }
}

/**
 * Invalidate cache entry or all cache.
 * Call this after writes (POST/PUT/DELETE) to ensure next GET fetches fresh data.
 *
 * @param key Optional cache key to remove. If omitted, clears all cache.
 *
 * @example
 * // After adding a favorite, invalidate favorites cache:
 * await axiosInstance.post('/favorites', { recipeId: '123' });
 * clearCache(getCacheKey('user', 'favorites'));
 */
export function clearCache(key?: string): void {
  if (key) {
    localStorage.removeItem(key);
  } else {
    localStorage.clear();
  }
}

/**
 * Generate stable cache key from ingredients and time range.
 * Sorts ingredients to ensure same cache key regardless of order.
 *
 * @param ingredients Array of ingredient names (e.g., ['chicken', 'rice'])
 * @param timeRange Cooking time range (e.g., '30-60')
 * @returns Normalized cache key (e.g., 'recipe_search_chicken,rice_30-60')
 *
 * @example
 * const key = getCacheKey(['garlic', 'chicken'], '15-30');
 * const key2 = getCacheKey(['chicken', 'garlic'], '15-30'); // Same key!
 */
export function getCacheKey(ingredients: string[], timeRange: string): string {
  const sorted = [...ingredients].sort().join(',');
  return `recipe_search_${sorted}_${timeRange}`;
}

/**
 * Unified cache-check-then-fetch pattern to reduce duplication.
 * Checks cache for key; if hit, returns cached value.
 * If miss, calls fetch function, caches result, and returns.
 *
 * @param key - Cache key
 * @param fetchFn - Async function to call if cache miss
 * @param ttl - Optional TTL in milliseconds (defaults to CACHE_TTL)
 * @returns Cached or fetched value
 *
 * @example
 * const result = await getCachedOrFetch(
 *   'recipe_detail_123',
 *   () => axiosInstance.get<ApiResponse<RecipeDetail>>('/recipes/123'),
 *   CACHE_TTL
 * );
 */
export async function getCachedOrFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
): Promise<T> {
  // Check cache first
  const cached = getCached<T>(key);
  if (cached) {
    return cached;
  }

  // Cache miss: call fetch function
  const result = await fetchFn();

  // Cache the result
  setCached(key, result);

  return result;
}
