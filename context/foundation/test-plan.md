---
project: 10xRecipes
version: 1
status: active
created: 2026-08-28
updated: 2026-08-28
prd_version: 1
roadmap_version: 1
north_star: S-01 (guest-search MVP complete; testing validates hypothesis remains true)
test_base_profile: none (no meaningful suite; phase 1 will bootstrap)
---

# Test Plan: 10xRecipes

> **Purpose:** Protect the guest-search MVP hypothesis and guard critical-path features as S-02 (auth), S-03 (favorites), and S-04 (allergens) ship. This plan is a phased rollout orchestrated via `/10x-test-plan`. Each phase opens a change folder and lands via the research → plan → implement chain.
>
> **Derived from:** `context/foundation/prd.md` (v1), `context/foundation/roadmap.md` (v1), Phase 1 hot-spot scan, Phase 2 user interview (2026-08-28).

---

## §1 Strategy

Three principles guide every test in this rollout:

1. **Cost × signal.** Every test — classic or AI-native — must answer one question: *what is the cheapest test that gives a real signal for this risk?* Do not promote to e2e because it "feels safer"; do not layer a vision model on top of a deterministic diff that already catches the regression. Each phase will pick the layer where the signal is best and the cost is lowest.

2. **User concerns are evidence.** Risks the team has lived through (Q2: "filtering broke silently"; Q3: "ranking feels like roulette") carry the same weight as PRD lines or hot-spot churn. The interview surfaced the top fragile areas; tests protect those first.

3. **Risks are scenarios, not code locations.** This plan cites evidence (interview Q#, PRD line, hot-spot directory, implementation history) for each risk, never specific files or functions. The call graph, failure path, and exact error translation belong to `/10x-research` output, produced during each rollout phase. The plan is a QA spec author and challenger, not a code auditor.

---

## §2 Risk Map

Top 6 risks, ranked by impact × likelihood. Each row is a failure scenario the test rollout will protect against.

### Risk Response Guidance

For each risk, the table below describes what would prove protection, the assumption to challenge, the context `/10x-research` must ground, the likely cheapest test layer, and the anti-pattern to avoid.

| Risk # | Risk scenario | Impact | Likelihood | Sources | What would prove protection | Must challenge | Context needed | Likely cheapest layer | Anti-pattern to avoid |
|---|---|---|---|---|---|---|---|---|---|
| **R1** | Empty search results when valid recipes exist | 🔴 HIGH | 🟡 MEDIUM | Q1 (user fear: "search returns empty"), RecipeSearchService hot-spot (152L churn), core hypothesis validation | Search endpoint returns ≥1 recipe when user provides valid ingredients + time; results are repeatable and ingredient-matched | "Empty results means no recipes exist in the DB" (false — algorithm might be filtering incorrectly, or ranking is inverted). | Entry point: POST /api/recipes/search (inputs: ingredients array, timeRange string). Algorithm: ingredient_overlap% × 0.6 + cook_time_fit% × 0.4. Filtering: strict time-range bounds (only recipes within [min, max]). Sorting: ascending by cook time. | Integration test: mock TheMealDB with known recipe set, call search endpoint, assert results match inputs. Don't need e2e browser. | Implementation mirror (assert current output, not business logic). Happy-path only (test [chicken, rice, 30min], not edge cases like [impossible ingredient, 0min]). Over-mocking (mock RecipeSearchService instead of testing the real ranking). |
| **R2** | Recipe doesn't match user's ingredients or time constraints | 🔴 HIGH | 🟡 MEDIUM | Q1, Q2 (burnt: "filtering broke silently"), Q3 (roulette: "ranking feels risky"), implementation review (phase 3: time-range filtering initially broken, re-ranking added); hot-spot: RecipeController (236L orchestrates search); alt ranking-weights finding (user intentional, but fragile) | Results strictly respect user constraints: all recipes ≤ user's max time, all recipes contain ≥N% of user's ingredients (ingredient_overlap% in the algorithm) | "I tested manually and it worked" (not repeatable; doesn't catch regressions). "If the unit tests pass, integration works" (algorithm can pass unit tests with wrong weights). | Algorithm weights: 0.6 ingredient, 0.4 cook time. Boundary: recipe cook time must be ≤ user's timeRange[max]; ingredient overlap must meet threshold. Regression vector: weight inversion, filtering removed, boundary comparison flipped (< instead of ≤). | Integration: test with boundary-condition recipes (cook time = user max, ingredient overlap = threshold); assert included. Test with out-of-range recipes; assert excluded. | Weights copied from current code as "expected" (oracle problem — masks bugs). Only testing recipes that obviously fit (no boundary cases). Missing the threshold logic or sorting order. |
| **R3** | Ranking algorithm silently inverts weights or corrupts | 🔴 HIGH | 🟡 MEDIUM | Q2 (past incident: "filtering broke"), Q3 (confidence gap: "every tweak feels like roulette"), RecipeController + RecipeSearchService hot-spots, implementation history: alternative weight hypothesis F1 (user rejected, but shows algorithm is fragile) | Score calculation is deterministic and monotonic: higher ingredient overlap → higher score; lower cook time → higher score. Swapping weights produces visibly different ranking (old: 0.6 ingredient + 0.4 time; new: 0.4 ingredient + 0.6 time should rank differently on the same data). | "The code looks right" (code review catches style, not logic bugs). "If search returns results, ranking is correct" (results can exist and still be ranked wrong). | Score formula: score = (ingredient_overlap% × 0.6) + (cook_time_fit% × 0.4). Regression vectors: weights swapped, ingredients or time component dropped, math operator flipped (multiply vs. add). Existing tests: none (test-base profile = none). | Unit: test score calculation on known inputs ([100% ingredient, 100% time → score=100], [0% ingredient, 0% time → score=0], [50% ingredient, 50% time → score=50]). Feed multiple recipes, assert ranking order is correct. | Assertion copied from production code (oracle problem). Only testing recipes that rank the same under both weight orders (misses the regression). Not testing the full spectrum of ingredient/time overlaps. |
| **R4** | Cache returns stale data or crashes on quota-exceeded (localStorage TTL or LRU eviction fails) | 🟡 MEDIUM | 🟡 MEDIUM | Implementation history: phase 3 fix (cache quota-exceeded handler added, LRU eviction wired); hot-spot: cache.ts (64L); interview Q5 (skip heavy UI testing, focus on core features like caching) | Cache respects 24-hour TTL; cache entries on second call return the same value as first call (not stale). On quota-exceeded error, clear storage and retry (no crash, returns results). | "If localStorage.setItem doesn't throw, it succeeded" (quota-exceeded is a silent error without try-catch). "My test passed locally, so cache works" (quota is device/browser-dependent). | TTL: 24 hours; source: localStorage browser API. Eviction: LRU when quota exceeded. Error case: DOMException code 22 (quota exceeded) triggers localStorage.clear(), then one retry. getCacheKey(ingredients, timeRange) returns stable key. | Unit: test TTL expiry (mock Date.now(), advance 24h+1s, assert cached entry returns null). Test LRU: fill cache to near-quota, add one more entry, assert oldest is evicted. Integration: simulate quota-exceeded error on setCached, verify clear + retry succeeds. | Mocking Date.now() (breaks system clock dependency; real TTL tests need actual delays). Not testing the quota error path (only happy-path). Snapshot of cache value (oracle problem). Asserting exact eviction order (brittleness — order can vary). |
| **R5** | API timeout or parsing error crashes search (TheMealDBClient edge cases) | 🟡 MEDIUM | 🟡 MEDIUM | Hot-spot: TheMealDBClient (111L); phase 3 fixes: 5-second timeout, URLEncoder.encode(mealId); edge cases: invalid recipe ID, slow network, TheMealDB offline | TheMealDB calls timeout cleanly after 5 seconds (no hang). Invalid mealId is URL-encoded before use (no injection). HTTP errors (404, 503) and parsing errors (malformed JSON) return user-friendly error (no stack trace or API key leaked). | "The API works, so our wrapper is fine" (wrapper has its own bugs: incorrect timeout, secrets in errors, encoding missing). "Testing with the real TheMealDB is safer than mocking" (brittle, flaky, consumes quota). | Timeout: Duration.ofSeconds(5) in HttpRequest builder. mealId encoding: URLEncoder.encode(mealId, StandardCharsets.UTF_8). Error cases: HttpTimeoutException, 404 (recipe not found), parsing failure (JSON invalid). Secrets: API base URL is in code; no secrets in error messages. | Integration: mock slow HTTP (sleep 6s), verify timeout exception caught cleanly. Mock 404 response, verify error message is safe (no URL, no raw response body). Mock invalid JSON, verify parsing error caught. Don't e2e the real API. | Using the real TheMealDB in tests (flaky, quota-consuming, not repeatable). Asserting exact error message text (too tightly coupled; brittle on message changes). Missing the timeout case or only testing success. Logging the full HTTP response (secrets leak risk). |
| **R6** | N+1 API calls regress after phase 3 fix (performance degradation on search) | 🟡 MEDIUM | 🟠 LOW | Phase 3 fix: .limit(20) on candidate recipes before enrichment loop; hot-spot: RecipeController (orchestrates search); implementation history: regression risk if limit removed or loop re-ordered | Search on candidate set ≤ 20 doesn't trigger > 20 sequential enrichment calls to fetchRecipeDetails. Call count is deterministic: getAllRecipes() (1 call) + limit(20) + enrichment loop (≤20 calls) = ≤21 calls total. | "We optimized this once, so it stays fast" (regressions happen; next developer may remove the limit or loop differently). "If the test passes, there's no N+1 bug" (test can pass and still hide the bug if it doesn't count calls). | N+1 blocker: /api/recipes/search → getAllRecipes (multi-letter scan ~300 recipes) → .limit(20) before enrichment → fetchRecipeDetails(id) per recipe, in sequence. Regression vectors: limit removed, limit moved after enrichment loop, fetchRecipeDetails called inside nested loop. | Unit: mock getAllRecipes to return 50 recipes, spy on fetchRecipeDetails, call the enrichment logic, assert fetchRecipeDetails called ≤20 times. Measure actual call count. | Over-mocking (mock fetchRecipeDetails entirely, missing the N+1). Happy-path only (test 1–2 recipes, not the boundary at 20). Not measuring actual API call count (assertion doesn't verify the fix). Asserting "fast enough" without numbers (unmeasurable). |

---

## §3 Phased Rollout

Orchestrator state table. Each row is a rollout phase; status evolves as `/10x-test-plan` invokes phases in sequence.

| # | Phase name | Goal | Risks covered | Test types | Status | Change folder | Notes |
|---|---|---|---|---|---|---|---|
| 1 | Critical-path search | Prove guest search returns valid recipes on valid input. Catch empty-results regressions. | R1, R2 (core hypothesis) | Integration: mock TheMealDB, call /search, assert results match inputs + constraints. | complete | context/archive/2026-08-28-testing-critical-path-search/ | Archived 2026-08-28. Unlocks Phase 2. |
| 2 | Ranking & caching | Protect against algorithm regressions and cache failures. Verify N+1 fix holds. | R3, R4, R6 (reliability + perf) | Unit + integration: algorithm score logic, TTL/LRU on mock storage, call-count assertions. | complete | context/archive/2026-08-28-testing-ranking-caching/ | Archived 2026-08-28. Unlocks Phase 3. |
| 3 | API resilience & security | Timeout handling, URL encoding, error messages safe. Auth layer readiness for S-02. | R5 (API edge cases), abuse scenarios (injection, token storage) | Integration: timeout/404/parsing failures mocked; URL injection tests; token in localStorage/HTTPS; no keys in bundle. | complete | context/archive/2026-08-29-phase-3a-api-injection-safety/ | Archived 2026-08-29. Complete rollout. |

---

## §4 Stack

### Existing infrastructure

- **Backend:** Spring Boot 4.1.1, Maven, Java 21. Test dependency: spring-boot-starter-test (JUnit, Mockito, AssertJ). No test runner configured beyond Maven Surefire (default).
- **Frontend:** React 19.2.8, Vite 8.2.2, TypeScript 7.0.2. Test runner: **none** (no vitest, jest, or testing-library configured). ESLint present.
- **API client:** Axios or fetch (to be confirmed in phase 1 research). Token injection (JWT) via localStorage.
- **Existing tests:** Test directories exist (`src/test/java/`, `test/java/`) but are empty. RecipeSearchServiceTest.java exists in history but no meaningful test cases.
- **CI/CD:** GitHub Actions (to be configured in F-05); Cloud Run deployment ready.

### Stack grounding tools (current session)

- **Docs:** Context7 docs / framework docs — not available in current session. Will verify Spring Security + React/Vite patterns during phase 1 research.
- **Search:** Exa.ai / web search MCP — not available in current session. Test tool decisions (vitest vs. jest, Mockito vs. manual mocks) will be made in phase 1 research based on codebase patterns.
- **Runtime/browser:** Playwright MCP — not available in current session. Browser automation tests deferred to phase 3 if needed; integration tests via mock HTTP should suffice for MVP.
- **Provider/platform:** GitHub / Cloudflare / Supabase / database tools — not available in current session. CI wiring (GitHub Actions secrets, Cloud Run env) is part of F-05 (deploy-scaffold), not this test rollout.

**Grounding approach:** Phase 1 research will examine existing codebase patterns (test structure, mocking approach, assertion style) and recommend test tools + setup that fit the project. No external MCPs needed to bootstrap.

### Test-base profile

**`none`** — no meaningful test suite exists.
- Test directories exist but are empty.
- spring-boot-starter-test is a dependency (includes JUnit, Mockito).
- No frontend test runner configured.
- Single placeholder test file (RecipeSearchServiceTest.java) with no real test cases.

**Phase 1 consequence:** Rollout will bootstrap both backend (Maven + Mockito) and frontend (vitest or jest) test runners as part of the first phase, alongside the critical-path search tests.

---

## §5 Negative Space

What this rollout does **NOT** test (per interview Q5 and lean execution):

- **TheMealDB API wrapper exhaustively.** We don't own TheMealDB; testing their API's every response type is wasted effort. Mock their API with known success/error cases; trust their docs for the rest.
- **UI styling and layout regressions.** CSS changes are cosmetic and low-risk. Snapshot tests break constantly and catch nothing. Focus on functional behavior (buttons work, forms submit, results display) instead.
- **Internal admin tools.** If admin endpoints exist (none in MVP scope), they're low-blast-radius. Test core user features first; defer admin coverage to v1.1.
- **Ingredient animation (FR-017).** PRD explicitly defers to v1.1 as "nice-to-have". MVP skips cosmetic polish.
- **Email verification, password reset, favorites count limit.** Parked for v1.1 (see `roadmap.md` "Parked" section). MVP assumes users are trusted; add safeguards post-launch.

---

## §6 Cookbook Patterns

Future reference for adding new tests by area. Each pattern is a template for the failure mode and the cheapest test type.

### Pattern 1: Recipe match (search returns valid results)

**When:** User searches by ingredients + time. **Failure mode:** Search returns empty or results don't match constraints. **Test type:** Integration (mock API, call endpoint, assert results). **Entry:** POST /api/recipes/search. **See:** Phase 1, Risk R1.

TBD — Phase 1 research will ground the exact mock recipe set, response shape, and assertion framework.

### Pattern 2: Ranking correctness (algorithm doesn't invert)

**When:** Algorithm ranks recipes by ingredient overlap + cook time. **Failure mode:** Weights are swapped or one component is dropped. **Test type:** Unit (deterministic score calculation on known inputs). **Entry:** RecipeSearchService.calculateScore() or equivalent. **See:** Phase 2, Risk R3.

TBD — Phase 2 research will identify the exact scoring function, test input range, and mock-recipe set.

### Pattern 3: Cache lifecycle (TTL + quota)

**When:** Frontend caches search results in localStorage. **Failure mode:** Stale data returned, or quota-exceeded crashes the app. **Test type:** Unit (mock storage, advance time, verify expiry/eviction). **Entry:** cache.ts: getCached(), setCached(). **See:** Phase 2, Risk R4.

TBD — Phase 2 research will ground TTL value, quota size, eviction order, and the quota-exceeded error handler path.

### Pattern 4: API resilience (timeout, encoding, error safety)

**When:** Backend calls TheMealDB or frontend calls backend API. **Failure mode:** Timeout hang, URL injection, secrets leak in error message. **Test type:** Integration (mock slow/failing HTTP, verify timeout + safe error message). **Entry:** TheMealDBClient: fetchAllRecipes(), fetchRecipeDetails(mealId). **See:** Phase 3, Risk R5.

TBD — Phase 3 research will ground the timeout duration, encoding format, and exact error-message surface (logs, HTTP response body, frontend console).

### Pattern 5: Performance (N+1 calls don't regress)

**When:** Search endpoint orchestrates recipe fetching. **Failure mode:** Enrichment loop triggered >20 times (N+1 regression). **Test type:** Unit (spy on API call count, assert ≤limit). **Entry:** RecipeController.searchRecipes() or equivalent. **See:** Phase 2, Risk R6.

TBD — Phase 2 research will ground the exact limit value, spy mechanism (Mockito spy, HTTP client mock, or call counter), and the current call-count baseline.

### Pattern 6: Auth readiness (token storage, injection, HTTPS)

**When:** S-02 (user auth) ships; token is generated and stored. **Failure mode:** Token in localStorage without HTTPS; token leaked in logs; no auth injection on API calls. **Test type:** Integration (verify token only set on HTTPS, verify token injected on API call, verify no token/keys in localStorage on guest mode). **Entry:** Frontend API client initialization, login flow, localStorage at [location].origin. **See:** Phase 3, abuse scenarios.

TBD — Phase 3 research will ground the token storage key, injection mechanism (Authorization header or custom header), and HTTPS enforcement path.

---

## Milestone

**Goal:** Every phase lands and ships before the corresponding roadmap slice.

- **Phase 1 (Critical-path search):** ≤ 2026-09-04 (before S-02 auth gates other slices). Validates R1 + R2.
- **Phase 2 (Ranking & caching):** ≤ 2026-09-11 (before S-03 favorites, which needs stable search + cache). Validates R3 + R4 + R6.
- **Phase 3 (API resilience & security):** ≤ 2026-09-14 (before launch + S-04 allergens; final gate). Validates R5 + abuse scenarios.

**Rollout cadence:** After each phase completes and archives, `/10x-test-plan` auto-advances to the next phase (or reports "all phases complete").

---

## Version History

- **v1** (2026-08-28): Initial rollout orchestration. Derived from guest-search MVP complete + roadmap S-02 onwards. 6 risks, 3 phases, bootstrap test runners in phase 1.

---

## Done

(populated by `/10x-archive` as phases complete)

