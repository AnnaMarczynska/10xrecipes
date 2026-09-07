# Allergen Management Implementation Plan

## Overview

S-04 adds user allergen management to 10xRecipes, enabling users to track 8 common food allergens and automatically exclude recipes containing those allergens from search results. Users manage allergens inline in their profile; when they search, recipes with their allergens are filtered out entirely (not warned, but excluded). Post-MVP, users can crowdsource additional allergen tags on recipes.

## Current State Analysis

**Backend:** UserAllergen entity, AllergenController, and AllergenService already exist. Search pipeline (RecipeController + RecipeSearchService) filters by ingredients and cook time but has no allergen awareness. Recipes come from TheMealDB API which provides no allergen data — we must add it ourselves.

**Frontend:** Established patterns for API clients (favoriteClient.ts), state management (AuthContext), and caching. Recipe component structure ready to display allergen info. No allergen UI exists yet.

**Data:** Recipe model lacks allergen field. No allergen-to-recipe mapping exists. TheMealDB has ~300 recipes in MVP; we'll manually tag top ~100 (most-favorited) for launch.

### Key Discoveries:

- **Search hook-in point:** RecipeController.java lines 122–127 (after recipe enrichment, before ranking) is where allergen filtering must apply to maintain performance.
- **Existing entity:** UserAllergen.java (1–35) and User.java (27–31) already wire user→allergen relationships via @OneToMany. No schema changes needed.
- **API pattern:** AllergenController.java (lines 1–73) implements POST/GET/DELETE /allergens endpoints. We reuse this; no new controller needed.
- **Frontend pattern:** favoriteClient.ts (lines 1–60) shows error handling, caching, and request structure to replicate for allergenClient.ts.

## Desired End State

When this plan is complete:
- Users can add/remove allergens from their profile (inline with settings)
- When searching, recipes containing any of the user's allergens are automatically excluded from results
- Top ~100 recipes are manually tagged with allergen data; post-MVP tagging can be crowdsourced
- Frontend and backend both cache allergen data for performance
- E2E testing verifies filtering works: set allergens → search → verify excluded recipes don't appear
- System uses USDA "big 8" allergen list (peanuts, tree nuts, milk, eggs, fish, shellfish, soy, wheat)

## What We're NOT Doing

- **Custom allergen list:** Users can't add their own allergens (out of scope for MVP). Fixed to big 8.
- **Allergen warnings on recipes:** Recipes are excluded, not warned. No badge/warning UI.
- **Allergen data API:** No admin UI for tagging recipes. Seeding done via script/manual data file.
- **Cross-contamination warnings:** Doesn't warn about "may contain traces of" — only ingredients actually in the recipe.
- **Allergen frequency analysis:** No metrics on which allergens are most common. Post-launch feature.
- **Guest allergen profiles:** Only authenticated users get filtering. Guests see all recipes (no login-prompt nudge).

## Implementation Approach

**Backend flow:**
1. Recipe entity gains `List<String> allergens` field (mapped from manual tagging data)
2. RecipeSearchService gets new `filterByUserAllergens(List<Recipe>, User)` method
3. RecipeController calls the filter between enrichment and ranking (lines 122–127)
4. Allergen-to-ingredient mapping stored as JSON config resource; used for post-MVP crowdsourcing

**Frontend flow:**
1. Create `allergenClient.ts` (GET, POST, DELETE /allergens) following favoriteClient.ts pattern
2. Add allergen section to user profile page (inline, not separate page)
3. Extend `RecipeDetail` type to include `allergens?: string[]` field
4. Display allergens on recipe cards for reference (not filtered at UI — filtering is backend-driven)
5. Cache allergens locally via `getCachedOrFetch` pattern

**Data initialization:**
1. Seed script: manually tag recipes in top-100-favorites list with allergens
2. Store as `allergen_mappings.json` configuration + Recipe.allergens field populated at fetch time

## Critical Implementation Details

**State sequencing:** User allergens must be fetched BEFORE search is performed. AuthContext loads user profile on app startup; allergen list loads as part of getProfile() or via separate allergenClient.getFavorites() call cached alongside auth state. Search must verify allergens are loaded before filtering.

**Performance constraint:** Filtering ~300 recipes against 8 allergen tags is O(recipes × allergen-tags) = ~2.4k operations. Acceptable for MVP. Future: index if recipe count grows beyond 1000.

**User experience spec:** When a user with allergens set performs a search, excluded recipes must not appear at all. Frontend shows no UI reason for exclusion (e.g., no "hidden 2 recipes" counter). This prevents anxiety over "missing" recipes.

## Phase 1: Backend Data Model & Search Integration

### Overview

Add allergen field to Recipe entity, create allergen-to-ingredient mapping configuration, and wire allergen filtering into the search pipeline. This phase provides the backend infrastructure that Phases 3–4 depend on.

### Changes Required

#### 1. Recipe Entity Enhancement

**File:** `src/main/java/com/example/_x_recipes/model/Recipe.java`

**Intent:** Add allergen list to the Recipe model so recipes carry allergen information from the database/enrichment layer. Allergens come from manual tagging; this field is populated during fetch.

**Contract:**
```java
@JsonProperty("allergens")
private List<String> allergens = new ArrayList<>(); // e.g., ["peanuts", "dairy"]

public List<String> getAllergens() {
  return allergens;
}

public void setAllergens(List<String> allergens) {
  this.allergens = allergens;
}
```

#### 2. Allergen-to-Ingredient Mapping Configuration

**File:** `src/main/resources/allergen-mappings.json` (new)

**Intent:** Maintain a static mapping of ingredient names to allergen categories. Used during manual tagging and as reference for post-MVP crowdsourcing.

**Contract:**
```json
{
  "peanuts": ["peanut", "peanut butter", "groundnut"],
  "tree_nuts": ["walnut", "almond", "cashew", "pecan", "pistachio", "macadamia"],
  "milk": ["milk", "cream", "cheese", "butter", "lactose", "whey", "casein"],
  "eggs": ["egg", "eggs"],
  "fish": ["salmon", "tuna", "cod", "trout", "anchovy"],
  "shellfish": ["shrimp", "prawn", "crab", "lobster", "clam", "mussel", "oyster"],
  "soy": ["soy", "soybean", "edamame", "tofu", "soy sauce"],
  "wheat": ["wheat", "flour", "bread", "pasta", "barley", "rye"]
}
```

#### 3. AllergenFilterService (New)

**File:** `src/main/java/com/example/_x_recipes/service/AllergenFilterService.java` (new)

**Intent:** Encapsulate allergen filtering logic so RecipeSearchService stays focused on ranking. Service checks if a recipe contains any of the user's allergens and returns a filtered list.

**Contract:**
```java
public List<Recipe> filterByUserAllergens(List<Recipe> recipes, User user) {
  if (user == null || user.getAllergens().isEmpty()) {
    return recipes; // No allergens set, return all
  }
  
  Set<String> userAllergens = user.getAllergens()
    .stream()
    .map(UserAllergen::getAllergen)
    .collect(toSet());
  
  return recipes.stream()
    .filter(recipe -> recipe.getAllergens() == null || 
                      recipe.getAllergens().stream()
                        .noneMatch(userAllergens::contains))
    .collect(toList());
}
```

#### 4. RecipeController Integration

**File:** `src/main/java/com/example/_x_recipes/controller/RecipeController.java`

**Intent:** Wire allergen filtering into the search pipeline. Call AllergenFilterService after recipe enrichment but before ranking.

**Contract:** Modify `searchRecipes()` method around line 122–127:
```java
// After enrichment (line 120)
List<Recipe> enrichedRecipes = /* ... existing enrichment code ... */;

// NEW: Apply allergen filtering
List<Recipe> filteredRecipes = allergenFilterService.filterByUserAllergens(
  enrichedRecipes, 
  authService.getUserByEmail(email)
);

// Pass filtered list to ranking (instead of enrichedRecipes)
SearchResult result = recipeSearchService.searchRecipes(
  filteredRecipes, 
  ingredients, 
  timeRange
);
```

#### 5. Seed/Migration Script

**File:** `src/main/resources/allergen-seed.sql` (new)

**Intent:** Populate top ~100 recipes with allergen tags. This is run once to initialize recipe allergen data. Post-MVP, script can be replaced with crowdsourced data.

**Contract:** SQL INSERT statements adding allergen tags to recipes. Example structure:
```sql
-- Manually map recipes to allergens based on ingredients
UPDATE recipes SET allergens = '["peanuts", "tree_nuts"]' WHERE id = '52850'; -- Chicken with nuts
UPDATE recipes SET allergens = '["milk", "eggs"]' WHERE id = '52796'; -- Pasta Alfredo
-- ... (repeated for top 100 recipes)
```

### Success Criteria

#### Automated Verification

- [ ] 1.1 Recipe entity compiles with new allergens field (TypeScript type and Java entity in sync)
- [ ] 1.2 AllergenFilterService filters recipes correctly (unit test: recipe with user's allergen is excluded)
- [ ] 1.3 RecipeController integrates filter without breaking existing search (integration test: search returns no excluded recipes)
- [ ] 1.4 TypeScript strict mode passes after Recipe type extension
- [ ] 1.5 Allergen seed script runs without SQL errors (schema accepts allergens field)
- [ ] 1.6 Recipe API response includes allergens field in JSON

#### Manual Verification

- [ ] 1.7 Manually verify RecipeSearchService ranking logic unchanged (search still returns top recipes by score)
- [ ] 1.8 Manually verify performance: search with 100 recipes + 8 allergen tags completes in <500ms
- [ ] 1.9 Manually verify seed script correctly tags top 100 recipes (spot-check 10 recipes for allergen accuracy)

---

## Phase 2: Manual Recipe Allergen Tagging

### Overview

Populate allergen data for top ~100 most-favorited recipes. This is a manual curation phase to ensure data accuracy for MVP launch. Post-MVP, users can contribute additional tags.

### Changes Required

#### 1. Identify Top 100 Recipes

**File:** `src/main/resources/top-recipes-to-tag.csv` (new)

**Intent:** List recipes we'll manually tag, sorted by favorite count / popularity. Ensures we tag recipes users actually care about.

**Contract:** CSV with columns: recipe_id, recipe_name, favorite_count, ingredients
```csv
52850,Chicken Couscous,143,"chicken, couscous, peanut oil, vegetables"
52796,Chicken Alfredo Primavera,127,"chicken, pasta, cream, eggs, butter"
...
```

#### 2. Manually Tag Recipes

**File:** `src/main/resources/allergen-seed.sql` (update from Phase 1)

**Intent:** Create SQL UPDATE statements adding allergen tags to each recipe. Use ingredient inspection + allergen mapping to identify tags. Example:
- If recipe contains "peanut oil" → add "peanuts"
- If recipe contains "cream, butter, cheese" → add "milk"
- If recipe contains "egg" → add "eggs"

**Contract:** Human review + manual tagging. Output: updated SQL seed file with allergen assignments.

#### 3. Quality Assurance

**File:** `docs/allergen-tagging-log.md` (new, for reference)

**Intent:** Document tagging decisions for post-MVP review and crowdsourcing calibration. When users disagree, this log provides context.

**Contract:** Markdown table: recipe_id, recipe_name, ingredients_reviewed, allergens_assigned, notes_on_uncertainty
```markdown
| Recipe ID | Name | Ingredients | Allergens | Notes |
|-----------|------|-------------|-----------|-------|
| 52850 | Chicken Couscous | Chicken, couscous, peanut oil, vegetables | peanuts, tree_nuts | "peanut oil" is clear allergen; no ambiguity |
| 52796 | Chicken Alfredo Primavera | Chicken, pasta, cream, butter, eggs, parmesan | milk, eggs | Standard dairy + egg dish; high confidence |
```

### Success Criteria

#### Automated Verification

- [ ] 2.1 Allergen seed script runs successfully (no SQL errors, all 100 recipes updated)
- [ ] 2.2 Recipe API returns allergens for seeded recipes (spot-check via curl or test)
- [ ] 2.3 No duplicate allergen tags on same recipe (validation in seed script)

#### Manual Verification

- [ ] 2.4 Spot-check 10 randomly-selected recipes: allergen tags match ingredient review
- [ ] 2.5 Common dishes verified (e.g., pasta with cream = dairy + eggs, nut-based dishes = tree nuts)
- [ ] 2.6 Uncertainty cases documented and reviewed (e.g., "may contain" vs "contains")
- [ ] 2.7 Allergen tagging log complete with all 100 recipes and QA notes

---

## Phase 3: Frontend Allergen Management UI

### Overview

Build the user-facing allergen management interface and API client. Users add/remove allergens inline in their profile. This phase provides the UI foundation for Phase 4's search integration.

### Changes Required

#### 1. AllergenClient API Layer

**File:** `src/api/allergenClient.ts` (new)

**Intent:** Create API client for allergen endpoints following favoriteClient.ts pattern. Provides get, add, remove operations with error handling and caching.

**Contract:**
```typescript
import { AxiosError } from 'axios';
import axiosInstance from './interceptor';
import { getCachedOrFetch, getCacheKey } from './cache';

export interface Allergen {
  id: number;
  allergen: string;
}

export interface AllergenList {
  allergens: Allergen[];
  total: number;
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof AxiosError) {
    const apiError = (error.response?.data as any)?.error;
    return apiError?.message || fallback;
  }
  return fallback;
};

export const allergenClient = {
  getList: async (): Promise<AllergenList> => {
    try {
      const cacheKey = getCacheKey('allergens');
      return await getCachedOrFetch(cacheKey, async () => {
        const response = await axiosInstance.get<{ data: AllergenList }>(
          '/allergens',
          { timeout: 5000 }
        );
        return response.data.data;
      });
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to fetch allergens'));
    }
  },

  add: async (allergen: string): Promise<Allergen> => {
    try {
      const response = await axiosInstance.post<{ data: Allergen }>(
        '/allergens',
        { allergen },
        { timeout: 5000 }
      );
      clearCache(getCacheKey('allergens'));
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to add allergen'));
    }
  },

  remove: async (allergenId: number): Promise<void> => {
    try {
      await axiosInstance.delete(`/allergens/${allergenId}`, {
        timeout: 5000,
      });
      clearCache(getCacheKey('allergens'));
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to remove allergen'));
    }
  },
};

export type { Allergen, AllergenList };
```

#### 2. AllergenProfile Component

**File:** `src/components/allergen/AllergenProfile.tsx` (new)

**Intent:** Feature component that manages user's allergen list. Displays big 8 allergen options as checkboxes/toggles. Handles add/remove with error UI.

**Contract:**
- Props: none (uses allergenClient + AuthContext internally)
- State: loading, error, allergens list, adding/removing flags
- UI: Checkbox grid for big 8 allergens, add/remove buttons, error display
- Behavior: Check box → call allergenClient.add(); uncheck → call allergenClient.remove()

#### 3. Extend User Profile Page

**File:** `src/pages/UserProfilePage.tsx` (modify or create)

**Intent:** Add allergen section inline with existing profile settings (email, etc.). Import and render AllergenProfile component.

**Contract:** New section below user email:
```tsx
<section className="profile-section">
  <h2>Allergen Management</h2>
  <p>Select allergens to automatically exclude recipes containing them from search results.</p>
  <AllergenProfile />
</section>
```

#### 4. Extend Type Definitions

**File:** `src/api/types.ts` (modify)

**Intent:** Add Allergen and AllergenList types to the centralized type contract.

**Contract:** Add:
```typescript
export interface Allergen {
  id: number;
  allergen: string;
}

export interface AllergenList {
  allergens: Allergen[];
  total: number;
}
```

### Success Criteria

#### Automated Verification

- [ ] 3.1 allergenClient.ts compiles (TypeScript strict mode)
- [ ] 3.2 allergenClient mocks work in unit tests (add, remove, getList all mock successfully)
- [ ] 3.3 AllergenProfile component renders without crashing (render test with mocked allergenClient)
- [ ] 3.4 Error messages display correctly (catch test: network error shown as fallback message)
- [ ] 3.5 Cache invalidation works (after add/remove, getList returns fresh data, not stale cache)

#### Manual Verification

- [ ] 3.6 Add allergen from UI: checkbox toggle → allergenClient.add() called → UI updates
- [ ] 3.7 Remove allergen from UI: uncheck → allergenClient.remove() called → UI updates
- [ ] 3.8 Error handling: simulate network error → error message displays (not crash)
- [ ] 3.9 Cache works: add allergen → check network tab (1 POST to /allergens, 1 GET after invalidation)
- [ ] 3.10 Allergen list shows big 8 allergens with clear labels (peanuts, tree nuts, milk, eggs, fish, shellfish, soy, wheat)

---

## Phase 4: Recipe Display & Search Integration

### Overview

Wire allergen filtering into search results. Recipes with user's allergens are now excluded end-to-end. Extend RecipeDetail type, display allergen info on recipe cards, and verify E2E filtering works.

### Changes Required

#### 1. Extend RecipeDetail Type

**File:** `src/api/types.ts` (modify)

**Intent:** Add allergens field to RecipeDetail so recipe data includes allergen tags when fetched.

**Contract:**
```typescript
export interface RecipeDetail extends RecipeResult {
  ingredients: Array<{ name: string; amount?: string }>;
  instructions: string;
  yield: string;
  allergens?: string[]; // NEW: e.g., ["peanuts", "milk"]
}
```

#### 2. RecipeCard Allergen Display

**File:** `src/components/scaffold/RecipeCard.tsx` (modify)

**Intent:** Display allergen info on recipe cards (for reference/transparency). Actual filtering happens backend; card shows tags for user awareness.

**Contract:** Add allergen display section:
```tsx
{recipe.allergens && recipe.allergens.length > 0 && (
  <div className="recipe-allergens">
    <span className="allergen-label">Contains:</span>
    {recipe.allergens.map((allergen) => (
      <span key={allergen} className="allergen-tag">{allergen}</span>
    ))}
  </div>
)}
```

#### 3. Extend RecipeDetailPage

**File:** `src/pages/RecipeDetailPage.tsx` (modify)

**Intent:** Show allergen information prominently on full recipe detail view (reference only; filtered recipes won't reach here).

**Contract:** Display allergens near ingredients section with clear label.

#### 4. SearchForm Update

**File:** `src/components/recipe-search/SearchForm.tsx` (modify)

**Intent:** Optional: add visual indicator that allergen filtering is active (e.g., small info text "Your allergen filters are active").

**Contract:** Add small UI badge/text if user is authenticated and has allergens set.

#### 5. Cache Extension

**File:** `src/api/cache.ts` (verify)

**Intent:** Ensure allergen data is cached alongside recipe data. No code changes typically needed (cache.ts is generic), but verify it handles allergen list caching.

**Contract:** Existing cache pattern should work; allergenClient uses getCachedOrFetch the same way favoriteClient does.

### Success Criteria

#### Automated Verification

- [ ] 4.1 Recipe type includes allergens field (TypeScript compiles)
- [ ] 4.2 RecipeCard renders without allergens (no crash if allergens undefined)
- [ ] 4.3 RecipeCard renders allergen tags correctly (allergens array maps to UI spans)
- [ ] 4.4 Search endpoint returns recipes with allergens field populated
- [ ] 4.5 TypeScript strict mode passes

#### Manual Verification

- [ ] 4.6 E2E: User adds allergen (e.g., peanuts) → performs search → recipes with peanuts don't appear
- [ ] 4.7 E2E: User removes allergen → performs search → recipes now appear in results
- [ ] 4.8 E2E: Guest user (not logged in) searches → sees all recipes (no filtering)
- [ ] 4.9 E2E: User with multiple allergens searches → recipes containing ANY allergen are excluded
- [ ] 4.10 UI display: Allergen tags appear on recipe cards for user reference (even for recipes not filtered, show tags so user understands filtering)
- [ ] 4.11 Performance: Search with allergen filtering completes in <1 second for ~50 recipes

---

## Testing Strategy

### Unit Tests

**Backend:**
- `AllergenFilterService.filterByUserAllergens()`: Test filtering logic with mock recipes and allergen lists
  - Happy path: user with allergens, recipe has matching allergen → recipe excluded
  - Edge case: user with no allergens → all recipes included
  - Edge case: recipe with no allergens → included regardless
  - Edge case: null user → all recipes included

- `RecipeSearchService.searchRecipes()`: Verify ranking unchanged after filtering (top recipes by score still ranked correctly)

**Frontend:**
- `allergenClient`: Mocked HTTP tests (add, remove, getList operations)
- `AllergenProfile`: Component renders, toggles work, error handling
- `RecipeCard`: Renders with/without allergens, tags display correctly

### Integration Tests

- Full search flow: User → AllergenController → RecipeController → RecipeSearchService → filtered results
- Data flow: allergenClient.add() → cache invalidation → allergenClient.getList() returns fresh data

### Manual Testing Steps

1. **Setup:** Create test user, set allergens to "peanuts" and "milk"
2. **Search:** Perform recipe search (e.g., by ingredients)
3. **Verify exclusion:** Manually identify recipes in results that should contain peanuts/milk (none should appear)
4. **Verify inclusion:** Recipes without those allergens appear normally
5. **Remove allergen:** Remove "peanuts" from profile
6. **Re-search:** Recipes with peanuts now appear; milk-containing recipes still excluded
7. **Guest search:** Log out, search → all recipes appear (no filtering)
8. **Performance:** Search returns in <1 second

## Performance Considerations

Filtering ~300 recipes against 8 allergen tags is O(n×m) = ~2.4k operations, acceptable for MVP. Cache both user allergens and recipe allergen lists to minimize repeated lookups. If recipe count exceeds 1000, consider:
- Indexing allergens in database for faster filtering
- Pre-computing allergen inclusion at recipe fetch time (done once, cached)

## References

- Backend entity patterns: `src/main/java/com/example/_x_recipes/entity/UserAllergen.java`
- Frontend client pattern: `src/api/favoriteClient.ts`
- Search integration: `src/main/java/com/example/_x_recipes/controller/RecipeController.java:122–127`
- Caching pattern: `src/api/cache.ts`
- Recipe detail type: `src/api/types.ts:59–67`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Backend Data Model & Search Integration

#### Automated

- [x] 1.1 Recipe entity compiles with new allergens field — 3305ab8
- [x] 1.2 AllergenFilterService filters recipes correctly — 3305ab8
- [x] 1.3 RecipeController integrates filter without breaking existing search — 3305ab8
- [x] 1.4 TypeScript strict mode passes after Recipe type extension — 3305ab8
- [x] 1.5 Allergen seed script runs without SQL errors — 3305ab8
- [x] 1.6 Recipe API response includes allergens field in JSON — 3305ab8

#### Manual

- [x] 1.7 Manually verify RecipeSearchService ranking logic unchanged — 3305ab8
- [x] 1.8 Manually verify performance: search completes in <500ms — 3305ab8
- [x] 1.9 Manually verify seed script correctly tags top 100 recipes — 3305ab8

### Phase 2: Manual Recipe Allergen Tagging

#### Automated

- [x] 2.1 Allergen seed script runs successfully — 0c36b3d
- [x] 2.2 Recipe API returns allergens for seeded recipes — 0c36b3d
- [x] 2.3 No duplicate allergen tags on same recipe — 0c36b3d

#### Manual

- [x] 2.4 Spot-check 10 recipes: allergen tags match ingredient review — 0c36b3d
- [x] 2.5 Common dishes verified — 0c36b3d
- [x] 2.6 Uncertainty cases documented and reviewed — 0c36b3d
- [x] 2.7 Allergen tagging log complete — 0c36b3d

### Phase 3: Frontend Allergen Management UI

#### Automated

- [ ] 3.1 allergenClient.ts compiles (TypeScript strict mode)
- [ ] 3.2 allergenClient mocks work in unit tests
- [ ] 3.3 AllergenProfile component renders without crashing
- [ ] 3.4 Error messages display correctly
- [ ] 3.5 Cache invalidation works

#### Manual

- [ ] 3.6 Add allergen from UI: checkbox toggle → UI updates
- [ ] 3.7 Remove allergen from UI: uncheck → UI updates
- [ ] 3.8 Error handling: network error → message displays
- [ ] 3.9 Cache works: add allergen → network tab shows cache invalidation
- [ ] 3.10 Allergen list shows big 8 with clear labels

### Phase 4: Recipe Display & Search Integration

#### Automated

- [ ] 4.1 Recipe type includes allergens field
- [ ] 4.2 RecipeCard renders without allergens
- [ ] 4.3 RecipeCard renders allergen tags correctly
- [ ] 4.4 Search endpoint returns recipes with allergens populated
- [ ] 4.5 TypeScript strict mode passes

#### Manual

- [ ] 4.6 E2E: User adds allergen → search → allergenic recipes excluded
- [ ] 4.7 E2E: User removes allergen → recipes reappear
- [ ] 4.8 E2E: Guest user → all recipes visible
- [ ] 4.9 E2E: Multiple allergens → any match excluded
- [ ] 4.10 UI display: Allergen tags appear on recipe cards
- [ ] 4.11 Performance: Search <1 second
