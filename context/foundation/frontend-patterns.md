# Frontend Pattern Guides for S-04 & S-05

This document provides detailed patterns, checklists, and concrete guidance for implementing new features on the 10xRecipes frontend scaffold.

**For S-04 (Allergens) and S-05 (Notes) teams:** Use the sections below as your implementation blueprint.

---

## API Client Pattern Deep Dive

### Structure

Every API client lives in `src/api/` and follows this structure:

```
src/api/
├── types.ts              # Type contracts (import here)
├── cache.ts              # Caching utilities (import here)
├── interceptor.ts        # Axios instance with auth (import here)
├── errorHandler.ts       # Shared error extraction (import getErrorMessage from authClient)
├── [featureName]Client.ts # Your new client
└── __tests__/
    └── [featureName]Client.test.ts
```

### Step-by-Step: Create an API Client

**Step 1: Add types to `src/api/types.ts`**

```typescript
// src/api/types.ts
export interface Allergen {
  id: number;
  name: string;
  icon?: string;
}

export interface UserAllergen extends Allergen {
  addedAt: string;
  severity?: 'mild' | 'moderate' | 'severe';
}

export interface AllergenList {
  allergens: UserAllergen[];
  availableAllergens: Allergen[]; // Suggestions for new
}

export interface AllergenWarning {
  recipeId: string;
  recipeName: string;
  allergens: string[];
  severity: 'warning' | 'alert';
}
```

**Step 2: Create the client file**

```typescript
// src/api/allergenClient.ts
import { AxiosError } from 'axios';
import axiosInstance from './interceptor';
import { getCachedOrFetch, getCacheKey, clearCache } from './cache';
import { ApiResponse, Allergen, UserAllergen, AllergenList } from './types';

const API_TIMEOUT_MS = 5000;

// Copy this from authClient.ts (shared pattern)
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

export const allergenClient = {
  /**
   * Fetch user's allergen list and available allergen suggestions.
   * Results are cached; invalid cache on writes.
   */
  getList: async (): Promise<AllergenList> => {
    try {
      const cacheKey = getCacheKey('user', 'allergens');
      return await getCachedOrFetch(cacheKey, async () => {
        const response = await axiosInstance.get<{ data: AllergenList }>(
          '/user/allergens',
          { timeout: API_TIMEOUT_MS }
        );
        if (!response.data.data) {
          throw new Error('Invalid response: missing allergen list');
        }
        return response.data.data;
      });
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to fetch allergens'));
    }
  },

  /**
   * Add allergen to user profile.
   * Clears cache so next getList() fetch is fresh.
   */
  add: async (allergen: string, severity?: string): Promise<UserAllergen> => {
    try {
      const response = await axiosInstance.post<{ data: UserAllergen }>(
        '/user/allergens',
        { allergen, severity },
        { timeout: API_TIMEOUT_MS }
      );
      clearCache(getCacheKey('user', 'allergens')); // Invalidate cached list
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to add allergen'));
    }
  },

  /**
   * Remove allergen from user profile by ID.
   * Clears cache so next getList() fetch is fresh.
   */
  remove: async (allergenId: number): Promise<void> => {
    try {
      await axiosInstance.delete(`/user/allergens/${allergenId}`, {
        timeout: API_TIMEOUT_MS,
      });
      clearCache(getCacheKey('user', 'allergens')); // Invalidate cached list
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to remove allergen'));
    }
  },

  /**
   * Check if a recipe contains user's allergens.
   * Returns warnings/alerts for any allergen matches.
   * Note: Recipe allergen data comes from recipe endpoint or separate service.
   */
  checkRecipe: async (recipeId: string): Promise<AllergenWarning | null> => {
    try {
      const response = await axiosInstance.get<{ data: AllergenWarning | null }>(
        `/recipes/${recipeId}/allergen-check`,
        { timeout: API_TIMEOUT_MS }
      );
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to check allergens'));
    }
  },
};

export type { Allergen, UserAllergen, AllergenList, AllergenWarning };
```

**Step 3: Create component(s) using the client**

See Component Pattern section below.

### Error Handling Pattern

**Every client should:**

```typescript
const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof AxiosError) {
    // Timeout → show clear message
    if (error.code === 'ECONNABORTED') {
      return `Request timed out after ${API_TIMEOUT_MS / 1000} seconds`;
    }
    // API error → show backend message if available
    const apiError = (error.response?.data as ApiResponse<unknown>)?.error;
    return apiError?.message || fallback;
  }
  // Network/other error → show fallback
  return fallback;
};

// Use it consistently:
try {
  const data = await apiCall();
  return data;
} catch (error) {
  throw new Error(getErrorMessage(error, 'Failed to load data'));
}
```

### Caching Pattern

**GET requests** — Cache results:
```typescript
const cacheKey = getCacheKey('user', 'allergens');
return await getCachedOrFetch(cacheKey, async () => {
  // Fetch logic here
});
```

**POST/PUT/DELETE requests** — Write operations, then invalidate cache:
```typescript
await axiosInstance.post('/user/allergens', { ... });
clearCache(getCacheKey('user', 'allergens')); // Invalidate so next GET is fresh
```

**When cache expires:** 24 hours (see `src/api/cache.ts`)

---

## Component Pattern Deep Dive

### Scaffold vs. Feature Components

| Aspect | Scaffold | Feature |
|--------|----------|---------|
| **Folder** | `components/scaffold/` | `components/[feature]/` |
| **Imports from API** | ❌ Never | ✅ Yes, uses API clients |
| **State** | Minimal, received via props | Can be complex |
| **Reusable** | ✅ Can be used in any context | ❌ Specific to feature |
| **Example** | FormError, RecipeCard, Header | SearchForm, AllergenProfile |

### Component Checklist (detailed version)

#### 1. Single Responsibility
```typescript
// ❌ BAD: Component does too much
<SearchAndDetail>
  {/* Renders search form, results, AND detail view */}
  <SearchForm />
  {selectedRecipeId && <RecipeDetail recipeId={selectedRecipeId} />}
</SearchAndDetail>

// ✅ GOOD: Components have one job
<SearchForm onSelectRecipe={handleSelect} />  {/* Only search */}
// Parent handles: navigate → App Router → RecipeDetailPage mounts
```

#### 2. Prop Contract
```typescript
// ✅ Always export props interface
interface AllergensPageProps {
  userId: string;
  onAllergenChange?: (allergen: UserAllergen) => void;
}

export default function AllergensPage({ userId, onAllergenChange }: AllergensPageProps) {
  // ...
}
```

#### 3. Scaffold vs. Business Logic
```typescript
// ✅ Scaffold (no API, generic, reusable)
import React from 'react';
interface AllergenSelectProps {
  allergens: Allergen[];
  selected: string[];
  onToggle: (allergen: string) => void;
}
export function AllergenSelect({ allergens, selected, onToggle }: AllergenSelectProps) {
  return allergens.map(a => (
    <label key={a.id}>
      <input
        type="checkbox"
        checked={selected.includes(a.name)}
        onChange={() => onToggle(a.name)}
      />
      {a.name}
    </label>
  ));
}

// ✅ Feature (imports API client, orchestrates logic)
import { allergenClient } from '../../api/allergenClient';
import AllergenSelect from '../scaffold/AllergenSelect';
export function AllergenProfileForm() {
  const [list, setList] = useState<AllergenList | null>(null);
  useEffect(() => {
    allergenClient.getList().then(setList);
  }, []);
  // ...
}
```

#### 4. Accessibility
```typescript
// ✅ Keyboard navigable, semantic HTML
<fieldset>
  <legend>Select your allergens</legend>
  {allergens.map(a => (
    <label key={a.id}>
      <input
        type="checkbox"
        name={`allergen-${a.id}`}
        onChange={() => handleToggle(a)}
        aria-label={`Allergen: ${a.name}`}
      />
      {a.name}
    </label>
  ))}
</fieldset>

// ❌ Avoid: Divs instead of native elements
<div onClick={() => toggle(a)} role="checkbox">
  {a.name}
</div>
```

#### 5. Error Handling
```typescript
// ✅ Handle errors gracefully
try {
  const list = await allergenClient.getList();
  setAllergens(list.allergens);
} catch (err) {
  const msg = err instanceof Error ? err.message : 'Unknown error';
  setError(msg); // Display to user
}

// ✅ Handle undefined props
if (!allergens) {
  return <div>No allergens found</div>;
}

// ❌ Don't silently fail
try {
  await allergenClient.add(allergen);
} catch (err) {
  // This does nothing! Users won't know it failed.
}
```

#### 6. JSDoc Comments
```typescript
/**
 * AllergensPage: User allergy management.
 * 
 * Lets users add/remove allergens from profile and see allergen warnings
 * on recipes. Allergen data persists to backend.
 * 
 * @example
 * <AllergensPage userId="user-123" onAllergenChange={handleChange} />
 * 
 * @requires authentication (wrapped in ProtectedRoute)
 */
export function AllergensPage({ userId, onAllergenChange }: AllergensPageProps) {
  // ...
}
```

#### 7. Unit Tests
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { vi } from 'vitest';
import AllergenSelect from '../AllergenSelect';

// Scaffold component test (no mocks)
describe('AllergenSelect', () => {
  const allergens = [
    { id: 1, name: 'Peanuts' },
    { id: 2, name: 'Shellfish' },
  ];

  it('renders all allergen options', () => {
    render(<AllergenSelect allergens={allergens} selected={[]} onToggle={() => {}} />);
    expect(screen.getByLabelText('Peanuts')).toBeInTheDocument();
    expect(screen.getByLabelText('Shellfish')).toBeInTheDocument();
  });

  it('calls onToggle when checkbox is clicked', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(<AllergenSelect allergens={allergens} selected={[]} onToggle={onToggle} />);
    
    await user.click(screen.getByLabelText('Peanuts'));
    expect(onToggle).toHaveBeenCalledWith('Peanuts');
  });
});
```

#### 8. Styles (BEM naming)
```css
/* AllergenSelect.css */
.allergen-select {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.allergen-select__label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.allergen-select__checkbox {
  cursor: pointer;
}

.allergen-select__checkbox:checked + .allergen-select__name {
  font-weight: bold;
  color: var(--color-primary);
}
```

#### 9. No console.log
```typescript
// ✅ Only for actual issues
console.error('Failed to load allergens:', error.message);

// ❌ Never ship debug logging
console.log('Allergen list:', list);
```

#### 10. TypeScript Strict
```typescript
// ✅ Typed errors
try {
  // ...
} catch (error) {
  const msg = error instanceof Error ? error.message : 'Unknown error';
  setError(msg);
}

// ❌ Implicit any
const data = await allergenClient.getList(); // data is type-safe: AllergenList
```

---

## Feature Implementation Guides

### S-04: Allergen Management

**Outcome:** User can add allergens to profile, see allergen warnings on recipes, and filter search results by allergens.

#### Architecture

```
src/
├── api/allergenClient.ts          # API: get, add, remove allergens + check recipe
├── components/
│   ├── scaffold/AllergenSelect.tsx # Generic checkbox list (reusable)
│   └── allergen/                   # Allergen-specific components
│       ├── AllergenProfile.tsx      # User's allergen list + add form
│       ├── RecipeAllergenWarning.tsx # Shows allergen warnings on recipe cards
│       └── AllergenFilter.tsx       # Optional: filter search by allergens
└── pages/AllergensPage.tsx          # Route: /allergens (ProtectedRoute)
```

#### Implementation Steps

**Step 1: Backend types**
```typescript
// Add to src/api/types.ts
export interface Allergen { /* see above */ }
export interface UserAllergen { /* see above */ }
export interface AllergenList { /* see above */ }
export interface AllergenWarning { /* see above */ }
```

**Step 2: API client**
```typescript
// Create src/api/allergenClient.ts (see template above)
```

**Step 3: Scaffold components**
```typescript
// Create src/components/scaffold/AllergenSelect.tsx
// Generic checkbox list for selecting allergens (reusable for filters too)

// Create src/components/scaffold/AllergenBadge.tsx
// Small badge to display allergen warning on recipe card
```

**Step 4: Feature components**
```typescript
// Create src/components/allergen/AllergenProfile.tsx
// User's allergen list, add form, delete buttons

// Create src/components/allergen/RecipeAllergenWarning.tsx
// Show warning/alert badge on recipe if it contains user's allergens (use on RecipeCard or RecipeDetail)
```

**Step 5: Page component**
```typescript
// Create src/pages/AllergensPage.tsx
// Render AllergensPage with current user's allergens + add form

// Add to App.tsx:
// <Route path="/allergens" element={<ProtectedRoute><AllergensPage /></ProtectedRoute>} />
```

**Step 6: Add navigation**
```typescript
// Update src/components/scaffold/Header.tsx
// Add link to /allergens if user is logged in
```

**Step 7: Test**
```typescript
// Create tests for scaffold components (AllergenSelect.test.tsx, AllergenBadge.test.tsx)
// Create tests for feature components (mock allergenClient)
```

#### Integration Points

- **Recipe Card:** Show AllergenBadge if recipe has user's allergens
- **Recipe Detail:** Show AllergenWarning prominently at top
- **Search Results:** Optional: show allergen warnings inline, allow filtering
- **Header:** Add "Allergens" link (if user is logged in)

#### Notes

- **Allergen data source:** Backend provides recipe allergen data (manually curated or via third-party API)
- **Severity levels:** Optional; could be "mild", "moderate", "severe" for user warnings
- **Filtering:** Optional for MVP; can defer to v1.1 if time-constrained

---

### S-05: Notes on Favorites

**Outcome:** Authenticated user can add a text note to favorite recipes and edit/delete notes later.

#### Architecture

```
src/
├── api/noteClient.ts              # API: add, update, delete notes + fetch recipe notes
├── components/
│   ├── scaffold/NoteEditor.tsx     # Textarea + save/cancel buttons (reusable)
│   └── note/                       # Note-specific components
│       ├── RecipeNotes.tsx         # Display and edit notes on recipe detail/favorites
│       └── NotesList.tsx           # (Optional) List all notes across favorites
└── pages/
    └── (no new page; integrate into FavoritesPage and RecipeDetailPage)
```

#### Implementation Steps

**Step 1: Backend types**
```typescript
// Add to src/api/types.ts
export interface RecipeNote {
  id: number;
  recipeId: string;
  userId: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}
```

**Step 2: API client**
```typescript
// Create src/api/noteClient.ts
export const noteClient = {
  add: async (recipeId: string, text: string): Promise<RecipeNote> => {
    // POST /recipes/{recipeId}/notes
  },
  update: async (noteId: number, text: string): Promise<RecipeNote> => {
    // PUT /notes/{noteId}
  },
  delete: async (noteId: number): Promise<void> => {
    // DELETE /notes/{noteId}
  },
  get: async (recipeId: string): Promise<RecipeNote[]> => {
    // GET /recipes/{recipeId}/notes (cached)
  },
};
```

**Step 3: Scaffold component**
```typescript
// Create src/components/scaffold/NoteEditor.tsx
interface NoteEditorProps {
  text: string;
  onSave: (text: string) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

// Renders textarea + save/cancel buttons
// Reusable for any note-taking feature in future
```

**Step 4: Feature component**
```typescript
// Create src/components/note/RecipeNotes.tsx
// Displays current note (if any) + edit button
// Opens editor (NoteEditor) on click
// Handles add/update/delete via noteClient
```

**Step 5: Integration**
```typescript
// Add RecipeNotes to:
// - FavoritesPage (in recipe card or expandable section)
// - RecipeDetailPage (if viewing from favorites)
```

**Step 6: Test**
```typescript
// Create tests for NoteEditor (scaffold) and RecipeNotes (feature)
```

#### Integration Points

- **FavoritesPage:** Add notes section to each favorite recipe
  ```typescript
  {favorite.id && <RecipeNotes recipeId={favorite.recipeId} />}
  ```
- **RecipeDetailPage:** Show notes if recipe is favorited
  ```typescript
  {isFavorited && <RecipeNotes recipeId={recipeId} />}
  ```

#### Notes

- **Char limit:** Optional; suggest 500 chars or unlimited for MVP
- **Rich text:** Not needed for MVP; plain text is sufficient
- **Sharing:** Notes are private to user; no sharing in MVP

---

## Testing Patterns by Layer

### Scaffold Components (no mocks)
```typescript
// Test independently without API mocks
import { render, screen } from '@testing-library/react';
import AllergenSelect from '../AllergenSelect';

it('renders allergens', () => {
  render(<AllergenSelect allergens={[...]} selected={[]} onToggle={() => {}} />);
  expect(screen.getByLabelText('Peanuts')).toBeInTheDocument();
});
```

### Feature Components (with mocks)
```typescript
// Mock API clients
import { vi } from 'vitest';
import AllergenProfile from '../AllergenProfile';

vi.mock('../../api/allergenClient', () => ({
  allergenClient: {
    getList: vi.fn(() => Promise.resolve({
      allergens: [{ id: 1, name: 'Peanuts' }],
      availableAllergens: [...]
    }))
  }
}));

it('loads and displays allergen list', async () => {
  render(<AllergenProfile />);
  await waitFor(() => {
    expect(screen.getByText('Peanuts')).toBeInTheDocument();
  });
});
```

### API Clients
```typescript
// Mock axios
import { vi } from 'vitest';
import { allergenClient } from '../allergenClient';

vi.mock('../../api/interceptor', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  }
}));

it('fetches allergen list', async () => {
  vi.mocked(axiosInstance.get).mockResolvedValue({
    data: { data: { allergens: [...] } }
  });
  const result = await allergenClient.getList();
  expect(result.allergens).toHaveLength(2);
});
```

---

## Deployment Checklist

Before shipping a new feature:

- [ ] All components have TypeScript types (strict mode passes)
- [ ] ESLint passes: `npm run lint`
- [ ] Unit tests added and passing: `npm test`
- [ ] E2E test scenario documented (manual or Playwright)
- [ ] API contracts match backend spec
- [ ] Error messages are user-friendly
- [ ] Accessibility: keyboard navigable, ARIA labels
- [ ] Documentation updated: README.md, JSDoc comments
- [ ] Responsive design works on mobile/tablet
- [ ] No console.log statements shipped

---

## FAQ

**Q: Should I use Context for feature state?**
A: Only if state needs to be shared across 3+ levels of prop drilling. For single feature (e.g., allergens on one page), use component state + hooks.

**Q: How do I handle offline?**
A: MVP assumes online. Cache provides offline read for cached requests. Offline writes can be queued in v1.1.

**Q: Can I use a different HTTP client (fetch, SWR, TanStack Query)?**
A: Stick with axios for consistency. Switching requires refactoring all clients. If needed post-launch, do as v1.1 refactor.

**Q: How do I test async components?**
A: Use `waitFor()` from Testing Library:
  ```typescript
  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument();
  });
  ```

**Q: Should I add loading spinners?**
A: Yes, always. Show loading state on buttons, disable input during request, show skeleton or spinner.

---

## Resources

- **Frontend README:** `src/README.md`
- **Scaffold components guide:** `src/components/scaffold/README.md`
- **Recipe search guide:** `src/components/recipe-search/README.md`
- **API types:** `src/api/types.ts`
- **Example API client:** `src/api/recipeClient.ts`
- **Example Context:** `src/context/AuthContext.tsx`

Good luck with S-04 and S-05! 🚀
