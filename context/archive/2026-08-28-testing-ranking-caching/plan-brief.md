# Phase 2: Ranking & Caching Tests — Plan Brief

> Full plan: `context/changes/testing-ranking-caching/plan.md`  
> Research: `context/changes/testing-ranking-caching/research.md`

## What & Why

Phase 2 delivers unit and integration tests that protect three critical fragile areas: the ranking algorithm (R3), cache lifecycle (R4), and N+1 API call pattern (R6). These tests validate the current system behavior against regressions, not toward fixing bugs. Research found one critical issue: the ranking service calculates a score but sorts by cook time instead — this is intentional for the MVP (cook time is prioritized), and Phase 2 protects this design from accidental changes.

## Starting Point

Phase 1 completed integration tests for the critical-path search (R1 + R2), bootstrapped TestRecipeFactory with 20+ mock recipes, and established Spring Boot test infrastructure (MockMvc, JUnit 5, Mockito). Phase 2 builds on this foundation with focused unit tests for ranking and cache, plus an integration test to validate the N+1 call limit.

Current state: Ranking algorithm works but has a regression vector (sorting by time, not score); cache is solid with no obvious bugs; N+1 limit is correctly placed but easy to regress.

## Desired End State

When this phase completes:
- **Ranking protected**: Unit tests assert score calculation (both ingredient + time components, correct weights 0.4/0.6), sorting order (by cook time, not score), and catch weight inversions, missing components, and threshold boundary flips.
- **Cache validated**: Unit tests assert TTL expiry (24h+1s → null), quota-exceeded error recovery (clear + retry), cache key collision prevention, and corrupted-entry handling.
- **N+1 defended**: Integration test counts actual API calls (≤20 enrichment calls per search) and fails if the limit moves or is removed.
- **Test infrastructure extended**: TestRecipeFactory has 5–10 boundary-case recipes; HTTP mocking is set up for integration tests.

## Key Decisions Made

| Decision | Choice | Why | Source |
|---|---|---|---|
| **Test layers** | Unit for ranking, unit for cache, integration for N+1 | Cheapest signal per risk: algorithms are deterministic unit tests; API call count requires end-to-end visibility. | Plan |
| **Ranking bug handling** | Test current behavior (score calculated, sorted by time) | Current weights + sorting are intentional for MVP (cook time is real priority). Phase 2 protects this design from regressions, not toward a future fix. | Research + Plan |
| **Ranking weights** | Assert 0.4 ingredient, 0.6 cook time (current values) | Tests validate current design choice, not test-plan expectation (0.6/0.4). Prevents accidental reversion. | Research + Plan |
| **Cache scope** | Core cases + stability: TTL, quota-exceeded, key collision, corruption | Balances fast feedback with confidence. Omit LRU simulation and concurrency testing (rely on implementation correctness). | Plan |
| **N+1 measurement** | Mockito spy on fetchRecipeDetails call count | Direct measurement of the regression vector; catches if limit moves or is removed. | Plan |
| **Test data** | Reuse TestRecipeFactory + extend with 5–10 boundary recipes | Avoids duplication, establishes shared fixture for Phase 3; boundary recipes test edge cases (100% ingredient + out-of-range time, 50% threshold exactly, etc.). | Plan |

## Scope

**In scope:**
- Unit tests for ranking algorithm (score calculation, sorting order, weight/component/threshold regressions)
- Unit tests for cache lifecycle (TTL expiry, quota-exceeded recovery, key collision, corruption)
- Integration test for N+1 call limit (≤20 enrichment calls)
- TestRecipeFactory extension with boundary-case recipes
- HTTP mocking setup for integration tests

**Out of scope:**
- Fixing the ranking sorting bug (score not used) — intentional MVP design
- Testing TheMealDB API exhaustively (mock with known cases only)
- Testing localStorage spec exhaustively (test our cache logic, trust browser API)
- Load testing cache under extreme quota pressure
- LRU eviction simulation (rely on localStorage FIFO behavior)

## Architecture / Approach

**Three parallel test suites with clear data flow:**

1. **Ranking unit tests** — Validate RecipeSearchService.java score formula and sorting order using TestRecipeFactory mock recipes. No HTTP. Catches weight inversions, missing components, sorting flips, threshold boundary bugs.
2. **Cache unit tests** — Validate cache.ts TTL, quota-exceeded, and key logic by mocking localStorage and Date.now(). No HTTP. Catches TTL leaks, quota crashes, key collisions, corruption.
3. **N+1 integration test** — Validate RecipeController orchestration by spying on theMealDBClient.fetchRecipeDetails call count during full POST /search request. Mocked HTTP. Catches if limit moves, is removed, or loop is reordered.

**Key insight**: Ranking and cache tests are independent unit tests (fast feedback); N+1 test is integration that depends on ranking working (soft dependency). All three use TestRecipeFactory mock data.

## Phases at a Glance

| Phase | What it delivers | Key risk |
|---|---|---|
| 1. Ranking Unit Tests | 5-6 tests validating score calculation, sorting order, weight/component regressions | Tests must assert current (sorted-by-time) behavior, not corrected behavior — risk of testing future design instead of current design |
| 2. Cache Unit Tests | 4-5 tests validating TTL, quota-exceeded recovery, key collision, corruption | Tests must mock Date.now() correctly to test 24h boundary; risk of flaky time-based tests if implementation changes |
| 3. N+1 Integration Test | 1 test validating call count ≤20 with 50+ candidate recipes | Spy setup must be correct; risk of brittle assertion if internal call patterns change (but that's the regression we want to catch) |

**Prerequisites:** Phase 1 test infrastructure (TestRecipeFactory, MockMvc, Mockito) from testing-critical-path-search is already in place.

**Estimated effort:** ~2-3 sessions across 3 phases (1-2 hours per phase for experienced test writers; new team members may take longer on Phase 3 spy setup).

## Open Risks & Assumptions

- **Assumption**: Ranking weights 0.4/0.6 and sorted-by-time behavior are intentional for MVP. If this changes post-Phase 2, tests will need to be updated. (Mitigation: document intent in test comments.)
- **Assumption**: Cache implementation is correct. Phase 2 tests edge cases but don't exhaustively validate localStorage spec. (Mitigation: trust browser API; focus tests on our wrapper logic.)
- **Assumption**: N+1 limit value is stable at 20. If this changes for performance reasons, the test assertion needs to update. (Mitigation: document in code why limit=20 is chosen.)
- **Assumption**: TestRecipeFactory can be extended without breaking Phase 1 tests. (Mitigation: run full Phase 1 test suite after extensions to verify backward compatibility.)

## Success Criteria (Summary)

- All ranking, cache, and N+1 tests pass: `mvn test` (backend), `npm test` (frontend)
- Spot-check: temporarily comment out ranking weight, run tests, verify they fail with correct message
- Spot-check: temporarily move `.limit(20)` in RecipeController, run N+1 test, verify it fails
- Phase 1 integration tests still pass (no regressions from Phase 2 changes)
