import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { searchRecipes, getRecipeDetails, getIngredients } from '../../../api/recipeClient';

// Mock the cache module
vi.mock('../../../api/cache', () => ({
  getCached: vi.fn(() => null),
  setCached: vi.fn(),
  getCacheKey: vi.fn((ingredients, timeRange) => `search_${ingredients.join(',')}_${timeRange}`),
}));

describe('RecipeClient Timeout Handling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Helper to set global fetch
  const setGlobalFetch = (fn: any) => {
    (globalThis as any).fetch = fn;
  };

  it('should timeout searchRecipes after 5 seconds on slow server', async () => {
    // Mock fetch to reject when abort signal fires
    const fetchMock = vi.fn(async (_url: string, options: any) => {
      return new Promise((_, reject) => {
        if (options?.signal) {
          options.signal.addEventListener('abort', () => {
            const error = new Error('The operation was aborted.');
            (error as any).name = 'AbortError';
            reject(error);
          });
        }
        // Simulate never resolving (slow server)
      });
    });
    setGlobalFetch(fetchMock);

    const promise = searchRecipes(['chicken'], '30-60');

    // Advance time by 5 seconds
    vi.advanceTimersByTime(5000);

    // Expect timeout error
    await expect(promise).rejects.toThrow(/timed out after 5 seconds/i);
  });

  it('should timeout getRecipeDetails after 5 seconds on slow server', async () => {
    const fetchMock = vi.fn(async (_url: string, options: any) => {
      return new Promise((_, reject) => {
        if (options?.signal) {
          options.signal.addEventListener('abort', () => {
            const error = new Error('The operation was aborted.');
            (error as any).name = 'AbortError';
            reject(error);
          });
        }
      });
    });
    setGlobalFetch(fetchMock);

    const promise = getRecipeDetails('123');

    vi.advanceTimersByTime(5000);

    await expect(promise).rejects.toThrow(/timed out after 5 seconds/i);
  });

  it('should timeout getIngredients after 5 seconds on slow server', async () => {
    const fetchMock = vi.fn(async (_url: string, options: any) => {
      return new Promise((_, reject) => {
        if (options?.signal) {
          options.signal.addEventListener('abort', () => {
            const error = new Error('The operation was aborted.');
            (error as any).name = 'AbortError';
            reject(error);
          });
        }
      });
    });
    setGlobalFetch(fetchMock);

    const promise = getIngredients();

    vi.advanceTimersByTime(5000);

    await expect(promise).rejects.toThrow(/timed out after 5 seconds/i);
  });

  it('should succeed on fast response (before timeout)', async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        results: [
          { id: '1', name: 'Chicken Recipe', image: 'img.jpg', cookTime: 30, matchedIngredientCount: 1, matchPercentage: 100, score: 100 },
        ],
        total: 1,
      }),
    };

    const fetchMock = vi.fn().mockResolvedValue(mockResponse);
    setGlobalFetch(fetchMock);

    const promise = searchRecipes(['chicken'], '30-60');

    // Advance time by 2 seconds (less than 5s timeout)
    vi.advanceTimersByTime(2000);

    const result = await promise;

    expect(result.total).toBe(1);
    expect(result.results[0].name).toBe('Chicken Recipe');
  });

  it('should clear timeout on successful response', async () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        results: [],
        total: 0,
      }),
    };

    const fetchMock = vi.fn().mockResolvedValue(mockResponse);
    setGlobalFetch(fetchMock);

    const promise = searchRecipes(['chicken'], '30-60');

    vi.advanceTimersByTime(1000);

    await promise;

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it('should clear timeout on error (non-abort)', async () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

    const fetchMock = vi.fn().mockRejectedValue(new Error('Network error'));
    setGlobalFetch(fetchMock);

    const promise = searchRecipes(['chicken'], '30-60');

    vi.advanceTimersByTime(1000);

    await expect(promise).rejects.toThrow('Network error');

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it('should pass AbortSignal to fetch call', async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({ results: [], total: 0 }),
    };

    const fetchMock = vi.fn().mockResolvedValue(mockResponse);
    setGlobalFetch(fetchMock);

    await searchRecipes(['chicken'], '30-60');

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/recipes/search',
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      })
    );
  });
});
