import axiosInstance from './interceptor';
import { getCached, setCached, getCacheKey } from './cache';

interface SearchResult {
  results: RecipeResult[];
  total: number;
}

interface RecipeResult {
  id: string;
  name: string;
  image: string;
  cookTime: number;
  matchedIngredientCount: number;
  matchPercentage: number;
  score: number;
}

interface RecipeDetail extends RecipeResult {
  ingredients: Array<{ name: string; amount?: string }>;
  instructions: string;
  yield: string;
}

async function searchRecipes(
  ingredients: string[],
  timeRange: string
): Promise<SearchResult> {
  // Check cache first
  const cacheKey = getCacheKey(ingredients, timeRange);
  const cached = getCached<SearchResult>(cacheKey);
  if (cached && cached.results) {
    console.log('Using cached search results');
    return cached;
  }

  try {
    const response = await axiosInstance.post<{ data: SearchResult }>(
      '/recipes/search',
      { ingredients, timeRange },
      { timeout: 5000 }
    );

    console.log('Search response:', response);
    const data = response.data.data;
    console.log('Extracted data:', data);

    if (!data || !data.results) {
      throw new Error('Invalid response: missing results data');
    }

    // Cache the result
    setCached(cacheKey, data);

    return data;
  } catch (error: any) {
    console.error('Search error:', error);
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out after 5 seconds');
    }
    throw error;
  }
}

async function getRecipeDetails(id: string): Promise<RecipeDetail> {
  // Check cache first
  const cacheKey = `recipe_detail_${id}`;
  const cached = getCached<RecipeDetail>(cacheKey);
  if (cached) {
    console.log('Using cached recipe details');
    return cached;
  }

  try {
    const response = await axiosInstance.get<{ data: RecipeDetail }>(
      `/recipes/${id}/details`,
      { timeout: 5000 }
    );

    const data = response.data.data;

    // Cache the result
    setCached(cacheKey, data);

    return data;
  } catch (error: any) {
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out after 5 seconds');
    }
    throw error;
  }
}

async function getIngredients(): Promise<string[]> {
  // Check cache first
  const cacheKey = 'ingredients_list';
  const cached = getCached<string[]>(cacheKey);
  if (cached) {
    console.log('Using cached ingredients');
    return cached;
  }

  try {
    const response = await axiosInstance.get<{ ingredients: string[] }>(
      '/ingredients',
      { timeout: 5000 }
    );

    const ingredients = response.data.ingredients || [];

    // Cache the result
    setCached(cacheKey, ingredients);

    return ingredients;
  } catch (error: any) {
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out after 5 seconds');
    }
    throw error;
  }
}

export { searchRecipes, getRecipeDetails, getIngredients };
export type { SearchResult, RecipeResult, RecipeDetail };
