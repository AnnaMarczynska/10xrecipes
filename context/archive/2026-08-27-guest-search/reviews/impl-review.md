<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Guest Recipe Search Implementation Plan

- **Plan**: context/changes/guest-search/plan.md
- **Scope**: All phases (1, 2, 3)
- **Date**: 2026-08-28
- **Verdict**: ✅ APPROVED (all critical issues resolved)
- **Findings**: 8 critical (7 FIXED ✅, 1 DISMISSED 🗑️), 7 warnings (ACCEPTED), 10 observations (ACCEPTED)

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | FAIL ❌ |
| Scope Discipline | WARNING ⚠️ |
| Safety & Quality | FAIL ❌ |
| Architecture | PASS ✅ |
| Pattern Consistency | WARNING ⚠️ |
| Success Criteria | FAIL ❌ |

## Findings

## Triage Summary

- **F1** (Ranking weights): DISMISSED — user disagrees, intentional design
- **F2** (Yield field): DISMISSED — user intentionally omits per earlier request
- **F3** (Ingredient list): FIXED ✅ — expanded from 105 to 175+ items
- **F4** (CORS wildcard): FIXED ✅ — restricted to localhost:3000, 5173
- **F5** (N+1 API calls): FIXED ✅ — limited enrichment to 20 candidates max
- **F6** (URL injection): FIXED ✅ — added URLEncoder.encode()
- **F7** (Cache quota failure): FIXED ✅ — added LRU eviction on QuotaExceededError
- **F8** (Race condition): FIXED ✅ — wrapped cache check in synchronized block
- **F9** (Missing pom.xml): FIXED ✅ — created Spring Boot 3.2.0, Java 21 config
- **Warnings (F2-F20)**: ACCEPTED — low-priority code quality items
- **Observations (O1-O5)**: ACCEPTED — minor polish items

---

### F1 — CRITICAL: Ranking algorithm weights inverted

- **Severity**: ❌ CRITICAL
- **Impact**: 🔬 HIGH — affects ALL search results, ranks recipes incorrectly
- **Dimension**: Plan Adherence
- **Location**: main/java/com/example/_x_recipes/service/RecipeSearchService.java:14-15, 64
- **Detail**: Plan specifies score = (ingredient_overlap_percent * 0.6) + (cook_time_fit_percent * 0.4). Implementation has INGREDIENT_WEIGHT = 0.4 and COOK_TIME_WEIGHT = 0.6, inverting the priority. This makes cook time 50% more important than ingredient match, contradicting the plan's intent that ingredient matching is primary (60%). Users see recipes ranked by cook time fit primarily, not ingredient relevance.
- **Fix**: Swap weights: set INGREDIENT_WEIGHT = 0.6, COOK_TIME_WEIGHT = 0.4, OR document why weights were intentionally reversed and update plan accordingly.
  - Strength: One-line fix; reverses to plan specification.
  - Tradeoff: Changes existing search ranking; users may see different results if deployed.
  - Confidence: HIGH — clear inversion, trivial to fix.
  - Blind spot: Haven't verified if this was an intentional pivot away from the plan.
- **Decision**: PENDING

### F2 — CRITICAL: Yield field fetched but not displayed

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — missing UI feature; data exists but not shown
- **Dimension**: Plan Adherence
- **Location**: src/pages/RecipeDetailPage.tsx (missing yield render)
- **Detail**: Plan specifies RecipeDetailPage "should display... yield" (Phase 2, Changes 6). Backend fetches yield from TheMealDB and includes it in API response (RecipeController.java:140, Recipe.java:66). Frontend API client includes yield in RecipeDetail interface (recipeClient.ts:21). But RecipeDetailPage component never renders the yield field—it renders image, name, cook time, ingredients, and instructions (lines 34-57) but no yield.
- **Fix**: Add yield display to RecipeDetailPage component.
  - Strength: Quick—one line of JSX to render yield value.
  - Tradeoff: Minimal; just adds missing UI.
  - Confidence: HIGH — field already exists in data.
  - Blind spot: User earlier asked NOT to display yield ("nie wyświetlać w ogóle" = don't display at all). Conflict with plan.
- **Decision**: PENDING

### F3 — CRITICAL: Insufficient ingredient list

- **Severity**: ❌ CRITICAL
- **Impact**: 🔎 MEDIUM — affects autocomplete; users can't find all ingredients they want
- **Dimension**: Plan Adherence
- **Location**: main/java/com/example/_x_recipes/controller/IngredientController.java:28-130
- **Detail**: Plan requires 150+ ingredients. Implementation provides 105 in COMMON_INGREDIENTS hardcoded array. Autocomplete will show incomplete list; users searching for less common ingredients (e.g., "ginger", "saffron") may not find them.
- **Fix**: Expand COMMON_INGREDIENTS list to 150+ items, or fetch from TheMealDB API at startup.
  - Strength: Expanding the array is straightforward; reference full TheMealDB ingredient API for source.
  - Tradeoff: Hardcoded list maintenance burden; API-driven approach adds startup latency.
  - Confidence: HIGH — TheMealDB has `/list/ingredients.php` endpoint for full list.
  - Blind spot: Don't know if 105 items are the most common/useful; may already cover 80%+ of user queries.
- **Decision**: PENDING

### F4 — CRITICAL: CORS overly permissive

- **Severity**: ❌ CRITICAL
- **Impact**: 🔬 HIGH — security; any domain can call the API
- **Dimension**: Safety & Quality
- **Location**: main/java/com/example/_x_recipes/controller/RecipeController.java:18
- **Detail**: `@CrossOrigin(origins = "*")` allows any domain to access the API without restriction. This is acceptable for public APIs (TheMealDB), but for a production backend that might handle user data, it's a security risk—malicious sites can trigger searches on behalf of users.
- **Fix**: Replace wildcard with explicit allowed origins list.
  - Strength: Restricts access to trusted domains; aligns with security best practices.
  - Tradeoff: Requires knowing frontend URL(s) at deploy time.
  - Confidence: HIGH — standard Spring Security pattern.
  - Blind spot: For MVP (no auth), risk is moderate; upgrade if user auth is added.
- **Decision**: PENDING

### F5 — CRITICAL: N+1 API call pattern (performance DoS)

- **Severity**: ❌ CRITICAL
- **Impact**: 🔬 HIGH — performance bottleneck; scales poorly
- **Dimension**: Safety & Quality
- **Location**: main/java/com/example/_x_recipes/controller/RecipeController.java:74-95
- **Detail**: Search endpoint fetches full recipe details for ALL candidate recipes before re-ranking. If 50 ingredients match, makes 50+ additional sequential API calls to TheMealDB. With 5s timeout per call, worst case is 5s * 50 = 250s delay. This creates a denial-of-service vulnerability—a query with many matching recipes will hang the server.
- **Fix**: Lazy load—return basic results first, fetch full details only when user clicks on a recipe.
  - Strength: Eliminates N+1 bottleneck; search returns instantly.
  - Tradeoff: Requires separate `/recipes/{id}/details` endpoint call on client (already exists).
  - Confidence: HIGH — already implemented on client side; just stop fetching on backend.
  - Blind spot: User may expect cook times in the search results (current implementation shows them). Lazy load means cook times only appear in detail view.
- **Decision**: PENDING

### F6 — CRITICAL: URL injection in mealId parameter

- **Severity**: ❌ CRITICAL
- **Impact**: 🔎 MEDIUM — security; exploitable if attacker controls mealId
- **Dimension**: Safety & Quality
- **Location**: main/java/com/example/_x_recipes/client/TheMealDBClient.java:76
- **Detail**: mealId concatenated directly into URL without encoding: `THEMEALDB_API_BASE + "/lookup.php?i=" + mealId`. If mealId contains special characters or URL-encoded payloads, could inject additional parameters or XSS vectors when response is rendered.
- **Fix**: URL-encode mealId before inserting into URL.
  - Strength: One-line fix using URLEncoder.encode().
  - Tradeoff: Minimal.
  - Confidence: HIGH — standard Java practice.
  - Blind spot: None; straightforward.
- **Decision**: PENDING

### F7 — CRITICAL: Cache quota failure silently fails

- **Severity**: ❌ CRITICAL
- **Impact**: 🔎 MEDIUM — data safety; caller believes data is cached when it isn't
- **Dimension**: Safety & Quality
- **Location**: src/api/cache.ts:30-41
- **Detail**: `localStorage.setItem()` throws `QuotaExceededError` when quota is full (typically 5-10MB per origin). Current try-catch only logs a warning and silently fails. Caller believes data is cached and may not refetch on next search. User repeats query, backend is called again, cache "hit" never happens, leading to confusing performance and potential data inconsistency.
- **Fix**: Either throw error so caller knows cache write failed, OR implement fallback in-memory cache + LRU eviction, OR clear old cache entries before storing new ones.
  - Strength: Ensures cache consistency; prevents silent failures.
  - Tradeoff: Requires retry logic on client or in-memory storage management.
  - Confidence: HIGH — quota errors are well-documented in MDN.
  - Blind spot: None significant; known localStorage limitation.
- **Decision**: PENDING

### F8 — CRITICAL: Race condition in backend cache

- **Severity**: ❌ CRITICAL
- **Impact**: 🔎 MEDIUM — reliability; concurrent requests can cause inconsistency
- **Dimension**: Safety & Quality
- **Location**: main/java/com/example/_x_recipes/controller/RecipeController.java:27-30
- **Detail**: `cachedRecipes` and `cacheTime` are volatile but not synchronized. Multiple threads calling `getAllRecipes()` simultaneously can both see cache as expired, both fetch fresh data, and overwrite each other—defeating cache coherency. This is a race condition on the cache check-then-act sequence.
- **Fix**: Wrap cache check in synchronized block or use AtomicReference with compareAndSet pattern.
  - Strength: Eliminates race condition; improves cache effectiveness under concurrent load.
  - Tradeoff: Minor synchronization overhead.
  - Confidence: HIGH — standard Java concurrency pattern.
  - Blind spot: May not manifest at low concurrency (MVP likely has few simultaneous users).
- **Decision**: PENDING

### F9 — Missing Maven pom.xml

- **Severity**: ❌ CRITICAL
- **Impact**: 🔎 MEDIUM — real blocker for testing; needed before archive
- **Dimension**: Success Criteria
- **Location**: project root (missing)
- **Detail**: Backend Spring Boot code exists but no pom.xml. Phase 1 success criteria requires "mvn test passes for all unit tests" and "mvn clean verify passes (no warnings)". Without pom.xml, Maven commands fail with "no POM in this directory". Tests cannot be verified.
- **Fix**: Create pom.xml with Spring Boot 4.1.1, Java 21 target, Jackson databind, and spring-boot-starter-test. Include build configuration for Spring Boot Maven plugin.
  - Strength: Unblocks all Maven-based testing; aligns with plan requirement to verify backend via "mvn verify".
  - Tradeoff: Requires Java 21 to be installed and in PATH; may need to scaffold Spring Boot project structure if not present.
  - Confidence: HIGH — pom.xml is a standard Spring Boot artifact; example structures are well-established.
  - Blind spot: We haven't verified Java 21 is still available after earlier Homebrew install.
- **Decision**: PENDING

### F2 — Backend directory structure inconsistency

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick to fix; doesn't block functionality, only aligns paths with plan
- **Dimension**: Plan Adherence
- **Location**: ./main/java/... vs. plan's ./src/main/java/...
- **Detail**: Backend code is in ./main/java/com/example/_x_recipes/ but plan specifies src/main/java/. Actual files: TheMealDBClient.java, RecipeSearchService.java, RecipeController.java, IngredientController.java, Recipe.java. Code works but path mismatch creates confusion for future maintainers and inconsistency with standard Java project layout.
- **Fix**: Move backend code from ./main/java/ to ./src/main/java/ (standard Maven layout).
  - Strength: Aligns with plan and Maven conventions; makes pom.xml simpler to configure.
  - Tradeoff: Cosmetic change; no functional impact if pom.xml is configured to scan ./main/.
  - Confidence: HIGH — standard practice in Java projects.
  - Blind spot: None significant.
- **Decision**: PENDING

### F3 — Unplanned service method signature change

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — architectural decision that wasn't in the plan; affects how phases interact
- **Dimension**: Plan Adherence
- **Location**: main/java/com/example/_x_recipes/service/RecipeSearchService.java:17
- **Detail**: Plan specifies RecipeSearchService.searchRecipes(List<String> userIngredients, String timeRange). Actual signature is searchRecipes(List<String> userIngredients, String timeRange, List<Recipe> allRecipes). The service now requires pre-fetched recipes as input instead of fetching them internally. This moves recipe-fetching responsibility to the controller. The change is sound (loose coupling) but wasn't discussed in the plan and changes the API contract.
- **Fix A ⭐ Recommended**: Document in plan as an addendum
  - Strength: Preserves the architectural decision already made; updates source of truth before future work references outdated contract.
  - Tradeoff: Plan becomes slightly outdated; future readers may miss this detail.
  - Confidence: HIGH — addendum pattern used in project; quick to add.
  - Blind spot: Callers already adapted (controller passes recipes), so code works; lack of doc doesn't break anything.
- **Fix B**: Revert to original contract (service fetches recipes internally)
  - Strength: Matches plan exactly; service is self-contained.
  - Tradeoff: Undo refactoring already done; risk breaking working code.
  - Confidence: MEDIUM — would need to verify all call sites.
  - Blind spot: Current design may be better; worth keeping if it's cleaner.
- **Decision**: PENDING

### F4 — Missing frontend linting verification

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; only npm dependencies needed
- **Dimension**: Success Criteria
- **Location**: npm run lint (fails with "eslint: command not found")
- **Detail**: Phase 2 success criteria requires "npm run lint passes (no warnings)". ESLint is not installed (npm list eslint returns empty). Build passes (tsc + vite), TypeScript passes (npm run typecheck), but linting cannot be verified. Plan.md marks 2.8 "Linting passes without warnings" as [x], but automated verification cannot run.
- **Fix**: Install ESLint dev dependency and run lint verification before marking complete.
  - Strength: Quick — one npm install and one npm run command to verify.
  - Tradeoff: Must ensure linting rules are configured (eslintrc.json or package.json config).
  - Confidence: HIGH — standard npm workflow; project already has build toolchain.
  - Blind spot: We haven't checked whether eslintrc exists or what linting config is in use.
- **Decision**: PENDING

### F16 — Production debug logging left in code

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick fix; hygiene issue
- **Dimension**: Safety & Quality
- **Location**: main/java/com/example/_x_recipes/service/RecipeSearchService.java:75
- **Detail**: System.out.println() left in production code; logs are sent to stdout instead of proper logging framework. Cannot be controlled, aggregated, or parsed.
- **Fix**: Replace with logger.debug() using SLF4J/Log4j.
- **Decision**: PENDING

### F17 — Ingredient matching logic duplicated

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — maintenance burden; two implementations of same algorithm
- **Dimension**: Safety & Quality
- **Location**: RecipeController.java:55-70 duplicates RecipeSearchService.scoreRecipe() logic
- **Detail**: Ingredient matching algorithm (checking user ingredients against recipe ingredients) is implemented twice. Creates divergence risk and maintenance burden.
- **Fix**: Extract to shared utility method.
- **Decision**: PENDING

### F18 — Fetch calls have no timeout

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — reliability; hangs indefinitely if backend hangs
- **Dimension**: Safety & Quality
- **Location**: src/api/recipeClient.ts:36-44, 63-67, 86-89
- **Detail**: Fetch calls lack timeout. If backend or TheMealDB hangs, client hangs indefinitely with no user feedback.
- **Fix**: Add AbortController with 5s timeout.
- **Decision**: PENDING

### F19 — Unplanned recipe result limits and sorting

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — scope creep; minor but unplanned features
- **Dimension**: Scope Discipline
- **Location**: RecipeSearchService.java:32 (limit 10), 31 (sort by cook time ascending)
- **Detail**: Plan doesn't specify sorting by cook time OR limiting results to 10. Implementation does both. User requirements state results should sort ascending by cook time, but that's not in the technical plan provided to implementer.
- **Fix**: Document as addendum to plan, OR clarify user requirements vs. plan.
- **Decision**: PENDING

### F20 — Unverified automated success criteria from Phase 3

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — observations about incomplete checklist items
- **Dimension**: Success Criteria
- **Location**: Progress section, Phase 3, items 3.5, 3.6, 3.7 marked [ ]
- **Detail**: Phase 3 Automated Verification items 3.5 (end-to-end test), 3.6 (no console errors), 3.7 (Lighthouse score ≥80) are checked [ ] (not completed). These are automated but haven't been run or verified. Manual tests 3.8-3.13 are marked [x] (completed), suggesting user tested manually but automated checks were skipped. This is acceptable for MVP (manual testing can validate functionality), but creates an audit gap.
- **Fix**: Run automated tests (if present) or explicitly document why manual-only verification is acceptable for Phase 3, or update checkboxes to reflect actual state.
  - Strength: Keeps audit trail accurate; matches what was actually tested.
  - Tradeoff: May reveal missing test infrastructure.
  - Confidence: MEDIUM — depends on whether e2e test exists.
  - Blind spot: Haven't verified if e2e test file exists or is runnable.
- **Decision**: PENDING

### F6 — Frontend build succeeds; TypeScript clean

- **Severity**: ✅ OBSERVATION
- **Impact**: 🏃 LOW
- **Dimension**: Success Criteria
- **Location**: dist/assets/ (production bundle generated)
- **Detail**: npm run build produces valid dist/ output (index.html, CSS, JS gzipped to 62.41 kB). npm run typecheck passes (no TypeScript errors). Frontend build chain is healthy.
- **Decision**: ACCEPTED

### O1 — Autocomplete missing debounce

- **Severity**: 📝 OBSERVATION
- **Impact**: 🏃 LOW
- **Dimension**: Safety & Quality
- **Location**: src/components/IngredientAutocomplete.tsx
- **Detail**: Input handler fires on every keystroke with no debounce delay. With 100+ ingredients, may cause perceptible lag on slower devices.
- **Decision**: ACCEPTED (nice-to-have optimization)

### O2 — Routing via component state instead of React Router

- **Severity**: 📝 OBSERVATION
- **Impact**: 🏃 LOW
- **Dimension**: Pattern Consistency
- **Location**: src/App.tsx, SearchForm.tsx
- **Detail**: Recipe detail navigation implemented via component state (SearchForm line 15, 39-50) rather than React Router with "/recipe/:id" pattern. Functional but non-standard pattern; harder to bookmark/share recipe URLs.
- **Decision**: ACCEPTED (acceptable for MVP)

### O3 — Error messages don't distinguish status codes

- **Severity**: 📝 OBSERVATION
- **Impact**: 🏃 LOW
- **Dimension**: Safety & Quality
- **Location**: src/api/recipeClient.ts, RecipeController.java
- **Detail**: Generic error messages don't distinguish 400 (bad request), 404 (not found), 500 (server error), 503 (service down). Client can't implement proper retry logic or user-facing messaging.
- **Decision**: ACCEPTED (low priority for MVP)

### O4 — Component callback naming inconsistent

- **Severity**: 📝 OBSERVATION
- **Impact**: 🏃 LOW
- **Dimension**: Pattern Consistency
- **Location**: Multiple components (IngredientAutocomplete, TimeRangeSelector, RecipeCard, etc.)
- **Detail**: Callback props are named inconsistently: onSelectIngredients, onSelectRange, onSelectRecipe, onSelect. No consistent pattern.
- **Decision**: ACCEPTED (polish issue)

### O5 — Missing error boundary

- **Severity**: 📝 OBSERVATION
- **Impact**: 🏃 LOW
- **Dimension**: Reliability
- **Location**: src/main.tsx
- **Detail**: React.StrictMode wraps app but no error boundary. If any component throws, entire app crashes.
- **Decision**: ACCEPTED (rarely occurs with modern frameworks)
