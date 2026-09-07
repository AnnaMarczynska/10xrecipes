# Frontend Architecture & Patterns Guide

Welcome to the 10xRecipes frontend! This guide explains the codebase structure, reusable patterns, and how to add new features.

**TL;DR:** The frontend is organized into reusable scaffold components, feature-specific components, API clients, and shared utilities. Follow the checklists in this guide when adding new features.

---

## Directory Structure

```
src/
├── api/                    # API client layer
│   ├── types.ts           # Unified type contracts (single source of truth)
│   ├── cache.ts           # Caching utilities
│   ├── interceptor.ts     # Axios instance with auth token injection
│   ├── authClient.ts      # Auth API (register, login, logout)
│   ├── recipeClient.ts    # Recipe search & details API
│   ├── favoriteClient.ts  # Favorites API
│   └── __tests__/         # API client unit tests
│
├── components/
│   ├── scaffold/          # Reusable UI foundation (no business logic)
│   │   ├── FormError.tsx              # Error message display
│   │   ├── Header.tsx                 # App header with auth status
│   │   ├── ProtectedRoute.tsx         # Auth guard for routes
│   │   ├── RecipeCard.tsx             # Recipe display card
│   │   ├── TimeRangeSelector.tsx      # Cooking time picker
│   │   ├── *.css                      # Component styles
│   │   ├── README.md                  # Scaffold component guide
│   │   └── __tests__/                 # Scaffold component tests
│   │
│   └── recipe-search/     # Feature-specific components (search flow)
│       ├── SearchForm.tsx              # Search orchestration
│       ├── IngredientAutocomplete.tsx # Ingredient selection
│       ├── RecipeResultsList.tsx      # Search results display
│       ├── *.css                      # Feature styles
│       └── README.md                  # Recipe search guide
│
├── context/               # React Context for shared state
│   ├── AuthContext.tsx    # Authentication state (user, login, logout)
│   └── AuthContext.css
│
├── hooks/                 # Custom React hooks (future expansion)
│
├── pages/                 # Page-level components (route destinations)
│   ├── HomePage.tsx       # Search homepage
│   ├── LoginPage.tsx      # User login form
│   ├── SignupPage.tsx     # User registration form
│   ├── FavoritesPage.tsx  # View saved recipes
│   ├── RecipeDetailPage.tsx # View recipe details
│   └── *.css
│
├── styles/                # Global & shared styles
│   ├── index.css          # Global base styles
│   ├── auth.css           # Auth page styles
│   ├── header.css         # Header styles
│   └── *.css
│
├── utils/                 # Utility functions
│   ├── tokenStorage.ts    # JWT token persistence
│   ├── validation.ts      # Form validation helpers
│   └── *.ts
│
├── test/                  # Test configuration
│   ├── setup.ts           # Vitest setup
│   └── typescript/        # TypeScript-specific tests
│
├── App.tsx                # Root app component with routing
├── App.css                # App layout styles
└── main.tsx               # Entry point
```

---

## API Client Pattern

All backend communication goes through the `api/` folder. Each client handles one domain/feature.

### When to Create a New Client

Create a new client when:
- You're adding a new feature with its own API endpoints
- The endpoints are logically grouped (e.g., "allergens", "notes")
- You want consistent error handling and caching across that feature

**Example:** For S-04 (Allergens), create `src/api/allergenClient.ts`.

### Client Template

```typescript
import axiosInstance from './interceptor';
import { getCachedOrFetch, getCacheKey } from './cache';
import { ApiResponse, AllergenList, UserAllergen } from './types';

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

/** Fetch user's current allergen list (cached) */
export const allergenClient = {
  getList: async (): Promise<AllergenList> => {
    try {
      const cacheKey = getCacheKey('allergens');
      return await getCachedOrFetch(cacheKey, async () => {
        const response = await axiosInstance.get<{ data: AllergenList }>(
          '/allergens',
          { timeout: API_TIMEOUT_MS }
        );
        return response.data.data;
      });
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to fetch allergens'));
    }
  },

  /** Add allergen to user profile (invalidates cache) */
  add: async (allergen: string): Promise<UserAllergen> => {
    try {
      const response = await axiosInstance.post<{ data: UserAllergen }>(
        '/allergens',
        { allergen },
        { timeout: API_TIMEOUT_MS }
      );
      // Invalidate cache so next fetch gets fresh data
      clearCache(getCacheKey('allergens'));
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to add allergen'));
    }
  },

  /** Remove allergen from user profile (invalidates cache) */
  remove: async (allergenId: number): Promise<void> => {
    try {
      await axiosInstance.delete(`/allergens/${allergenId}`, {
        timeout: API_TIMEOUT_MS,
      });
      clearCache(getCacheKey('allergens'));
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to remove allergen'));
    }
  },
};

export type { AllergenList, UserAllergen };
```

### Key Principles

**Error Handling:**
- Every client uses `getErrorMessage()` to extract user-friendly messages
- Timeout errors show "Request timed out after X seconds"
- API errors show backend error message (from `response.data.error.message`)
- Network errors show a fallback message
- Always throw a new Error with the message for caller to handle

**Caching:**
- GET requests use `getCachedOrFetch()` for automatic caching
- POST/PUT/DELETE requests skip cache
- After writes (POST/PUT/DELETE), call `clearCache()` to invalidate related GET cache
- Example: After adding a favorite, clear the "favorites" cache so next fetch is fresh

**Type Contracts:**
- All types defined in `src/api/types.ts` (single source of truth)
- Client imports types from there: `import { ApiResponse, Allergen } from './types'`
- Export types from client file so components can use them: `export type { Allergen }`

**Timeout:**
- All requests have `timeout: 5000` (5 seconds)
- Clients handle AbortError for timeouts gracefully
- Customize timeout per request if needed

---

## Component Pattern

Components follow a strict hierarchy: scaffold (reusable) → feature-specific → pages.

### Component Checklist

When creating a new component, verify:

- [ ] **Single responsibility** — Component does one thing
  - ❌ Don't mix search logic with detail view rendering
  - ✅ Do separate: SearchForm (search) + parent handles detail view
  
- [ ] **Clear prop contract** — Props are typed and exported
  ```typescript
  interface YourComponentProps {
    prop1: string;
    prop2: number;
    onAction?: (value: string) => void;
  }
  export default function YourComponent({ prop1, prop2, onAction }: YourComponentProps) { ... }
  ```
  
- [ ] **Scaffold vs. business logic**
  - **Scaffold:** No imports from `api/`, no feature-specific logic → `scaffold/` folder
  - **Feature:** Uses API clients, has business logic → feature-specific folder
  
- [ ] **Accessibility**
  - Include `role`, `aria-*` attributes for interactive elements
  - Keyboard navigable (Tab, Enter, Escape)
  - Semantic HTML: `<button>`, `<a>`, `<label>` instead of `<div role="button">`
  
- [ ] **Error handling**
  - Gracefully handle errors from props (undefined, null, invalid data)
  - Display error UI or delegate to parent via callback
  - Never silently fail
  
- [ ] **JSDoc or inline comments**
  - Explain contract and usage if non-obvious
  ```typescript
  /**
   * Display a recipe card with favorite button.
   * 
   * @example
   * <RecipeCard recipe={recipe} onSelect={handleSelect} onFavoriteToggle={handleFav} />
   */
  ```
  
- [ ] **Unit test**
  - At least happy path + error case
  - No need for API mocking if component doesn't call API
  - Scaffold components should test independently
  
- [ ] **Styles**
  - Co-located with component file (`RecipeCard.tsx` + `RecipeCard.css`)
  - Use class-based styling (BEM naming: `.recipe-card__title`)
  - No inline styles unless absolutely necessary
  
- [ ] **No console.log**
  - Use `console.error()` or `console.warn()` for actual issues
  - Never ship debug logging
  
- [ ] **TypeScript strict mode**
  - No implicit `any`
  - No `unknown` widening
  - All errors typed (catch blocks: `catch (error: unknown)`)

### Component Template

```typescript
import React, { useState } from 'react';
import './YourComponent.css';

/**
 * YourComponent: One-line purpose.
 * 
 * Explain what the component does, who should use it, and why.
 * @example
 * <YourComponent title="Example" onSubmit={handleSubmit} />
 */
interface YourComponentProps {
  title: string;
  onSubmit: (value: string) => void;
  isLoading?: boolean;
}

export default function YourComponent({
  title,
  onSubmit,
  isLoading = false,
}: YourComponentProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(input);
  };

  return (
    <form onSubmit={handleSubmit} className="your-component">
      <label htmlFor="input">{title}</label>
      <input
        id="input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={isLoading}
      />
      <button type="submit" disabled={isLoading || !input}>
        {isLoading ? 'Loading...' : 'Submit'}
      </button>
    </form>
  );
}
```

---

## Context & State Management

Use React Context for cross-cutting state (auth, theme, global notifications). Avoid for feature-specific state.

### AuthContext Pattern (model to follow)

```typescript
// context/AuthContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { authClient, AuthResponse } from '../api/authClient';
import { useAuth } from '../hooks/useAuth';

interface AuthContextType {
  user: { email: string } | null;
  isLoggedIn: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const authState = useAuth();
  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

**When to create Context:**
- Cross-app state (auth, theme, user preferences)
- More than 3 levels of prop drilling

**When NOT to use Context:**
- Feature-specific state (use component state or a hook)
- One-time data fetches (use a hook with useEffect)

---

## Testing Approach

### Unit Tests (Vitest + Testing Library)

**Where:** Each component/utility gets a `.test.ts(x)` file in `__tests__/` subfolder

**What to test:**
- **Scaffold components:** Rendering, prop handling, user interactions (no mocks needed)
- **Feature components:** API calls, state changes, error handling (mock API calls)
- **Utilities:** Edge cases, error conditions, return values
- **Hooks:** State updates, side effects, dependencies

**Example - Scaffold component (no mocks):**
```typescript
import { render, screen } from '@testing-library/react';
import RecipeCard from '../RecipeCard';

it('renders recipe name and image', () => {
  const recipe = { id: '1', name: 'Pasta', image: 'url...' };
  render(<RecipeCard recipe={recipe} onSelect={() => {}} />);
  expect(screen.getByText('Pasta')).toBeInTheDocument();
  expect(screen.getByAltText('Pasta')).toBeInTheDocument();
});
```

**Example - Feature component (with mocks):**
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import SearchForm from '../SearchForm';

vi.mock('../../api/recipeClient', () => ({
  searchRecipes: vi.fn(() => Promise.resolve({
    results: [{ id: '1', name: 'Pasta' }],
  })),
  getIngredients: vi.fn(() => Promise.resolve(['chicken', 'rice'])),
}));

it('displays search results after submit', async () => {
  render(<SearchForm onSelectRecipe={() => {}} />);
  // ... test interaction
  await waitFor(() => {
    expect(screen.getByText('Pasta')).toBeInTheDocument();
  });
});
```

### E2E Tests (Playwright)

**Where:** `src/test/e2e/` (future expansion)

**What to test:**
- Complete user flows: login → search → favorite → logout
- Real backend communication (not mocked)
- Visual regression (optional: Argos, Lost Pixel)

**Run:** `npm run test:e2e` (when configured)

### Running Tests

```bash
# Unit tests
npm test

# Unit tests in watch mode (re-run on file change)
npm test -- --watch

# E2E tests (when configured)
npm run test:e2e
```

---

## Key Files & Quick Reference

| File | Purpose | When to update |
|------|---------|-----------------|
| `src/api/types.ts` | Type contracts (single source of truth) | Adding new API response types |
| `src/components/scaffold/README.md` | Reusable component guide | Adding new scaffold component |
| `src/components/recipe-search/README.md` | Search feature guide | Adding new search-related component |
| `src/context/AuthContext.tsx` | Auth state | Never (model for other contexts) |
| `src/utils/tokenStorage.ts` | JWT token persistence | Never (core utility) |
| `src/App.tsx` | Routes & top-level layout | Adding new page routes |

---

## Common Tasks

### Add a new feature (e.g., S-04: Allergens)

1. **Create API client** → `src/api/allergenClient.ts` (follow template above)
2. **Add types** → `src/api/types.ts` (add `Allergen`, `AllergenList` types)
3. **Create components:**
   - Scaffold: `src/components/scaffold/AllergenSelector.tsx` (generic, reusable)
   - Feature: `src/components/allergen/AllergenProfile.tsx` (uses client)
4. **Create page** → `src/pages/AllergensPage.tsx` (route destination)
5. **Add route** → `src/App.tsx` (add `/allergens` route)
6. **Add link** → `src/components/scaffold/Header.tsx` (nav link if needed)
7. **Test:** Add unit tests for components + E2E for flow

### Debug a component

```bash
# Check TypeScript errors
npm run typecheck

# Run ESLint
npm run lint

# Run tests
npm test -- src/components/YourComponent.test.tsx

# Dev server (live reload)
npm run dev
```

### Deploy changes

```bash
# Build for production
npm run build

# Deploy (handled by CI/CD, see CLAUDE.md)
git push origin branch-name
```

---

## Troubleshooting

**Import errors after moving files?**
- Check relative paths: `../`, `../../` etc.
- ESLint will catch broken imports on next `npm run lint`

**Component not updating after API call?**
- Ensure state update is in `useEffect` dependency array
- Check browser DevTools Network tab for failed requests

**"Cannot find module" errors?**
- Run `npm install` to ensure dependencies are installed
- Check that moved components have updated import paths

**Tests failing after reorganization?**
- Update test imports to new component locations
- Mock paths should match relative imports in code

---

## Next Steps for New Features

This guide covers the foundation. For specific features:

- **S-04 (Allergens)** → See `context/foundation/frontend-patterns.md` (S-04 section)
- **S-05 (Notes)** → See `context/foundation/frontend-patterns.md` (S-05 section)

Good luck! 🚀
