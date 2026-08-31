# Auth Scaffold — Plan Brief

> Full plan: `context/changes/auth-scaffold/plan.md`

## What & Why

Spring Security and JWT infrastructure are already scaffolded in the codebase. This plan **completes and integrates** that auth system with F-01's API response patterns, adds the logout endpoint, ensures proper error handling, and verifies all auth flows with comprehensive tests.

The auth system enables user registration and login via email + password, stateless token-based authentication with 24-hour JWT tokens, and opens the path for user-specific features (favorites, allergens, notes).

**Why now:** F-01 (API Scaffold) is complete, and S-02 (User Auth slice) depends on F-03 to ship. Auth is the gateway to all user-facing features.

## Starting Point

Spring Security, JwtTokenProvider, JwtAuthenticationFilter, and AuthService already exist and are functional. However:
- Auth endpoint responses are NOT wrapped in ApiResponse envelope (inconsistent with F-01)
- Auth errors bypass GlobalExceptionHandler (built earlier, not integrated with auth)
- Logout endpoint is missing
- Request validation uses no annotations (manual checks in service)
- Comprehensive test coverage is absent
- JWT secret management lacks explicit configuration profiles

The work is integration and completion, not build-from-scratch.

## Desired End State

- ✅ All auth endpoints return ApiResponse envelopes (consistent with recipe endpoints)
- ✅ Auth errors are caught by GlobalExceptionHandler (409 duplicate email, 401 invalid credentials, 404 user not found)
- ✅ Logout endpoint exists; stateless design (server makes no changes, frontend deletes token)
- ✅ Request validation via @Valid annotations (no manual checks)
- ✅ Configuration profiles for dev/prod (dev uses safe fallback, prod requires JWT_SECRET env var)
- ✅ All auth flows covered by unit + integration tests (happy path, errors, security scenarios)
- ✅ Auth endpoints documented in Swagger/OpenAPI
- ✅ Auth system is production-ready and secure

## Key Decisions Made

| Decision | Choice | Why | 
| --- | --- | --- |
| Response Format | Wrap in ApiResponse envelope | Consistent with F-01 pattern; simplifies frontend (all endpoints return same shape) |
| Logout Strategy | Stateless (client deletes token) | Maintains stateless architecture; keeps implementation simple (no blacklist needed for MVP) |
| Secret Management | Config file with env fallback | Dev profile uses safe fallback for local testing; prod profile requires JWT_SECRET environment variable (fail-fast) |
| Password Rules | 6-128 chars, no complexity | Balances security and usability; MVP scope (complexity rules deferred to v1.1) |
| Token Expiration | 24 hours (no refresh logic) | Simplifies implementation (no refresh token endpoint needed); acceptable for MVP |
| Email Validation | Regex format only | Fast, no external dependencies; sufficient for MVP (deliverability checks deferred to v1.1) |
| Error Handling | Integrate with GlobalExceptionHandler | Consistent error format across all endpoints (includes auth) |
| Testing | All flows: happy path + error + security | Comprehensive coverage to catch bugs early; prevents security regressions |

## Scope

**In scope:**
- Wrap auth responses in ApiResponse envelope
- Integrate auth errors with GlobalExceptionHandler
- Add logout endpoint
- Request validation annotations on SignupRequest/LoginRequest
- Configuration profiles (dev/prod)
- Swagger documentation
- Unit + integration tests for all auth flows
- JWT secret management strategy

**Out of scope:**
- Email verification (v1.1)
- Password reset (v1.1)
- Token refresh logic (v1.1, if needed)
- Rate limiting on auth endpoints (v1.1 or API gateway)
- OAuth/SSO integration (v1.1)
- Multi-role authorization (out of scope — all users have same permissions)

## Architecture / Approach

**Three phases, each integration-focused:**

1. **Phase 1: Response Envelope & Error Integration** — Adapt existing endpoints to use ApiResponse; integrate exceptions; add logout
2. **Phase 2: Validation & Configuration** — Add @Valid annotations; configure dev/prod profiles; document in Swagger
3. **Phase 3: Testing & Documentation** — Unit + integration tests for all flows; verify end-to-end

Stateless architecture throughout: JwtTokenProvider generates/validates tokens; JwtAuthenticationFilter processes Bearer tokens; SecurityConfig permits /auth/** unauthenticated access. No server-side session state.

## Phases at a Glance

| Phase | Delivers | Risk |
| --- | --- | --- |
| 1. Response Envelope & Error Integration | ApiResponse wrapping, logout endpoint, exception integration | Breaking change to response format (coordinate with frontend) |
| 2. Validation & Configuration | @Valid annotations, dev/prod profiles, Swagger docs | Prod profile requires environment variable setup (fail-fast is safe) |
| 3. Testing & Documentation | Unit + integration tests, security verification | Test complexity (many flows, edge cases); requires careful mocking |

**Prerequisites:** F-01 (REST API scaffold) must be complete — we depend on ApiResponse and GlobalExceptionHandler patterns.

**Estimated effort:** ~2-3 sessions across 3 phases (per agentic implementation pace).

## Open Risks & Assumptions

- **Assumption: 24-hour token expiration is acceptable for MVP.** If users complain they're logged out mid-session, refresh token logic will need to ship. Mitigation: monitor session length in v1.1.
- **Assumption: Stateless logout (no server-side token blacklist) is acceptable.** Leaked tokens remain valid for 24 hours. Mitigation: v1.1 can add Redis-backed blacklist if needed; for MVP, accept the risk.
- **Assumption: Email regex validation is sufficient.** Won't catch many invalid formats. Mitigation: v1.1 can add DNS MX record check or email verification flow.
- **Risk: Breaking change to auth response format.** Existing clients (if any) expect old format. Mitigation: coordinate frontend changes with backend; use feature flag if needed (v1.1).
- **Risk: JWT_SECRET must be set in production via environment.** Deployment must handle this correctly. Mitigation: clear documentation, fail-fast in prod profile if missing, test locally with dev profile.

## Success Criteria (Summary)

- All auth endpoints return ApiResponse-wrapped responses
- Auth errors are caught by GlobalExceptionHandler and wrapped consistently
- Signup, login, logout, and profile endpoints all work end-to-end
- 80%+ code coverage on auth-related classes
- All automated and manual tests pass
- Swagger/OpenAPI documents auth endpoints with proper schemas
