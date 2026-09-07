import { AxiosError } from 'axios';
import axiosInstance from './interceptor';
import { getCachedOrFetch, getCacheKey } from './cache';
import { SearchResult, RecipeResult, RecipeDetail, ApiResponse } from './types';

const API_TIMEOUT_MS = 5000;

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof AxiosError) {
    if (error.code === 'ECONNABORTED') {
      return `Request timed out after ${API_TIMEOUT_MS / 1000} seconds`;
    }
    const apiError = (error.response?.data as ApiResponse<unknown>)?.error;
    return apiError?.message || fallback;
  }
  return fallback;
};

async function searchRecipes(
  ingredients: string[],
  timeRange: string
): Promise<SearchResult> {
  try {
    const cacheKey = getCacheKey(ingredients, timeRange);
    return await getCachedOrFetch(cacheKey, async () => {
      const response = await axiosInstance.post<{ data: SearchResult }>(
        '/recipes/search',
        { ingredients, timeRange },
        { timeout: API_TIMEOUT_MS }
      );

      const data = response.data.data;

      if (!data || !data.results) {
        throw new Error('Invalid response: missing results data');
      }

      return data;
    });
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to search recipes'));
  }
}

async function getRecipeDetails(id: string): Promise<RecipeDetail> {
  try {
    const cacheKey = `recipe_detail_${id}`;
    return await getCachedOrFetch(cacheKey, async () => {
      const response = await axiosInstance.get<{ data: RecipeDetail }>(
        `/recipes/${id}/details`,
        { timeout: API_TIMEOUT_MS }
      );

      return response.data.data;
    });
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to fetch recipe details'));
  }
}

async function getIngredients(): Promise<string[]> {
  try {
    const cacheKey = 'ingredients_list';
    return await getCachedOrFetch(cacheKey, async () => {
      const response = await axiosInstance.get<{ ingredients: string[] }>(
        '/ingredients',
        { timeout: API_TIMEOUT_MS }
      );

      return response.data.ingredients || [];
    });
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to fetch ingredients'));
  }
}

export { searchRecipes, getRecipeDetails, getIngredients };
export type { SearchResult, RecipeResult, RecipeDetail, ApiResponse };
