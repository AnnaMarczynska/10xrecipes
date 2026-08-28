---
date: 2026-08-28T00:00:00Z
researcher: Claude
git_commit: a32c80a78dc9c890c5f9b9b0d4cf2af4797f6d14
branch: main
repository: 10xrecipes
topic: Phase 2 research — ranking algorithm, cache implementation, N+1 call pattern, test infrastructure
tags: [research, ranking, cache, performance, phase-2]
status: complete
last_updated: 2026-08-28
last_updated_by: Claude
---

# Research: Phase 2 Testing (Ranking & Caching)

**Date**: 2026-08-28  
**Researcher**: Claude  
**Git Commit**: a32c80a78dc9c890c5f9b9b0d4cf2af4797f6d14  
**Branch**: main  
**Repository**: 10xrecipes

---

## Research Question

What are the current implementations of the ranking algorithm (R3), cache lifecycle (R4), and N+1 call pattern (R6) in the codebase? What test opportunities and regression vectors exist?

---

## Summary

Phase 2 protects three critical fragile areas: the ranking algorithm (which has **inverted weights and a score-not-used bug**), cache TTL/LRU/quota handling (which is **solid**), and the N+1 call fix (which is **correctly placed but easily regressed**). The test infrastructure from Phase 1 is ready; Phase 2 must focus on:

1. **R3 (Ranking)**: Unit tests that catch weight inversions, missing components, and the score/sorting mismatch
2. **R4 (Cache)**: Unit tests for TTL expiry, LRU eviction simulation, and quota-exceeded error recovery
3. **R6 (N+1)**: Integration test that counts actual API calls and verifies the limit is enforced

---

## Detailed Findings

### Component 1: Ranking Algorithm (R3)

#### Implementation Location
`src/main/java/com/example/_x_recipes/service/RecipeSearchService.java:10–152`

#### Current Weights
```java
private static final double INGREDIENT_WEIGHT = 0.4;  // Line 14
private static final double COOK_TIME_WEIGHT = 0.6;   // Line 15
```

**Critical Finding**: Weights are **inverted** from test plan expectation.
- Test plan states: 0.6 ingredient, 0.4 cook time
- Code has: 0.4 ingredient, 0.6 cook time
- Code comments suggest intentional change: "Reduced from 0.6" (ingredient) and "Increased from 0.4" (cook time)
- **This is a confirmed regression vector** — if someone inverts weights back to 0.6/0.4, tests must catch it

#### Scoring Formula
```java
double score = (matchPercentage * INGREDIENT_WEIGHT) + (cookTimeScore * COOK_TIME_WEIGHT);
```
(Line 72)

**Formula is correct**, but score is **not used for ranking**.

#### **CRITICAL BUG FOUND**: Score Calculated but Not Used for Sorting

Lines 32–38 sort by cook time ascending, **NOT** by score:
```java
.sorted((a, b) -> {
    // Sort by cook time ascending (shortest first)
    if (a.getCookTime() != null && b.getCookTime() != null) {
        return a.getCookTime().compareTo(b.getCookTime());
    }
    return 0;
})
```

**Impact**: 
- Service calculates `score` (line 72) 
- Returns `RecipeResult` with score (lines 78–86)
- But **ignores the score when sorting** (lines 32–38)
- Results are sorted by cook time, not by the (ingredient + time) score
- This breaks the ranking contract and explains Phase 1 unit tests' observation that ranking wasn't working as expected

**Regression vector**: If someone sorts by score instead of time (or vice versa), tests must catch it.

#### Supporting Data

**Ingredient overlap calculation** (lines 52–62):
- Uses substring matching: `.contains(userIngredient.toLowerCase())`
- False-positive risk: "salt" would match substring "alt" in "malted"
- **Not a regression vector** (current behavior is intentional), but worth noting

**Cook time scoring** (lines 116–151):
- Returns 100 if within range
- Returns scaled penalty (50 - diff × 5) if outside range
- Capped at 0 (no negative scores)
- Math is correct and deterministic

**Minimum match threshold** (line 13):
```java
private static final int MIN_MATCH_PERCENTAGE = 50;
```
- Enforced in two places: lines 30, 64
- Matches test plan expectation

**Result limit** (line 39):
```java
.limit(10)
```
- **Discrepancy**: Service limits to 10 results
- But controller passes up to 20 candidates to service (see R6 below)
- Test plan expected service to return top N (20 candidates → 10 results is fine)

#### Test Regression Vectors to Protect

| Vector | Current | Wrong | Detection |
|--------|---------|-------|-----------|
| Weight inversion | 0.4 ingredient, 0.6 time | 0.6 ingredient, 0.4 time | Unit test: assert score on known inputs |
| Missing component | Both ingredients + time in score | Only one component | Unit test: assert score when one is 0 |
| Score/sorting mismatch | Sorted by time, score calculated | Sorted by score | Integration test: assert result order matches input profile |
| Threshold dropped | Enforced 50% min | No threshold | Integration test: assert low-overlap recipes excluded |
| Sorting comparison flipped | `<` in ascending | `>` in descending | Unit test: assert order is monotonic |

---

### Component 2: Cache Implementation (R4)

#### Implementation Location
`src/api/cache.ts:1–65`

#### Cache Architecture
```typescript
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
```

#### TTL Implementation (lines 8–28)
```typescript
export function getCached<T>(key: string): T | null {
  const cached: CacheEntry<T> = JSON.parse(entry);
  const now = Date.now();
  if (now - cached.timestamp > CACHE_TTL) {
    localStorage.removeItem(key);
    return null;  // Expired
  }
  return cached.data;
}
```

**Status**: ✓ Correct TTL enforcement. Returns null if > 24 hours old. On retrieval, expired entries are removed.

#### Quota-Exceeded Error Handling (lines 30–50)
```typescript
export function setCached<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (error) {
    if (error instanceof DOMException && error.code === 22) {
      localStorage.clear();
      try {
        localStorage.setItem(key, JSON.stringify({data, timestamp: Date.now()}));
      } catch (retryError) {
        console.error('Failed to cache after clearing storage:', retryError);
      }
    }
  }
}
```

**Status**: ✓ Quota-exceeded (error code 22) triggers:
1. Clear all storage
2. Retry the write once
3. Log error if retry fails

**No crash** — exception caught and handled gracefully.

#### Cache Key Stability (lines 60–64)
```typescript
export function getCacheKey(ingredients: string[], timeRange: string): string {
  const sorted = [...ingredients].sort().join(',');
  return `recipe_search_${sorted}_${timeRange}`;
}
```

**Status**: ✓ Deterministic. Sorts ingredients before creating key, so `[chicken, rice]` and `[rice, chicken]` return same key.

#### Frontend Cache Usage (src/api/recipeClient.ts:24–52)
```typescript
const cached = getCached<SearchResult>(cacheKey);
if (cached) return cached;
// ... fetch ...
setCached(cacheKey, data);
```

**Status**: ✓ Implemented correctly. Checks cache before fetch, stores after successful fetch. Cache is used for:
- `searchRecipes()` (search results)
- `getRecipeDetails()` (recipe detail pages)
- `getIngredients()` (ingredient list)

#### Test Regression Vectors to Protect

| Vector | Current | Wrong | Detection |
|--------|---------|-------|-----------|
| TTL exceeded | 24h + 1s → null | 24h + 1s → cached | Unit test: mock Date, advance 24h+1s, assert null |
| Corrupted entry | JSON.parse fails → remove + return null | Corrupted entry returned | Unit test: setCached malformed JSON, assert getCached null |
| Quota not cleared | Error 22 → clear + retry | Error 22 → throw/crash | Unit test: simulate quota error, assert no crash + retry works |
| Wrong quota code | Error 22 detected | Error 11 not detected | Unit test: mock different DOMException codes |
| Cache key collision | Sorted ingredients | Unsorted ingredients | Unit test: assert [a, b] and [b, a] have same key |

---

### Component 3: N+1 Call Pattern (R6)

#### Backend Orchestration (RecipeController.java)

**Candidate selection** (lines 55–71):
```java
List<Recipe> candidateRecipes = allRecipes.stream()
    .filter(recipe -> {
        // Quick filter: must have >= 50% ingredient match
        // ...
    })
    .limit(20)
    .collect(Collectors.toList());
```

**Status**: ✓ Limit(20) is **before** enrichment loop.

**Enrichment loop** (lines 75–96):
```java
for (Recipe recipe : candidateRecipes) {
    Recipe fullRecipe = theMealDBClient.fetchRecipeDetails(recipe.getId());
    // ... process ...
}
```

**Status**: ✓ Correctly loops over ≤20 candidates, calling `fetchRecipeDetails()` per candidate.

**Total API calls per search request**:
1. `getAllRecipes()` → 1 call (fetches all recipes from TheMealDB)
2. Enrichment loop → ≤20 calls (one per candidate)
3. **Total: ≤21 calls**

**Historical context** (from Phase 1 plan, line 203):
> "Phase 3 fix: .limit(20) on candidate recipes before enrichment loop"

This limit was added to prevent N+1 explosion. Without it, if `getAllRecipes()` returned 300 recipes and all passed the quick filter, enrichment would make 300 calls.

#### Regression Vectors to Protect

| Vector | Current | Wrong | Detection |
|--------|---------|-------|-----------|
| Limit removed | `.limit(20)` present | Limit deleted or moved | Integration test: spy API calls, assert ≤20 enrichment calls |
| Limit moved after loop | Before enrichment | After enrichment (inside loop) | Integration test: trace call count, assert ≤20 |
| Loop nested incorrectly | Sequential loop | Nested inside another loop | Integration test: mock 50 candidates, assert ≤50 calls not 50×N |
| Async not awaited | Sequential `fetchRecipeDetails` | Parallel (if changed) | Integration test: timing or call-count verification |

---

## Code References

### Ranking Algorithm
- `src/main/java/com/example/_x_recipes/service/RecipeSearchService.java:10–152` — Main service
  - Line 14: `INGREDIENT_WEIGHT = 0.4`
  - Line 15: `COOK_TIME_WEIGHT = 0.6`
  - Line 72: Score formula
  - Lines 32–38: Sorting (by time, not score)

### Cache
- `src/api/cache.ts:1–65` — Cache utility
  - Line 6: `CACHE_TTL = 24 * 60 * 60 * 1000`
  - Lines 8–28: TTL check
  - Lines 30–50: Quota-exceeded handler
  - Lines 60–64: Cache key generation
- `src/api/recipeClient.ts:24–52` — Frontend usage

### N+1 Pattern
- `src/main/java/com/example/_x_recipes/controller/RecipeController.java:32–121`
  - Lines 55–71: Candidate filtering + limit(20)
  - Lines 75–96: Enrichment loop

### Existing Tests
- `src/test/java/com/example/_x_recipes/service/RecipeSearchServiceTest.java:14–107` — Unit tests (5 test cases)
  - Line 57: Asserts score order but doesn't verify by score
  - No integration tests for /search endpoint
- `context/archive/2026-08-28-testing-critical-path-search/plan.md:1–` — Phase 1 test plan
  - Documents TestRecipeFactory and integration test bootstrap

---

## Architecture Insights

### Test Infrastructure (from Phase 1)
- **TestRecipeFactory**: Centralized mock recipe factory (20+ recipes)
  - Used in Phase 1b integration tests
  - Reusable for Phase 2 (ranking, cache, N+1)
  - Located: `src/test/java/com/example/_x_recipes/test/TestRecipeFactory.java`

- **Test framework**: Spring Boot Test (JUnit 5, Mockito, MockMvc)
  - In-place since Phase 1
  - Ready for Phase 2 unit + integration tests

- **Test patterns**:
  - Unit tests: Direct service instantiation, no mocks (RecipeSearchServiceTest.java)
  - Integration tests: MockMvc for endpoint testing (Phase 1b created foundation)

### Risk Assessment

**R3 (Ranking) — HIGH RISK**
- Weights inverted from expected
- Score calculated but not used for sorting (bug)
- Existing tests don't catch this (assert score order but don't verify by score)
- Easy regression: weight swap, sorting change, missing component

**R4 (Cache) — LOW RISK**
- Implementation is solid
- Quota handling is correct
- TTL enforcement is clear
- No obvious regressions possible without intentional breaking changes

**R6 (N+1) — MEDIUM RISK**
- Limit is correctly placed
- Easy to regress: move limit after loop, remove limit, nest loop
- Requires call-count assertions to catch

---

## Historical Context (from Prior Changes)

**Phase 1 (completed 2026-08-28)**:
- `context/archive/2026-08-28-testing-critical-path-search/plan.md` — Critical-path search tests
  - Bootstrap TestRecipeFactory with 20+ mock recipes
  - Integrated tests for /search endpoint
  - Validated R1 + R2 (search returns results, results match constraints)
  - Established test infrastructure for Phase 2 + 3

**Implicit Phase 3 reference** (from code comments):
- Phase 3 fix added `.limit(20)` before enrichment loop (URL encoding on mealId, timeout handling, error safety)

---

## Related Research

- `context/foundation/test-plan.md` — Master test plan with risk map and rollout phases
- `context/archive/2026-08-28-testing-critical-path-search/plan.md` — Phase 1 detailed plan and implementation notes

---

## Open Questions & Recommendations

### For Phase 2 Planning

1. **Ranking sort order expectation**:
   - Current code sorts by cook time ascending (shortest first)
   - Score is calculated but unused
   - **Question**: Is this intentional (cook time is the actual tie-breaker), or is it a bug?
   - **Recommendation**: Phase 2 research should clarify: if weight swap to 0.6/0.4 is the "correct" intent, does sorting change too?

2. **Result limit mismatch**:
   - Service limits to 10 results
   - Controller passes up to 20 candidates
   - **Question**: Should service return top 10 from 20, or should limit be configurable?
   - **Recommendation**: Verify test expectation: does Phase 2 assert final result set is ≤10 or ≤20?

3. **Frontend cache key collision**:
   - Three different cache keys: `recipe_search_*`, `recipe_detail_*`, `ingredients_list`
   - **Question**: Are these namespaces sufficient, or should we add more structure (e.g., version prefix)?
   - **Recommendation**: Phase 2 cache tests should include multi-key scenarios to avoid future collisions

### For Phase 2 Test Planning

**Ranking (R3)**:
- Unit test: score calculation on known inputs (100% ingredient + 100% time → score 100, etc.)
- Unit test: weight swap detection (swap 0.4/0.6, assert different score)
- Integration test: assert results rank correctly per formula

**Cache (R4)**:
- Unit test: TTL expiry (mock Date.now(), advance 24h+1s)
- Unit test: LRU simulation (fill cache near-quota, add entry, assert oldest removed)
- Unit test: quota error recovery (simulate error code 22, assert clear + retry succeeds)
- Unit test: cache key stability ([a, b] and [b, a] have same key)

**N+1 (R6)**:
- Integration test: spy on `fetchRecipeDetails()` call count
- Integration test: pass 50 candidates, assert ≤20 enrichment calls (not 50)
- Integration test: verify limit placement doesn't regress (move after loop should fail)

---

## Next Steps

When `/10x-plan` is invoked for Phase 2:
1. Use the regression vectors identified here as test acceptance criteria
2. Prioritize unit tests for ranking (high-risk) and cache (to validate solid implementation)
3. Design N+1 call-count assertions that are resilient but catch the regression
4. Reuse TestRecipeFactory from Phase 1; extend if needed for boundary scenarios
