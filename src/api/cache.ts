interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

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

export function clearCache(key?: string): void {
  if (key) {
    localStorage.removeItem(key);
  } else {
    localStorage.clear();
  }
}

export function getCacheKey(ingredients: string[], timeRange: string): string {
  // Create a stable hash of ingredients and time range
  // Sorting ensures "chicken, garlic" and "garlic, chicken" produce the same cache key
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
