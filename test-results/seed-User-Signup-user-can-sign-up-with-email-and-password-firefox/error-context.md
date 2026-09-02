# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: seed.spec.ts >> User Signup >> user can sign up with email and password
- Location: tests/e2e/seed.spec.ts:12:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/account created|logged in/i)
Expected: visible
Error: strict mode violation: getByText(/account created|logged in/i) resolved to 2 elements:
    1) <h1>Account Created!</h1> aka getByRole('heading', { name: 'Account Created!' })
    2) <p class="success-message">You are logged in. Welcome to 10xRecipes!</p> aka getByText('You are logged in. Welcome to')

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/account created|logged in/i)

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - banner [ref=e3]:
    - navigation [ref=e4]:
      - link "Recipe Search" [ref=e6] [cursor=pointer]:
        - /url: /
      - generic [ref=e7]:
        - generic [ref=e8]: user-1788339834336@example.com
        - button "Logout" [ref=e9] [cursor=pointer]
  - generic [ref=e11]:
    - heading "Account Created!" [level=1] [ref=e12]
    - paragraph [ref=e13]: You are logged in. Welcome to 10xRecipes!
    - button "Go to recipes now" [ref=e14] [cursor=pointer]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | // Seed test: Signup flow with unique test data
  4  | // This test models every generated E2E spec in this project.
  5  | // Pattern: Setup → Action → Assert → Cleanup (implicit via unique data)
  6  | 
  7  | test.describe('User Signup', () => {
  8  |   // Each test gets a unique email (timestamp-based) to avoid collisions
  9  |   const testEmail = `user-${Date.now()}@example.com`;
  10 |   const testPassword = 'password123';
  11 | 
  12 |   test('user can sign up with email and password', async ({ page }) => {
  13 |     // Setup: navigate to signup page
  14 |     await page.goto('/signup');
  15 | 
  16 |     // Assert: form is visible before interaction
  17 |     await expect(page.getByRole('heading', { name: /sign up/i })).toBeVisible();
  18 | 
  19 |     // Action: fill form with test data
  20 |     await page.getByLabel(/email/i).fill(testEmail);
  21 |     await page.getByLabel(/password/i).fill(testPassword);
  22 | 
  23 |     // Action: submit form
  24 |     await page.getByRole('button', { name: /sign up/i }).click();
  25 | 
  26 |     // Assert: success message appears (wait for state, not time)
> 27 |     await expect(page.getByText(/account created|logged in/i)).toBeVisible();
     |                                                                ^ Error: expect(locator).toBeVisible() failed
  28 | 
  29 |     // Assert: token is stored in localStorage
  30 |     const token = await page.evaluate(() => localStorage.getItem('auth_token'));
  31 |     expect(token).toBeTruthy();
  32 | 
  33 |     // Assert: "Go to recipes" link is present
  34 |     await expect(page.getByRole('link', { name: /go to recipes|recipes/i })).toBeVisible();
  35 |   });
  36 | 
  37 |   test('user sees error message on duplicate email', async ({ page }) => {
  38 |     // Setup: sign up once
  39 |     await page.goto('/signup');
  40 |     await page.getByLabel(/email/i).fill(testEmail);
  41 |     await page.getByLabel(/password/i).fill(testPassword);
  42 |     await page.getByRole('button', { name: /sign up/i }).click();
  43 |     await expect(page.getByText(/account created|logged in/i)).toBeVisible();
  44 | 
  45 |     // Setup: navigate back to signup for second attempt
  46 |     await page.goto('/signup');
  47 | 
  48 |     // Action: attempt to sign up with same email
  49 |     await page.getByLabel(/email/i).fill(testEmail);
  50 |     await page.getByLabel(/password/i).fill(testPassword);
  51 |     await page.getByRole('button', { name: /sign up/i }).click();
  52 | 
  53 |     // Assert: error message appears (backend rejects duplicate)
  54 |     await expect(page.getByText(/already registered|duplicate|exists/i)).toBeVisible();
  55 |   });
  56 | });
  57 | 
```