# Save Recipes to Favorites Implementation Plan

## Overview

Implement authenticated user favorites management — a persistent list of recipes users can save from search results, view in a dedicated favorites page, and remove. Favorites are stored in the database (using the pre-built Favorite entity from F-04), with a clean backend API and interactive frontend UI.

**Key decision**: Keep notes out of S-03 scope (they'll be added in S-05). S-03 focuses purely on add/remove/list favorites. The Favorite entity already has a `notes` field, but S-03 treats it as read-only; S-05 will add full edit/delete capability.

## Current State Analysis

### What's Already in Place

- **Favorite Entity** (`src/main/java/com/example/_x_recipes/entity/Favorite.java`): Fully defined with JPA annotations, relationships, and database constraints
- **FavoriteRepository** (`src/main/java/com/example/_x_recipes/repository/FavoriteRepository.java`): Complete with `findByUser()`, `findByUserAndRecipeId()`, `existsByUserAndRecipeId()`
- **User-to-Favorite relationship**: Defined in User entity with cascade delete and orphan removal
- **FavoriteController** (`src/main/java/com/example/_x_recipes/controller/FavoriteController.java`): Mostly complete with POST (add), GET (list), DELETE (remove), PUT (notes — to be used in S-05)
- **FavoriteService** (`src/main/java/com/example/_x_recipes/service/FavoriteService.java`): Business logic in place for add/remove/list operations
- **FavoriteRepositoryIntegrationTest**: Integration tests for repository-level operations (from F-04)
- **AuthContext & Security**: User authentication via JWT token, authenticated requests via Bearer header
- **FavoritesPage** (`src/pages/FavoritesPage.tsx`): Skeleton page exists, needs implementation
- **Database**: PostgreSQL with F-04 schema including `favorites` table with unique constraint on (user_id, recipe_id)

### What's Missing

1. **Frontend FavoritesPage**: Needs data fetching, list display, delete functionality with confirmation dialog
2. **Favorite button in search results**: Need to add to RecipeCard component, track favorite state, handle add/remove UX
3. **API Client**: Need a `favoriteClient.ts` for API calls (addFavorite, removeFavorite, getFavorites)
4. **Error handling**: Backend has basic error handling; needs refinement for production-ready responses
5. **Response envelopes**: Backend methods return Map/List directly; should wrap in ApiResponse for consistency
6. **Component tests**: No tests for FavoritesPage or RecipeCard favorite button
7. **E2E tests**: No end-to-end tests for the add/remove favorites flow

### Key Discoveries

- **LazyLoading on relationships**: User.favorites uses FetchType.LAZY to prevent N+1 queries — good for list performance
- **Duplicate prevention**: FavoriteRepository has `existsByUserAndRecipeId()` to check before adding — backend already validates
- **Immutable timestamps**: `addedAt` column has `updatable=false` to preserve creation time
- **Authorization pattern**: FavoriteService checks `favorite.getUser().getId().equals(user.getId())` before mutations
- **State sync challenge**: Search results and favorites list need to stay in sync when user favorites/unfavorites — requires shared state or refetch
- **API patterns**: Existing controllers use SecurityContextHolder to extract authenticated user, then fetch full User entity via AuthService

## Desired End State

After S-03 is complete:

1. **Favorites Page is functional**: Users can view their saved recipes, see when each was added (sorted by most recent), and remove recipes with a confirmation dialog
2. **Add-to-favorites in search**: Search results show filled/outline heart icons; clicking toggles favorite state; clicking again shows "Already in favorites" toast
3. **Backend is production-ready**: All endpoints return consistent ApiResponse envelopes; errors include clear messages and proper HTTP status codes
4. **Full test coverage**: Backend unit tests, integration tests, React component tests, and E2E tests for the add/remove flow
5. **Performance is acceptable**: Favorite list queries don't trigger N+1 problems (lazy loading ensures recipe data isn't fetched until needed)
6. **Notes field is visible but not editable**: FavoritesPage displays notes if present, but S-03 doesn't provide UI to edit them
7. **S-03 is unblocked S-05**: Frontend structure is in place for notes; S-05 just needs to add edit/delete buttons and form

### Verification Criteria

- Users can add recipes from search results (heart icon fills, toast shows "Added to favorites")
- Users can view their favorites on `/favorites` page, sorted by most recent first
- Users can remove a favorite after confirming "Are you sure?" dialog
- Removing updates the search results immediately (if search page is still open)
- No duplicate favorites are allowed (backend rejects, shows "Already in favorites" toast)
- All API endpoints return ApiResponse envelope with proper status codes
- Backend unit tests pass (FavoriteService)
- Integration tests pass (FavoriteRepository with testcontainers)
- React component tests pass (FavoritesPage, RecipeCard)
- E2E tests pass (add favorite from search → navigate to favorites → verify list → remove favorite → verify deletion)

## What We're NOT Doing

- **Edit/delete notes**: Notes field exists but is read-only in S-03; S-05 adds full notes management
- **Sorting/filtering UI**: Defaults to "most recent first"; no sort dropdown in S-03
- **Favorite count quota**: No limit on number of favorites (can add quota in v1.1 if needed)
- **Bulk operations**: Can't favorite/unfavorite multiple recipes at once
- **Share favorites list**: No public sharing of a user's favorite list
- **Collaborative favorites**: Each user has their own list; no group/shared lists
- **Recipe recommendation engine**: Favorites are stored but not used for recommendations yet

## Implementation Approach

**Three sequential phases, each completing before the next:**

1. **Backend Polish** — Update controller/service to return ApiResponse envelopes, refine error handling, ensure consistency
2. **Frontend Implementation** — Build FavoritesPage component, add favorite button to search results, create favoriteClient API
3. **Testing & Integration** — Write component tests, integration tests, and E2E tests; verify the full favorites flow works end-to-end

Each phase includes automated verification (tests, type checking, linting) and manual verification (UI testing, flow verification).

## Critical Implementation Details

**State sync between search results and favorites list**: When user adds a favorite from search results, the heart icon should immediately fill (optimistic update). If they navigate to favorites and back to search, the icon state should reflect the current database state. Solution: fetch favorite status for visible recipes on search page load, or use a global favorites set in a context.

**Authorization checks**: All endpoints that mutate a user's favorites must verify the user owns the favorite before allowing deletion. The pattern is: look up favorite by ID, check if `favorite.user.id == authenticatedUser.id`, only then proceed. This prevents users from deleting other users' favorites.

**Notes field visibility**: Favorite entity has a `notes` field (for S-05 use). S-03 FavoritesPage should display notes if present (e.g., as read-only text below recipe name), but NOT provide UI to edit. S-05 adds an "Edit notes" button or in-line form.

---

## Phase 1: Backend Polish & API Consistency

### Overview

Update FavoriteController and FavoriteService to follow the ApiResponse envelope pattern used in AuthController. Refine error handling for production readiness. Ensure consistent status codes and error messages.

### Changes Required

#### 1. Update FavoriteController to use ApiResponse

**File**: `src/main/java/com/example/_x_recipes/controller/FavoriteController.java`

**Intent**: FavoriteController returns raw Map/List instead of ApiResponse envelopes. Update all endpoints to return `ResponseEntity<ApiResponse<?>>` for consistency with AuthController and to provide structured error handling.

**Contract**: 
- `POST /favorites` → `ResponseEntity<ApiResponse<FavoriteDTO>>` (201 Created on success)
- `GET /favorites` → `ResponseEntity<ApiResponse<FavoritesListDTO>>` with `{ favorites: [...], total: N }`
- `DELETE /favorites/{id}` → `ResponseEntity<ApiResponse<Void>>` (200 OK)
- All errors return ApiResponse with appropriate status codes (400, 401, 403, 404, 409)

Create inner DTOs (FavoriteDTO, FavoritesListDTO) or use Map as before but wrap in ApiResponse.

#### 2. Create FavoriteController DTOs

**File**: `src/main/java/com/example/_x_recipes/controller/FavoriteController.java` (inner classes)

**Intent**: Define request/response DTOs for type safety and API documentation. Already has `AddFavoriteRequest` and `UpdateNotesRequest`; add response DTOs.

**Contract**:
```java
public static class FavoriteDTO {
    private Long id;
    private String recipeId;
    private String recipeName;
    private String notes; // nullable
    private LocalDateTime addedAt;
    // getters/setters
}

public static class FavoritesListDTO {
    private List<FavoriteDTO> favorites;
    private Integer total;
    // getters/setters
}
```

#### 3. Improve error handling in FavoriteService

**File**: `src/main/java/com/example/_x_recipes/service/FavoriteService.java`

**Intent**: Replace generic `throw new Exception()` with specific exception classes or structured error responses. Use consistent error codes for API responses.

**Contract**:
- Duplicate favorite → throw DuplicateFavoriteException with message "Recipe already in favorites"
- Favorite not found → throw ResourceNotFoundException with message "Favorite not found"
- Unauthorized → throw UnauthorizedException with message "Unauthorized"
- Notes too long → throw ValidationException with message "Notes cannot exceed 500 characters"

Or keep generic Exception but ensure message is clear and HTTP status is appropriate in controller.

#### 4. Validate input in controller

**File**: `src/main/java/com/example/_x_recipes/controller/FavoriteController.java`

**Intent**: Add validation annotations to request DTOs and validate recipe metadata before saving.

**Contract**:
- AddFavoriteRequest: `@NotBlank String recipeId`, `@NotBlank String recipeName`
- Validate that recipeId is not empty (backend checks these are provided before calling service)

### Success Criteria

#### Automated Verification

- All FavoriteController methods return `ResponseEntity<ApiResponse<?>>` (or equivalent typed response)
- Code compiles: `mvn clean compile`
- Type checking passes: No compilation errors
- Linting passes: `mvn checkstyle:check`

#### Manual Verification

- Call `POST /api/favorites` with valid recipe → response is `{ data: { id, recipeId, ... }, status: "success" }`
- Call `GET /api/favorites` → response is `{ data: { favorites: [...], total: N }, status: "success" }`
- Call `DELETE /api/favorites/{id}` with another user's favorite → response includes error message and 403 Forbidden
- Call `POST /api/favorites` with duplicate recipe → response includes "Already in favorites" message

---

## Phase 2: Frontend Implementation

### Overview

Build FavoritesPage component with data fetching and state management. Add favorite button to RecipeCard. Create favoriteClient API. Wire authentication and token injection.

### Changes Required

#### 1. Create favoriteClient API

**File**: `src/api/favoriteClient.ts`

**Intent**: Provide functions for frontend to call favorites endpoints. Follow the pattern established in `authClient.ts` and `recipeClient.ts`.

**Contract**:
```typescript
export async function addFavorite(recipeId: string, recipeName: string): Promise<any>
export async function removeFavorite(id: number): Promise<any>
export async function getFavorites(): Promise<{ favorites: FavoriteItem[]; total: number }>
export interface FavoriteItem {
  id: number;
  recipeId: string;
  recipeName: string;
  notes?: string;
  addedAt: string;
}
```

Implementation details:
- Use `axiosInstance` (with token interceptor) for all calls
- Handle errors with `getErrorMessage()` utility
- GET `/api/favorites` returns list
- POST `/api/favorites` with body `{ recipeId, recipeName }`
- DELETE `/api/favorites/{id}` to remove
- Throw/return errors on duplicate (409), unauthorized (401), not found (404)

#### 2. Implement FavoritesPage component

**File**: `src/pages/FavoritesPage.tsx`

**Intent**: Display user's favorite recipes in a list. Allow removal with confirmation dialog. Show loading state and empty state. Sort by most recent first.

**Contract**:
- Load favorites on mount via `getFavorites()`
- Show loading spinner while fetching
- Display empty state if no favorites: "No favorites yet. Add some from search results!"
- List favorites sorted by addedAt DESC (most recent first)
- Each item shows: recipe name, add date, notes (if present, read-only), remove button
- Click remove → confirmation dialog "Are you sure?" → Delete if confirmed
- On delete success → toast "Removed from favorites" → refetch list
- On error → toast with error message

**Key decisions from your input**:
- Confirmation dialog before removal (you chose this)
- Notes field is visible but not editable (S-03 constraint)
- Sort by most recent first (you chose this)

#### 3. Add favorite button to RecipeCard

**File**: `src/components/RecipeCard.tsx`

**Intent**: Add a heart icon button to each recipe in search results. Track favorite state. Allow quick add/remove.

**Contract**:
- Heart icon: filled if favorited, outline if not
- Click → add to favorites OR remove if already favorited
- On add success → icon fills, toast "Added to favorites"
- On duplicate → show toast "Already in favorites"
- On remove → prompt confirmation (or just remove since it's a quick action) → icon outline
- State should update optimistically (fill icon immediately, then sync with API)

**Key decision**: Heart filled/outlined (you chose this for the indicator)

#### 4. Create useAuth hook usage or AuthContext subscription

**File**: `src/pages/FavoritesPage.tsx`, `src/components/RecipeCard.tsx`

**Intent**: Ensure user is authenticated before showing favorites or favorite button. Redirect to login if needed.

**Contract**:
- FavoritesPage should be wrapped in ProtectedRoute (already in place)
- RecipeCard can show heart button to both authenticated and unauthenticated users; clicking when logged out navigates to login
- Fetch favorite state for RecipeCard only if authenticated

#### 5. Manage favorite state across components

**File**: Multiple component files

**Intent**: Search results and favorites page need to stay in sync. When user favorites a recipe, both pages should reflect it.

**Contract**: Two approaches (pick one):
- **Option A (simpler, initial)**: Each component fetches/manages favorite state independently. Duplicate checking done on add. UI updates optimistically.
- **Option B (more complex)**: Create a `FavoritesContext` to share favorite state globally. All components subscribe to it.

For S-03, recommend Option A (simpler). S-05 can add context if needed.

### Success Criteria

#### Automated Verification

- Code compiles: `npm run build` (or equivalent TypeScript check)
- ESLint passes: `npm run lint` (or `eslint src/`)
- No TypeScript errors: `npx tsc --noEmit`
- All imports resolve

#### Manual Verification

- Navigate to search page → search for a recipe → see heart icon outline on results
- Click heart icon → toast "Added to favorites" → icon fills
- Click heart icon again → if duplicate: toast "Already in favorites"
- Navigate to `/favorites` → see list of saved recipes sorted by date (most recent first)
- Each item shows recipe name, date added, notes (if any, read-only)
- Click remove button → confirmation dialog appears
- Confirm removal → recipe disappears from list, toast "Removed from favorites"
- Navigate back to search → heart icon for removed recipe is now outline
- Log out, log back in → favorites list still shows (persisted in DB)

---

## Phase 3: Testing & Integration

### Overview

Write component tests (React), integration tests (backend), and E2E tests (full flow). Verify the feature works end-to-end and handles edge cases.

### Changes Required

#### 1. FavoritesPage component tests

**File**: `src/pages/__tests__/FavoritesPage.test.tsx`

**Intent**: Test FavoritesPage render, data fetching, delete flow, empty state, loading state.

**Tests to include**:
- Renders loading spinner while fetching
- Renders empty state when no favorites
- Renders list when favorites are returned sorted by date
- Delete button shows confirmation dialog
- Confirms deletion and removes item from list
- Shows error toast on API failure
- Shows notes field if present (read-only)

#### 2. RecipeCard favorite button tests

**File**: `src/components/__tests__/RecipeCard.test.tsx`

**Intent**: Test favorite button rendering, click behavior, state updates.

**Tests to include**:
- Renders heart icon (outline if not favorited, filled if favorited)
- Click adds to favorites (shows toast, icon fills)
- Click on filled heart shows duplicate error (if configured) or removes
- Handles API errors gracefully

#### 3. Backend integration tests for FavoriteController

**File**: `src/test/java/com/example/_x_recipes/controller/FavoriteControllerIntegrationTest.java`

**Intent**: Test controller endpoints with authentication, error cases, response format.

**Tests to include**:
- POST `/api/favorites` with valid recipe and auth token → 200, returns ApiResponse with favorite data
- POST with duplicate → 409 Conflict, error message includes "Already in favorites"
- GET `/api/favorites` → returns list wrapped in ApiResponse
- DELETE with valid favorite ID → 200, removes from DB
- DELETE with invalid ID → 404 Not Found
- DELETE another user's favorite → 403 Forbidden
- Missing auth token → 401 Unauthorized

#### 4. E2E test for full favorites flow

**File**: `e2e/favorites.spec.ts` (or similar, using Playwright)

**Intent**: Test the complete user flow: search → add to favorites → view favorites → remove → verify deletion.

**Flow to test**:
1. Log in
2. Go to search page
3. Search for a recipe (e.g., "chicken")
4. Find a recipe in results
5. Click heart icon → verify toast "Added to favorites", icon fills
6. Navigate to `/favorites` → verify recipe appears in list
7. Click remove button → confirm dialog → verify recipe disappears
8. Navigate back to search → verify heart icon is outline again

**Edge cases**:
- Add same recipe twice → shows "Already in favorites" on second attempt
- Remove, then add again → should work, icon fills
- Log out and back in → favorites persist

### Success Criteria

#### Automated Verification

- All unit tests pass: `npm test` (frontend), `mvn test` (backend)
- All integration tests pass: `mvn verify`
- E2E tests pass: `npx playwright test`
- Code coverage > 70% for FavoritesPage and RecipeCard
- Linting passes: `npm run lint`, `mvn checkstyle:check`
- Type checking passes: `npx tsc --noEmit`

#### Manual Verification

- Open application in browser
- Log in with test account
- Search for recipes, add several to favorites
- Navigate to favorites page → see all added recipes
- Remove one → confirm dialog → verify it's gone
- Navigate back to search → verify removed recipe is unfavorited
- Log out, log back in → favorites are still there
- Try to add duplicate → see "Already in favorites" message
- Notes field is visible on favorites page (even if empty)

---

## Testing Strategy

### Unit Tests

- FavoriteService: all methods (add, remove, list, update notes)
- favoriteClient: API calls and error handling

### Integration Tests

- FavoriteController endpoints with MockMvc
- FavoriteRepository queries (already in place from F-04)
- Auth flow → favorites API (authenticated request)

### Component Tests

- FavoritesPage: render, fetch, delete, loading, empty states
- RecipeCard: favorite button render, click, state sync

### E2E Tests

- Full flow: login → search → add favorite → view favorites → remove → verify

### Test Coverage Target

- Backend: > 80% (critical paths, error cases)
- Frontend: > 70% (components, API client)
- E2E: Key happy path + critical edge cases (duplicate, unauthorized, not found)

---

## Performance Considerations

**Lazy loading**: User.favorites uses FetchType.LAZY, so querying a User doesn't load all favorites. When FavoritesPage fetches favorites, only the Favorite entities are loaded (not full User objects).

**N+1 prevention**: FavoritesPage calls `getFavorites()` once; don't call it per-recipe. Backend uses `findByUser()` which is a single query.

**Caching**: Frontend could cache favorite state in context or localStorage, but for S-03 initial load is fine. S-05 can add caching if favorites list grows large.

**Recipe metadata**: Storing `recipeName` at favorite time means we don't re-query TheMealDB for recipe details when listing favorites. This is good for performance.

---

## Migration Notes

No database migrations needed — Favorite entity and table already exist from F-04. Schema is complete. Just inserting/updating/deleting rows.

---

## References

- User entity: `src/main/java/com/example/_x_recipes/entity/User.java`
- Favorite entity: `src/main/java/com/example/_x_recipes/entity/Favorite.java`
- FavoriteRepository: `src/main/java/com/example/_x_recipes/repository/FavoriteRepository.java`
- AuthController pattern: `src/main/java/com/example/_x_recipes/controller/AuthController.java`
- AuthContext: `src/context/AuthContext.tsx`
- RecipeCard component: `src/components/RecipeCard.tsx`
- Lessons: `context/foundation/lessons.md` (code quality checks after each phase)

---

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Backend Polish & API Consistency

#### Automated

- [x] 1.1 FavoriteController returns ApiResponse envelopes for all endpoints — 0f8da4d
- [x] 1.2 Request/response DTOs defined (FavoriteDTO, FavoritesListDTO, AddFavoriteRequest) — 0f8da4d
- [x] 1.3 Error handling refined (specific exceptions or consistent error codes) — 0f8da4d
- [x] 1.4 Code compiles: `mvn clean compile` — 0f8da4d
- [x] 1.5 Type checking passes: `mvn clean compile` — 0f8da4d
- [x] 1.6 Linting passes: `mvn checkstyle:check` — 0f8da4d

#### Manual

- [x] 1.7 Tested POST /api/favorites with valid recipe (returns ApiResponse) — acc3092
- [x] 1.8 Tested POST with duplicate (shows "Already in favorites") — acc3092
- [x] 1.9 Tested GET /api/favorites (returns list with total count) — acc3092
- [x] 1.10 Tested DELETE with unauthorized access (403 Forbidden) — acc3092

### Phase 2: Frontend Implementation

#### Automated

- [x] 2.1 favoriteClient.ts created with addFavorite, removeFavorite, getFavorites functions — acb3464
- [x] 2.2 FavoritesPage component built with data fetching, list display, delete confirmation — acb3464
- [x] 2.3 RecipeCard component updated with favorite button (heart icon, filled/outline) — acb3464
- [x] 2.4 TypeScript compiles: `npx tsc --noEmit` — acb3464
- [x] 2.5 Linting passes: `npm run lint` — acb3464
- [x] 2.6 Build succeeds: `npm run build` — acb3464

#### Manual

- [x] 2.7 Tested add favorite from search results (toast shows, icon fills)
- [x] 2.8 Tested view favorites page (list displays sorted by date, most recent first)
- [x] 2.9 Tested remove favorite (confirmation dialog, item disappears)
- [x] 2.10 Tested search page → favorites page → search (state stays in sync)
- [x] 2.11 Tested notes field visibility (displayed, read-only)

### Phase 3: Testing & Integration

#### Automated

- [ ] 3.1 FavoritesPage component tests pass: `npm test`
- [ ] 3.2 RecipeCard favorite button tests pass: `npm test`
- [ ] 3.3 FavoriteController integration tests pass: `mvn verify`
- [ ] 3.4 E2E tests pass: `npx playwright test`
- [ ] 3.5 Code coverage > 70%: `npm test -- --coverage`
- [ ] 3.6 Linting passes: `npm run lint`, `mvn checkstyle:check`

#### Manual

- [ ] 3.7 Tested full flow: login → search → add → view → remove → verify
- [ ] 3.8 Tested edge cases: duplicate add, remove, add again
- [ ] 3.9 Tested persistence: log out/in, favorites still visible
- [ ] 3.10 Tested error cases: network failure, unauthorized, not found
