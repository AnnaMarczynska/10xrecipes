# User Registration & Login with JWT — Plan Brief

> Full plan: `context/changes/user-auth/plan.md`

## What & Why

Add user registration and login to 10xRecipes. Users create email + password accounts, receive JWT tokens, and access authenticated features (favorites, allergens, notes). The auth infrastructure backend is complete (F-03: auth-scaffold). This plan adds the frontend: signup/login pages, token management, and session handling. Token stored in localStorage, auto-injected into API requests via interceptor.

## Starting Point

**Backend ready:**
- Spring Security configured, JWT provider functional, endpoints tested (67 tests passing)
- ApiResponse envelope pattern established, error handling integrated
- User persistence wired to PostgreSQL

**Frontend scaffold exists:**
- React 19.2.8 + Vite with dev server (port 5173) and proxy to backend
- Component structure established (src/components/, src/pages/, src/api/)
- API client patterns exist (recipeClient.ts)

**What's missing:**
- Auth API client (signup/login/logout calls)
- Signup and login pages with forms
- Token utilities and API interceptor
- Session state management (React context)
- Integration tests

## Desired End State

After this plan:
- Users can sign up and log in on dedicated pages
- JWT token stored in localStorage, auto-injected into all API requests
- Auth errors displayed near form fields (field-level UX)
- Success messages show on signup/login page with link to recipes
- Protected routes (S-03+) can check authentication from context
- Full integration test coverage
- Backend endpoints documented in Swagger

## Key Decisions Made

| Decision | Choice | Why | Source |
|----------|--------|-----|--------|
| Component Structure | Separate `/pages` for signup.tsx, login.tsx | Matches common SPA pattern, clean routing | Plan |
| Token Storage | localStorage with API client interceptor | Standard OAuth2 pattern, persistent across reloads, automatic injection | Plan |
| Error Handling | Field-level messages + optional toast | Users know which field caused error, matches form UX best practices | Plan |
| Validation Layer | Server-side only (no client validation) | Simpler frontend code, server is source of truth, faster to implement | Plan |
| Session After Login | Show success message, stay on page, link to recipes | User can confirm login before navigating, less disruptive | Plan |
| Testing | Integration tests (frontend + backend) + manual E2E | Real flow validation, catches integration gaps, simpler than full E2E suite | Plan |

## Scope

**In scope:**
- Auth API client (authClient.ts)
- Signup and login React pages
- Token storage utilities and API interceptor
- Form error display (field-level + toast)
- React context for authentication state
- Protected route guards
- Navigation flows (redirect after auth)
- Logout button and flow
- Integration tests (signup, login, protected routes)
- Manual E2E verification

**Out of scope:**
- Email verification (v1.1)
- Password reset (v1.1)
- Client-side form validation (server validates; frontend shows errors)
- Refresh token logic (24-hour tokens sufficient)
- Rate limiting / brute-force protection (v1.1)
- Social login / OAuth (v1.1)

## Architecture / Approach

**Four-phase approach:**

1. **Phase 0: API Bridge** — Create authClient.ts (auth API calls), token utilities, HTTP interceptor for auto-injection
2. **Phase 1: Pages** — Build signup.tsx and login.tsx with forms, field-level error display, validation utilities
3. **Phase 2: Integration** — Wire context for authentication state, protected route guards, session management, redirect flows
4. **Phase 3: Tests** — Integration tests (frontend + backend), manual E2E verification, finalize Swagger docs

Each phase builds on the previous; no breaking changes between phases.

**Tech stack:**
- Frontend: React 19 + TypeScript, axios for HTTP, localStorage for token
- Backend: Spring Security + JWT (already done in F-03)
- Testing: Vitest + React Testing Library + MSW

## Phases at a Glance

| Phase | Deliverable | Key Risk | Time |
|-------|-------------|----------|------|
| 0 | Auth API client, token utilities, interceptor | Axios interceptor complexity | ~20% |
| 1 | Signup/login pages, forms, error UI | Form state management, error mapping | ~30% |
| 2 | Session state, protected routes, navigation | Context setup, redirect logic | ~35% |
| 3 | Integration tests, E2E verification | Test coverage completeness | ~15% |

**Prerequisites:** F-01 ✅ (API), F-03 ✅ (auth endpoints), existing React/Vite setup ✅

**Estimated effort:** ~3 focused sessions across 4 phases (depends on React experience)

## Open Risks & Assumptions

- **Risk: Token leak via localStorage** — localStorage is vulnerable to XSS. Mitigation: v1.1 will explore httpOnly cookies if XSS exposure becomes critical.
- **Assumption: Backend validation sufficient** — Plan relies on server-side validation; frontend doesn't duplicate rules. If rules diverge, frontend may show confusing errors. Mitigation: keep validation logic in one place (server).
- **Assumption: Existing auth endpoints work as documented** — F-03 is tested; this plan assumes endpoints are stable. Mitigation: F-03 integration tests already verified.

## Success Criteria (Summary)

1. Users can create accounts and log in via dedicated pages
2. Token persists across page reloads and is auto-injected into API calls
3. Auth errors display near form fields with clear messages
4. Protected routes (future S-03+) can check authentication status
5. All integration tests pass (signup, login, protected routes)
6. Manual E2E verification succeeds (full flow in browser)
