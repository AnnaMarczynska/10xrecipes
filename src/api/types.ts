/**
 * Unified API type contracts for all frontend clients.
 * Single source of truth for request/response shapes.
 */

/**
 * Generic API response envelope used by all backend endpoints.
 * Wraps the actual data and includes error information.
 */
export interface ApiResponse<T> {
  data: T;
  error: null | {
    code: string;
    message: string;
    details?: string;
  };
  status: number;
}

/**
 * Authentication response from signup/login endpoints.
 */
export interface AuthResponse {
  token: string;
  email: string;
  message?: string;
}

/**
 * User profile information retrieved from backend.
 */
export interface UserProfile {
  email: string;
  id?: string;
}

/**
 * Recipe search result from the search endpoint.
 * Contains summary information; use getRecipeDetails for full recipe.
 */
export interface RecipeResult {
  id: string;
  name: string;
  image: string;
  cookTime: number;
  matchedIngredientCount: number;
  matchPercentage: number;
  score: number;
}

/**
 * Full recipe details retrieved from the recipe detail endpoint.
 * Includes ingredients list and preparation instructions.
 */
export interface RecipeDetail extends RecipeResult {
  ingredients: Array<{ name: string; amount?: string }>;
  instructions: string;
  yield: string;
}

/**
 * Paginated search results response from recipe search endpoint.
 */
export interface SearchResult {
  results: RecipeResult[];
  total: number;
}

/**
 * Favorite recipe entry stored in user's favorites list.
 */
export interface Favorite {
  id: number;
  recipeId: string;
  recipeName: string;
  notes: string | null;
  addedAt: string;
}

/**
 * Response from get favorites endpoint.
 */
export interface FavoritesListResponse {
  favorites: Favorite[];
  total: number;
}
