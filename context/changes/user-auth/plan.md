# User Registration & Login with JWT — Implementation Plan

## Overview

S-02 adds user authentication to 10xRecipes. Users can create accounts with email + password, log in to receive JWT tokens, and access authenticated features (favorites, allergens, notes). This plan integrates the completed auth-scaffold backend (F-03) with the frontend, adding signup/login pages, token management, and session handling. Token is stored in localStorage and auto-injected into API requests via interceptor.

The work spans frontend (React pages + token utilities) and backend-frontend integration only—the auth infrastructure (Spring Security, JWT provider, endpoints) is already complete and tested in F-03.

## Current State Analysis

**What exists today:**
- Spring Security + JWT auth endpoints: POST `/auth/signup`, POST `/auth/login`, GET `/auth/logout`, GET `/auth/profile` (all tested, 67 integration tests passing)
- ApiResponse envelope pattern established (F-01)
- React 19.2.8 + Vite dev server (port 5173) with `/api` proxy to backend (8080)
- Component structure: src/components/, src/pages/, src/api/ directories
- API client pattern: recipeClient.ts (existing)
- User entity + database persistence ready

**What's missing:**
- Auth API client (login/signup/logout API calls)
- Token utilities (localStorage wrapper, validation)
- API interceptor to inject JWT token into requests
- Auth pages: signup.tsx, login.tsx
- Shared validation utilities (validateEmail, validatePassword)
- Protected route guards
- Session/user context for app-wide state
- Error handling UI (field-level errors + toasts)
- Integration tests for signup/login flow

**Key Constraints:**
- MVP uses long-lived tokens (24-hour expiration); no refresh token logic
- No email verification (sign up creates account immediately)
- Server-side validation only (no client-side validation; trust backend)
- Stateless logout (server returns success, frontend deletes token)
- Token stored in localStorage (persistent across page reloads)
- Token auto-injected via API client interceptor
- Error messages shown near form fields + optional toast

## Desired End State

After this plan:
- ✅ Users can sign up with email + password on `/signup` page
- ✅ Users can log in on `/login` page
- ✅ JWT token stored in localStorage after login, auto-injected in API requests
- ✅ Signup/login show success message on same page, offer link to recipes
- ✅ Auth errors display near form fields (duplicate email → email field error, wrong password → password field error)
- ✅ Logout endpoint returns 200, frontend deletes token
- ✅ Protected routes (future S-03+) can check authentication status from React context
- ✅ Full integration test coverage: happy path + error scenarios
- ✅ Backend auth endpoints documented in Swagger/OpenAPI

## What We're NOT Doing

- **Email verification**: Sign-up creates account immediately; verification is v1.1 feature
- **Password reset**: Out of scope for MVP; deferred to v1.1
- **Client-side validation**: Forms submit to server; server validates and returns errors (simpler, server is source of truth)
- **Refresh token flow**: 24-hour tokens avoid complexity; refresh is v1.1 feature
- **Session timeout warnings**: No "your session expires in X minutes" UI
- **Social/OAuth login**: Email + password only; OAuth is v1.1 feature
- **Rate limiting**: Brute-force protection deferred to v1.1 or API gateway

## Implementation Approach

**Four phases in sequence:**

1. **Phase 0: Auth API Client** — Create authClient.ts with API calls (login, signup, logout), token utilities (localStorage wrapper, validation), and API interceptor for automatic token injection
2. **Phase 1: Auth Pages** — Build signup.tsx and login.tsx pages with forms, shared validation utilities, error UI (field-level + toast), and styling
3. **Phase 2: Session Management** — Wire token lifecycle (store/retrieve/delete), implement protected route guards, create user context for app-wide authentication state, and redirect flows
4. **Phase 3: Testing & Integration** — Comprehensive integration tests (frontend + backend), manual E2E verification in browser, finalize Swagger documentation

Each phase builds on the previous; authentication remains functional between phases.

---

## Phase 1: Auth API Client

### Overview

Create the API bridge between frontend and backend auth endpoints. Set up token storage utilities, API client functions, and HTTP interceptor for automatic token injection into all requests.

### Changes Required:

#### 1. Create Auth API Client

**File**: `src/api/authClient.ts`

**Intent**: Encapsulate auth API calls (signup, login, logout) following the recipeClient.ts pattern.

**Contract**: Export functions:
- `signup(email: string, password: string): Promise<{token: string, email: string}>`
- `login(email: string, password: string): Promise<{token: string, email: string}>`
- `logout(): Promise<{status: string}>`

Use axios instance with error handling. Return only the data payload (unwrap ApiResponse envelope). Throw error on non-2xx status with backend error details.

#### 2. Create Token Storage Utilities

**File**: `src/utils/tokenStorage.ts`

**Intent**: Abstract localStorage token management (set, get, delete, validate).

**Contract**:
- `setToken(token: string): void` — save to localStorage under key "auth_token"
- `getToken(): string | null` — retrieve token or null if missing
- `deleteToken(): void` — remove token from storage
- `isTokenValid(): boolean` — check if token exists (non-empty, not null)
- `getAuthHeader(): {Authorization: string} | {}` — return header object for API calls (used by interceptor)

#### 3. Create API Interceptor

**File**: `src/api/interceptor.ts`

**Intent**: Automatically inject JWT token into every API request's Authorization header.

**Contract**: Configure axios interceptor:
- Request interceptor: before each request, inject `Authorization: Bearer <token>` header if token exists
- Response interceptor: no changes needed (error responses already wrapped in ApiResponse)

Export configured axios instance with interceptor attached.

#### 4. Update recipeClient.ts to Use Interceptor

**File**: `src/api/recipeClient.ts`

**Intent**: Use the new axios instance (with interceptor) instead of creating a new one.

**Contract**: Import axios from interceptor.ts, use it for all requests. Existing recipe search, details calls continue to work; now tokens are auto-injected on authenticated requests.

### Success Criteria:

#### Automated Verification:

- `src/api/authClient.ts` exports signup, login, logout functions
- `src/utils/tokenStorage.ts` exports token utility functions
- `src/api/interceptor.ts` exports axios instance with interceptor attached
- `npm run build` succeeds (TypeScript compiles, no errors)
- Token is correctly stored to and retrieved from localStorage
- API interceptor adds Authorization header when token exists
- API interceptor omits header when token is null/empty

#### Manual Verification:

- Start dev server: `npm run dev`
- Verify dev server runs without errors on port 5173
- Verify proxy to backend works: open browser console, no CORS errors when calling `/api/*`
- Manually inspect localStorage after test token set: key "auth_token" contains value

---

## Phase 2: Auth Pages

### Overview

Build signup and login page components with forms, validation, and error handling. Create shared validation utilities. Implement field-level error display and success messages.

### Changes Required:

#### 1. Create Shared Validation Utilities

**File**: `src/utils/validation.ts`

**Intent**: Validation functions used by both signup and login forms.

**Contract**: Export functions:
- `validateEmail(email: string): {valid: boolean, error?: string}` — check email format (basic @domain check)
- `validatePassword(password: string): {valid: boolean, error?: string}` — check length 6-128 chars
- `validateSignupForm(email: string, password: string): {valid: boolean, errors: {email?: string, password?: string}}`
- `validateLoginForm(email: string, password: string): {valid: boolean, errors: {email?: string, password?: string}}`

Note: Server-side validation is authoritative; client validation is for UX feedback only.

#### 2. Create Signup Page

**File**: `src/pages/SignupPage.tsx`

**Intent**: User account creation flow.

**Contract**: 
- Form fields: email, password
- Submit button: "Sign Up"
- Error display: show error message below email field if email error, below password field if password error
- Success display: on signup success, show "Account created! You are logged in." message and link "Go to recipes"
- State management: email, password, errors, loading, success flags
- On submit: validate form → call authClient.signup() → store token → show success
- On error: display backend error message (DUPLICATE_EMAIL → "Email already registered", validation errors → field-specific messages)

#### 3. Create Login Page

**File**: `src/pages/LoginPage.tsx`

**Intent**: User authentication flow.

**Contract**:
- Form fields: email, password
- Submit button: "Log In"
- Error display: show error message below email field if email error, below password field if password error
- Success display: on login success, show "Welcome back! You are logged in." message and link "Go to recipes"
- State management: email, password, errors, loading, success flags
- On submit: validate form → call authClient.login() → store token → show success
- On error: display backend error (INVALID_CREDENTIALS → "Wrong password", USER_NOT_FOUND → "User not found", validation errors → field errors)

#### 4. Create Error Message Component

**File**: `src/components/FormError.tsx`

**Intent**: Reusable field-level error display.

**Contract**: Props: `message: string | undefined`. Render error text below form field (conditionally, only if message exists). Style: red text, small font, margin above.

#### 5. Add Styling

**Files**: `src/pages/SignupPage.css`, `src/pages/LoginPage.css`

**Intent**: Basic form styling (inputs, buttons, error messages, success message).

**Contract**: Match existing component styles. Inputs with labels, button with hover state, error text in red, success message in green.

### Success Criteria:

#### Automated Verification:

- `src/pages/SignupPage.tsx` compiles without errors
- `src/pages/LoginPage.tsx` compiles without errors
- `src/components/FormError.tsx` renders conditionally based on props
- `src/utils/validation.ts` export functions callable from components
- `npm run build` succeeds
- Type checking passes: `tsc --noEmit`

#### Manual Verification:

- Dev server runs: `npm run dev`
- Navigate to `/signup` (or `/signup` route if configured) → form displays with email, password fields
- Navigate to `/login` → form displays with email, password fields
- Enter invalid email in signup → should not show error yet (no client-side validation; server validates)
- Submit signup form with valid input → form submits (loading state briefly shown)
- After successful signup → success message appears with link to recipes
- After successful login → success message appears with link to recipes

---

## Phase 3: Session Management

### Overview

Wire token lifecycle management, create React context for authentication state, implement protected route guards, and set up navigation flows.

### Changes Required:

#### 1. Create Auth Context

**File**: `src/context/AuthContext.tsx`

**Intent**: App-wide authentication state (current user, is logged in, login/logout methods).

**Contract**:
- Context exports: `{user: {email: string} | null, isLoggedIn: boolean, login(email, token), logout()}`
- Provider wraps app at top level (in main.tsx or App.tsx)
- On mount: check localStorage for token; if exists, set isLoggedIn = true, extract email from JWT claims (or call `/auth/profile` to get user data)
- login(email, token): store token via tokenStorage, set context state
- logout(): delete token, clear context state

#### 2. Create Protected Route Guard

**File**: `src/components/ProtectedRoute.tsx`

**Intent**: Wrap routes that require authentication; redirect to login if not authenticated.

**Contract**: Props: `{children: React.ReactNode}`. If context.isLoggedIn = true, render children; otherwise redirect to `/login` page.

Usage in router: `<ProtectedRoute><FavoritesPage /></ProtectedRoute>`

#### 3. Create Navigation Helpers

**File**: `src/utils/navigation.ts`

**Intent**: Helper functions for redirecting after auth actions.

**Contract**: 
- `redirectToRecipes()` — navigate to `/recipes` (guest search page or favorites if authenticated)
- `redirectToLogin()` — navigate to `/login`
- `redirectToSignup()` — navigate to `/signup`

#### 4. Update Auth Pages to Use Context

**Files**: `src/pages/SignupPage.tsx`, `src/pages/LoginPage.tsx`

**Intent**: After successful auth, update context and redirect instead of just showing success message.

**Contract**:
- On signup/login success: call `authContext.login(email, token)` → update context → redirect to recipes link
- Link text: "Go to recipes" button/link calls `redirectToRecipes()`
- On logout: call `authContext.logout()` → redirect to login

#### 5. Add Logout Button to Header/Nav

**File**: `src/components/Header.tsx` or main nav component (create if missing)

**Intent**: Show logout button when logged in.

**Contract**: If `context.isLoggedIn = true`, show logout button. On click: call authClient.logout() → authContext.logout() → redirectToLogin().

### Success Criteria:

#### Automated Verification:

- `src/context/AuthContext.tsx` compiles and exports context + provider
- `src/components/ProtectedRoute.tsx` renders children when logged in, redirects when not
- `src/utils/navigation.ts` exports navigation functions
- Auth pages updated to use context and navigation
- `npm run build` succeeds
- Type checking passes

#### Manual Verification:

- Dev server runs
- Login with valid credentials → success message shows → click "Go to recipes" → page redirects to recipes/home page
- Reload page → still logged in (context reads token from localStorage, shows user as logged in)
- Click logout → redirected to login page
- Try to access protected page (favorites) without login → redirected to login page
- Log in again → can access protected page

---

## Phase 4: Testing & Integration

### Overview

Comprehensive integration tests for auth flows, manual E2E verification in browser, finalize documentation.

### Changes Required:

#### 1. Create Integration Tests for Auth API Client

**File**: `src/api/__tests__/authClient.test.ts`

**Intent**: Test authClient functions against real backend.

**Contract**: Test cases:
- `signup()` with valid email/password → returns token and email
- `signup()` with duplicate email → throws error with code "DUPLICATE_EMAIL"
- `login()` with correct password → returns token
- `login()` with wrong password → throws error with code "INVALID_CREDENTIALS"
- `logout()` → returns success

Use real backend (start dev server + Spring Boot). Mock localStorage if needed.

#### 2. Create Integration Tests for Auth Pages

**File**: `src/pages/__tests__/SignupPage.test.tsx`

**Intent**: Test signup page end-to-end (user fills form, submits, sees success).

**Contract**: Using React Testing Library + MSW (Mock Service Worker) to mock backend:
- Render SignupPage → form displays
- Fill email and password → submit
- Wait for success message → verify message appears
- Verify token saved to localStorage

Similar test for LoginPage.

#### 3. Create Protected Route Tests

**File**: `src/components/__tests__/ProtectedRoute.test.tsx`

**Intent**: Test that ProtectedRoute redirects when not logged in.

**Contract**:
- When not logged in → component redirects to login page
- When logged in → component renders children

#### 4. Finalize Swagger/OpenAPI Documentation

**File**: Backend (already done in F-03, verify)

**Intent**: Ensure auth endpoints are documented with request/response schemas.

**Contract**: GET `/v3/api-docs` returns OpenAPI spec including:
- POST `/auth/signup` with SignupRequest schema
- POST `/auth/login` with LoginRequest schema
- GET `/auth/logout` 
- GET `/auth/profile` (with Bearer token security)
- Error responses (400, 401, 404, 409) with error schema

### Success Criteria:

#### Automated Verification:

- `npm test` runs all tests without errors
- All signup/login integration tests pass
- ProtectedRoute tests pass
- `npm run build` succeeds
- Type checking passes
- GET `http://localhost:8080/v3/api-docs` returns valid OpenAPI spec with auth endpoints

#### Manual Verification:

- Start dev server: `npm run dev`
- Start backend: `mvn spring-boot:run`
- Navigate to `http://localhost:5173/signup` → form displays
- Fill in email/password → click Sign Up → verify success message appears
- Click "Go to recipes" → navigate to home/recipes page
- Verify token stored in localStorage (open DevTools → Application → Local Storage)
- Navigate to `http://localhost:5173/login` → form displays
- Log in with same account → success message appears
- Click logout (if logout button exists) → navigate to login page
- Try to navigate to protected page (favorites) without logging in → redirected to login
- Log in again → access protected page works

---

## Testing Strategy

### Integration Tests (Frontend + Backend):

- **Scope**: Full auth flow with real backend API calls
- **Tool**: Vitest + React Testing Library + MSW
- **Coverage**: Happy path (signup → login → access), error scenarios (duplicate email, wrong password), validation failures
- **Examples**: User fills signup form → API returns token → stored in localStorage → can access profile endpoint

### Unit Tests (Components):

- **Scope**: Individual components with mocked context/props
- **Tool**: React Testing Library
- **Coverage**: Form rendering, error display, button clicks
- **Examples**: FormError component shows message when prop provided, hides when undefined

### Manual E2E:

- **Scope**: Full user journey in browser
- **Steps**: Signup → login → access protected feature → logout
- **Browser**: Dev server running on port 5173, backend on 8080
- **Verification**: Success/error messages display, redirects work, localStorage persists token

---

## References

- **Completed**: `context/archive/2026-08-31-auth-scaffold/` — backend auth infrastructure
- **Pattern reference**: `src/api/recipeClient.ts` — existing API client structure
- **Component reference**: `src/pages/RecipeDetailPage.tsx` — existing page pattern
- **Auth endpoints**: POST `/auth/signup`, POST `/auth/login`, GET `/auth/logout`, GET `/auth/profile`

---

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Auth API Client

#### Automated

- [x] 1.1 Create authClient.ts with signup, login, logout functions
- [x] 1.2 Create tokenStorage.ts with get/set/delete/validate utilities
- [x] 1.3 Create API interceptor (axios with Bearer token injection)
- [x] 1.4 Update recipeClient.ts to use interceptor axios instance
- [x] 1.5 Verify npm build succeeds, no TypeScript errors
- [x] 1.6 Verify token correctly stored/retrieved from localStorage

#### Manual

- [x] 1.7 Verify dev server runs without CORS errors
- [x] 1.8 Verify API interceptor adds Authorization header when token exists

### Phase 2: Auth Pages

#### Automated

- [ ] 2.1 Create shared validation utilities (validateEmail, validatePassword, validateSignupForm, validateLoginForm)
- [ ] 2.2 Create SignupPage.tsx with form, error display, success message
- [ ] 2.3 Create LoginPage.tsx with form, error display, success message
- [ ] 2.4 Create FormError.tsx component for field-level error display
- [ ] 2.5 Add CSS styling for signup/login pages and forms
- [ ] 2.6 Verify npm build succeeds, type checking passes

#### Manual

- [ ] 2.7 Verify /signup page displays form with email and password fields
- [ ] 2.8 Verify /login page displays form with email and password fields
- [ ] 2.9 Test signup form submission (valid input → success message appears)
- [ ] 2.10 Test login form submission (valid input → success message appears)

### Phase 3: Session Management

#### Automated

- [ ] 3.1 Create AuthContext.tsx with user state and login/logout methods
- [ ] 3.2 Create ProtectedRoute.tsx component for route guards
- [ ] 3.3 Create navigation.ts with redirect helpers
- [ ] 3.4 Update SignupPage and LoginPage to use AuthContext
- [ ] 3.5 Add logout button to header/nav component
- [ ] 3.6 Verify npm build succeeds, type checking passes

#### Manual

- [ ] 3.7 Test full login flow: submit form → success message → click "Go to recipes" → redirect works
- [ ] 3.8 Verify token persists: reload page → still logged in (context loads token from localStorage)
- [ ] 3.9 Test logout: click logout button → redirected to login page → access protected page → redirected to login
- [ ] 3.10 Test protected route: try to access protected page without login → redirected to login

### Phase 4: Testing & Integration

#### Automated

- [ ] 4.1 Create authClient integration tests (signup, login, logout with real backend)
- [ ] 4.2 Create SignupPage integration tests (form submission, success, localStorage)
- [ ] 4.3 Create LoginPage integration tests (form submission, success, token injection)
- [ ] 4.4 Create ProtectedRoute tests (redirect when not logged in, render when logged in)
- [ ] 4.5 All tests pass: `npm test`
- [ ] 4.6 Verify Swagger/OpenAPI includes auth endpoints with proper schemas
- [ ] 4.7 npm build succeeds, type checking passes

#### Manual

- [ ] 4.8 Manual E2E: signup → login → access protected feature (if available) → logout
- [ ] 4.9 Verify localStorage shows auth token after login
- [ ] 4.10 Verify Authorization header injected in network requests (DevTools → Network tab)
