# Phase 2: Ranking & Caching Tests Implementation Plan

## Overview

Phase 2 delivers unit and integration tests that protect three critical fragile areas: the ranking algorithm (R3), cache lifecycle (R4), and N+1 API call pattern (R6). This phase focuses on validating the current system behavior against regressions, not fixing bugs. Tests are split by risk and test layer: unit tests for ranking and cache (fast, deterministic), integration test for N+1 calls (end-to-end visibility).

---

## Current State Analysis

**Existing state:**
- Ranking algorithm: Service calculates score but sorts by cook time (not score). Weights are 0.4 ingredient + 0.6 cook time. RecipeSearchService.java exists; RecipeSearchServiceTest.java has 5 basic unit tests that don't validate ranking order.
- Cache: cache.ts is solid — TTL (24h), quota-exceeded handler (clear + retry), key stability. recipeClient.ts uses cache correctly. No existing tests.
- N+1 fix: RecipeController.java correctly places `.limit(20)` before enrichment loop. No call-count assertions exist; easy regression vector.
- Test infrastructure: Phase 1 created TestRecipeFactory (20+ mock recipes) and MockMvc integration test skeleton. Spring Boot test stack in place (JUnit 5, Mockito, AssertJ).

**Missing:**
- Ranking unit tests that validate score calculation on boundary cases and catch weight/sorting regressions
- Cache unit tests for TTL expiry, quota-exceeded recovery, and key collision
- Integration test that counts API calls and verifies N+1 limit holds
- Extended TestRecipeFactory with Phase 2 boundary-case recipes

**Key discoveries** (from research.md):
- Ranking sorts by cook time ascending, not by score — this is intentional (MVP prioritizes time-fit over ingredient overlap)
- Current weights (0.4/0.6) are intentional; tests protect this design, not the test-plan expectation (0.6/0.4)
- Cache implementation is correct; tests validate edge cases for confidence
- N+1 limit is placed correctly; tests must catch if it moves after enrichment loop

---

## Desired End State

When this phase completes:

1. **Automated tests validate all three risks** before any code ship:
   - Ranking tests assert score formula (both components present, correct weights) and sorting order (by time, not score)
   - Ranking tests catch weight swaps, missing components, sorting inversions
   - Cache tests assert TTL expiry, quota-exceeded recovery, key collision prevention
   - N+1 test counts actual API calls and asserts ≤20 enrichment calls (1 getAllRecipes + ≤20 fetchRecipeDetails)

2. **Test infrastructure** is extended and reusable:
   - TestRecipeFactory extended with 5-10 boundary-case recipes (100% ingredient + out-of-range time, 50% threshold + in-range time, etc.)
   - HTTP mocking set up for integration tests (MockRestServiceServer or equivalent)
   - Ranking and cache tests follow Spring Boot test patterns (direct instantiation, Mockito mocks)
   - N+1 test uses Mockito spy on theMealDBClient to count calls

3. **Manual verification** confirms:
   - All automated tests pass: `mvn test`
   - Phase 1 integration tests still pass (no regressions from Phase 2 changes)
   - Test data is realistic and covers boundary cases

---

## Key Discoveries

- **Ranking weights intentional**: 0.4 ingredient + 0.6 cook time is the current design (cook time prioritized for MVP). Tests protect this choice, not the test-plan expectation.
- **Score calculated but unused**: Service calculates score but sorts by cook time. This is a regression vector to protect, not a bug to fix in Phase 2.
- **Cache is solid**: No obvious bugs in TTL/quota/key logic. Tests validate edge cases for confidence.
- **N+1 fix correctly placed**: `.limit(20)` is before enrichment loop. Easy to regress if moved or removed — tests must catch this.
- **Test infrastructure ready**: TestRecipeFactory and MockMvc from Phase 1 are reusable; extend for boundary cases.

---

## What We're NOT Doing

- **Fixing the ranking bug** (score not used for sorting). Current behavior is intentional; Phase 2 tests protect it. Fixing this is a separate design decision, not Phase 2 scope.
- **Testing TheMealDB API exhaustively**. We mock their API with known success/error cases; trust their docs for the rest.
- **Testing localStorage exhaustively**. We test our cache logic (TTL, quota handling), not the browser API.
- **Load testing cache under extreme pressure**. We test quota-exceeded error recovery, not quota limits under production load.
- **Testing the sorting comparison operator exhaustively**. We test that results are ordered by cook time (ascending); flipped comparison is a regression to catch but not to exhaustively validate across all edge cases.

---

## Implementation Approach

**Three parallel test suites with clear dependencies:**

1. **Ranking unit tests** (RecipeSearchServiceTest extension) — Validate score calculation and sorting order. Uses TestRecipeFactory for mock recipes. Runs fast, isolated from HTTP.
2. **Cache unit tests** (new file: CacheTest.ts for frontend) — Validate TTL, quota-exceeded, and key collision. Mocks localStorage. Runs fast, isolated.
3. **N+1 integration test** (RecipeSearchControllerTest extension) — End-to-end validation of API call count. Uses Mockito spy on theMealDBClient. Requires ranking to work correctly (soft dependency).

**Key design decisions:**
- **Unit for ranking & cache**: Fast, deterministic, easy to debug. Score calculation and TTL logic don't require full HTTP stack.
- **Integration for N+1**: Need end-to-end visibility to count actual API calls. Spy on theMealDBClient at the component boundary.
- **Reuse TestRecipeFactory**: Avoid duplication; extend with 5-10 boundary recipes for ranking edge cases (100% ingredient + outside time range, 50% threshold + inside range, etc.).
- **Test current behavior, not future fixes**: Weights and sorting order are tested as-is; Phase 2 protects current design from regressions, not toward a different design.

---

## Phase 1: Ranking Unit Tests

### Overview

Create unit tests that validate the ranking algorithm's score calculation and sorting order. This phase extends TestRecipeFactory with ranking-specific recipes (boundary cases) and writes tests that catch weight inversions, missing score components, and sorting regressions.

### Changes Required:

#### 1. Extend TestRecipeFactory with Phase 2 Boundary-Case Recipes

**File**: `src/test/java/com/example/_x_recipes/test/TestRecipeFactory.java`

**Intent**: Add 5-10 recipes that test ranking edge cases: exact ingredient-overlap thresholds (50%), exact time boundaries, 100% ingredient match with out-of-range time, etc. These recipes are used by Phase 1 ranking tests and later by Phase 3 (API resilience).

**Contract**: Static factory methods returning Recipe objects with specific properties:
- `recipeWith100PercentIngredientOutOfTimeRange()` — all user ingredients, cook time > max (tests score calc with high ingredient overlap but low time score)
- `recipeWith50PercentIngredientAtTimeThreshold()` — exactly 50% ingredient match, cook time exactly at user's max (tests threshold boundary)
- `recipeWith75PercentIngredientInTimeRange()` — 3 of 4 ingredients, cook time in range (tests mid-spectrum)
- Others as needed per ranking tests (see Phase 1b for exact list)

#### 2. Ranking Unit Tests — RecipeSearchServiceTest Extension

**File**: `src/test/java/com/example/_x_recipes/service/RecipeSearchServiceTest.java`

**Intent**: Add tests that validate score calculation correctness and catch regressions in weights, sorting, and component logic. Tests use boundary-case recipes from Phase 1a to verify edge cases.

**Contract**: JUnit 5 test class with @Test methods:
- `testScoreCalculationWithKnownInputs()` — Assert score on [100% ingredient, 100% time] = 100, [0% ingredient, 0% time] = 0, [50% ingredient, 50% time] = 50. Catches weight inversion.
- `testScoreBothComponentsRequired()` — Score with ingredient=100, time=0 must be < score with ingredient=100, time=100. Catches if one component is dropped.
- `testSortingIsByCookTimeAscending()` — Results sorted by cook time ascending (shortest first), not by score. Validates current behavior.
- `testWeightInversionDetected()` — Swap weights to 0.6/0.4, verify results rank differently. Regression test.
- `testThresholdExactly50Percent()` — Recipe with exactly 50% ingredient overlap should be included. Catches threshold boundary bug.
- `testTimeRangeStrictBoundary()` — Recipe with cook time exactly at user's max should be included; one minute over should be excluded. Catches boundary comparison flips.

### Success Criteria:

#### Automated Verification:

- [ ] TestRecipeFactory extended with Phase 2 recipes: `mvn test -Dtest=TestRecipeFactory 2>&1 | grep -c "BUILD SUCCESS"`
- [ ] All ranking unit tests pass: `mvn test -Dtest=RecipeSearchServiceTest 2>&1 | grep "Tests run" | grep -q "failures=0"`
- [ ] No type errors in test file: `mvn clean compile`
- [ ] Tests cover weight inversion, sorting order, component presence, boundary cases (from test names above)

#### Manual Verification:

- [ ] Review test logic: each test asserts specific regression vector from research.md (§ Test Regression Vectors)
- [ ] Run locally: `mvn test -Dtest=RecipeSearchServiceTest` and verify all pass
- [ ] Spot-check one test with debugger to confirm assertions are binding (e.g., swap weights manually, run test, verify it fails)

---

## Phase 2: Cache Unit Tests

### Overview

Create unit tests that validate the cache lifecycle: TTL expiry, quota-exceeded error recovery, key collision prevention, and corrupted-entry handling. These tests are pure unit tests (no HTTP), mocking localStorage and Date.now().

### Changes Required:

#### 1. Cache Unit Tests — New Test File

**File**: `src/test/typescript/api/cache.test.ts` (frontend tests, runs via jest or vitest)

**Intent**: Add unit tests that validate cache.ts behavior in isolation. Mock localStorage and Date.now() to test TTL, quota errors, and key collision.

**Contract**: Test suite with 4-5 test cases:
- `testTTLExpiryAfter24Hours()` — Set entry at time T, advance Date.now() to T+24h+1s, assert getCached returns null and entry is removed
- `testQuotaExceededErrorHandling()` — Mock localStorage.setItem to throw DOMException(code 22), assert setCached doesn't crash, clears storage, retries successfully
- `testCacheKeyStability()` — Assert getCacheKey([chicken, rice], "30-60") === getCacheKey([rice, chicken], "30-60") (order-independent)
- `testCorruptedJSONRemoved()` — Set corrupted JSON in localStorage, assert getCached returns null and removes entry (doesn't throw)
- `testMultipleKeysIndependent()` — Set two keys, expire one, assert the other is still valid (namespace isolation)

### Success Criteria:

#### Automated Verification:

- [ ] All cache unit tests pass: `npm test -- cache.test.ts 2>&1 | grep "passed"`
- [ ] Coverage for cache.ts ≥ 90%: `npm test -- --coverage cache.test.ts`
- [ ] No type errors: `npx tsc --noEmit`
- [ ] All regression vectors tested (from research.md § Test Regression Vectors for R4)

#### Manual Verification:

- [ ] Review test names and assertions — each maps to a regression vector
- [ ] Run locally: `npm test -- cache.test.ts` and verify all pass
- [ ] Spot-check one test (e.g., manually corrupt a cache entry, run test, verify it handles gracefully)

---

## Phase 3: N+1 Integration Test

### Overview

Create an integration test that validates the N+1 fix: call count must be ≤21 (1 getAllRecipes + ≤20 fetchRecipeDetails). This test uses Mockito spy on theMealDBClient to count actual API calls during a search request.

### Changes Required:

#### 1. N+1 Integration Test — RecipeSearchControllerTest Extension

**File**: `src/test/java/com/example/_x_recipes/controller/RecipeSearchControllerTest.java`

**Intent**: Add integration test that verifies the N+1 limit. Uses Mockito spy to count fetchRecipeDetails calls; creates 50+ candidate recipes (to force the limit to matter) and asserts enrichment is called ≤20 times.

**Contract**: MockMvc test with Mockito spy:
- Set up test with 50+ recipes in mock getAllRecipes response (using TestRecipeFactory)
- Mock theMealDBClient using @SpyBean or spy(theMealDBClient)
- Call POST /api/recipes/search with valid input (e.g., [chicken, rice], "30-60")
- Count invocations: `Mockito.verify(theMealDBClient, Mockito.times(callCount)).fetchRecipeDetails(anyString())`
- Assert callCount ≤ 20
- Assert total calls (getAllRecipes + enrichment) ≤ 21

**Test case**: `testN+1LimitEnforcedWithLargeCandidateSet()` — 50 candidates, assert ≤20 enrichment calls.

### Success Criteria:

#### Automated Verification:

- [ ] N+1 integration test passes: `mvn test -Dtest=RecipeSearchControllerTest 2>&1 | grep "testN+1LimitEnforcedWithLargeCandidateSet" | grep -q "PASSED"`
- [ ] Spy correctly counts calls: `mvn test -Dtest=RecipeSearchControllerTest -X 2>&1 | grep -i "verify.*times.*fetchRecipeDetails"`
- [ ] Test fails if limit is removed (manual check): comment out `.limit(20)` in RecipeController, run test, verify it fails with "expected ≤20, got >20"
- [ ] Phase 1 integration tests still pass (no regressions from Phase 2): `mvn test -Dtest=RecipeSearchControllerTest 2>&1 | grep "Tests run" | grep -q "failures=0"`

#### Manual Verification:

- [ ] Review test setup: 50+ candidates, spy configuration, call count assertion
- [ ] Run locally: `mvn test -Dtest=RecipeSearchControllerTest` and verify test passes
- [ ] Temporarily move `.limit(20)` to after enrichment loop (lines 75–96 in RecipeController), run test, verify it fails with correct error message
- [ ] Restore code and rerun to confirm test passes again

---

## Testing Strategy

### Unit Tests (Ranking & Cache):

- **Ranking**: 5-6 tests covering score formula, weights, sorting order, thresholds, boundaries. Fast, deterministic.
- **Cache**: 4-5 tests covering TTL, quota-exceeded, key stability, corruption, namespace isolation. Fast, mocked storage.
- **Goal**: Catch regressions in algorithms and core logic. No HTTP or I/O.

### Integration Test (N+1):

- **Setup**: 50+ candidate recipes, Mockito spy on theMealDBClient
- **Execution**: POST /search with valid input
- **Assertion**: fetchRecipeDetails called ≤20 times
- **Goal**: Validate end-to-end orchestration and call-count limit. Catches if limit moves or is removed.

### Manual Testing:

1. **Verify test data** — TestRecipeFactory recipes reflect realistic overlaps and time ranges
2. **Verify regressions fail**: Comment out key code (weights, limit, TTL check), run tests, confirm they fail with clear messages
3. **Verify Phase 1 not broken**: Run all Phase 1 integration tests, confirm no regressions introduced by Phase 2 changes

---

## Performance Considerations

- **Ranking unit tests**: Instant (no HTTP, small dataset)
- **Cache unit tests**: Instant (mocked storage, mocked Date)
- **N+1 integration test**: < 1 second (mocked HTTP, 50 recipes, single request)
- **Total test suite time for Phase 2**: < 5 seconds (all tests combined)

---

## References

- Research: `context/changes/testing-ranking-caching/research.md`
- Phase 1 plan: `context/archive/2026-08-28-testing-critical-path-search/plan.md`
- Ranking source: `src/main/java/com/example/_x_recipes/service/RecipeSearchService.java:10–152`
- Cache source: `src/api/cache.ts:1–65`
- Controller source: `src/main/java/com/example/_x_recipes/controller/RecipeController.java:32–121`

---

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Ranking Unit Tests

#### Automated

- [x] 1.1 TestRecipeFactory extended with Phase 2 boundary-case recipes — 1dddfc8
- [x] 1.2 Ranking unit tests added (score calc, sorting, weights, thresholds) — 1dddfc8
- [x] 1.3 All ranking tests pass: `mvn test -Dtest=RecipeSearchServiceTest` — 1dddfc8

#### Manual

- [x] 1.4 Review test assertions — each maps to a regression vector from research.md — 1dddfc8
- [x] 1.5 Spot-check one test with debugger (swap weights, verify test fails) — 1dddfc8
- [x] 1.6 Phase 1 integration tests still pass (no regressions) — 1dddfc8

### Phase 2: Cache Unit Tests

#### Automated

- [x] 2.1 Cache unit tests added (TTL, quota-exceeded, key collision, corruption) — 706a955
- [x] 2.2 All cache tests pass: `npm test -- cache.test.ts` — 706a955
- [x] 2.3 Coverage ≥ 90% for cache.ts — 706a955

#### Manual

- [x] 2.4 Review test names and assertions — 706a955
- [x] 2.5 Spot-check one test manually (corrupt cache entry, verify handling) — 706a955

### Phase 3: N+1 Integration Test

#### Automated

- [ ] 3.1 N+1 integration test added (50+ candidates, spy on fetchRecipeDetails)
- [ ] 3.2 Test passes: `mvn test -Dtest=RecipeSearchControllerTest`
- [ ] 3.3 Test fails when limit is removed (manual regression check)

#### Manual

- [ ] 3.4 Review test setup (spy configuration, call count assertion)
- [ ] 3.5 Temporarily move `.limit(20)` to after enrichment loop, run test, verify failure with clear message
- [ ] 3.6 Restore code, rerun test, confirm pass
