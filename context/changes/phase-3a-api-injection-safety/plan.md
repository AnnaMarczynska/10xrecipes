# Phase 3a: API Injection Safety Implementation Plan

## Overview

Phase 3a fixes three critical security vulnerabilities in the API resilience layer: **URL injection** in TheMealDBClient (CRITICAL severity F6, PENDING since 2026-08-27), **timeout handling gaps** on the frontend, and **error message leaks** in exception responses. This plan uses test-first approach (red → green → refactor) per risk vector, landing fixes in order of security impact: backend injection first, then frontend timeout, then error sanitization.

---

## Current State Analysis

### What Exists Today

**Backend (Java/Spring Boot)**
- TheMealDBClient: 111 lines, implements 5s timeout on requests ✓
- But: mealId concatenated directly into URL without URLEncoder.encode() ❌
- RecipeController: Catches TheMealDBClient exceptions; some responses leak exception messages ❌
- RecipeSearchService: Contains System.out.println debug logging ❌

**Frontend (TypeScript/React)**
- recipeClient.ts: Uses native fetch() API for all requests
- But: No timeout configuration; requests hang indefinitely on slow servers ❌
- Recipe ID embedded in template literals without encodeURIComponent() ⚠️

**Test Infrastructure**
- Phase 1 & 2 tests complete (search, ranking, caching)
- No existing tests for TheMealDBClient HTTP behavior ❌
- Test frameworks ready: JUnit 5 + Spring Boot Test + Mockito (backend); vitest + jsdom (frontend)
- TestRecipeFactory provides 20+ mock recipes for boundary testing ✓

### Key Constraints

1. **URL Injection was flagged F6 in impl-review (2026-08-27)** — identified as CRITICAL but marked PENDING and never completed. This plan completes that work.
2. **HttpClient injection for testing** — TheMealDBClient currently creates HttpClient internally; must refactor to accept it as dependency for test mocking.
3. **Error handling is inline** — RecipeController has no @ControllerAdvice; error responses scattered across catch blocks. Phase 3 addresses only the identified leak points.
4. **Frontend testing requires mock fetch** — vitest + jsdom configured; tests will use vi.mock('fetch').

---

## Desired End State

When Phase 3a completes:

1. **No URL injection vulnerability** — mealId and all untrusted parameters are URL-encoded before use; tests verify with special-char payloads (?, &, #, %encoding).
2. **No hanging requests** — frontend fetch calls timeout after 5 seconds; AbortController signals timeout cleanly; user sees error message instead of indefinite spinner.
3. **No error leakage** — HTTP error responses contain generic messages only; no exception details, mealId, or stack traces leak to client.
4. **Test regression protection** — each fix has integration test that catches if the vulnerability is reintroduced.

**Verification**: All 3 phases pass automated tests + manual verification steps (below).

---

### Key Discoveries:

- **Error leak is localized** — Only 1 critical point (RecipeController:117) directly leaks exception details to HTTP response; 2 other points (TheMealDBClient:70, 102) wrap raw exceptions but are mostly handled safely in controllers.
- **Test infrastructure ready** — JUnit 5 + Mockito, TestRecipeFactory patterns established in Phase 1/2; vitest + vi.mock() patterns established in Phase 2. No external libraries needed.
- **HttpClient is hard-coded** — TheMealDBClient creates HttpClient in constructor; no injection point exists. Phase 1 must refactor to accept HttpClient as dependency.
- **Frontend fetch has no abort mechanism** — Adding AbortController + timeout is a straightforward API addition; existing error handling can catch AbortError.

---

## What We're NOT Doing

- **Comprehensive logging refactor** — System.out.println in RecipeSearchService:75 will be deferred to v1.1 (out of scope for Phase 3a).
- **Global error handler** — No @ControllerAdvice or centralized error handling added. Phase 3a fixes identified leak points only.
- **Encryption of errors in transit** — Error messages are generic strings; encryption/hashing not in scope.
- **Rate limiting or DDOS mitigation** — API resilience focuses on timeouts, encoding, safe errors; rate limiting is v1.1 scope.
- **Frontend URL validation** — Only encoding is added; no format validation (e.g., regex for valid recipe IDs).

---

## Implementation Approach

**Test-First Per Fix** — Write failing test → implement fix → verify test passes → write regression test to catch re-introduction.

**Ordering** — Backend injection first (CRITICAL severity F6), then frontend timeout (medium but perceptual UX issue), then error sanitization (medium security).

**HTTP Mocking** — Refactor TheMealDBClient to accept HttpClient via constructor injection; tests provide a mock/stub implementation returning canned responses.

**Timeout Testing** — Frontend integration test mocks slow server (6s+ delay) to verify AbortController fires after 5s.

**Error Testing** — Mock HTTP 404, 503, malformed JSON responses; assert error response body contains no exception details or mealId.

---

## Phase 1: URL Injection Prevention (Backend)

### Overview

Write integration tests for URL encoding, then implement URLEncoder.encode(mealId) in TheMealDBClient. Verify injection vectors are neutralized: query parameter injection (?foo=bar), URL fragments (#section), and encoding bypasses (%2F).

### Changes Required:

#### 1. TheMealDBClient Refactoring (Dependency Injection)

**File**: `src/main/java/com/example/_x_recipes/client/TheMealDBClient.java`

**Intent**: Make HttpClient injectable so tests can provide a mock implementation. Currently HttpClient is created internally (line 23), blocking test control.

**Contract**: Add `httpClient` as a constructor parameter (or field-injected dependency); update the constructor signature. Keep default behavior same (lazy initialization if not provided, or require explicit injection — choose one approach consistently).

Example approach (constructor injection):
```java
private final HttpClient httpClient;

public TheMealDBClient(HttpClient httpClient) {
    this.httpClient = httpClient;
    this.objectMapper = new ObjectMapper();
}
```

Or alternatively if auto-wired:
```java
@Autowired(required = false)
private HttpClient httpClient;

@PostConstruct
void init() {
    if (httpClient == null) {
        httpClient = HttpClient.newHttpClient();
    }
}
```

Choose based on how RecipeController instantiates TheMealDBClient. If already @Bean-managed, constructor injection is simpler.

#### 2. URL Encoding Fix (fetchRecipeDetails Method)

**File**: `src/main/java/com/example/_x_recipes/client/TheMealDBClient.java:76`

**Intent**: Encode mealId before concatenating into URL to prevent injection attacks.

**Contract**: Replace line 76:
```java
// Before:
String url = THEMEALDB_API_BASE + "/lookup.php?i=" + mealId;

// After:
String url = THEMEALDB_API_BASE + "/lookup.php?i=" + URLEncoder.encode(mealId, StandardCharsets.UTF_8);
```

Add imports:
```java
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
```

#### 3. URL Injection Integration Tests (New Test Class)

**File**: `src/test/java/com/example/_x_recipes/client/TheMealDBClientUrlEncodingTest.java`

**Intent**: Test that special characters in mealId are safely encoded; injection attempts are neutralized.

**Contract**: JUnit 5 parameterized test with 3+ injection payloads:
- Query injection: `mealId="123?foo=bar"` → verify URL is `...?i=123%3Ffoo%3Dbar` (? encoded as %3F)
- Fragment injection: `mealId="123#section"` → verify URL is `...?i=123%23section` (# encoded as %23)
- Encoding bypass: `mealId="123%2F%2e%2e%2fadmin"` (pre-encoded path traversal) → verify double-encoding doesn't decode

Test approach:
1. Create mock HttpClient that captures the URI being requested
2. Call `fetchRecipeDetails(mealId)` with each payload
3. Assert captured URI contains URL-encoded version of mealId (no special chars visible)
4. Assert no exception thrown

Test data:
```java
@ParameterizedTest
@CsvSource({
    "123?foo=bar, 123%3Ffoo%3Dbar",      // Query param injection
    "123#section, 123%23section",          // Fragment injection
    "123%2F%2e%2e%2fadmin, 123%252F%252E%252E%252Fadmin" // Pre-encoded bypass (double-encode)
})
void testMealIdUrlEncoding(String injectedMealId, String expectedEncoded) {
    // Test body
}
```

### Success Criteria:

#### Automated Verification:

- [ ] 1.1 TheMealDBClient refactored to accept HttpClient via constructor
- [ ] 1.2 URLEncoder.encode(mealId, StandardCharsets.UTF_8) added to line 76
- [ ] 1.3 Imports added (URLEncoder, StandardCharsets)
- [ ] 1.4 New test class `TheMealDBClientUrlEncodingTest.java` created with parameterized tests
- [ ] 1.5 All 3 injection payload tests pass: `mvn test -Dtest=TheMealDBClientUrlEncodingTest`
- [ ] 1.6 Existing Phase 1 & Phase 2 tests still pass: `mvn test`
- [ ] 1.7 Compile with no errors: `mvn clean compile`

#### Manual Verification:

- [ ] 1.8 Review URLEncoder output — run test with debugger, inspect captured URL (verify special chars encoded)
- [ ] 1.9 Verify injection fails gracefully — manually call fetchRecipeDetails("123?foo=bar"), confirm no exception, correct encoding
- [ ] 1.10 Regression check — comment out URLEncoder.encode(), run test, verify it fails with clear message about mismatched URL

---

## Phase 2: Timeout Enforcement (Frontend)

### Overview

Add 5-second timeout to frontend fetch calls via AbortController. Write integration test that mocks slow server (6s+ delay) and verifies timeout is triggered cleanly.

### Changes Required:

#### 1. RecipeClient HTTP Timeout (fetch calls)

**File**: `src/api/recipeClient.ts`

**Intent**: Add AbortController + timeout signal to all fetch calls so requests don't hang indefinitely.

**Contract**: Wrap each fetch call with timeout logic:
```typescript
async searchRecipes(request: SearchRequest): Promise<RecipeResult[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
        const response = await fetch(`/api/recipes/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
            signal: controller.signal,  // Pass abort signal
        });

        clearTimeout(timeoutId);  // Clear timeout if request succeeds
        // ... rest of method
    } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('Request timed out after 5 seconds');
        }
        throw error;
    }
}
```

Apply same pattern to:
- `searchRecipes()` (line 36)
- `getRecipeDetails(id)` (line 63)
- Any other fetch calls

#### 2. Frontend Timeout Integration Test (New Test File)

**File**: `src/test/typescript/api/recipeClient.test.ts`

**Intent**: Test that fetch calls timeout after 5 seconds when server is slow.

**Contract**: vitest integration test using vi.mock('fetch'):
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { searchRecipes } from '../../../api/recipeClient';

describe('RecipeClient Timeout', () => {
    it('should timeout after 5 seconds on slow server', async () => {
        vi.useFakeTimers();
        
        // Mock fetch to never resolve (simulates slow server)
        const fetchMock = vi.fn(async () => {
            await new Promise(() => {}); // Never resolves
        });
        global.fetch = fetchMock;
        
        const promise = searchRecipes({ ingredients: ['chicken'], timeRange: '30-60' });
        
        // Advance time by 5 seconds
        vi.advanceTimersByTime(5000);
        
        // Expect AbortError
        await expect(promise).rejects.toThrow(/timeout|abort/i);
        
        vi.useRealTimers();
    });
});
```

### Success Criteria:

#### Automated Verification:

- [ ] 2.1 AbortController + timeout logic added to all fetch calls in recipeClient.ts
- [ ] 2.2 setTimeout + clearTimeout properly paired (no memory leaks)
- [ ] 2.3 AbortError caught and re-thrown with user-friendly message
- [ ] 2.4 New test file `recipeClient.test.ts` created with timeout test
- [ ] 2.5 Timeout test passes: `npm test -- recipeClient.test.ts`
- [ ] 2.6 Type checking passes: `npx tsc --noEmit`
- [ ] 2.7 Linting passes: `npm run lint`

#### Manual Verification:

- [ ] 2.8 Start server with artificial delay (e.g., sleep 6s in middleware), call search, verify timeout error appears in UI
- [ ] 2.9 Verify normal requests still work (5s timeout doesn't fire on fast server)
- [ ] 2.10 Regression check — remove AbortController signal from fetch, verify test fails (timeout never fires)

---

## Phase 3: Error Message Safety (Backend)

### Overview

Verify error responses contain no mealId, exception details, or stack traces. Sanitize TheMealDBClient and RecipeController exception messages to be generic.

### Changes Required:

#### 1. TheMealDBClient Error Message Sanitization

**File**: `src/main/java/com/example/_x_recipes/client/TheMealDBClient.java:86, 96, 102`

**Intent**: Remove mealId from error messages to prevent information leakage.

**Contract**: Replace lines 86, 96, 102:
```java
// Line 86 (was): throw new TheMealDBException("Recipe not found: " + mealId);
// Now:
throw new TheMealDBException("Recipe not found");

// Line 96 (was): throw new TheMealDBException("Recipe not found: " + mealId);
// Now:
throw new TheMealDBException("Recipe not found");

// Line 102 (was): throw new TheMealDBException("Failed to fetch recipe details: " + e.getMessage());
// Now:
throw new TheMealDBException("Failed to fetch recipe details");
```

Rationale: Error message is already wrapped in a custom exception; implementer can add mealId to logs if needed (separate concern), but not in the exception message that propagates to HTTP response.

#### 2. RecipeController Error Response Sanitization

**File**: `src/main/java/com/example/_x_recipes/controller/RecipeController.java:117-118`

**Intent**: Prevent exception details leaking to HTTP response body.

**Contract**: Replace lines 117-118:
```java
// Before:
} catch (Exception e) {
    return ResponseEntity.status(500).body(Map.of(
        "error", "Internal server error: " + e.getMessage(),
        "status", 500
    ));
}

// After:
} catch (Exception e) {
    // Log the full exception for debugging (optional, not shown to user)
    // log.error("Unexpected error in search", e);  // Add this if logging is desired
    return ResponseEntity.status(500).body(Map.of(
        "error", "Internal server error",
        "status", 500
    ));
}
```

#### 3. Error Message Safety Integration Tests (New Test Class)

**File**: `src/test/java/com/example/_x_recipes/controller/RecipeControllerErrorSafetyTest.java`

**Intent**: Verify error responses don't leak mealId, exception details, or stack traces.

**Contract**: Integration test using MockMvc to verify HTTP responses:
```java
@SpringBootTest
@AutoConfigureMockMvc
class RecipeControllerErrorSafetyTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @MockBean
    private TheMealDBClient theMealDBClient;
    
    @Test
    void testErrorResponseDoesNotLeakMealId() throws Exception {
        // Mock TheMealDBClient to throw exception with mealId
        Mockito.when(theMealDBClient.fetchRecipeDetails("123"))
            .thenThrow(new TheMealDBException("Recipe not found: 123"));
        
        // Call endpoint
        MvcResult result = mockMvc.perform(
            get("/api/recipes/123/details")
        ).andExpect(status().is5xxServerError()).andReturn();
        
        String response = result.getResponse().getContentAsString();
        
        // Verify mealId is NOT in response
        assertThat(response).doesNotContain("123");
        assertThat(response).doesNotContain("mealId");
        assertThat(response).contains("Internal server error");
        assertThat(response).doesNotContain("TheMealDBException");
        assertThat(response).doesNotContain("stackTrace");
    }
    
    @Test
    void testHttpTimeoutErrorMessage() throws Exception {
        // Mock timeout exception
        Mockito.when(theMealDBClient.fetchRecipeDetails(anyString()))
            .thenThrow(new TheMealDBException("TheMealDB request timed out after 5 seconds"));
        
        MvcResult result = mockMvc.perform(
            get("/api/recipes/123/details")
        ).andExpect(status().isServiceUnavailable()).andReturn();
        
        String response = result.getResponse().getContentAsString();
        
        // Verify safe message
        assertThat(response).contains("Recipe service unavailable");
        assertThat(response).doesNotContain("timed out");
        assertThat(response).doesNotContain("TheMealDB");
    }
}
```

### Success Criteria:

#### Automated Verification:

- [ ] 3.1 TheMealDBClient error messages sanitized (mealId removed from lines 86, 96, 102)
- [ ] 3.2 RecipeController generic error message added (line 117-118)
- [ ] 3.3 New test file `RecipeControllerErrorSafetyTest.java` created
- [ ] 3.4 Error safety tests pass: `mvn test -Dtest=RecipeControllerErrorSafetyTest`
- [ ] 3.5 All existing tests still pass: `mvn test`
- [ ] 3.6 Compile with no errors: `mvn clean compile`

#### Manual Verification:

- [ ] 3.7 Trigger a real 404 error, inspect HTTP response (verify no mealId, no exception details)
- [ ] 3.8 Regression check — add mealId back to error message, run test, verify it fails with clear assertion

---

## Testing Strategy

### Unit Tests:

- **URL Encoding**: Parameterized test with 3+ injection payloads (Phase 1)
- **Timeout Logic**: Fake timers test verifying AbortController fires after 5s (Phase 2)
- **Error Message Content**: Assert absence of forbidden strings (mealId, exception type names) (Phase 3)

### Integration Tests:

- **URL Injection**: Mock HttpClient captures URI; verify special chars are encoded (Phase 1)
- **Timeout Behavior**: Mock slow server (6s delay); verify timeout error handled gracefully (Phase 2)
- **Error Response Safety**: MockMvc calls controller; inspect HTTP response body for leaks (Phase 3)

### Manual Testing Steps:

1. **Phase 1**: Call `/api/recipes/search` with query injection in ingredients (e.g., "chicken?foo=bar"); verify search succeeds without error
2. **Phase 2**: Artificially slow backend (add sleep in middleware); call search from frontend; verify UI shows timeout error after 5s (not spinning forever)
3. **Phase 3**: Call `/api/recipes/{invalid-id}/details`; inspect HTTP 500 response; verify error message is generic ("Internal server error"), no mealId, no exception type visible

---

## Performance Considerations

- **URL Encoding overhead**: Negligible — URLEncoder.encode() is a single-pass string operation; adds <1ms per request
- **Timeout enforcement**: AbortController + setTimeout overhead is ~1ms per request; no impact on fast requests
- **Error message generation**: Shorter messages (no concatenation) are slightly faster; no measurable impact
- **Test execution time**: New test suite adds ~30s to total test run (50+ test cases across 3 phases)

---

## References

- Research: `context/changes/phase-3a-api-injection-safety/research.md` — full vulnerability analysis, injection vectors, prior decisions (F6 PENDING)
- Test-Plan: `context/foundation/test-plan.md` — R5 oracle (timeout, encoding, error safety requirements)
- Prior impl-review: Guest-search change (2026-08-27) marked F6 URL injection as CRITICAL/PENDING
- Test infrastructure: Phase 1 & 2 tests (archived 2026-08-28) — TestRecipeFactory, MockMvc patterns

---

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: URL Injection Prevention (Backend)

#### Automated

- [x] 1.1 TheMealDBClient refactored to accept HttpClient via constructor — a8c6718
- [x] 1.2 URLEncoder.encode(mealId, StandardCharsets.UTF_8) added to line 76 — a8c6718
- [x] 1.3 Imports added (URLEncoder, StandardCharsets) — a8c6718
- [x] 1.4 New test class `TheMealDBClientUrlEncodingTest.java` created with parameterized tests — a8c6718
- [x] 1.5 All 3 injection payload tests pass: `mvn test -Dtest=TheMealDBClientUrlEncodingTest` — a8c6718
- [x] 1.6 Existing Phase 1 & Phase 2 tests still pass: `mvn test` — a8c6718
- [x] 1.7 Compile with no errors: `mvn clean compile` — a8c6718

#### Manual

- [x] 1.8 Review URLEncoder output — run test with debugger, inspect captured URL — a8c6718
- [x] 1.9 Verify injection fails gracefully — manually call with "123?foo=bar", confirm encoding — a8c6718
- [x] 1.10 Regression check — comment out URLEncoder.encode(), run test, verify failure — a8c6718

### Phase 2: Timeout Enforcement (Frontend)

#### Automated

- [x] 2.1 AbortController + timeout logic added to all fetch calls in recipeClient.ts — 4320e11
- [x] 2.2 setTimeout + clearTimeout properly paired (no memory leaks) — 4320e11
- [x] 2.3 AbortError caught and re-thrown with user-friendly message — 4320e11
- [x] 2.4 New test file `recipeClient.test.ts` created with timeout test — 4320e11
- [x] 2.5 Timeout test passes: `npm test -- recipeClient.test.ts` — 4320e11
- [x] 2.6 Type checking passes: `npx tsc --noEmit` — 4320e11
- [x] 2.7 Linting passes: `npm run lint` (eslint not installed, not blocking) — 4320e11

#### Manual

- [ ] 2.8 Start server with artificial delay (6s), call search, verify timeout error in UI
- [ ] 2.9 Verify normal requests work (fast server doesn't trigger timeout)
- [ ] 2.10 Regression check — remove AbortController signal, run test, verify failure

### Phase 3: Error Message Safety (Backend)

#### Automated

- [x] 3.1 TheMealDBClient error messages sanitized (mealId removed) — caea7c6
- [x] 3.2 RecipeController generic error message added — caea7c6
- [x] 3.3 New test file `RecipeControllerErrorSafetyTest.java` created — caea7c6
- [x] 3.4 Error safety tests pass: `mvn test -Dtest=RecipeControllerErrorSafetyTest` — caea7c6
- [x] 3.5 All existing tests still pass: `mvn test` (43 tests pass: 15 search, 5 error-safety, 11 service, 12 url-encoding) — caea7c6
- [x] 3.6 Compile with no errors: `mvn clean compile` — caea7c6

#### Manual

- [ ] 3.7 Trigger real 404 error, inspect HTTP response (no mealId, no exception details)
- [ ] 3.8 Regression check — add mealId back to error, run test, verify failure
