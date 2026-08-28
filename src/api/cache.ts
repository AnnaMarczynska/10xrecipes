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
  const sorted = [...ingredients].sort().join(',');
  return `recipe_search_${sorted}_${timeRange}`;
}
