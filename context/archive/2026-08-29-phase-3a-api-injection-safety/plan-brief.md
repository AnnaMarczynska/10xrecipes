# Phase 3a: API Injection Safety — Plan Brief

> Full plan: `context/changes/phase-3a-api-injection-safety/plan.md`  
> Research: `context/changes/phase-3a-api-injection-safety/research.md`

## What & Why

Fix three critical security vulnerabilities in API resilience: **URL injection** in TheMealDBClient (CRITICAL severity F6, flagged PENDING in impl-review 2026-08-27 but never completed), **frontend timeout hangs** (requests block indefinitely on slow servers), and **error message leaks** (exception details exposed to clients). Test-first approach per risk vector, test-driven via TDD (red → green → refactor).

## Starting Point

- Backend: 5s timeout configured ✓, but mealId never URL-encoded ❌, error messages leak details ❌
- Frontend: fetch() calls have no timeout; recipes IDs not encodeURIComponent() ⚠️
- Tests: Phase 1 & 2 (search, ranking, cache) complete; no tests for TheMealDBClient HTTP behavior
- Scope out: Debug logging (System.out.println) deferred to v1.1

## Desired End State

When Phase 3a completes:
- All URL parameters URL-encoded before use; injection vectors neutralized (test: special chars ?, &, #, %encoding all safely escaped)
- Frontend fetch calls timeout after 5s; AbortController signals cleanly; user sees error instead of spinning
- HTTP error responses generic only (no exception details, mealId, or stack traces leak to clients)
- Each fix has regression test that catches if vulnerability is reintroduced

## Key Decisions Made

| Decision | Choice | Why | Source |
|----------|--------|-----|--------|
| **Phasing** | Test-first per fix (injection → timeout → errors), 3 phases | Matches M3L2 TDD approach; each fix verified by tests immediately | Plan (user choice) |
| **Priority order** | Backend injection first (highest risk) | F6 marked CRITICAL; security is the blocking concern | Plan (user choice) |
| **Test vectors** | All 3 injection types (?, &, #, %encoding) | Comprehensive coverage; each represents different attack class | Plan (user choice) |
| **Error messages** | Generic (no exception details) | Balance security (no info leak) with debuggability (log full error separately) | Plan (user choice) |
| **Debug logging** | Defer to v1.1 (out of scope) | Keeps Phase 3a focused on security layer; logging refactor is broader | Plan (user choice) |
| **Frontend mocking** | Mock HttpClient via dependency injection | Aligns with existing test patterns; no external libraries | Plan (user choice) |

## Scope

**In scope:**
- URL encoding: TheMealDBClient fetchRecipeDetails() and frontend recipeClient getRecipeDetails()
- Timeout: Frontend fetch() calls with AbortController
- Error sanitization: Remove mealId from TheMealDBClient exceptions; generic message in RecipeController
- Tests: Integration tests for each fix (3 parameterized injection tests, 1 timeout test, 2+ error safety tests)

**Out of scope:**
- Debug logging cleanup (System.out.println in RecipeSearchService)
- Comprehensive error handler (@ControllerAdvice)
- Rate limiting or DDOS mitigation
- Frontend URL validation

## Architecture / Approach

**Test-First Per Fix** — Write failing test → implement fix → verify test passes → add regression test.

**Backend Injection (Phase 1)**
- Refactor TheMealDBClient to accept HttpClient as dependency (enables test mocking)
- Add URLEncoder.encode(mealId, UTF-8) to line 76
- Parameterized integration test verifies special chars encoded; injection fails gracefully

**Frontend Timeout (Phase 2)**
- Add AbortController + 5s timeout to all fetch() calls
- Catch AbortError and re-throw with user-friendly message
- Integration test mocks slow server (6s delay); verifies timeout fires after 5s

**Error Safety (Phase 3)**
- Remove mealId from TheMealDBClient error messages (lines 86, 96, 102)
- Replace exception.getMessage() with generic string in RecipeController (line 117)
- Integration tests verify error response contains no exception details or mealId

## Phases at a Glance

| Phase | What it delivers | Key risk |
|-------|------------------|----------|
| 1. URL Injection | URLEncoder.encode() fix + 3 parameterized tests | HttpClient injection refactor adds slight complexity |
| 2. Timeout | AbortController + 5s timeout + integration test | Fake timers in test can be tricky; need proper cleanup |
| 3. Error Safety | Generic error messages + 2+ integration tests | May need to coordinate logging strategy (separate concern) |

**Prerequisites:** Phase 1 & 2 tests (search, ranking, cache) passing. Testing frameworks ready (JUnit 5, vitest).

**Estimated effort:** ~2-3 sessions, one per phase. Phase 1 (refactor + test) ~60-90 min; Phase 2 (AbortController + test) ~45-60 min; Phase 3 (sanitization + test) ~30-45 min.

## Open Risks & Assumptions

- **HttpClient refactor assumption** — assumes current code allows constructor injection; if Spring creates TheMealDBClient automatically, may need @Bean refactoring
- **Test mock complexity** — mocking HttpClient requires implementing its interface or using reflection; vitest's vi.mock() for fetch is well-established
- **Timeout race condition** — race between AbortError and timeout callback; mitigation: proper clearTimeout in catch block (already planned)
- **Error message backwards compatibility** — changing error messages may break clients that parse them; mitigation: clients should expect generic messages (this is a security requirement)

## Success Criteria (Summary)

✓ All 3 phases pass automated tests (compile, type-check, unit/integration tests)  
✓ Manual verification: URL injection test fails with old code, timeout test hangs without AbortController, error test leaks details without sanitization  
✓ No existing tests regress (Phase 1 & 2 tests still passing)  
✓ Code review sign-off on security changes
