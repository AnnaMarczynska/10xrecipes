# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth-signup-login.spec.ts >> Auth Signup & Login >> user can log in with valid credentials
- Location: tests/e2e/auth-signup-login.spec.ts:40:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: /account created/i })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: /account created/i })

```

```yaml
- banner:
  - navigation:
    - link "Recipe Search":
      - /url: /
    - link "Log In":
      - /url: /login
    - link "Sign Up":
      - /url: /signup
- heading "Sign Up" [level=1]
- text: Email
- textbox "Email":
  - /placeholder: you@example.com
  - text: test-1788339856225@example.com
- alert: Email already registered
- text: Password
- textbox "Password":
  - /placeholder: At least 6 characters
  - text: SecurePass123
- button "Sign Up"
- text: Already have an account?
- link "Log in":
  - /url: /login
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | // Risk 2.9: Signup form submission → success message + token stored
  4   | // Risk 2.10: Login form submission → success message
  5   | // Seed: tests/e2e/seed.spec.ts (role-based locators, state waits, unique test data, no cleanup needed)
  6   | 
  7   | test.describe('Auth Signup & Login', () => {
  8   |   const uniqueEmail = `test-${Date.now()}@example.com`;
  9   |   const testPassword = 'SecurePass123';
  10  | 
  11  |   // ===== Risk 2.9: Signup =====
  12  |   test('user can sign up with email and password', async ({ page }) => {
  13  |     // Setup
  14  |     await page.goto('/signup');
  15  | 
  16  |     // Assert: form is visible with expected fields
  17  |     await expect(page.getByRole('heading', { name: /sign up/i })).toBeVisible();
  18  |     await expect(page.getByLabel(/email/i)).toBeVisible();
  19  |     await expect(page.getByLabel(/password/i)).toBeVisible();
  20  | 
  21  |     // Action: fill form with unique test data
  22  |     await page.getByLabel(/email/i).fill(uniqueEmail);
  23  |     await page.getByLabel(/password/i).fill(testPassword);
  24  | 
  25  |     // Action: submit form
  26  |     await page.getByRole('button', { name: /sign up/i }).click();
  27  | 
  28  |     // Assert: success state is reached (wait for state, not time)
  29  |     // The page renders "Account Created!" heading and success message on successful signup
  30  |     await expect(page.getByRole('heading', { name: /account created/i })).toBeVisible();
  31  |     await expect(page.getByText(/you are logged in/i)).toBeVisible();
  32  | 
  33  |     // Assert: token is stored in localStorage (observable side effect of login)
  34  |     const token = await page.evaluate(() => localStorage.getItem('auth_token'));
  35  |     expect(token).toBeTruthy();
  36  |     expect(token).not.toBe('');
  37  |   });
  38  | 
  39  |   // ===== Risk 2.10: Login (reuse same test account) =====
  40  |   test('user can log in with valid credentials', async ({ page }) => {
  41  |     // Setup: Pre-create account via signup (happy path preparation)
  42  |     // We reuse uniqueEmail from above to test login with the same account just created
  43  |     await page.goto('/signup');
  44  |     await page.getByLabel(/email/i).fill(uniqueEmail);
  45  |     await page.getByLabel(/password/i).fill(testPassword);
  46  |     await page.getByRole('button', { name: /sign up/i }).click();
> 47  |     await expect(page.getByRole('heading', { name: /account created/i })).toBeVisible();
      |                                                                           ^ Error: expect(locator).toBeVisible() failed
  48  | 
  49  |     // Clear localStorage to simulate fresh login (logout)
  50  |     await page.evaluate(() => localStorage.clear());
  51  | 
  52  |     // Action: navigate to login and log in with the same account
  53  |     await page.goto('/login');
  54  |     await expect(page.getByRole('heading', { name: /log in/i })).toBeVisible();
  55  | 
  56  |     // Action: fill and submit login form
  57  |     await page.getByLabel(/email/i).fill(uniqueEmail);
  58  |     await page.getByLabel(/password/i).fill(testPassword);
  59  |     await page.getByRole('button', { name: /log in/i }).click();
  60  | 
  61  |     // Assert: success state (wait for observable state change)
  62  |     await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  63  |     await expect(page.getByText(/you are logged in/i)).toBeVisible();
  64  | 
  65  |     // Assert: token is stored in localStorage again
  66  |     const token = await page.evaluate(() => localStorage.getItem('auth_token'));
  67  |     expect(token).toBeTruthy();
  68  |   });
  69  | 
  70  |   // Edge case: signup with duplicate email shows error
  71  |   test('signup shows error when email already registered', async ({ page }) => {
  72  |     const duplicateTestEmail = `dup-${Date.now()}@example.com`;
  73  |     const password = 'TestPass123';
  74  | 
  75  |     // Setup: create account
  76  |     await page.goto('/signup');
  77  |     await page.getByLabel(/email/i).fill(duplicateTestEmail);
  78  |     await page.getByLabel(/password/i).fill(password);
  79  |     await page.getByRole('button', { name: /sign up/i }).click();
  80  |     await expect(page.getByRole('heading', { name: /account created/i })).toBeVisible();
  81  | 
  82  |     // Action: attempt to sign up with same email
  83  |     await page.goto('/signup');
  84  |     await page.getByLabel(/email/i).fill(duplicateTestEmail);
  85  |     await page.getByLabel(/password/i).fill(password);
  86  |     await page.getByRole('button', { name: /sign up/i }).click();
  87  | 
  88  |     // Assert: error message appears (observable state, not success)
  89  |     // The page should show an error; we assert on the visible error message
  90  |     await expect(page.getByText(/already registered|duplicate|email.*already/i)).toBeVisible();
  91  | 
  92  |     // Assert: NO success message (verify we're not in success state)
  93  |     const successHeading = await page.getByRole('heading', { name: /account created/i }).count();
  94  |     expect(successHeading).toBe(0);
  95  |   });
  96  | 
  97  |   // Edge case: login with wrong password shows error
  98  |   test('login shows error when password is incorrect', async ({ page }) => {
  99  |     const testEmail = `pwdtest-${Date.now()}@example.com`;
  100 |     const correctPassword = 'CorrectPass123';
  101 |     const wrongPassword = 'WrongPassword123';
  102 | 
  103 |     // Setup: create account
  104 |     await page.goto('/signup');
  105 |     await page.getByLabel(/email/i).fill(testEmail);
  106 |     await page.getByLabel(/password/i).fill(correctPassword);
  107 |     await page.getByRole('button', { name: /sign up/i }).click();
  108 |     await expect(page.getByRole('heading', { name: /account created/i })).toBeVisible();
  109 | 
  110 |     // Clear auth for fresh login attempt
  111 |     await page.evaluate(() => localStorage.clear());
  112 | 
  113 |     // Action: attempt login with wrong password
  114 |     await page.goto('/login');
  115 |     await page.getByLabel(/email/i).fill(testEmail);
  116 |     await page.getByLabel(/password/i).fill(wrongPassword);
  117 |     await page.getByRole('button', { name: /log in/i }).click();
  118 | 
  119 |     // Assert: error message appears (backend validates password)
  120 |     await expect(page.getByText(/wrong password|invalid.*password/i)).toBeVisible();
  121 | 
  122 |     // Assert: no success message
  123 |     const successHeading = await page.getByRole('heading', { name: /welcome back/i }).count();
  124 |     expect(successHeading).toBe(0);
  125 |   });
  126 | });
  127 | 
```