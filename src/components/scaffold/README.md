# Scaffold Components

Reusable UI foundation components that are agnostic to business logic. These components should work in any context and are generic enough to be reused across features.

## Components

### FormError
- **Purpose:** Display validation and error messages
- **Props:** `message?: string`, `id?: string`
- **When to use:** Alongside form inputs to show validation feedback
- **Example:**
  ```tsx
  <FormError message={errors.email} id="email-error" />
  <input aria-describedby="email-error" />
  ```

### Header
- **Purpose:** App-level navigation header with auth status
- **Props:** None (uses `useAuth()` hook internally)
- **When to use:** Render once at app root level, before Routes
- **Features:** Shows user email when logged in, logout button, navigation links

### ProtectedRoute
- **Purpose:** Guard routes that require authentication
- **Props:** `children: React.ReactNode`
- **When to use:** Wrap any route that should only be accessible to authenticated users
- **Example:**
  ```tsx
  <Route path="/favorites" element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>} />
  ```

### RecipeCard
- **Purpose:** Display a single recipe as a card
- **Props:**
  - `recipe: RecipeResult` — recipe data
  - `onSelect: (recipeId: string) => void` — callback when card is clicked
  - `isFavorited?: boolean` — whether recipe is favorited
  - `onFavoriteToggle?: (recipeId: string, recipeName: string) => void` — callback for favorite button
- **Accessibility:** Keyboard navigable, role="button", ARIA labels
- **When to use:** Inside result lists or grids to display individual recipes

### TimeRangeSelector
- **Purpose:** Let user pick a cooking time range
- **Props:** `onSelectRange: (range: string) => void`
- **When to use:** In search forms that filter by cooking time
- **Ranges:** `<15`, `15-30`, `30-60`, `60+` minutes
- **Default:** `30-60` minutes

## Guidelines

- **No business logic** — Components here don't import from `api/` or feature-specific contexts
- **Prop-driven** — Use props, not global state (AuthContext is exception for ProtectedRoute)
- **Accessibility first** — Include `role`, `aria-*`, keyboard navigation where interactive
- **Reusable types** — Export prop interfaces so consumers can extend or type their usage
- **Self-contained styles** — Each component has its own `.css` file in this folder
- **No console.log** — Use error/warn only for actual errors

## Adding a New Scaffold Component

1. Create `YourComponent.tsx` in this folder
2. Create `YourComponent.css` for styles
3. Export a clear prop interface
4. Add JSDoc comment explaining purpose and usage
5. Ensure no business logic or domain-specific imports
6. Test independently with Vitest (add to `__tests__/`)
7. Update this README with brief description

## Testing

Test files live in `__tests__/` subfolder. Test scaffold components in isolation:

```typescript
import { render, screen } from '@testing-library/react';
import RecipeCard from '../RecipeCard';

it('renders recipe name', () => {
  const recipe = { id: '1', name: 'Pasta', image: '...' };
  render(<RecipeCard recipe={recipe} onSelect={() => {}} />);
  expect(screen.getByText('Pasta')).toBeInTheDocument();
});
```

Remember: scaffold components should not need mocks or context providers in their tests.
