# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth-protected-route.spec.ts >> Protected Routes >> authenticated user can access protected route
- Location: tests/e2e/auth-protected-route.spec.ts:22:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByLabel(/email/i)

```

# Page snapshot

```yaml
- generic [ref=e4]:
  - heading "🍽️ 10xRecipes" [level=1] [ref=e5]
  - paragraph [ref=e6]: Find recipes that match your needs
  - generic [ref=e7]:
    - generic [ref=e8]:
      - text: Email
      - textbox "you@example.com" [ref=e9]
    - generic [ref=e10]:
      - text: Password
      - textbox "••••••••" [ref=e11]
    - button "Login" [ref=e12] [cursor=pointer]
  - button "Don't have an account? Register" [ref=e13] [cursor=pointer]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | // Risk 3.10: Protected route redirects to login when not authenticated
  4  | // Seed: tests/e2e/seed.spec.ts (role-based locators, state waits, unique test data)
  5  | 
  6  | test.describe('Protected Routes', () => {
  7  |   // ===== Risk 3.10: Protected Route Redirect =====
  8  |   test('unauthenticated user trying to access protected route is redirected to login', async ({ page }) => {
  9  |     // Setup: start with a new context (no prior auth)
  10 |     // Navigate to home first to establish origin context, then clear storage
  11 |     await page.goto('/');
  12 |     await page.evaluate(() => localStorage.clear());
  13 | 
  14 |     // Action: try to access protected /favorites route directly
  15 |     await page.goto('/favorites');
  16 | 
  17 |     // Assert: redirected to login page (URL changed, login form visible)
  18 |     await expect(page).toHaveURL('/login');
  19 |     await expect(page.getByRole('heading', { name: /log in/i })).toBeVisible();
  20 |   });
  21 | 
  22 |   test('authenticated user can access protected route', async ({ page }) => {
  23 |     const testEmail = `protected-${Date.now()}@example.com`;
  24 |     const testPassword = 'SecurePass123';
  25 | 
  26 |     // Setup: sign up and log in
  27 |     await page.goto('/signup');
> 28 |     await page.getByLabel(/email/i).fill(testEmail);
     |                                     ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  29 |     await page.getByLabel(/password/i).fill(testPassword);
  30 |     await page.getByRole('button', { name: /sign up/i }).click();
  31 |     await expect(page.getByRole('heading', { name: /account created/i })).toBeVisible();
  32 | 
  33 |     // Action: click "Go to recipes now" to proceed
  34 |     await page.getByRole('link', { name: /go to recipes/i }).click();
  35 |     await page.waitForURL('/');
  36 | 
  37 |     // Action: navigate to protected /favorites route
  38 |     await page.goto('/favorites');
  39 | 
  40 |     // Assert: can access protected route (heading visible, not redirected)
  41 |     await expect(page).toHaveURL('/favorites');
  42 |     await expect(page.getByRole('heading', { name: /my favorites/i })).toBeVisible();
  43 |     await expect(page.getByText(/your saved recipes/i)).toBeVisible();
  44 |   });
  45 | 
  46 |   test('logged out user loses access to protected route', async ({ page }) => {
  47 |     const testEmail = `logoutprot-${Date.now()}@example.com`;
  48 |     const testPassword = 'SecurePass123';
  49 | 
  50 |     // Setup: sign up, log in, and access protected route
  51 |     await page.goto('/signup');
  52 |     await page.getByLabel(/email/i).fill(testEmail);
  53 |     await page.getByLabel(/password/i).fill(testPassword);
  54 |     await page.getByRole('button', { name: /sign up/i }).click();
  55 |     await expect(page.getByRole('heading', { name: /account created/i })).toBeVisible();
  56 | 
  57 |     // Action: click "Go to recipes now" to proceed
  58 |     await page.getByRole('link', { name: /go to recipes/i }).click();
  59 |     await page.waitForURL('/');
  60 | 
  61 |     // Go to protected route (should work while logged in)
  62 |     await page.goto('/favorites');
  63 |     await expect(page.getByRole('heading', { name: /my favorites/i })).toBeVisible();
  64 | 
  65 |     // Action: logout
  66 |     await page.getByRole('button', { name: /logout/i }).click();
  67 |     await page.waitForURL('/login');
  68 | 
  69 |     // Action: try to navigate back to protected route
  70 |     await page.goto('/favorites');
  71 | 
  72 |     // Assert: redirected to login (can't access after logout)
  73 |     await expect(page).toHaveURL('/login');
  74 |     await expect(page.getByRole('heading', { name: /log in/i })).toBeVisible();
  75 |   });
  76 | });
  77 | 
```