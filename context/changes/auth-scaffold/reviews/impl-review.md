<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Auth Scaffold — Spring Security + JWT

- **Plan**: context/changes/auth-scaffold/plan.md
- **Scope**: All 3 phases (Response Envelope & Error Integration, Validation & Configuration, Testing & Documentation)
- **Date**: 2026-08-31
- **Verdict**: APPROVED
- **Findings**: 3 critical, 3 warnings, 2 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS ✅ |
| Scope Discipline | PASS ✅ |
| Safety & Quality | FAIL ❌ (3 critical findings) |
| Architecture | PASS ✅ |
| Pattern Consistency | PASS ✅ |
| Success Criteria | PASS ✅ (all automated tests passing, 67/67) |

---

## Findings

### F1 — @CrossOrigin(origins = "*") overrides CORS security policy

- **Severity**: ❌ CRITICAL
- **Impact**: 🔎 MEDIUM — real security tradeoff requiring decision
- **Dimension**: Safety & Quality
- **Location**: src/main/java/com/example/_x_recipes/controller/AuthController.java:14
- **Detail**: `@CrossOrigin(origins = "*")` on auth controller allows *any* origin to call auth endpoints, contradicting the planned CORS policy managed via `SecurityConfig.corsConfigurationSource()` which uses environment variable `${cors.allowed-origins}`. This creates a security hole: any website can trigger signup/login on behalf of users.
- **Fix**: Remove the `@CrossOrigin(origins = "*")` annotation and rely solely on `SecurityConfig` CORS configuration, which respects the configured allowed origins.
  - Strength: Aligns with existing security architecture; removes redundant/conflicting policy.
  - Tradeoff: None — CORS is already handled at SecurityConfig level.
  - Confidence: HIGH — identical pattern used by RecipeSearchController.
  - Blind spot: None significant.
- **Decision**: FIXED (Applied Fix)

### F2 — JWT_SECRET and CORS_ALLOWED_ORIGINS default to empty strings at runtime

- **Severity**: ❌ CRITICAL
- **Impact**: 🔬 HIGH — deployment blocker; silent failure in production
- **Dimension**: Safety & Quality
- **Location**: src/main/resources/application-prod.properties:17, 22
- **Detail**: Both environment variables default to empty strings if not set: `jwt.secret=${JWT_SECRET:}` and `cors.allowed-origins=${CORS_ALLOWED_ORIGINS:}`. If either env var is missing during deployment, Spring will silently use an empty string. This breaks JWT token generation (empty secret) and CORS validation (empty allowed origins), causing auth failures without clear error messages. The plan intended to enforce these as required, not optional.
- **Fix**: Add validation in `SecurityConfig` constructor that throws an exception if either value is blank after property resolution.
  ```java
  @Value("${jwt.secret:}")
  private String jwtSecret;
  
  @PostConstruct
  void validateConfiguration() {
      if (jwtSecret == null || jwtSecret.trim().isEmpty()) {
          throw new IllegalStateException("JWT_SECRET environment variable is required and must not be empty");
      }
      // Similar check for CORS
  }
  ```
  - Strength: Fails fast with clear error at startup, visible in logs; prevents silent production outages.
  - Tradeoff: Requires environment variable to be set; cannot fall back to defaults.
  - Confidence: HIGH — validated approach for security-critical config.
  - Blind spot: None significant.
- **Decision**: FIXED (Applied Fix)

### F3 — Catch-all exception handler exposes internal error details to clients

- **Severity**: ❌ CRITICAL
- **Impact**: 🔎 MEDIUM — information disclosure; moderately sensitive
- **Dimension**: Safety & Quality
- **Location**: src/main/java/com/example/_x_recipes/controller/GlobalExceptionHandler.java:102-116
- **Detail**: The catch-all `handleException()` method includes the full exception class name and message in the client-facing `ApiResponse.detail` field (line 112: `e.getClass().getSimpleName() + ": " + e.getMessage()`). Also logs full stack traces with `e.printStackTrace()` (line 108). This exposes internal implementation details (class names, method names, package structure) to any API client, violating the plan's "no stack traces in error response" requirement. An attacker can use these details to probe the system.
- **Fix**: Return generic "Internal server error" message to client; log full stack trace only to server logs.
  ```java
  String clientMessage = "An unexpected error occurred. Please contact support.";
  String serverMessage = e.getClass().getSimpleName() + ": " + e.getMessage();
  logger.error(serverMessage, e); // Logs full stack trace for operators
  
  ErrorDetail errorDetail = new ErrorDetail(
      "INTERNAL_ERROR",
      clientMessage, // Generic message to client
      "Internal server error" // No exception details
  );
  ```
  - Strength: Eliminates information leakage; matches security best practices.
  - Tradeoff: Operators see details in server logs, not client response (requires log aggregation).
  - Confidence: HIGH — standard error handling pattern for APIs.
  - Blind spot: Log retention and access control; ensure server logs are not publicly accessible.
- **Decision**: FIXED (Applied Fix)

---

### F4 — Missing null check in getProfile() authentication extraction

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick fix; obvious guard clause
- **Dimension**: Safety & Quality
- **Location**: src/main/java/com/example/_x_recipes/controller/AuthController.java:57-58
- **Detail**: `getProfile()` calls `SecurityContextHolder.getContext().getAuthentication().getPrincipal()` without null-checking `getAuthentication()`. If auth filter fails to set authentication (malformed token, etc.), this throws NullPointerException instead of returning 401.
- **Fix**: Add null guard before accessing `getPrincipal()`.
- **Decision**: FIXED (Applied Fix)

### F5 — Email validation regex is too permissive

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick validation enhancement
- **Dimension**: Safety & Quality
- **Location**: src/main/java/com/example/_x_recipes/service/AuthService.java:77-80
- **Detail**: Regex `^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$` accepts invalid emails like "test@localhost" (no TLD) and misses RFC 5322 edge cases.
- **Fix**: Use Jakarta `@Email` validation annotation instead of custom regex.
- **Decision**: FIXED (Applied Fix)

### F6 — Potential NullPointerException in exception handler

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — defensive code
- **Dimension**: Safety & Quality
- **Location**: src/main/java/com/example/_x_recipes/controller/GlobalExceptionHandler.java:105-107
- **Detail**: `e.getCause()` may be null; accessing `.getClass()` without null check can NullPointerException.
- **Fix**: Add `if (e.getCause() != null)` guard.
- **Decision**: FIXED (Applied Fix)

---

### O1 — Exception hierarchy follows project patterns

- **Severity**: 📌 OBSERVATION
- **Dimension**: Pattern Consistency
- **Detail**: Custom exception classes (`AuthException`, `DuplicateEmailException`, `InvalidCredentialsException`, `UserNotFoundException`) follow the same inheritance pattern as `TheMealDBClient.TheMealDBException`. Consistent and well-organized.
- **Decision**: ACKNOWLEDGED

### O2 — Integration test coverage is comprehensive

- **Severity**: 📌 OBSERVATION
- **Dimension**: Success Criteria
- **Detail**: `AuthControllerIntegrationTest` covers happy paths (valid signup/login), error scenarios (duplicate email, wrong password, non-existent user), validation errors, and malformed JSON. 10 integration tests; all passing. Good coverage for a phase 3 deliverable.
- **Decision**: ACKNOWLEDGED

---

## Summary

**All automated verification passed**: 67 tests (0 failures), clean compilation, all plan items checked.

**All three critical findings are production-blockers** and must be addressed before deployment:
1. Remove overly permissive CORS annotation
2. Add configuration validation for required secrets
3. Fix error response to not leak internal details

**Three additional warnings** are defensive improvements (null checks, email validation validation).

**Plan adherence is solid** — all planned changes implemented. No scope creep or skipped items detected.

