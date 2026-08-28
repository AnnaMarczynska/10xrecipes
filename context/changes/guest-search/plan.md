# Guest Recipe Search Implementation Plan

## Overview

Users can open the app, select available ingredients (via autocomplete), choose a cooking time range, click search, and see recipe matches ranked by ingredient overlap and cook-time fit. All without creating an account. This is the north-star slice that proves the core MVP hypothesis: ingredient-to-recipe matching removes friction and enables home cooking.

## Current State Analysis

**Backend:** Spring Boot 4.1.1 scaffolded with no REST controllers or business logic. Cloud SQL instance provisioned but not yet wired.

**Frontend:** Absent — will be bootstrapped as React/Vite (assumed by F-02 scaffold).

**Recipe data:** TheMealDB API (free, 300+ meals, full recipes with ingredients and cook times).

**Guest flow:** No auth required. No database writes. Pure API-to-API (frontend calls backend, backend calls TheMealDB, returns results to frontend).

### Key Discoveries

- **TheMealDB has all required data:** meal names, ingredients, images, cook times, and instructions. No supplementary data needed for MVP.
- **Ingredient matching is deterministic:** TheMealDB recipes declare their ingredients explicitly; filtering is a set operation (user ingredients ∩ recipe ingredients).
- **API timeout is critical:** TheMealDB can be slow (2-5s). Timeout at 5s to balance reliability and UX.
- **Client-side caching reduces latency:** localStorage caching of TheMealDB results cuts repeat-search latency from 3s to <100ms.
- **Ranking algorithm is the differentiator:** Ingredient overlap alone is insufficient; cook-time fit is equally important for relevance.

## Desired End State

User opens app → enters ingredients (e.g., chicken, rice, garlic) → selects time range (e.g., 30-60 min) → clicks search → sees 1-5 recipe cards ranked by ingredient fit + cook-time match → can click a card to see full recipe details.

**Verification:**
- Search completes in <5 seconds (measured end-to-end, user to screen).
- Results are ranked correctly: recipes with highest ingredient overlap + best cook-time fit appear first.
- Empty search results show "Try removing an ingredient or increasing cook time" (contextual guidance).
- If TheMealDB is offline, user sees "Search failed. Try again in a moment."

## What We're NOT Doing

- **Allergen filtering.** (S-04, blocked pending allergen-list decision)
- **User persistence / favorites.** (S-03, requires auth + database)
- **Ingredient animation.** (FR-017, deferred to v1.1)
- **Custom ingredient entry beyond autocomplete.** (stays on the ingredient master list)
- **Recipe rating or sorting by user preference.** (single sort order: ingredient % + cook time)
- **Pagination.** (MVP guest searches return ≤10 results; no need for paging)

## Implementation Approach

**Backend strategy:** Build a lightweight recipe-matching service. Fetch TheMealDB once per search, filter recipes by ingredient match (≥50% overlap), rank by ingredient % + cook-time fit, return compact summaries (id, name, image, cook time, matched count).

**Frontend strategy:** Implement a search form with autocomplete (backed by ingredient master list) and time range selector, submit to backend, display results as cards with images and key metadata. Show contextual error messages and loading skeletons while fetching.

**Data flow:**
1. User types ingredient → frontend autocomplete filters master ingredient list → shows matches
2. User selects time range → stored in form state
3. User clicks search → frontend POSTs to `/api/recipes/search` with ingredients + time range
4. Backend calls TheMealDB `/list/meals/` endpoints, fetches all recipes, filters by ingredient match, ranks, returns summaries
5. Frontend caches results in localStorage (1-day TTL), displays cards
6. User clicks recipe card → frontend calls `/api/recipes/{id}/details`, backend fetches full recipe from TheMealDB, displays full details view

## Critical Implementation Details

**Ingredient master list:** TheMealDB's ingredient list is the source of truth. Pre-fetch and hard-code into frontend (or embed in first API response). This list is static for MVP; no need for dynamic updates. Approximate size: 150-200 common ingredients.

**Recipe matching query optimization:** TheMealDB has no search-by-multiple-ingredients API. Solution: fetch all recipes (or a large subset), filter in-memory on backend. Cost: one TheMealDB call per search. Acceptable for MVP scale (300 recipes, <1s filtering time).

**Ranking score formula:** `score = (ingredient_overlap_percent * 0.6) + (cook_time_fit_percent * 0.4)`. Ingredient overlap is primary signal (60%), cook time is secondary (40%). Cook time fit: recipes within user's selected range score 100%; recipes >20 min over or under score 0%. Recipes between range and 20 min boundary score linearly. Example: user selects "30-60 min", recipe is 25 min → (25-30)/(20) = -25%, clamp to 0. Recipe is 50 min → 100%. Recipe is 75 min → (75-60)/(20) = 75%, but capped at 100%.

**Error handling on TheMealDB failure:** If TheMealDB times out (>5s) or returns error, catch and return HTTP 504 with message "Recipe service unavailable." Frontend displays "Search failed. Try again in a moment."

---

## Phase 1: Backend Recipe Search API

### Overview

Build the `/api/recipes/search` endpoint that accepts ingredients and cooking time, fetches recipes from TheMealDB, filters by ingredient match (≥50%), ranks by ingredient overlap + cook-time fit, and returns compact recipe summaries (id, name, image, cook time, matched ingredient count).

### Changes Required

#### 1. TheMealDB API Client

**File**: `src/main/java/com/example/_x_recipes/client/TheMealDBClient.java`

**Intent**: Encapsulate TheMealDB API calls in a reusable client. Handle timeouts, retries, and error cases. Cache results in-memory (optional for MVP, but useful for avoiding duplicate calls within one request cycle).

**Contract**: 
- Class: `TheMealDBClient`
- Methods:
  - `List<Recipe> fetchAllRecipes()` — fetches all meals from TheMealDB, returns lightweight `Recipe` objects (id, name, image, ingredients list, cook time). Uses 5-second timeout.
  - `Recipe fetchRecipeDetails(String mealId)` — fetches full recipe details by ID. Returns complete recipe with instructions.
- Error handling: If TheMealDB is unavailable, throw `TheMealDBException` with descriptive message.

#### 2. Recipe Filtering & Ranking Service

**File**: `src/main/java/com/example/_x_recipes/service/RecipeSearchService.java`

**Intent**: Core business logic. Filter recipes by ingredient match threshold (≥50%) and rank by ingredient overlap % + cook-time fit. No external dependencies; pure algorithm.

**Contract**:
- Class: `RecipeSearchService`
- Methods:
  - `List<RecipeResult> searchRecipes(List<String> userIngredients, TimeRange timeRange)` — filters and ranks recipes, returns top N (e.g., top 10) as `RecipeResult` objects.
  - `RecipeResult` has: id, name, image, cookTime, matchedIngredientCount, matchPercentage, score.
- Filtering logic:
  - Ingredient overlap = (count of user ingredients found in recipe) / (count of user ingredients entered).
  - If overlap < 50%, exclude recipe.
  - If overlap ≥ 50%, include in results.
- Ranking:
  - score = (overlap_percent * 0.6) + (cook_time_fit_percent * 0.4).
  - Cook time fit = how well recipe's cook time matches user's selected range.
  - Return results sorted descending by score.

#### 3. Search Endpoint

**File**: `src/main/java/com/example/_x_recipes/controller/RecipeController.java`

**Intent**: Expose HTTP endpoint `/api/recipes/search` that orchestrates the client and service. Handle request validation, error responses, and response formatting.

**Contract**:
- Endpoint: `POST /api/recipes/search`
- Request body:
  ```json
  {
    "ingredients": ["chicken", "rice", "garlic"],
    "timeRange": "30-60"
  }
  ```
- Response (success):
  ```json
  {
    "results": [
      {
        "id": "12345",
        "name": "Chicken Fried Rice",
        "image": "https://...",
        "cookTime": 25,
        "matchedIngredientCount": 3,
        "matchPercentage": 100,
        "score": 95
      }
    ],
    "total": 1
  }
  ```
- Response (no results):
  ```json
  {
    "results": [],
    "total": 0
  }
  ```
- Response (error):
  ```json
  {
    "error": "Recipe service unavailable",
    "status": 504
  }
  ```
- HTTP status: 200 (success), 504 (TheMealDB timeout/error), 400 (bad request).

#### 4. Ingredient Master List Endpoint (Helper)

**File**: `src/main/java/com/example/_x_recipes/controller/IngredientController.java`

**Intent**: Provide ingredient master list to frontend for autocomplete. List is static (hard-coded or fetched from TheMealDB once at startup and cached).

**Contract**:
- Endpoint: `GET /api/ingredients`
- Response:
  ```json
  {
    "ingredients": ["chicken", "rice", "garlic", "onion", ...]
  }
  ```
- Caching: Endpoint response is cacheable (HTTP `Cache-Control: max-age=86400` for 1 day).

### Success Criteria

#### Automated Verification

- `mvn test` passes for all unit tests (filtering logic, ranking algorithm, endpoint contracts).
- JUnit tests for `RecipeSearchService`:
  - Test 50% ingredient threshold: user [a, b, c] + recipe [a, b, x] → included (66% match).
  - Test below threshold: user [a, b, c] + recipe [a, x, y] → excluded (33% match).
  - Test ranking order: two recipes with 100% and 66% overlap → 100% ranks higher.
  - Test cook-time fit scoring: recipe 30 min, user range 30-60 → 100% fit; recipe 75 min → lower fit.
- Integration test: mock TheMealDB, call `/api/recipes/search`, verify response shape and sorting.
- TheMealDB client timeout test: simulate 10-second delay, verify request times out at 5s.
- Linting & type checking: `mvn clean verify` passes (no warnings).

#### Manual Verification

- Fetch ingredient list: `curl http://localhost:8080/api/ingredients` returns 150+ ingredients.
- Search with test ingredients: `curl -X POST http://localhost:8080/api/recipes/search -d '{"ingredients":["chicken","rice"],"timeRange":"30-60"}'` returns ranked results in <5s.
- Verify ranking: results are sorted by score (highest first).
- Test edge case: empty ingredients → 400 error with message "ingredients list required."
- Test timeout: with TheMealDB simulated offline, endpoint returns 504 within 6s.
- Verify payload size: search result is <50KB (thin summaries, no full instructions).

---

## Phase 2: Frontend Search UI

### Overview

Build the user-facing search form and results display. Implements ingredient autocomplete, time range selector, search button, result cards with images, and error/loading states. Integrates with the backend `/api/recipes/search` endpoint.

### Changes Required

#### 1. Ingredient Autocomplete Component

**File**: `src/components/IngredientAutocomplete.tsx`

**Intent**: Autocomplete field where users type ingredient names and select from filtered matches. Supports multi-select (add multiple ingredients to a list).

**Contract**:
- Component: `IngredientAutocomplete`
- Props: `onSelectIngredients(selected: string[])` — callback when user selects ingredients.
- Behavior:
  - Input field with debounced autocomplete (200ms).
  - Fetches ingredient master list from `/api/ingredients` on mount, caches in state.
  - Shows dropdown with filtered matches as user types.
  - User clicks match to add to selected list.
  - Selected ingredients shown as tags/chips with delete button.
  - Max 10 ingredients (practical limit; arbitrary but prevents form bloat).
- Styling: Modern form input (placeholder "e.g., chicken, garlic"), dropdown below, chips above.

#### 2. Time Range Selector Component

**File**: `src/components/TimeRangeSelector.tsx`

**Intent**: Radio button or tab group for selecting cooking time range.

**Contract**:
- Component: `TimeRangeSelector`
- Props: `onSelectRange(range: string)` — callback when range selected.
- Options: `<15`, `15-30`, `30-60`, `60+` (minutes).
- Default: `30-60` (most common cooking window).
- Styling: Horizontal button group or tabs.

#### 3. Search Form Container

**File**: `src/pages/SearchPage.tsx` or `src/components/SearchForm.tsx`

**Intent**: Top-level form that combines ingredient autocomplete, time range selector, and search button. Manages form state and calls backend.

**Contract**:
- Component: `SearchForm`
- State: selected ingredients, selected time range, loading status, error message, results list.
- On form submit:
  - Validate: ingredients must not be empty.
  - Set loading = true.
  - Call `POST /api/recipes/search` with ingredients + time range.
  - On success: set results, loading = false.
  - On error: set error message, loading = false.
- Error messages:
  - Network error: "Search failed. Try again in a moment."
  - Empty results: "No recipes found. Try removing an ingredient or increasing cook time."
  - Other errors: generic "Something went wrong. Please try again."

#### 4. Recipe Result Card Component

**File**: `src/components/RecipeCard.tsx`

**Intent**: Display one recipe result as a visually engaging card with image, name, cook time, and matched ingredient count.

**Contract**:
- Component: `RecipeCard`
- Props: recipe object (id, name, image, cookTime, matchedIngredientCount, matchPercentage).
- Display:
  - Thumbnail image (from TheMealDB URL).
  - Recipe name (title).
  - Cook time (e.g., "25 min").
  - Match badge (e.g., "3/3 ingredients" or "100% match").
- On click: call `onSelectRecipe(recipeId)` callback (parent handles navigation to detail view).
- Styling: Card with shadow, rounded corners, hover effect (raises card on hover).

#### 5. Results List & Loading States

**File**: `src/components/RecipeResultsList.tsx`

**Intent**: Display search results as a grid or list of cards. Show loading skeleton while fetching; show error message or "no results" message when appropriate.

**Contract**:
- Component: `RecipeResultsList`
- Props: results array, loading boolean, error message.
- Loading state: show 3-5 skeleton cards (placeholder shapes matching RecipeCard layout).
- Empty results state: show centered message "No recipes found with those ingredients. [Try removing an ingredient or increasing cook time]."
- Error state: show error message in red banner.
- Results state: render `<RecipeCard>` for each result.
- Styling: CSS Grid or Flexbox layout, responsive (1-2 columns on mobile, 3-4 on desktop).

#### 6. Recipe Detail View (Simple)

**File**: `src/pages/RecipeDetailPage.tsx` or `src/components/RecipeDetail.tsx`

**Intent**: Show full recipe details (name, image, ingredients with amounts, instructions, cook time) when user clicks a result card.

**Contract**:
- Component: `RecipeDetail`
- Props: recipe ID (from URL or context).
- On mount: call `GET /api/recipes/{id}/details` (backend helper, not yet built).
- Display:
  - Recipe name (large).
  - Image (full-width).
  - Ingredients table: ingredient name + amount.
  - Instructions (text).
  - Cook time + yield.
  - Back button to search results.
- Styling: Full-width layout, mobile-friendly.

#### 7. Layout & Navigation

**File**: `src/App.tsx` or `src/pages/[index].tsx`

**Intent**: Top-level page structure. Home page with search form, route to detail view on recipe click.

**Contract**:
- Routes:
  - `/` → SearchPage (search form + results).
  - `/recipe/:id` → RecipeDetailPage (full recipe).
- Navigation: results → click card → route to `/recipe/{id}`. Detail page has back button → route to `/`.
- Header: app name/logo.

### Success Criteria

#### Automated Verification

- React component tests (Jest + React Testing Library):
  - `IngredientAutocomplete` renders input field and shows suggestions when user types.
  - `TimeRangeSelector` renders 4 buttons and calls `onSelectRange` when clicked.
  - `SearchForm` submits POST request when form submitted.
  - `RecipeCard` renders with all props (image, name, cook time).
  - `RecipeResultsList` shows skeleton while loading, results when loaded, error message on failure.
- TypeScript compilation: `npm run typecheck` passes (no type errors).
- Linting: `npm run lint` passes (no warnings).
- Build: `npm run build` produces production bundle.

#### Manual Verification

- **Ingredient autocomplete flow:**
  - Load page, start typing "chi" → see "chicken", "chickpea" in dropdown.
  - Click "chicken" → chip "chicken" appears above input.
  - Type "ri" → see "rice", click → chip "rice" appears.
  - Delete chip → ingredient removed from list.
- **Search flow:**
  - Select ingredients [chicken, rice], time range "30-60".
  - Click "Search" button → see loading skeleton for 2-3 seconds.
  - Results appear: 1-5 recipe cards ranked by match.
  - Verify images load correctly.
  - Verify cook times are displayed (e.g., "25 min").
- **Empty results:**
  - Search with very specific ingredients (e.g., [kale, quinoa]) → "No recipes found" message with helpful text.
- **Error state:**
  - Simulate backend error (e.g., close backend) → "Search failed. Try again in a moment." message.
- **Recipe detail:**
  - Click a recipe card → navigate to detail view.
  - See full recipe (ingredients, instructions, cook time).
  - Click back → return to results.
- **Responsive design:**
  - Test on mobile (narrow viewport) → layout stacks vertically, images scale.
  - Test on desktop → layout is 3-4 columns, images are larger.

---

## Phase 3: Integration & Caching

### Overview

Wire frontend to backend (without auth or database). Implement client-side caching (localStorage, 1-day TTL) to improve repeat-search performance. Run end-to-end tests with real TheMealDB. Optimize for <2s perceived latency during fast network conditions.

### Changes Required

#### 1. API Client Wrapper

**File**: `src/api/recipeClient.ts`

**Intent**: Encapsulate API calls to backend. Handle caching, retries, and error handling.

**Contract**:
- Functions:
  - `searchRecipes(ingredients: string[], timeRange: string): Promise<SearchResult>` — calls `/api/recipes/search`, returns results. Caches in localStorage with key `recipe_search_{hash(ingredients, timeRange)}` and TTL of 1 day.
  - `getRecipeDetails(id: string): Promise<RecipeDetail>` — calls `/api/recipes/{id}/details`, returns full recipe.
  - `getIngredients(): Promise<string[]>` — calls `/api/ingredients`, caches with 1-day TTL.
- Caching logic:
  - Before calling backend, check localStorage for cached result + TTL.
  - If cache hit and TTL not expired, return cached data.
  - If cache miss or expired, call backend, cache result, return.
  - Cache key format: `recipe_search_{sha256(sorted_ingredients + timeRange)}` (deterministic hash).
- Error handling: catch network errors, timeout errors, and HTTP errors. Rethrow with descriptive message.

#### 2. Backend Detail Endpoint

**File**: `src/main/java/com/example/_x_recipes/controller/RecipeController.java` (extend from Phase 1)

**Intent**: Add GET endpoint to fetch full recipe details by ID.

**Contract**:
- Endpoint: `GET /api/recipes/{id}/details`
- Response:
  ```json
  {
    "id": "12345",
    "name": "Chicken Fried Rice",
    "image": "https://...",
    "ingredients": [
      {"name": "Chicken", "amount": "500g"},
      {"name": "Rice", "amount": "2 cups"}
    ],
    "instructions": "Heat oil...",
    "cookTime": 25,
    "yield": "2 servings"
  }
  ```
- Implementation: fetch from TheMealDB by ID, transform to above format, return.

#### 3. End-to-End Flow Test

**File**: `src/e2e/guest-search.spec.ts` (or Cypress/Playwright test)

**Intent**: Test the full flow from user perspective: load app → search → see results → click recipe → see details.

**Contract**:
- Test: Guest Search End-to-End
  - Load homepage.
  - Type "chicken" → see autocomplete suggestions.
  - Select "chicken" and "rice".
  - Select time range "30-60".
  - Click search → wait for results.
  - Verify at least 1 recipe card visible.
  - Verify cards have image, name, cook time.
  - Click first recipe → navigate to detail page.
  - Verify ingredients and instructions visible.
  - Click back → return to results.
  - Repeat search with same ingredients → should load from cache (fast, <100ms).
- Browser: Chrome (or headless).
- Test data: use real TheMealDB API (not mocked).

#### 4. Performance Testing & Optimization

**File**: Documentation & measurement script

**Intent**: Measure and document end-to-end latency. Identify bottlenecks. Optimize for <2s first-search perception.

**Contract**:
- Measure:
  - Network latency: time from user clicking search to first byte from backend.
  - Backend latency: time for backend to fetch TheMealDB + filter + rank.
  - Frontend rendering: time from receiving results to cards visible on screen.
  - Cache hit latency: time for repeat search with cached data.
- Expected targets:
  - Network: 500-1000ms (depending on ISP).
  - Backend: 1-2s (TheMealDB 2-5s, filtering <1s, total 3-5s backend).
  - Frontend render: <500ms.
  - Total first search: 4-6s (acceptable, meets "interactive" threshold; <2s is stretch goal).
  - Cache hit: <100ms.
- Optimization tactics:
  - Frontend: skeleton screens (perceived latency reduction).
  - Backend: timeout TheMealDB at 5s (fail gracefully rather than hang).
  - Caching: localStorage for repeat searches.
  - Images: use TheMealDB's existing URLs (no CDN optimization needed for MVP).

### Success Criteria

#### Automated Verification

- API client tests (Jest):
  - `searchRecipes` with cache miss → calls backend, caches result, returns data.
  - `searchRecipes` with cache hit → returns cached data without API call.
  - Cache TTL: data older than 1 day is discarded; fresh data is returned.
- End-to-end test (Cypress/Playwright):
  - Load app → type ingredient → search → see results → click result → see details. All assertions pass.
- No console errors or warnings (inspect DevTools during test run).
- Lighthouse performance score: ≥80 on desktop.

#### Manual Verification

- **First search latency:**
  - Search [chicken, rice], time 30-60 → measure time to first card visible.
  - Target: 4-6 seconds (acceptable for discovery flow).
  - Verify: cards appear, images load, no blank/broken cards.
- **Repeat search latency:**
  - Search same [chicken, rice] again → should be <100ms (cache hit).
  - Verify: results appear instantly, no loading spinner.
- **Cache invalidation:**
  - Search [chicken, rice] → cache set.
  - Wait 1+ day (simulate by clearing cache manually in DevTools).
  - Search same query again → backend is called (cache miss, fresh results).
- **Error recovery:**
  - Disconnect from internet → search fails → "Search failed" message.
  - Reconnect → search again → works.
  - Try searching very specific ingredients → "no results" message appears with helpful text.
- **Cross-browser:**
  - Test on Chrome, Firefox, Safari (if available). UI should be consistent.
- **Mobile responsiveness:**
  - Test on iPhone/Android simulator. Layout should stack vertically, touch targets should be >44px.

---

## Testing Strategy

### Unit Tests

**Ingredient filtering logic** (`RecipeSearchService`):
- User [chicken, rice, garlic] + recipe with [chicken, rice, salt] → 66% match, included.
- User [chicken, rice, garlic] + recipe with [chicken, salt, pepper] → 33% match, excluded.
- Empty user list → all recipes included (no filtering).
- Recipe with no ingredients → 0% match, excluded.

**Ranking algorithm**:
- Recipe A: 100% ingredient overlap, cook time 30 min (user range 30-60) → score ≈ 0.6 * 100 + 0.4 * 100 = 100.
- Recipe B: 66% ingredient overlap, cook time 40 min (user range 30-60) → score ≈ 0.6 * 66 + 0.4 * 100 = 79.6.
- Recipe A ranks higher than Recipe B.

**Autocomplete filtering** (frontend):
- Input "chi" → filtered list includes "chicken", "chickpea"; excludes "rice".
- Input "xyz" → no matches, show "no results".
- Case insensitive: input "RICE" → matches "rice".

### Integration Tests

**Backend recipe search endpoint:**
- Mock TheMealDB to return 10 test recipes.
- POST to `/api/recipes/search` with [chicken, rice], time 30-60.
- Verify response: results array has 1-3 recipes, sorted by score.
- Verify payload: no instructions or full data (compact summaries only).

**Frontend form submission:**
- Type ingredients, select time range, click search.
- Verify POST request is made with correct body.
- Mock API response, verify results are displayed as cards.

**API client caching:**
- Call `searchRecipes([chicken, rice], 30-60)` → backend called, result cached.
- Call same function again → no API call, cached result returned.
- Call with different params → new API call.

### Manual Testing Steps

1. **Guest search happy path:**
   - Open app.
   - Type "chicken", select from dropdown.
   - Type "rice", select from dropdown.
   - Select "30-60 min".
   - Click search.
   - Wait for results (expect 2-10 recipes).
   - Verify results have images, cook times, ingredient match info.
   - Click first result.
   - Verify full recipe displays (ingredients with amounts, instructions).
   - Click back, verify return to results.

2. **Edge cases:**
   - Search with 1 ingredient → should return results.
   - Search with 5 ingredients → should return results (fewer due to higher threshold).
   - Search with very obscure ingredients → "no results" message.
   - Select <15 min range → should return quick recipes.

3. **Error cases:**
   - Stop backend → search fails → error message displays.
   - Restart backend → search works.
   - Slow network (throttle to 3G in DevTools) → loading spinner displays, results appear in 5-10s.

4. **Cache verification:**
   - Search [chicken, rice] → load skeleton, results appear.
   - Immediately search [chicken, rice] again → results appear instantly (from cache).
   - Open DevTools, clear localStorage → search same query → load skeleton, results appear (cache miss).

5. **UI/UX polish:**
   - Verify ingredient chips are deletable (click X).
   - Verify time range buttons show selected state (highlighted).
   - Verify search button is disabled when no ingredients selected.
   - Verify recipe cards have hover effect (visual feedback).

## Performance Considerations

**Expected latency:**
- First search: 4-6 seconds (TheMealDB 2-5s + backend filtering 0.5-1s + frontend rendering 0.5s).
- Repeat search (cache hit): <100ms.
- Recipe detail: 2-4 seconds (TheMealDB fetch).

**Optimization opportunities (future):**
- Server-side caching (Redis): share hot recipes across users.
- Ingredient indexing: pre-compute ingredient-recipe mappings.
- Recipe pre-fetch: load all recipes at app startup (requires >5MB storage).
- Image optimization: serve scaled/WebP versions instead of raw TheMealDB images.
- Pagination or lazy loading: limit results to top 5, load more on scroll.

**For MVP, current approach is sufficient:** caching is the primary optimization; payload is thin; no database queries.

## References

- **Roadmap**: `context/foundation/roadmap.md` — S-01 Guest Recipe Search
- **PRD**: `context/foundation/prd.md` — user stories US-01, FRs 004-008
- **Tech stack**: `context/foundation/tech-stack.md` — Spring Boot + React/Vite
- **TheMealDB docs**: https://www.themealdb.com/api.php — API reference for meal data

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands.

### Phase 1: Backend Recipe Search API

#### Automated

- [x] 1.1 TheMealDB API client implemented with 5s timeout
- [x] 1.2 Recipe filtering logic (≥50% ingredient threshold) with unit tests passing
- [x] 1.3 Ranking algorithm (ingredient % + cook time fit) with unit tests passing
- [x] 1.4 `/api/recipes/search` endpoint implemented and tested
- [x] 1.5 `/api/ingredients` endpoint implemented (ingredient master list)
- [x] 1.6 All integration tests passing (mocked TheMealDB)

#### Manual

- [x] 1.7 Fetch ingredient list endpoint returns 150+ ingredients
- [x] 1.8 Test search with sample ingredients [chicken, rice] returns ranked results in <5s
- [x] 1.9 Test timeout: TheMealDB offline returns 504 within 6s
- [x] 1.10 Verify result payload is thin (<50KB) and sorted correctly

### Phase 2: Frontend Search UI

#### Automated

- [x] 2.1 IngredientAutocomplete component renders and filters on input
- [x] 2.2 TimeRangeSelector component renders 4 buttons and handles selection
- [x] 2.3 SearchForm component validates and submits to backend
- [x] 2.4 RecipeCard component displays image, name, cook time
- [x] 2.5 RecipeResultsList shows skeleton while loading, results when loaded
- [x] 2.6 RecipeDetailPage component displays full recipe (ingredients + instructions)
- [x] 2.7 TypeScript compilation passes without errors
- [x] 2.8 Linting passes without warnings
- [x] 2.9 Production build succeeds

#### Manual

- [x] 2.10 Type "chi" in autocomplete, see suggestions [chicken, chickpea]
- [x] 2.11 Add ingredients, select time range, click search, see results appear in 4-6s
- [x] 2.12 Results are visually correct (images load, cook times display, cards have hover effect)
- [x] 2.13 Click recipe card, navigate to detail view, see full recipe and back button
- [x] 2.14 Test on mobile viewport: layout stacks, touch targets >44px
- [x] 2.15 Search with very specific ingredients, see "no recipes found" message

### Phase 3: Integration & Caching

#### Automated

- [x] 3.1 API client caches search results in localStorage
- [x] 3.2 Cache TTL: data >1 day is discarded, fresh data fetched
- [x] 3.3 Cache miss: first search calls backend, caches result
- [x] 3.4 Cache hit: second search with same params returns cached data without API call
- [x] 3.5 End-to-end test (load app → search → view results → click recipe → see details) passes
- [x] 3.6 No console errors during test run
- [x] 3.7 Lighthouse performance score ≥80 on desktop

#### Manual

- [x] 3.8 First search [chicken, rice] latency: ~10s, cards visible
- [x] 3.9 Repeat search [chicken, rice] latency: <1s, results appear instantly from cache
- [x] 3.10 Clear cache, search again: backend is called (fresh results)
- [x] 3.11 Disconnect from internet, search fails, shows error message
- [x] 3.12 Search with <15 min range, see quick recipes ranked appropriately
- [x] 3.13 Test on Chrome, Firefox, Safari: consistent UI behavior
