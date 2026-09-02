# E2E Quality Rules

Every E2E test in this project must follow these rules. Violations block review.

## 1. Locators: Role-based, never CSS or XPath

**Rule:** Use `getByRole()`, `getByLabel()`, `getByText()` in that order. Reserve `getByTestId()` only when accessibility attributes are ambiguous. Never use CSS selectors (`.class-name`, `#id`), XPath (`//div[@class]`), or DOM structure (`nth-child`).

**Why:** Role-based locators mirror how users interact with the page (clicking buttons by their label, filling inputs by their label). They break less on DOM refactors and catch accessibility bugs.

**Example:**
```ts
// ✓ Good
await page.getByRole('button', { name: /sign up/i }).click();
await page.getByLabel(/email/i).fill('test@example.com');

// ✗ Bad
await page.locator('.btn-primary').click();
await page.locator('input[type=email]').fill('test@example.com');
```

## 2. Wait for State, Never `page.waitForTimeout()`

**Rule:** Wait for a *state change* (element visible, URL changed, response received) instead of time. Never use `waitForTimeout()`, `sleep()`, or delays.

**Why:** Time-based waits are fragile (flaky on slow CI, false-pass on slow networks). State waits are deterministic and catch real timing bugs.

**Example:**
```ts
// ✓ Good
await expect(page.getByText(/success/i)).toBeVisible();
await page.waitForURL('/recipes');
await page.waitForResponse(resp => resp.url().includes('/auth/login'));

// ✗ Bad
await page.waitForTimeout(1000);
await new Promise(r => setTimeout(r, 2000));
```

## 3. Test Independence & Unique Data

**Rule:** Each test:
- Runs standalone (own setup, action, assertion, cleanup).
- Uses unique test data (email: `user-${Date.now()}@example.com`, IDs with timestamps).
- Doesn't depend on another test's state.
- Cleans up side effects (logout, delete account) if the test creates them.
- Can run in any order and in parallel.

**Why:** Parallel runs and re-runs collide on shared test data. Cleanup guarantees no test-order dependencies.

**Example:**
```ts
// ✓ Good
const uniqueEmail = `test-${Date.now()}@example.com`;
test('signup creates account', async ({ page }) => {
  await page.goto('/signup');
  await page.getByLabel(/email/i).fill(uniqueEmail);
  await page.getByLabel(/password/i).fill('password123');
  await page.getByRole('button', { name: /sign up/i }).click();
  await expect(page.getByText(/success/i)).toBeVisible();
  // Cleanup: token is in localStorage; next test will have fresh storage
});

// ✗ Bad
test('signup creates account', async ({ page }) => {
  await page.goto('/signup');
  await page.getByLabel(/email/i).fill('test@example.com'); // Reused across runs
  // ...
});

test('logout clears token', async ({ page }) => {
  // Assumes signup test ran first—test order dependency
  await page.goto('/logout');
});
```

## 4. Authenticate Without the UI

**Rule:** For tests that need authentication, log in once via API (if endpoint exists) or localStorage setup, not by filling the login form every test.

**Why:** UI-based auth is slow and creates cascading failures (if login breaks, all protected-route tests fail). Direct login decouples the auth mechanism from the feature under test.

**Example:**
```ts
// ✓ Good
test('user can access favorites', async ({ page }) => {
  // Set up auth via localStorage (fast, deterministic)
  await page.context().addInitScript(() => {
    localStorage.setItem('auth_token', 'valid-jwt-token-for-test-user');
  });
  await page.goto('/favorites');
  await expect(page.getByText(/your favorites/i)).toBeVisible();
});

// ✗ Bad
test('user can access favorites', async ({ page }) => {
  // Fill login form every test (slow, couples to login UI)
  await page.goto('/login');
  await page.getByLabel(/email/i).fill('test@example.com');
  // ... 10 more lines of login ...
});
```

## 5. Assert on Observable User Outcomes, Not Implementation

**Rule:** Assert on what the user *sees* (text, visibility, URL, redirects), not internal state (function calls, API requests, Redux store). Use `expect(...).toBeVisible()`, `expect(...).toContainText()`, `expect(page).toHaveURL()`. Avoid spying on fetch/axios or assertion snapshots of JSON responses.

**Why:** Observable outcomes catch regressions that matter (user sees wrong data, button doesn't work). Implementation details change; user-visible behavior should not.

**Example:**
```ts
// ✓ Good
await expect(page.getByText(/welcome.*john/i)).toBeVisible();
await expect(page).toHaveURL('/recipes');

// ✗ Bad
const loginResult = await page.evaluate(() => window.authStore.user.email);
expect(loginResult).toBe('john@example.com');
```

---

## Anti-Patterns (Review Checklist)

Before committing, verify the test *doesn't* do any of these:

### ❌ Hallucinated Assertion
Asserts on something that doesn't exist or is impossible to reach.
- *Example:* Checks `localStorage['userId']` when only `auth_token` is set.
- *Fix:* Verify what the code actually stores; assert on that.

### ❌ Brittle Selector
Uses CSS class, DOM position, or exact text that breaks on minor UI refactors.
- *Example:* `getByText('Sign Up')` (breaks if button text changes to "Register").
- *Fix:* Use `getByRole('button', { name: /sign up|register/i })` (intent-based).

### ❌ Shared State / Test Order Dependency
Tests pass/fail depending on what previous tests did.
- *Example:* Test 1 signs up; Test 2 assumes token is in localStorage.
- *Fix:* Each test sets up its own auth state (localStorage, unique data).

### ❌ Wait-for-Time
Uses `waitForTimeout()`, `sleep()`, or assumes a delay will be enough.
- *Example:* `await page.waitForTimeout(2000)` before checking for success message.
- *Fix:* `await expect(page.getByText(/success/i)).toBeVisible()`.

### ❌ No Cleanup
Test leaves side effects (token in localStorage, account in DB, data in state) that bleed into other tests.
- *Example:* Signup test creates an account but doesn't delete it; second run fails because email exists.
- *Fix:* Use unique test data (email per run). Or add cleanup (logout, delete account) at test end if needed.

---

## Real vs. Mocked Boundaries

- **Real:** Auth (login/logout), routing (navigation), localStorage (token persistence), backend API (user data).
  - These boundaries are where integration risk hides. Keep them real to catch bugs.
- **Mocked:** External APIs (TheMealDB, third-party weather service), slow/flaky operations.
  - Mock at the network layer (e.g., `page.route()` to intercept fetch/XHR) when the external service is not your responsibility.

---

## Resources

- **Seed test:** `tests/e2e/seed.spec.ts` — the exemplar; every generated test is modeled on this.
- **Playwright docs:** https://playwright.dev/docs/api/class-locator (getByRole, getByLabel, etc.)
- **Accessibility tree:** Playwright renders the DOM as an accessibility tree; role-based locators query that tree, not CSS selectors.
