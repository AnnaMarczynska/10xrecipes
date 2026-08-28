# Testing Critical-Path Search Implementation Plan

## Overview

Phase 1 delivers integration tests that validate the core 10xRecipes search hypothesis: when users select ingredients and cooking time, the API returns valid recipes that strictly match their constraints. This phase covers Risks R1 (empty results when recipes exist) and R2 (results don't match user constraints). Tests verify both the happy path (search succeeds) and boundary conditions (filtering enforces strict constraints).

## Current State Analysis

**Existing state:**
- Search endpoint exists: `POST /api/recipes/search` (RecipeController, lines 32-121)
- RecipeSearchService implements scoring: 0.4 × ingredient_overlap + 0.6 × cook_time_fit
- Minimum ingredient match threshold: 50%
- Supported time ranges: "<15", "15-30", "30-60", "60+"
- Mock HTTP available via Spring Boot Test (Mockito, MockMvc)
- Existing tests: RecipeSearchServiceTest.java with 5 unit tests (direct instantiation, no mocks)

**Missing:**
- Integration tests for the /search endpoint (no MockMvc tests exist)
- Comprehensive mock recipe dataset for realistic testing
- Boundary condition tests (threshold overlaps, exact time matches)
- Test fixtures reusable across Phase 2 (ranking) and Phase 3 (API resilience)

## Desired End State

When this phase completes:
1. **Automated tests** validate R1 + R2 before any code ship:
   - Search returns ≥1 recipe when valid ingredients + time provided (happy-path)
   - All returned recipes match user's time constraint (≤ user's max time)
   - All returned recipes contain ≥50% of user's ingredients (ingredient threshold)
   - Results ranked by score (0.4 ingredient, 0.6 time fit) in descending order
   - Recipes outside constraints are strictly excluded (boundary tests)

2. **Test infrastructure** is bootstrapped and reusable:
   - TestRecipeFactory with 20+ comprehensive mock recipes
   - RecipeSearchControllerTest with integration test cases
   - MockMvc configured for endpoint testing
   - Recipes mimic real TheMealDB distribution (varied overlaps, time ranges)

3. **Manual verification** confirms:
   - All automated tests pass: `mvn test`
   - Test data is realistic and representative
   - Test assertions verify the contract, not just current behavior

## Key Discoveries

- **Algorithm weights confirmed:** 0.4 ingredient_overlap + 0.6 cook_time_fit (cook time prioritized for MVP use case)
- **Threshold enforcement:** 50% minimum ingredient match; strict time-range boundaries
- **Response format:** POST returns Map with `results` (List<RecipeResult>) and `total` (count)
- **Existing test pattern:** Direct instantiation without mocks; spring-boot-starter-test provides Mockito + MockMvc
- **Cache architecture:** In-memory, 1-hour TTL—not tested in Phase 1 (Phase 2 owns cache validation, R4)

## What We're NOT Doing

- **Frontend component testing.** React search UI deferred to Phase 3; Phase 1 validates API layer only.
- **Cache behavior.** TTL expiry, LRU eviction, quota-exceeded error handling are Phase 2 (R4). Phase 1 tests fresh searches only.
- **Error cases.** Invalid input, TheMealDB outages, timeout scenarios deferred to Phase 3 (R5). Phase 1 assumes valid inputs and available API.
- **Performance testing.** N+1 call regression (R6) tested in Phase 2. Phase 1 accepts the current call pattern.
- **Auth or access control.** No token/session testing in Phase 1; that's S-02 launch scope.

## Implementation Approach

**Two-phase test buildout:**

1. **Phase 1a: Test fixture bootstrap** — Create TestRecipeFactory with 20+ realistic mock recipes (varied ingredient overlaps, cook times). Set up MockMvc integration test skeleton. Verify infrastructure works.
2. **Phase 1b: Test suite** — Write integration tests covering happy-path scenarios (search returns results, results match inputs) and boundary conditions (exact time matches, threshold ingredient overlaps). Verify R1 + R2 protection.

**Key design decisions:**

- **Comprehensive mock data:** 20+ recipes mirroring real TheMealDB, not just happy-path cases. This includes recipes with 0%, 30%, 50%, 75%, 100% ingredient overlaps and time ranges spanning <15 through 60+ minutes. Reusable across phases.
- **TestRecipeFactory utility class:** Centralize mock recipes for reuse in Phase 2 (ranking) and Phase 3 (API resilience). Simplifies test maintenance.
- **Integration tests, not unit tests:** Use MockMvc to test the endpoint contract (POST /search request/response). Complements existing RecipeSearchServiceTest.java (unit). Existing service tests unchanged.
- **Boundary-case coverage:** Test edge cases that catch constraint violations: recipe with cook time exactly matching user's max, recipe with ingredient overlap exactly at 50% threshold, recipes just outside these boundaries (to verify exclusion).

---

## Phase 1a: Test Fixture Bootstrap

### Overview

Create the mock recipe dataset and integration test infrastructure. This phase produces TestRecipeFactory (reusable across all test phases) and verifies MockMvc can call the search endpoint.

### Changes Required

#### 1. Create TestRecipeFactory utility class

**File:** `src/test/java/com/example/_x_recipes/test/TestRecipeFactory.java`

**Intent:** Provide a centralized, reusable factory for mock Recipe objects. This fixture will be used by Phase 1b, Phase 2 (ranking tests), and Phase 3 (API resilience) to avoid duplicating recipe data.

**Contract:** Static factory methods that return Recipe objects with known properties (ingredient lists, cook times). Recipes span the spectrum: 0% ingredient overlap, threshold (50%), and 100% overlap; time ranges <15 through 60+. No external dependencies; uses only Recipe model constructors.

**Factory coverage (20+ recipes):**
- **Ingredient overlap scenarios:**
  - 0% overlap (no matching ingredients)
  - 30% overlap (low match)
  - 50% overlap (threshold boundary)
  - 75% overlap (strong match)
  - 100% overlap (all ingredients)
- **Cook time scenarios:**
  - <15 min
  - 15-30 min (common user choice)
  - 30-60 min
  - 60+ min (long recipes)
- **Combinations:** Each ingredient tier has recipes in each time range (5 overlap levels × 4 time ranges = 20 recipes minimum)

#### 2. Create RecipeSearchControllerTest integration test file

**File:** `src/test/java/com/example/_x_recipes/controller/RecipeSearchControllerTest.java`

**Intent:** Integration tests for the POST /api/recipes/search endpoint. Uses MockMvc to verify request/response contract without starting a real server or calling TheMealDB.

**Contract:** Spring Boot test class annotated with `@SpringBootTest` and `@AutoConfigureMockMvc`. MockMvc pre-configured for endpoint testing. Mock TheMealDB responses using Mockito.

**Test setup (no actual test cases yet, just infrastructure):**
- MockMvc instance available
- Mock TheMealDB client injected and configured to return recipes from TestRecipeFactory
- Helper methods for building SearchRequest JSON and parsing RecipeResult responses
- One sanity-check test: verify endpoint responds with 200 and returns a results array

### Success Criteria

#### Automated Verification

- TestRecipeFactory compiles and builds: `mvn clean compile`
- All recipes in TestRecipeFactory have valid ingredient lists and cook times
- No missing fields in Recipe objects (name, ingredients, cookTime populated)
- RecipeSearchControllerTest class compiles and can be invoked
- MockMvc endpoint test passes: POST /api/recipes/search returns HTTP 200 with results array
- `mvn test` runs both RecipeSearchServiceTest (existing) and RecipeSearchControllerTest (new) without errors

#### Manual Verification

- Review TestRecipeFactory recipes: Do they span the intended overlap/time ranges?
- Verify recipe data is realistic (names, ingredients, cook times plausible)
- Check that mock setup doesn't break existing unit tests

---

## Phase 1b: Integration Tests (Happy-Path + Boundary Cases)

### Overview

Write the full test suite covering R1 (search returns results) and R2 (results match constraints). Tests include happy-path scenarios and boundary conditions that verify strict constraint enforcement.

### Changes Required

#### 1. Implement integration tests in RecipeSearchControllerTest

**File:** `src/test/java/com/example/_x_recipes/controller/RecipeSearchControllerTest.java` (continued from Phase 1a)

**Intent:** Test the /search endpoint with realistic inputs, verifying results match user constraints.

**Contract:** Test methods that call POST /api/recipes/search via MockMvc and assert:
1. Response status (200 OK)
2. Response structure (results array, total count)
3. Result filtering (all recipes match user constraints)
4. Result ranking (descending by score)
5. Edge cases (boundary overlaps, exact time matches)

**Test cases (organized by risk):**

**R1 Coverage: Empty Results**
- `testSearchReturnsResultsForValidInput` — User selects [chicken, rice, garlic], 30min → returns ≥1 result
- `testSearchReturnsResultsForCommonIngredients` — [eggs, milk, butter], 15min → returns recipes with these ingredients
- `testSearchReturnsResultsForLongTimeRange` — [pasta, tomato], 60min → returns recipes that fit longer window

**R2 Coverage: Constraint Violations**
- `testSearchExcludesRecipesExceedingTimeLimit` — User picks 30min max; results contain no recipes > 30min
- `testSearchExcludesRecipesBelowIngredientThreshold` — User picks [chicken]; recipes with <50% chicken excluded
- `testSearchIncludesRecipesAtThresholdBoundary` — Recipe with exactly 50% ingredient overlap included
- `testSearchExcludesRecipesJustBelowThreshold` — Recipe with 49% overlap excluded
- `testSearchIncludesRecipesAtTimeMatchBoundary` — Recipe with cook time = user's max included
- `testSearchExcludesRecipesJustAboveTimeLimit` — Recipe with cook time = user's max + 1 excluded

**Ranking Verification:**
- `testSearchRanksByScore` — Results ordered by score (0.4 ingredient + 0.6 time fit), descending
- `testSearchPrefersCookTimeOverIngredients` — Recipe A: 100% ingredients, 10min cook; Recipe B: 75% ingredients, 25min cook. With 30min available, B ranks higher (0.6 weight on time fit)

**Boundary Scenarios:**
- `testSearchWithExactTimeMatches` — Multiple recipes all fit exactly in user's time range; ranking by ingredient overlap
- `testSearchWithMixedThresholdOverlaps` — Recipes at 50%, 75%, 100% overlap; verify all included and sorted

### Success Criteria

#### Automated Verification

- All test methods pass: `mvn test -Dtest=RecipeSearchControllerTest`
- Type checking passes: `mvn compile`
- Linting/code quality passes: `mvn checkstyle:check` (if configured)
- No warnings in test output
- Integration tests exercise the full request/response flow (not just unit testing the service)
- Mock TheMealDB is not called; all data comes from TestRecipeFactory

#### Manual Verification

- Code review: Verify test data realistic, assertions test the contract (not implementation)
- Run `mvn test` locally and confirm all 10+ new test cases pass
- Spot-check one test case: Add a debug log to RecipeSearchService.searchRecipes(), run the test, verify the service is actually called (not mocked away)
- Verify no changes to RecipeSearchServiceTest.java (existing unit tests unchanged)

**Implementation Note:** After all automated verification passes, pause for manual review. The manual verification confirms that tests actually exercise the endpoint and that mock setup is correct (easy mistake: over-mocking that makes tests useless).

---

## Testing Strategy

### Unit vs. Integration Layer Boundaries

- **RecipeSearchServiceTest.java (existing):** Unit tests for the scoring and filtering logic. Direct instantiation, no mocks. Tests the `RecipeSearchService` class in isolation.
- **RecipeSearchControllerTest.java (new):** Integration tests for the endpoint. MockMvc + mocked TheMealDB client. Tests the full request/response cycle, verifying the endpoint correctly orchestrates service + repository.

This split prevents duplication: service logic tested thoroughly at unit level; endpoint contract validated at integration level.

### Mock Strategy

- **TheMealDB client mocked** to return TestRecipeFactory recipes. Real HTTP calls to TheMealDB are not made during testing.
- **MockMvc used** to simulate HTTP requests/responses without starting a server.
- **No cache mocking:** Phase 1 tests assume fresh searches (cache not consulted). Cache validation (R4) is Phase 2.

### Test Data Rationale

20+ recipes chosen to cover realistic scenarios without over-engineering:
- **5 ingredient-overlap levels** (0%, 30%, 50%, 75%, 100%) ensure edge cases at the 50% threshold are tested.
- **4 time-range tiers** (<15, 15-30, 30-60, 60+) cover all user-facing options.
- **Combination matrix** (5 × 4 = 20) ensures recipes exist for every search scenario.
- Reusable factory prevents duplicating this data in Phase 2 and Phase 3.

---

## References

- Test-plan strategy: `context/foundation/test-plan.md` §2 (Risks R1, R2), §6 Pattern 1 (Recipe match)
- Search endpoint: `src/main/java/com/example/_x_recipes/controller/RecipeController.java`, lines 32-121
- Search service: `src/main/java/com/example/_x_recipes/service/RecipeSearchService.java`, lines 17-90
- Existing unit tests: `src/test/java/com/example/_x_recipes/service/RecipeSearchServiceTest.java`

---

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1a: Test Fixture Bootstrap

#### Automated

- [x] 1.1 Create TestRecipeFactory.java with 20+ mock recipes (5 overlap levels × 4 time ranges)
- [x] 1.2 Verify TestRecipeFactory compiles and recipes are structurally valid (no missing fields)
- [x] 1.3 Create RecipeSearchControllerTest.java skeleton with MockMvc configured
- [x] 1.4 Write sanity-check test: POST /api/recipes/search returns HTTP 200
- [x] 1.5 Existing RecipeSearchServiceTest.java still passes (no regression)

#### Manual

- [ ] 1.6 Code review: Verify mock recipes are realistic and span intended ranges
- [ ] 1.7 Verify test infrastructure is correct (MockMvc calls real endpoint, not just mocked service)

### Phase 1b: Integration Tests (Happy-Path + Boundary Cases)

#### Automated

- [x] 2.1 testSearchReturnsResultsForValidInput — Happy-path with common ingredients
- [x] 2.2 testSearchReturnsResultsForCommonIngredients — Second happy-path scenario
- [x] 2.3 testSearchReturnsResultsForLongTimeRange — Third happy-path scenario
- [x] 2.4 testSearchExcludesRecipesExceedingTimeLimit — Time constraint enforcement
- [x] 2.5 testSearchExcludesRecipesBelowIngredientThreshold — Ingredient threshold enforcement
- [x] 2.6 testSearchIncludesRecipesAtThresholdBoundary — Boundary: exactly 50% overlap
- [x] 2.7 testSearchExcludesRecipesJustBelowThreshold — Boundary: 49% overlap excluded
- [x] 2.8 testSearchIncludesRecipesAtTimeMatchBoundary — Boundary: exact time match included
- [x] 2.9 testSearchExcludesRecipesJustAboveTimeLimit — Boundary: time just over limit excluded
- [x] 2.10 testSearchRanksByScore — Results ordered by score, descending
- [x] 2.11 testSearchPrefersCookTimeOverIngredients — Cook time weight (0.6) > ingredient weight (0.4)
- [x] 2.12 testSearchWithExactTimeMatches — Multiple recipes at time boundary ranked by ingredients
- [x] 2.13 testSearchWithMixedThresholdOverlaps — Multiple overlaps tested together
- [x] 2.14 All tests pass: `mvn test -Dtest=RecipeSearchControllerTest`

#### Manual

- [x] 2.15 Code review: Verify assertions test contract (not implementation); test data is realistic
- [x] 2.16 Spot-check one test execution: Confirm RecipeSearchService is actually called (not mocked away)
- [x] 2.17 Verify no changes to existing RecipeSearchServiceTest.java
