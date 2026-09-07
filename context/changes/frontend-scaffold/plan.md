# Frontend Scaffold Audit & Quality Pass — Implementation Plan

## Overview

The React/Vite frontend was built as a prerequisite to S-01 (Guest Search) and now includes authentication, favorites, and search functionality. This audit verifies the scaffold is properly structured as a reusable foundation, identifies and fixes quality issues, refactors for consistency, and documents patterns for downstream features (S-04: Allergens, S-05: Notes).

The goal: leave a clean, well-documented, maintainable scaffold that future implementers can extend without re-learning patterns or working around technical debt.

## Current State Analysis

**What exists:**
- React 19.2.8 + Vite 8.2.2 with strict TypeScript
- Directory structure: `components/`, `pages/`, `api/`, `context/`, `hooks/`, `utils/`, `styles/`, `test/`
- Authentication context with token storage and axios interceptor
- API client layer (authClient, recipeClient, favoriteClient) with type contracts
- 8 core components (SearchForm, RecipeCard, Header, ProtectedRoute, etc.)
- 4 pages (LoginPage, SignupPage, FavoritesPage, RecipeDetailPage)
- Testing: Vitest, Playwright, Testing Library configured
- Accessibility basics (aria-*, role attributes)

**Quality gaps discovered:**
1. **No ESLint config** — eslint in package.json but `.eslintrc` missing; no linting rules enforced
2. **Console.log statements** — recipeClient.ts has 4+ debug logs left in production code
3. **Type inconsistency** — API response types defined in multiple places (authClient, recipeClient); no single contract
4. **Undocumented patterns** — No README or JSDoc explaining component contracts, hook usage, or API client conventions
5. **Mixed concerns** — SearchForm component mixes search logic with recipe detail view (rendering RecipeDetailPage inside)
6. **Cache strategy opaque** — cache.ts exists but invalidation logic and TTL reasoning not explained
7. **Error handling scattered** — Each client handles errors independently; no unified error boundary or recovery pattern
8. **Testing gaps** — Component tests exist but API client tests incomplete; no E2E test examples for auth flow
9. **No pattern checklists** — Future features (S-04, S-05) will need to know: "When adding a feature, follow these component/API patterns"

**Key discoveries:**
- File: `src/components/SearchForm.tsx:6` imports RecipeDetailPage and renders it conditionally (mixing concerns)
- File: `src/api/recipeClient.ts` has repetitive cache-check-then-fetch pattern in 3 functions; DRY violation
- File: `src/context/AuthContext.tsx` is well-structured; use as pattern model for future context
- File: `src/utils/tokenStorage.ts` is clean and simple; reusable pattern
- Test setup exists but patterns not documented; `src/test/setup.ts` needs comments
- Vite proxy config works but dev vs. prod setup not documented

## Desired End State

**After this plan completes:**
- Codebase passes ESLint with configured rules (no console.log, consistent naming, etc.)
- All console.log statements removed (except where needed for debugging; documented with warnings)
- Type contracts unified: single source of truth for API responses, component props
- Components reorganized: scaffold foundation (reusable) vs. search-specific (business logic) clearly separated
- Cache pattern DRY'd up; invalidation documented
- Error handling consistent: unified error boundary or documented per-client strategy
- Frontend README documents: directory structure, component patterns, API client conventions, testing approach
- JSDoc comments on 10+ key utilities and context hooks
- Pattern checklist created for downstream teams (S-04, S-05)
- ESLint passes, TypeScript strict mode passes, tests pass
- Future implementers can add new features without guessing patterns

**Verification:**
- `npm run lint` passes (0 warnings/errors)
- `npm run typecheck` passes strict mode
- `npm test` passes all unit tests
- `npm run build` succeeds
- README.md added to frontend structure
- Pattern checklists in `context/foundation/frontend-patterns.md`

## What We're NOT Doing

- **Rewriting components** — Only refactoring for clarity and reusability; no logic changes
- **Adding new features** — S-04 (Allergens) and S-05 (Notes) are separate slices; audit prep only
- **Performance optimization** — No lazy loading, code splitting, or memoization work (that's deployment/performance phase)
- **UI/UX redesign** — No styling changes or new components
- **End-to-end test suite** — Only document patterns; E2E tests come with features that need them
- **Mobile responsiveness review** — Styling/responsiveness is separate from scaffold structure

## Implementation Approach

**Phased cleanup with increasing impact:**
1. **Phase 1** — Gather findings via detailed code review; create findings matrix
2. **Phase 2** — Fix obvious quality issues (ESLint, console.log, type consistency)
3. **Phase 3** — Refactor for reusability (separate scaffold from business logic, DRY cache pattern, standardize error handling)
4. **Phase 4** — Document patterns and create guides for downstream teams

**Why this order:** Phase 2 fixes are mechanical (linting, cleanup). Phase 3 refactoring is safe because it has clear test coverage. Phase 4 creates value for future work.

---

## Phase 1: Code Review & Findings Documentation

### Overview

Systematically audit all source files for architecture, patterns, quality, and future-readiness. Create a findings matrix documenting: what's found, where, severity, and recommended fix.

### Changes Required

#### 1. Code Review — Components

**File**: `src/components/**/*.tsx`

**Intent**: Read each component, assess for: prop contract clarity, reusability, pattern consistency, testing coverage, accessibility. Document findings.

**Review checklist**:
- Props typed clearly; types exportable for consumers?
- Single responsibility — does component do one thing or multiple?
- Reusable or specific to search/auth flow?
- Accessibility: aria-*, role attributes, keyboard navigation?
- Error boundary or error handling?
- Testing: unit test exists? Coverage adequate?
- JSDoc or comments explaining contract?

**Components to review**:
- SearchForm, RecipeCard, RecipeResultsList, TimeRangeSelector, IngredientAutocomplete
- Header, FormError, ProtectedRoute
- LoginPage, SignupPage, FavoritesPage, RecipeDetailPage

**Findings to document**: 
- Each component's responsibility
- Prop contract clarity (0-5 scale)
- Reusability score (0-5 scale)
- Quality issues (naming, types, patterns)
- Testing coverage (unit test exists? passing?)

#### 2. Code Review — API Clients

**File**: `src/api/**/*.ts`

**Intent**: Assess consistency of API client patterns, error handling, type contracts, caching logic.

**Review checklist**:
- Type contracts (ApiResponse, etc.) — unified or scattered?
- Error handling — consistent across clients or different in each?
- Caching pattern — DRY or duplicated?
- Console.log statements — debugging only or left in production?
- Timeout handling — explicit or implicit?
- Request/response shapes — documented or inferred?

**Findings to document**:
- authClient, recipeClient, favoriteClient patterns
- Type contract consolidation opportunities
- Error handling strategy (per-client vs. unified)
- Cache pattern efficiency
- Documentation gaps

#### 3. Code Review — Context & Hooks

**File**: `src/context/AuthContext.tsx`, `src/hooks/**/*.ts`

**Intent**: Assess context design, hook patterns, state management clarity.

**Findings to document**:
- AuthContext contract (what's public, what's private?)
- Custom hooks: are they needed? Reusable?
- State management complexity
- Side effects (useEffect) — are they safe and testable?

#### 4. Create Findings Matrix

**File**: Internal document (will be synthesized into plan findings)

**Matrix structure**:
```
Category | Component/File | Finding | Severity | Recommended Fix | Effort
---------|---------|---------|----------|---------|--------
Type Consistency | recipeClient.ts | ApiResponse defined here; authClient has duplicate | Medium | Create types in api/types.ts, import in both | 0.5h
Console Output | recipeClient.ts:44 | console.log left in production search logic | Low | Remove or replace with debug flag | 0.5h
DRY Violation | recipeClient.ts:25-92 | Cache check → fetch pattern repeated 3x | Medium | Extract to getCachedOrFetch utility | 1h
Reusability | SearchForm.tsx:6 | Imports & renders RecipeDetailPage (biz logic, not reusable) | Medium | Move detail view navigation to parent or router | 1.5h
...
```

### Success Criteria

#### Automated Verification

- Findings matrix complete (all components, API clients, hooks reviewed)
- No crashes or errors during code inspection

#### Manual Verification

- Findings matrix reviewed for accuracy (spot-check 3-5 items with actual code)
- Severity and effort estimates reasonable
- Recommendations are clear and actionable

---

## Phase 2: Quality Fixes & Cleanup

### Overview

Address findings from Phase 1: add ESLint config, remove console.log, unify type contracts, standardize error handling.

### Changes Required

#### 1. ESLint Configuration

**File**: `.eslintrc.cjs` (new)

**Intent**: Enforce consistent code style and catch common issues.

**Contract**: ESLint config for React + TypeScript with rules for:
- No console.log (except console.error/warn, which are flagged for review)
- Consistent naming (camelCase for variables/functions, PascalCase for components)
- No unused variables or imports
- React Hook rules (useEffect dependencies, etc.)
- Accessibility (jsx-a11y rules)

**Config**: Standard ESLint setup compatible with React 19 and TypeScript 7.

#### 2. Remove Console.log Statements

**Files**: `src/api/recipeClient.ts`, `src/components/SearchForm.tsx` (and any others found)

**Intent**: Remove debug logging left from development. Keep console.error/warn for errors only.

**Changes**:
- `recipeClient.ts:34` — `console.log('Using cached search results')` → remove
- `recipeClient.ts:44-46` — Search response logging → remove  
- `SearchForm.tsx:29, 31` — Debug logging → remove
- (and others found in audit)

**Contract**: No production console.log; console.error/warn only for actual errors.

#### 3. Unify Type Contracts

**File**: `src/api/types.ts` (new)

**Intent**: Single source of truth for all API types.

**Contract**: Consolidate types:
- `ApiResponse<T>` — Generic response envelope (status, data, error)
- `AuthResponse` — Signup/login response shape
- `UserProfile` — User data shape
- `RecipeResult`, `RecipeDetail` — Recipe shapes
- Other response types as discovered

**Implementation**: 
- Create `src/api/types.ts` with all type exports
- Update authClient, recipeClient, favoriteClient to import from it
- Remove duplicate type definitions

#### 4. Standardize Error Handling

**Files**: `src/api/authClient.ts`, `src/api/recipeClient.ts`, `src/api/favoriteClient.ts`

**Intent**: Consistent error extraction and messaging strategy.

**Contract**: Every client should:
- Extract error message from ApiResponse.error (if present)
- Fall back to generic message if ApiResponse malformed
- Log at appropriate level (console.error for actual errors only)
- Throw with descriptive message for caller to handle

**Implementation**: Keep the `getErrorMessage` pattern from authClient, apply to recipeClient and favoriteClient.

#### 5. Cache Pattern Cleanup (DRY)

**File**: `src/api/cache.ts`, `src/api/recipeClient.ts`

**Intent**: Extract repetitive cache-check-then-fetch logic into utility.

**Contract**: Utility function `getCachedOrFetch` that:
- Takes cache key, fetch function, and optional TTL
- Checks cache; if hit, returns
- If miss, calls fetch, caches result, returns
- Handles cache expiry

**Implementation**: Add to cache.ts; refactor recipeClient to use it.

#### 6. Test Files — Add Missing Tests

**File**: `src/api/__tests__/recipeClient.test.ts` (expand if exists)

**Intent**: Test cache pattern, error handling, timeout behavior.

**Contract**: Unit tests for:
- searchRecipes: successful search, cache hit, cache miss, timeout
- getRecipeDetails: caching behavior, timeout
- getIngredients: caching behavior
- Error cases: malformed response, network error

### Success Criteria

#### Automated Verification

- `npm run lint` passes (0 errors, 0 warnings)
- `npm run typecheck` passes (strict mode)
- `npm run build` succeeds
- `npm test` passes all tests (including new cache/error tests)

#### Manual Verification

- Spot-check: recipeClient.ts has no console.log (except console.error in error handlers)
- Spot-check: authClient and recipeClient both use getErrorMessage pattern
- Spot-check: Cache pattern used consistently (getCachedOrFetch in 3+ places)
- Test coverage: API client tests run without error

---

## Phase 3: Refactoring & Reusability

### Overview

Reorganize components and patterns to clearly separate scaffold (reusable foundation) from business logic (search-specific). Ensure future features can plug in without guessing or refactoring.

### Changes Required

#### 1. Component Organization — Separate Concerns

**Files**: `src/components/` (reorganize)

**Intent**: Make clear which components are scaffold (reusable UI primitives) vs. business logic (search-specific).

**Contract**: 
- **Scaffold components** (reusable, no recipe/search knowledge):
  - `FormError` — error display
  - `Header` — navigation header
  - `ProtectedRoute` — auth guard
  - `RecipeCard` — card display (generic, not search-specific)
  - `TimeRangeSelector` — time picker (generic)
  - Folder: `src/components/scaffold/` (these go here)

- **Business logic components** (search-specific):
  - `SearchForm` — search orchestration
  - `IngredientAutocomplete` — search autocomplete
  - `RecipeResultsList` — search results
  - Folder: `src/components/recipe-search/` (these go here; clearly scoped)

**Implementation**:
- Move scaffold components to `src/components/scaffold/`
- Move recipe-search components to `src/components/recipe-search/`
- Update imports throughout
- Add README.md to each folder explaining contents

#### 2. SearchForm Refactoring — Remove Mixed Concerns

**File**: `src/components/recipe-search/SearchForm.tsx`

**Intent**: SearchForm should handle search orchestration, not render recipe detail view. Navigation should be handled by parent or router.

**Contract**:
- SearchForm: renders search inputs + results list
- Does NOT: import or render RecipeDetailPage
- Emits event (or uses callback) when user selects a recipe
- Parent (HomePage or Router) handles detail view navigation

**Implementation**: Remove `selectedRecipeId` and detail view logic from SearchForm; move to parent component or use router.

#### 3. API Client Types — Cleanup Duplication

**Files**: `src/api/types.ts`, `src/api/recipeClient.ts`

**Intent**: All types in one place; clients import as needed.

**Contract**: 
- `types.ts` exports: `ApiResponse<T>`, `AuthResponse`, `UserProfile`, `RecipeResult`, `RecipeDetail`, `SearchResult`, etc.
- Each client imports: `import { AuthResponse, UserProfile } from './types'`

**Implementation**: Already done in Phase 2; verify no duplication remains.

#### 4. Error Handling Pattern — Document & Standardize

**File**: `src/api/index.ts` or add to each client

**Intent**: Ensure every API client uses same error extraction + messaging strategy.

**Contract**:
- All clients: use `getErrorMessage` utility (from authClient) or equivalent
- All clients: throw with descriptive message, not raw axios error
- Components: catch and display error.message

**Implementation**: Documented in Phase 2; verify applied consistently.

#### 5. Hook Patterns — Create & Document Custom Hooks

**Files**: `src/hooks/` (create as needed)

**Intent**: Extract reusable hook patterns for future features.

**Potential hooks to create** (if not already present):
- `useApiCall(fn)` — wraps async API call, returns { data, loading, error }
- `useFormState(initialValues)` — form state management
- `useFetch(url, deps)` — generic fetch hook

**Contract**: Each hook should:
- Have clear prop/return types
- Handle loading, error, success states
- Be documented with JSDoc
- Have unit tests

**Implementation**: Create hooks file; document patterns.

#### 6. Styles Reorganization

**Files**: `src/styles/` (optional cleanup)

**Intent**: Ensure CSS is co-located with components or organized clearly.

**Contract**:
- Option A: Component-specific CSS next to component file
- Option B: Global styles in `src/styles/`, component classes documented

**Implementation**: Document chosen pattern; ensure consistency.

### Success Criteria

#### Automated Verification

- `npm run lint` passes
- `npm run typecheck` passes
- `npm run build` succeeds
- `npm test` passes
- ESLint finds no import errors (refactored paths correct)

#### Manual Verification

- Spot-check: SearchForm no longer imports RecipeDetailPage
- Spot-check: Components in `src/components/scaffold/` are generic (no search/recipe domain logic)
- Spot-check: Components in `src/components/recipe-search/` are search-specific
- Folder structure clear: future implementers know where to add new components

---

## Phase 4: Documentation & Pattern Guides

### Overview

Create comprehensive documentation so future teams (S-04: Allergens, S-05: Notes) can extend the scaffold without guessing patterns.

### Changes Required

#### 1. Frontend README

**File**: `src/README.md` (new)

**Intent**: Guide new contributors through codebase structure and patterns.

**Contract**: README includes:
- **Directory Structure** — explain each folder and its purpose
  - `components/scaffold/` — reusable UI components
  - `components/recipe-search/` — search feature components
  - `pages/` — page-level components
  - `api/` — API clients and types
  - `context/` — React context (auth, etc.)
  - `hooks/` — custom hooks
  - `utils/` — utilities (tokenStorage, validation, etc.)
  - `styles/` — global or shared styles
  - `test/` — test setup
  
- **API Client Pattern** — How to create a new API client
  - Example: authClient structure
  - When to add to interceptor vs. client
  - How to handle errors
  - Caching strategy (when to use, TTL, invalidation)
  
- **Component Pattern** — How to create a new component
  - Scaffold component vs. business logic component
  - Props contract (what to export)
  - Testing approach
  - Accessibility requirements
  
- **Context & State Pattern** — How to add new context
  - When to use context vs. prop drilling
  - Hook pattern (useXxx)
  - Testing context in components
  
- **Testing Approach**
  - Unit tests: Vitest + Testing Library
  - E2E tests: Playwright
  - What to test at each layer
  
- **Quick Links** — To pattern examples below

#### 2. API Client Pattern Guide

**File**: `context/foundation/frontend-patterns.md` (new section or file)

**Intent**: Document how to create and extend API clients for new features.

**Contract**: Guide includes:
- **When to create a new client** — per feature/domain
- **Client template**:
  ```typescript
  import axiosInstance from './interceptor';
  import { getCachedOrFetch } from './cache';
  import { ApiResponse, /* types */ } from './types';

  const getErrorMessage = (error: unknown, fallback: string): string => {
    // ... error extraction
  };

  export const featureClient = {
    getFeature: async (id: string): Promise<Feature> => {
      const cacheKey = `feature_${id}`;
      return getCachedOrFetch(cacheKey, () => 
        axiosInstance.get<ApiResponse<Feature>>(`/feature/${id}`)
      );
    },
    // ... other methods
  };

  export type { Feature };
  ```
  
- **Error handling** — Always use getErrorMessage, throw with descriptive message
- **Caching** — Use getCachedOrFetch for GET requests; skip cache for writes
- **Type contracts** — Define request/response types; export from types.ts
- **Testing** — Mock axiosInstance; test success + error paths

#### 3. Component Pattern Checklist

**File**: `context/foundation/frontend-patterns.md` (new section)

**Intent**: Checklist for implementing new components.

**Contract**: Checklist:
- [ ] Component has clear responsibility (does one thing)
- [ ] Props are typed and exported (consumers can extend)
- [ ] Component is generic or clearly scoped (scaffold vs. business logic)
- [ ] Accessibility: aria-*, role, keyboard navigation if interactive
- [ ] Error handling: graceful fallback or delegates to parent
- [ ] JSDoc comment explaining contract
- [ ] Unit test exists and covers happy path + error case
- [ ] Styles: co-located or linked to global style
- [ ] No console.log; use error/warn for issues
- [ ] TypeScript strict mode passes

#### 4. JSDoc Comments on Key Utilities

**Files**: `src/utils/tokenStorage.ts`, `src/context/AuthContext.tsx`, `src/api/cache.ts`, `src/hooks/*`

**Intent**: Explain contract and usage for future readers.

**Example JSDoc**:
```typescript
/**
 * Token storage utilities for managing auth token in localStorage.
 * 
 * @example
 * import { tokenStorage } from './tokenStorage';
 * tokenStorage.setToken(myToken);
 * const token = tokenStorage.getToken();
 */
export const tokenStorage = { ... };
```

#### 5. Testing Pattern Examples

**File**: `src/components/scaffold/FormError.test.tsx` (or existing test)

**Intent**: Document testing patterns for future teams.

**Contract**: Examples show:
- How to test scaffold components (generic UI without auth/API)
- How to test components that use context (mock useAuth)
- How to test API clients (mock axiosInstance)
- How to test E2E (Playwright example for login flow)

#### 6. Allergen & Notes Feature Prep

**File**: `context/foundation/frontend-patterns.md` (new section)

**Intent**: Specific guidance for S-04 (Allergens) and S-05 (Notes) teams.

**Contract**: 
- **For S-04 (Allergens)**: 
  - Scaffold component needed: allergen selector (checkbox list)
  - API client pattern: allergenClient.getList(), allergenClient.add(allergen)
  - Where to integrate: UserProfilePage (new page), or FavoritesPage
  - Reuse: FormError, ProtectedRoute already available

- **For S-05 (Notes)**:
  - Scaffold component needed: note editor (textarea, save/cancel)
  - API client pattern: noteClient.add(recipeId, text), noteClient.update, noteClient.delete
  - Where to integrate: FavoritesPage (note editor in recipe card)
  - Reuse: FormError, existing FavoritesPage structure

### Success Criteria

#### Automated Verification

- README.md exists and renders without errors
- frontend-patterns.md exists and is well-formatted
- No broken links in documentation

#### Manual Verification

- README clearly explains directory structure (could a new dev find api/ clients?)
- API client pattern guide is complete (has template, error handling, caching guidance)
- Component checklist is actionable (future teams can follow it step-by-step)
- JSDoc comments are clear and have examples
- Allergen & Notes prep gives concrete starting points (team knows what to build, where to add it)

---

## Testing Strategy

### Unit Tests

**Coverage**:
- API clients: success paths, error handling, cache behavior, timeout
- Components: rendering, prop handling, accessibility, error states
- Context: login/logout, token persistence, profile fetch
- Utilities: tokenStorage, cache, validation

**Framework**: Vitest + Testing Library (already configured)

**Run**: `npm test`

### Integration Tests

**Scenarios**:
- Login flow: signup → set token → fetch profile → show user email
- Guest search: search without token → see results
- Favorites: login → save recipe → view favorites → delete → see update
- Error recovery: API timeout → show error message → retry succeeds

**Framework**: Playwright E2E tests (already configured)

**Run**: `npm run test:e2e` (if script exists)

### Manual Verification

- ESLint passes: `npm run lint`
- Type checking passes: `npm run typecheck`
- Build succeeds: `npm run build`
- Dev server starts: `npm run dev`

---

## Critical Implementation Details

**SearchForm refactoring order**: Remove detail view rendering BEFORE separating component folders. Reason: detail view logic change must be atomic with file move; doing both in one commit ensures no orphaned logic.

**ESLint config timing**: Add ESLint config in Phase 2 BEFORE removing console.log. Reason: linting will flag console.log; removes them more reliably than manual search.

**Type consolidation**: Create `types.ts` BEFORE updating clients. Reason: import errors will be caught by TypeScript; safer to have file first, then update imports.

---

## References

- Codebase: `src/` directory
- Roadmap: `context/foundation/roadmap.md` (F-02 frontend-scaffold)
- Related archive: `context/archive/2026-08-27-guest-search/` (S-01 that used this scaffold)
- Lessons: `context/foundation/lessons.md` (code quality pattern applies to frontend)

---

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands.

### Phase 1: Code Review & Findings Documentation

#### Automated

- [x] 1.1 Component review checklist completed (SearchForm, RecipeCard, Header, ProtectedRoute, etc.) — 6cb26e1
- [x] 1.2 API client review checklist completed (authClient, recipeClient, favoriteClient) — 6cb26e1
- [x] 1.3 Context & hooks review checklist completed (AuthContext, custom hooks) — 6cb26e1

#### Manual

- [ ] 1.4 Findings matrix created and reviewed for accuracy
- [ ] 1.5 Severity & effort estimates confirmed reasonable

### Phase 2: Quality Fixes & Cleanup

#### Automated

- [x] 2.1 ESLint config (eslint.config.js) added — 6cb26e1
- [ ] 2.2 `npm run lint` passes (0 errors, 0 warnings)
- [x] 2.3 Console.log statements removed from production code — 6cb26e1
- [x] 2.4 Type contracts unified in `src/api/types.ts` — 6cb26e1
- [x] 2.5 Error handling standardized across all API clients — 6cb26e1
- [x] 2.6 Cache pattern refactored to use getCachedOrFetch utility — 6cb26e1
- [ ] 2.7 API client tests added/updated for cache, error, timeout scenarios
- [x] 2.8 `npm run typecheck` passes (strict mode) — 6cb26e1
- [ ] 2.9 `npm test` passes all tests
- [ ] 2.10 `npm run build` succeeds

#### Manual

- [ ] 2.11 Spot-check: recipeClient.ts clean (no debug logging)
- [ ] 2.12 Spot-check: authClient and recipeClient use same error pattern
- [ ] 2.13 Spot-check: Cache pattern consistent across 3+ API calls

### Phase 3: Refactoring & Reusability

#### Automated

- [ ] 3.1 Components reorganized: `src/components/scaffold/` and `src/components/recipe-search/`
- [ ] 3.2 SearchForm refactored: no longer imports RecipeDetailPage
- [ ] 3.3 All import paths updated and correct
- [ ] 3.4 `npm run lint` passes
- [ ] 3.5 `npm run typecheck` passes
- [ ] 3.6 `npm test` passes
- [ ] 3.7 `npm run build` succeeds

#### Manual

- [ ] 3.8 Spot-check: Components in `src/components/scaffold/` are generic (no domain logic)
- [ ] 3.9 Spot-check: Components in `src/components/recipe-search/` are scoped and documented
- [ ] 3.10 Folder README.md added to both scaffold and recipe-search explaining contents

### Phase 4: Documentation & Pattern Guides

#### Automated

- [ ] 4.1 `src/README.md` created with directory structure, patterns, quick links
- [ ] 4.2 `context/foundation/frontend-patterns.md` created with API client and component checklists
- [ ] 4.3 JSDoc comments added to `tokenStorage.ts`, `AuthContext.tsx`, `cache.ts`, custom hooks
- [ ] 4.4 Markdown files render without errors (no broken links)

#### Manual

- [ ] 4.5 README reviewed for clarity (new dev could navigate codebase)
- [ ] 4.6 API client pattern guide reviewed for completeness (has template, error handling, caching)
- [ ] 4.7 Component checklist is actionable (team can follow step-by-step)
- [ ] 4.8 JSDoc examples are clear and helpful
- [ ] 4.9 Allergen & Notes prep section gives concrete starting points (teams know what to build)
