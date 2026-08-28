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

  const response = await fetch('/api/recipes/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ingredients, timeRange }),
  });

  if (!response.ok) {
    throw new Error('Search failed');
  }

  const data = await response.json();

  // Cache the result
  setCached(cacheKey, data);

  return data;
}

async function getRecipeDetails(id: string): Promise<RecipeDetail> {
  // Check cache first
  const cacheKey = `recipe_detail_${id}`;
  const cached = getCached<RecipeDetail>(cacheKey);
  if (cached) {
    console.log('Using cached recipe details');
    return cached;
  }

  const response = await fetch(`/api/recipes/${id}/details`);

  if (!response.ok) {
    throw new Error('Failed to fetch recipe details');
  }

  const data = await response.json();

  // Cache the result
  setCached(cacheKey, data);

  return data;
}

async function getIngredients(): Promise<string[]> {
  // Check cache first
  const cacheKey = 'ingredients_list';
  const cached = getCached<string[]>(cacheKey);
  if (cached) {
    console.log('Using cached ingredients');
    return cached;
  }

  const response = await fetch('/api/ingredients');

  if (!response.ok) {
    throw new Error('Failed to fetch ingredients');
  }

  const data = await response.json();
  const ingredients = data.ingredients || [];

  // Cache the result
  setCached(cacheKey, ingredients);

  return ingredients;
}

export { searchRecipes, getRecipeDetails, getIngredients };
export type { SearchResult, RecipeResult, RecipeDetail };
