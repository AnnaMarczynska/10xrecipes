# Recipe Search Components

Feature-specific components for the recipe search flow. These components coordinate search functionality and manage search-related state. They can import from `api/` and feature-specific contexts.

## Components

### SearchForm
- **Purpose:** Orchestrate the recipe search flow (input, execute, display results)
- **Props:**
  - `onSelectRecipe?: (recipeId: string) => void` — callback when user clicks a recipe
- **Usage:**
  ```tsx
  const handleSelectRecipe = (recipeId: string) => {
    navigate(`/recipe/${recipeId}`);
  };
  <SearchForm onSelectRecipe={handleSelectRecipe} />
  ```
- **Features:**
  - Ingredient selection (via IngredientAutocomplete)
  - Cooking time range selection (via TimeRangeSelector)
  - Search execution and error handling
  - Results list display
- **State:** ingredients, timeRange, results, loading, error
- **Important:** Does NOT render detail view — parent handles navigation

### IngredientAutocomplete
- **Purpose:** Let user search and select available ingredients
- **Props:** `onSelectIngredients: (selected: string[]) => void`
- **Features:**
  - Auto-complete suggestions as user types
  - Max 10 ingredients
  - Display selected ingredients as chips
  - Remove button for each selected ingredient
- **API:** Calls `getIngredients()` on mount to populate suggestion list
- **Accessibility:** Keyboard navigable, ARIA live region for suggestions

### RecipeResultsList
- **Purpose:** Display search results as a list of recipe cards
- **Props:**
  - `results: RecipeResult[]` — array of recipe results
  - `loading: boolean` — show loading state
  - `error: string | null` — show error message
  - `onSelectRecipe: (recipeId: string) => void` — callback when recipe is clicked
- **Features:**
  - Uses RecipeCard (scaffold component) for each result
  - Shows loading spinner while fetching
  - Shows error message if search fails
  - Shows empty state if no results
  - Favorite toggle for authenticated users
- **Favorites:** If user is logged in, shows favorite button on each card
- **Accessibility:** Results list has appropriate ARIA labels

## Architecture Decision: Separation of Concerns

**SearchForm does NOT render RecipeDetail.** Here's why:

- **Single responsibility:** SearchForm orchestrates search; detail view is separate
- **Better routing:** Parent app controls navigation via `onSelectRecipe` callback
- **Reusable patterns:** FavoritesPage can also use recipe detail view without duplicating logic
- **Easier testing:** SearchForm tests focus on search logic, not navigation

**Flow:**
```
SearchForm (search orchestration)
  ↓ onSelectRecipe callback
HomePage (receives selected recipe ID)
  ↓ navigate to route
App Router
  ↓ mounts recipe detail page at /recipe/:id
RecipeDetailPage (handles detail view)
```

## Adding a New Search Component

1. Create `YourSearchComponent.tsx` in this folder
2. Create `YourSearchComponent.css` for styles
3. Import from `api/` as needed for data fetching
4. Keep state management clear and minimal
5. Use scaffold components (FormError, RecipeCard, etc.) where appropriate
6. Export via `onSelectRecipe` callback for parent to handle navigation
7. Add JSDoc explaining purpose and state management
8. Update this README

## Guidelines

- **Callback-driven navigation** — Don't render detail views; let parent handle routing
- **Scaffol component reuse** — Use FormError, RecipeCard, etc. for common UI
- **API integration** — Import directly from `api/` folder
- **Error handling** — Display user-friendly error messages via state
- **Loading states** — Always show loading spinner during API calls
- **Accessibility** — Include ARIA labels, keyboard navigation, semantic HTML

## Testing

Search components need mocking of API calls:

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import SearchForm from '../SearchForm';

vi.mock('../../api/recipeClient', () => ({
  searchRecipes: vi.fn(() => Promise.resolve({
    results: [{ id: '1', name: 'Pasta' }]
  })),
  getIngredients: vi.fn(() => Promise.resolve(['chicken', 'rice']))
}));

it('calls onSelectRecipe when result is clicked', async () => {
  const onSelectRecipe = vi.fn();
  render(<SearchForm onSelectRecipe={onSelectRecipe} />);
  // ... test interaction
  expect(onSelectRecipe).toHaveBeenCalledWith('1');
});
```

## Migration Notes (Phase 3)

**What changed:**
- SearchForm no longer imports or renders RecipeDetailPage
- SearchForm removed `selectedRecipeId` state and detail view logic
- RecipeDetailPage now supports route parameters (via `useParams`)
- App.tsx now has `/recipe/:id` route for detail view
- SearchForm now emits `onSelectRecipe` callback for parent to handle

**Impact:** Existing code that expects SearchForm to handle detail view must be updated to use the parent callback pattern. See App.tsx for example.
