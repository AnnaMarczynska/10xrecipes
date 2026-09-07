import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AxiosError } from 'axios';
import { searchRecipes, getRecipeDetails, getIngredients } from '../../../api/recipeClient';

// Mock axios interceptor
vi.mock('../../../api/interceptor', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

// Mock the cache module
vi.mock('../../../api/cache', () => ({
  getCachedOrFetch: vi.fn((key, fn) => fn()),
  getCacheKey: vi.fn((ingredients, timeRange) => `search_${ingredients.join(',')}_${timeRange}`),
}));

describe('RecipeClient Error Handling', () => {
  let axiosInstance: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('../../../api/interceptor');
    axiosInstance = mod.default;
  });

  it('should handle timeout errors with standardized message', async () => {
    const error = new AxiosError('Request timeout');
    error.code = 'ECONNABORTED';

    vi.mocked(axiosInstance.post).mockRejectedValue(error);

    await expect(searchRecipes(['chicken'], '30-60')).rejects.toThrow(
      'Request timed out after 5 seconds'
    );
  });

  it('should handle API errors with server message', async () => {
    const error = new AxiosError('Server error');
    error.response = {
      data: {
        error: { message: 'Ingredients not found' },
      },
    } as any;

    vi.mocked(axiosInstance.post).mockRejectedValue(error);

    await expect(searchRecipes(['chicken'], '30-60')).rejects.toThrow('Ingredients not found');
  });

  it('should handle generic network errors with fallback', async () => {
    const error = new Error('Network error');

    vi.mocked(axiosInstance.post).mockRejectedValue(error);

    await expect(searchRecipes(['chicken'], '30-60')).rejects.toThrow(
      'Failed to search recipes'
    );
  });

  it('should succeed on valid response', async () => {
    const mockResponse = {
      data: {
        data: {
          results: [
            { id: '1', name: 'Chicken Recipe', image: 'img.jpg', cookTime: 30, matchedIngredientCount: 1, matchPercentage: 100, score: 100 },
          ],
          total: 1,
        },
      },
    };

    vi.mocked(axiosInstance.post).mockResolvedValue(mockResponse);

    const result = await searchRecipes(['chicken'], '30-60');

    expect(result.total).toBe(1);
    expect(result.results[0].name).toBe('Chicken Recipe');
  });

  it('should handle recipe details timeout', async () => {
    const error = new AxiosError('Timeout');
    error.code = 'ECONNABORTED';

    vi.mocked(axiosInstance.get).mockRejectedValue(error);

    await expect(getRecipeDetails('123')).rejects.toThrow(
      'Request timed out after 5 seconds'
    );
  });

  it('should handle ingredients timeout', async () => {
    const error = new AxiosError('Timeout');
    error.code = 'ECONNABORTED';

    vi.mocked(axiosInstance.get).mockRejectedValue(error);

    await expect(getIngredients()).rejects.toThrow(
      'Request timed out after 5 seconds'
    );
  });
});
