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
  if (cached) {
    console.log('Using cached search results');
    return cached;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch('/api/recipes/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredients, timeRange }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error('Search failed');
    }

    const data = await response.json();

    // Cache the result
    setCached(cacheKey, data);

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(`/api/recipes/${id}/details`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error('Failed to fetch recipe details');
    }

    const data = await response.json();

    // Cache the result
    setCached(cacheKey, data);

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch('/api/ingredients', {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error('Failed to fetch ingredients');
    }

    const data = await response.json();
    const ingredients = data.ingredients || [];

    // Cache the result
    setCached(cacheKey, ingredients);

    return ingredients;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out after 5 seconds');
    }
    throw error;
  }
}

export { searchRecipes, getRecipeDetails, getIngredients };
export type { SearchResult, RecipeResult, RecipeDetail };
