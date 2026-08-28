# Testing Critical-Path Search — Plan Brief

> Full plan: `context/changes/testing-critical-path-search/plan.md`

## What & Why

We're building integration tests for the 10xRecipes search feature to validate a core MVP hypothesis: *when users select ingredients and cooking time, the API returns recipes that strictly match their constraints*. This is Risk R1 (empty results when recipes exist) and Risk R2 (results violate constraints), the two highest-priority risks from the test-plan.

## Starting Point

Search endpoint (`POST /api/recipes/search`) exists and implements scoring (0.4 ingredient overlap + 0.6 cook-time fit). Unit tests for the service logic exist, but no integration tests validate the endpoint or test boundary conditions (e.g., recipes just outside the user's time limit).

## Desired End State

Automated tests verify:
- Search returns ≥1 recipe when user inputs valid ingredients + time (catches R1)
- All returned recipes stay within user's time constraint and have ≥50% ingredient match (catches R2)
- Results ranked correctly by score (cook time weighted 60%, ingredients 40%)
- Edge cases handled (exact time boundaries, threshold ingredient overlaps)

## Key Decisions Made

| Decision | Choice | Why | Source |
|----------|--------|-----|--------|
| Mock data volume | 20+ comprehensive recipes (5 overlap levels × 4 time ranges) | Covers realistic scenarios + boundaries without over-engineering; reusable across phases 2 & 3 | Plan |
| Test scope | Backend integration tests only (MockMvc) | Validates core API logic; unblocks frontend; defers React testing to phase 3 | Plan |
| Coverage strategy | Happy-path + boundary cases (not error handling) | Catches R1 + R2; error resilience (R5) deferred to phase 3 | Plan |
| Cache testing | Deferred to phase 2 | Phase 1 focuses on search correctness (R1 + R2); cache is separate risk (R4) | Plan |
| Test file organization | TestRecipeFactory utility + RecipeSearchControllerTest | Centralizes mock data for reuse; keeps unit/integration tests separate | Plan |

## Scope

**In scope:**
- Create TestRecipeFactory with 20+ realistic mock recipes
- Write integration tests using MockMvc for POST /api/recipes/search
- Verify happy-path (search returns results) and boundary cases (constraints enforced)
- Validate ranking by score (descending order)

**Out of scope:**
- Frontend React component testing (phase 3)
- Cache TTL/eviction testing (phase 2)
- Error handling (invalid input, API timeouts — phase 3)
- Performance testing / N+1 optimization (phase 2)

## Architecture / Approach

Two-phase test buildout within a single test change:

1. **Phase 1a (Setup):** Create TestRecipeFactory (reusable fixtures) + RecipeSearchControllerTest skeleton + sanity-check test. Verify MockMvc infrastructure works.

2. **Phase 1b (Tests):** Write 10+ integration test methods covering R1 (search returns results) and R2 (constraint violations). Include happy-path scenarios + boundary conditions (exact time matches, ingredient overlap at 50% threshold, recipes just outside boundaries).

**Data strategy:** 20+ mock recipes span the full spectrum:
- Ingredient overlaps: 0%, 30%, 50% (boundary), 75%, 100%
- Time ranges: <15min, 15-30min, 30-60min, 60+min
- Each overlap level has recipes in each time range (5 × 4 = 20)

**Testing approach:**
- Mock TheMealDB client via Mockito; no real API calls
- Use MockMvc to simulate HTTP; no server startup
- Assertions verify constraints (time within range, ingredients ≥50%), not implementation details

## Phases at a Glance

| Phase | What it delivers | Key risk |
|-------|------------------|----------|
| 1a | TestRecipeFactory (20+ recipes) + MockMvc infrastructure | Mock data incomplete or unrealistic |
| 1b | 10+ integration tests (happy-path + boundaries) | Test assertions too weak; miss regressions |

**Prerequisites:** 
- RecipeController, RecipeSearchService, RecipeResult classes exist and compile
- Spring Boot Test (Mockito, MockMvc) available in pom.xml (already confirmed)

**Estimated effort:** ~2-3 dev sessions (day 1: fixtures + infrastructure, day 2: full test suite)

## Open Risks & Assumptions

- **Mock recipes must span full spectrum** — If fixtures are too narrow (only happy-path recipes), tests will pass but miss boundary regressions. Mitigation: Explicit 5×4 matrix coverage in TestRecipeFactory.
- **Over-mocking risk** — Mocking TheMealDBClient is correct, but if we accidentally mock the service or controller layer, tests become useless. Mitigation: Integration test explicitly calls endpoint via MockMvc; verify service is actually invoked in manual testing.
- **Weights in code differ from earlier spec** — Code has 0.4 ingredient, 0.6 time (confirmed correct); test assertions must match actual implementation, not spec memorization.

## Success Criteria (Summary)

- All integration tests pass: `mvn test -Dtest=RecipeSearchControllerTest`
- Happy-path test scenarios return results that match user inputs
- Boundary-case tests verify recipes outside constraints are excluded
- Results ranked by score in descending order (cook time fit weighted 60%)
- Existing RecipeSearchServiceTest.java still passes (no regression)
- Manual code review confirms test data is realistic and assertions are valid
