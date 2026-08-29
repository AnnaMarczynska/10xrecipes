---
date: 2026-08-29T14:45:00Z
researcher: Claude (AI)
git_commit: a5c6df4637c35c02428651b010906f0507805d08
branch: main
repository: 10xRecipes
topic: "R5 API Resilience: URL Injection, Timeout Handling, Error Message Safety"
tags: [research, security, api-resilience, injection, secrets-leakage, themealdb-client]
status: complete
last_updated: 2026-08-29
last_updated_by: Claude (AI)
---

# Research: R5 API Resilience & Security

**Date**: 2026-08-29
**Researcher**: Claude (AI)  
**Git Commit**: a5c6df4637c35c02428651b010906f0507805d08  
**Branch**: main  
**Repository**: 10xRecipes

---

## Research Question

What is the current state of API resilience in TheMealDBClient? Specifically:
1. Is URL encoding implemented for the mealId parameter?
2. Are timeouts properly configured (5s duration)?
3. Do error messages leak secrets or implementation details?
4. What injection vectors exist?
5. What prior decisions or blockers affect Phase 3 implementation?

---

## Executive Summary

**CRITICAL SECURITY ISSUE IDENTIFIED**: The TheMealDBClient has a **URL injection vulnerability** on line 76 where `mealId` is concatenated directly into the URL without URLEncoder.encode(). This was flagged as **PENDING (F6)** in the guest-search impl-review (2026-08-27) but was never fixed.

| Aspect | Status | Details |
|--------|--------|---------|
| **URL Encoding** | ❌ MISSING | mealId not encoded; injection risk exists |
| **Timeout Config** | ✅ IMPLEMENTED | 5 seconds configured on backend |
| **Frontend Timeout** | ❌ MISSING | fetch() calls have no timeout; will hang indefinitely |
| **Error Message Safety** | ❌ FAILS | Exception details + mealId leaked in responses |
| **Prior Decision** | ⚠️ PENDING | F6 URL injection flagged in impl-review, never completed |

**Risk Level**: MEDIUM (test-plan R5) with **CRITICAL code issue** blocking Phase 3.

---

## Detailed Findings

### 1. URL Injection Vulnerability (CRITICAL)

#### Current Implementation
**File**: `src/main/java/com/example/_x_recipes/client/TheMealDBClient.java:76`

```java
public Recipe fetchRecipeDetails(String mealId) throws TheMealDBException {
    try {
        String url = THEMEALDB_API_BASE + "/lookup.php?i=" + mealId;  // ← VULNERABLE
        HttpRequest request = HttpRequest.newBuilder()
            .uri(new URI(url))
            .timeout(TIMEOUT)
            .GET()
            .build();
        
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        // ... rest of method
    }
}
```

#### The Problem
The `mealId` parameter is concatenated directly into the URL without calling `URLEncoder.encode()`. This allows special characters to break URL parsing or inject additional parameters.

#### Attack Scenarios

**Scenario 1: Query parameter injection**
- Input: `mealId = "123?foo=bar&service=admin"`
- Generated URL: `https://www.themealdb.com/api/json/v1/1/lookup.php?i=123?foo=bar&service=admin`
- Result: Malformed URL; duplicate `?` causes parsing failure or unexpected parameter handling

**Scenario 2: URL fragment injection**
- Input: `mealId = "123#section"`
- Generated URL: `https://www.themealdb.com/api/json/v1/1/lookup.php?i=123#section`
- Result: Fragment `#section` is stripped by HTTP client; request sent for `i=123` only, but caching layer or middleware might cache the wrong response

**Scenario 3: Special character escaping bypass**
- Input: `mealId = "123%2f%2e%2e%2fadmin"` (pre-encoded path traversal attempt)
- URL constructed as-is without re-encoding
- Result: Depends on how HTTP libraries and servers handle double-encoding; potential bypass

#### Data Flow

```
Frontend recipeClient.ts:63
  ↓
/api/recipes/{id}/details (Spring routing)
  ↓
RecipeController.getRecipeDetails(@PathVariable String id)
  Line 126: theMealDBClient.fetchRecipeDetails(id)
  ↓
TheMealDBClient.fetchRecipeDetails(String mealId)
  Line 76: String url = THEMEALDB_API_BASE + "/lookup.php?i=" + mealId  ← NO ENCODING
  ↓
HttpRequest.newBuilder().uri(new URI(url))
  ↓
TheMealDB API (or proxy/middleware)
```

#### Oracle (from test-plan R5)
> "Invalid mealId is URL-encoded before use (no injection)."

**Current State**: ✗ FAILS — No URLEncoder.encode() call found.

---

### 2. Frontend Path Traversal Risk (MEDIUM)

**File**: `src/api/recipeClient.ts:63`

```typescript
async getRecipeDetails(id: string): Promise<RecipeDetails> {
    const response = await fetch(`/api/recipes/${id}/details`);  // ← NO ENCODING
    // ...
}
```

#### Issue
The recipe `id` is embedded in the URL template literal without `encodeURIComponent()`. This allows path traversal attacks:
- Input: `id = "123/../admin"`
- URL: `/api/recipes/123/../admin/details`
- Risk: Depending on Spring's path normalization, may bypass authorization checks

#### Fix
```typescript
const response = await fetch(`/api/recipes/${encodeURIComponent(id)}/details`);
```

---

### 3. Timeout Configuration

#### Backend (TheMealDBClient)

**Status**: ✅ **IMPLEMENTED**

**File**: `src/main/java/com/example/_x_recipes/client/TheMealDBClient.java:18`

```java
private static final Duration TIMEOUT = Duration.ofSeconds(5);
```

Applied to both `fetchAllRecipes()` (line 38) and `fetchRecipeDetails()` (line 79):

```java
HttpRequest request = HttpRequest.newBuilder()
    .uri(new URI(url))
    .timeout(TIMEOUT)  // ← Applied correctly
    .GET()
    .build();
```

**Error Handling**: Caught and wrapped safely (lines 67-68, 97-98):
```java
catch (java.net.http.HttpTimeoutException e) {
    throw new TheMealDBException("TheMealDB request timed out after " + TIMEOUT.toSeconds() + " seconds");
}
```

#### Frontend (recipeClient.ts)

**Status**: ❌ **MISSING**

**File**: `src/api/recipeClient.ts:36, 63, 86`

```typescript
const response = await fetch(`/api/recipes/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
});
// ← NO timeout configuration
// ← NO AbortController signal
```

**Issue**: Browser `fetch()` API has no built-in timeout parameter. Without an `AbortController`, requests will hang indefinitely if the server becomes unresponsive.

**Fix**:
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000);

const response = await fetch(`/api/recipes/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal: controller.signal,
});

clearTimeout(timeoutId);
```

---

### 4. Error Message Safety & Secrets Leakage

#### Issue 1: mealId Leaked in Error Messages

**File**: `src/main/java/com/example/_x_recipes/client/TheMealDBClient.java:86, 96, 102`

```java
// Line 86 & 96
throw new TheMealDBException("Recipe not found: " + mealId);

// Line 102  
throw new TheMealDBException("Failed to fetch recipe details: " + e.getMessage());
```

**Problem**: The `mealId` and raw exception messages are included in the error message. If caught and returned to the client, they leak implementation details.

**Leakage Chain**:
1. TheMealDBClient throws exception with mealId
2. Caught in RecipeController:144-146
3. Returned in HTTP 500 response (line 150)
4. Client sees: `"error": "Failed to fetch recipe details: Recipe not found: 12345"`

#### Issue 2: Exception Details Returned to Client

**File**: `src/main/java/com/example/_x_recipes/controller/RecipeController.java:117-118`

```java
catch (Exception e) {
    return ResponseEntity.status(500).body(Map.of(
        "error", "Internal server error: " + e.getMessage(),
        "status", 500
    ));
}
```

**Risk**: Full exception message returned directly to client.

**Possible Leaks**:
- `"Internal server error: JsonEOFException: Unexpected end-of-input at [Source: ...; line: 1, column: 450]"` ← Reveals parsing logic
- `"Internal server error: SocketTimeoutException: Read timed out at 192.168.1.100:443"` ← Reveals internal IP
- If database added later: `"Internal server error: SQLException: Column 'api_secret' not found in table recipes"` ← Reveals schema

#### Issue 3: Debug Logging of Algorithm Details

**File**: `src/main/java/com/example/_x_recipes/service/RecipeSearchService.java:75`

```java
System.out.println("DEBUG: " + recipe.getName() + " - cookTime=" + recipe.getCookTime() + 
    " timeRange=" + timeRange + " cookTimeScore=" + cookTimeScore + " score=" + score);
```

**Risk**: Algorithm internals logged to stdout (appears in application logs, log aggregation services, monitoring dashboards).

**Example Output**:
```
DEBUG: Chicken Stir Fry - cookTime=25 timeRange=15-30 cookTimeScore=100 score=42.0
DEBUG: Pasta Carbonara - cookTime=20 timeRange=15-30 cookTimeScore=100 score=45.0
```

**Attacker Intelligence**:
- Exact formula visible
- Weights visible (0.6 ingredient, 0.4 time from code review)
- Can reverse-engineer ranking system from logs
- Can craft queries to exploit weaknesses

---

### 5. Prior Decisions & Timeline

#### Guest-Search Impl-Review (2026-08-27)

**Commit**: eb63530 (from git history referenced in change folder)  
**Finding F6**: URL injection in TheMealDBClient — **Severity: CRITICAL, Status: PENDING**

This means the vulnerability was **identified but not fixed**. It was flagged as a blocker for Phase 3.

#### TheMealDBClient Implementation (2026-08-27)

**Initial commit**: e067c72  
**Features**:
- ✅ 5-second timeout configured
- ✅ Exception handling wraps errors
- ❌ No URLEncoder.encode() on mealId (matches PENDING F6 flag)

#### Phase Testing Progress

| Phase | Status | Date | Notes |
|-------|--------|------|-------|
| Phase 1 (Critical-path search) | ✅ Archived | 2026-08-28 | 13 integration tests; no URL injection tests |
| Phase 2 (Ranking & caching) | ✅ Archived | 2026-08-28 | Focused on algorithm + cache; API resilience deferred |
| Phase 3 (API resilience) | ⏸️ Not started | 2026-08-29 | Change folder created; research in progress |

#### Test-Plan R5 Oracle

From `context/foundation/test-plan.md` lines 47-48:

> "TheMealDB calls timeout cleanly after 5 seconds (no hang). **Invalid mealId is URL-encoded before use (no injection).** HTTP errors (404, 503) and parsing errors (malformed JSON) return user-friendly error (no stack trace or API key leaked)."

**Current Code vs. Oracle**:
- Timeout: ✅ 5s configured
- URL encoding: ❌ **MISSING** — mealId NOT encoded
- Error safety: ❌ **FAILS** — exception details leaked, mealId leaked

---

## Security Vulnerability Summary Table

| Vulnerability | Severity | File:Line | Type | Status | Fix |
|---|---|---|---|---|---|
| **URL injection (mealId)** | CRITICAL | TheMealDBClient:76 | Injection | Unfixed (F6 PENDING) | `URLEncoder.encode(mealId, UTF_8)` |
| **Frontend path traversal** | MEDIUM | recipeClient.ts:63 | Injection | New finding | `encodeURIComponent(id)` |
| **mealId leaked in errors** | MEDIUM | TheMealDBClient:86,96 | Secrets leak | Unfixed | Remove mealId from message |
| **Exception details to client** | HIGH | RecipeController:117-118 | Secrets leak | Unfixed | Generic error message |
| **Algorithm debug logging** | MEDIUM | RecipeSearchService:75 | Secrets leak | Unfixed | Remove println or log at DEBUG level |
| **Frontend timeout missing** | MEDIUM | recipeClient.ts:36,63,86 | Availability | New finding | Add AbortController timeout |

---

## Code References

### TheMealDBClient.java (111 lines)
- `src/main/java/com/example/_x_recipes/client/TheMealDBClient.java:18` — Timeout constant (5s)
- `src/main/java/com/example/_x_recipes/client/TheMealDBClient.java:23` — HttpClient initialization
- `src/main/java/com/example/_x_recipes/client/TheMealDBClient.java:27-72` — fetchAllRecipes() method
- `src/main/java/com/example/_x_recipes/client/TheMealDBClient.java:74-104` — fetchRecipeDetails() method (VULNERABLE at line 76)
- `src/main/java/com/example/_x_recipes/client/TheMealDBClient.java:106-110` — TheMealDBException class

### RecipeController.java
- `src/main/java/com/example/_x_recipes/controller/RecipeController.java:126` — Calls fetchRecipeDetails(id)
- `src/main/java/com/example/_x_recipes/controller/RecipeController.java:117-118` — Error response with exception message

### RecipeSearchService.java
- `src/main/java/com/example/_x_recipes/service/RecipeSearchService.java:75` — Debug println leak

### recipeClient.ts
- `src/api/recipeClient.ts:36` — fetch(/api/recipes/search) with no timeout
- `src/api/recipeClient.ts:63` — fetch(/api/recipes/${id}/details) with no encoding
- `src/api/recipeClient.ts:86` — fetch (GET details) with no timeout

---

## Architecture Insights

### Timeout Handling Philosophy
The team correctly implemented timeout at the **request level** (not client level) in Java, allowing granular control per request. However, frontend was inconsistently protected — fetch() calls left hanging indefinitely.

### Error Handling Pattern
Generic error wrapping is used in RecipeController (safe), but details leak in underlying client exceptions. The pattern of throwing custom exceptions (TheMealDBException) is good; the problem is the message content passed to them.

### Security Pattern Inconsistency
Backend recognizes some security concerns (CORS fixed F4, error wrapping F3), but URL encoding was left PENDING despite being flagged as CRITICAL. Suggests:
- Security review happened (good)
- Implementation backlog exists but wasn't prioritized
- Phase 3 is the correct place to complete this work

---

## Historical Context (Prior Changes)

### Guest-Search Implementation (2026-08-27)

**Reference**: `context/archive/2026-08-27-guest-search/plan.md`

The impl-review for guest-search noted:
- **F6 URL injection**: "Invalid mealId is not URL-encoded before use" — **PENDING**
- Other security fixes: F3 (error wrapping), F4 (CORS), F7 (cache quota)

This change flagged the vulnerability but deferred fixing it. The team made a conscious decision to address it in Phase 3 (API resilience).

### Phase 1 Testing (2026-08-28)

**Reference**: `context/archive/2026-08-28-testing-critical-path-search/plan.md`

Phase 1 focused on search returns valid results. No URL injection tests included. The 13 integration tests didn't cover injection vectors because Phase 3 was expected to handle API resilience.

### Phase 2 Testing (2026-08-28)

**Reference**: `context/archive/2026-08-28-testing-ranking-caching/plan.md`

Phase 2 focused on ranking algorithm + cache. All 3 sub-phases complete (ranking unit tests, cache unit tests, N+1 integration test). No API resilience testing in scope.

---

## Open Questions & Recommendations

### Q1: Should F6 URL encoding fix be applied BEFORE Phase 3 tests are written?

**Recommendation**: NO — Apply fix as part of Phase 3 implementation, with test-first approach.

**Rationale**: 
- The vulnerability is understood and scoped
- Test-plan R5 is the contract specifying the expected behavior
- Tests should be written against the expected behavior (URLEncoder present)
- If code is fixed first without tests, there's no regression protection

### Q2: Should frontend timeout be handled in Phase 3 or separate phase?

**Recommendation**: Include in Phase 3a.

**Rationale**:
- It's part of R5 (API resilience) — "timeouts must work cleanly"
- Low effort fix (AbortController)
- Completes the timeout story (both backend + frontend)

### Q3: Should error message safety be fixed comprehensively?

**Recommendation**: Fix the 3 identified leaks in Phase 3. Other services can wait for v1.1.

**Rationale**:
- Guest-search MVP doesn't expose admin endpoints or sensitive data (yet)
- The 3 leaks identified are fixable in isolation
- Broader error handling strategy (logging, monitoring) is v1.1 scope

---

## Test Regression Vectors (for Phase 3 planning)

From research, these are the regression vectors Phase 3 tests must catch:

1. **URL injection**: If mealId contains `?`, `&`, `#`, `%` characters, they must be encoded. Test: `fetchRecipeDetails("123%20test")` → verify URL is safe.

2. **Timeout enforcement**: If timeout removed or duration changed, test must fail. Test: mock 6s delay, verify exception caught after 5s.

3. **Error message safety**: If exception message includes raw mealId or response body, test must fail. Test: mock 404, verify error message doesn't include mealId or URL.

4. **Frontend path traversal**: If id not encoded, `/../admin` could traverse paths. Test: call getRecipeDetails("123/../admin"), verify URL is `/api/recipes/123%2F..%2Fadmin/details`.

---

## Recommendation for Phase 3 Plan

Phase 3a (API Injection Safety) should address:

1. **URL Encoding Implementation** (1 line fix)
   - Add URLEncoder import
   - Encode mealId on line 76
   - Test: parameterized test with special chars

2. **Error Message Sanitization** (3 locations)
   - Remove mealId from TheMealDBClient error messages
   - Generic error message only in RecipeController
   - Test: verify no mealId in exception message

3. **Timeout Enforcement (Frontend)** (1-2 method updates)
   - Add AbortController to recipeClient.ts fetch calls
   - Test: mock 6s server delay, verify AbortError caught

4. **Debug Logging Cleanup** (1 file)
   - Remove or downgrade System.out.println to logger at DEBUG level
   - Test: no algorithm details in application logs

5. **Test Suite**
   - Integration tests: mock slow HTTP, 404, malformed JSON, special-char mealId
   - Security tests: verify no secrets in error messages
   - Regression tests: inject special chars, verify they're encoded

---

## Conclusion

Phase 3a (API Injection Safety) is **unblocked and ready for planning**. The vulnerability is well-understood (flagged in prior impl-review), the scope is clear (URL encoding + error safety), and the test contract is defined in test-plan R5.

No additional research needed. Ready to move to `/10x-plan phase-3a-api-injection-safety`.
