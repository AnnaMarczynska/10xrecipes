# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth-session-lifecycle.spec.ts >> Auth Session Lifecycle >> full login flow redirects to home after success
- Location: tests/e2e/auth-session-lifecycle.spec.ts:77:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForURL: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for navigation to "/" until "load"
============================================================
```

# Page snapshot

```yaml
- generic [ref=f1e2]:
  - banner [ref=f1e3]:
    - navigation [ref=f1e4]:
      - link "Recipe Search" [ref=f1e6] [cursor=pointer]:
        - /url: /
      - generic [ref=f1e7]:
        - generic [ref=f1e8]: fullflow-1788339794157@example.com
        - button "Logout" [ref=f1e9] [cursor=pointer]
  - generic [ref=f1e11]:
    - heading "Welcome Back!" [level=1] [ref=f1e12]
    - paragraph [ref=f1e13]: You are logged in.
    - button "Go to recipes now" [ref=f1e14] [cursor=pointer]
```

# Test source

```ts
  3   | // Risk 3.8: Token persists after page reload (localStorage hydration)
  4   | // Risk 3.9: Logout clears token and redirects to login
  5   | // Risk 3.7: Full login flow with redirect
  6   | // Seed: tests/e2e/seed.spec.ts (unique test data, role-based locators, state waits)
  7   | 
  8   | test.describe('Auth Session Lifecycle', () => {
  9   |   const testEmail = `session-${Date.now()}@example.com`;
  10  |   const testPassword = 'SecurePass123';
  11  | 
  12  |   // ===== Risk 3.8: Token Persistence =====
  13  |   test('token persists across page reloads', async ({ page }) => {
  14  |     // Setup: sign up and log in
  15  |     await page.goto('/signup');
  16  |     await page.getByLabel(/email/i).fill(testEmail);
  17  |     await page.getByLabel(/password/i).fill(testPassword);
  18  |     await page.getByRole('button', { name: /sign up/i }).click();
  19  |     await expect(page.getByRole('heading', { name: /account created/i })).toBeVisible();
  20  | 
  21  |     // Action: click "Go to recipes now" to proceed
  22  |     await page.getByRole('link', { name: /go to recipes/i }).click();
  23  |     await page.waitForURL('/');
  24  | 
  25  |     // Assert: user is logged in (logout button visible, user email shown)
  26  |     await expect(page.getByRole('button', { name: /logout/i })).toBeVisible();
  27  |     await expect(page.getByText(testEmail)).toBeVisible();
  28  | 
  29  |     // Action: reload the page
  30  |     await page.reload();
  31  | 
  32  |     // Assert: still logged in after reload (token persisted via localStorage)
  33  |     // The AuthContext should have hydrated from localStorage on mount
  34  |     await expect(page.getByRole('button', { name: /logout/i })).toBeVisible();
  35  |     await expect(page.getByText(testEmail)).toBeVisible();
  36  | 
  37  |     // Assert: token still in localStorage
  38  |     const token = await page.evaluate(() => localStorage.getItem('auth_token'));
  39  |     expect(token).toBeTruthy();
  40  |   });
  41  | 
  42  |   // ===== Risk 3.9: Logout =====
  43  |   test('logout clears token and redirects to login page', async ({ page }) => {
  44  |     const logoutTestEmail = `logout-${Date.now()}@example.com`;
  45  | 
  46  |     // Setup: create account and login
  47  |     await page.goto('/signup');
  48  |     await page.getByLabel(/email/i).fill(logoutTestEmail);
  49  |     await page.getByLabel(/password/i).fill(testPassword);
  50  |     await page.getByRole('button', { name: /sign up/i }).click();
  51  |     await expect(page.getByRole('heading', { name: /account created/i })).toBeVisible();
  52  | 
  53  |     // Action: click "Go to recipes now" to proceed
  54  |     await page.getByRole('link', { name: /go to recipes/i }).click();
  55  |     await page.waitForURL('/');
  56  | 
  57  |     // Assert: logout button visible
  58  |     await expect(page.getByRole('button', { name: /logout/i })).toBeVisible();
  59  | 
  60  |     // Action: click logout
  61  |     await page.getByRole('button', { name: /logout/i }).click();
  62  | 
  63  |     // Assert: redirected to login page (URL changed, login form visible)
  64  |     await page.waitForURL('/login');
  65  |     await expect(page.getByRole('heading', { name: /log in/i })).toBeVisible();
  66  | 
  67  |     // Assert: logout button no longer visible (not logged in)
  68  |     const logoutBtn = await page.getByRole('button', { name: /logout/i }).count();
  69  |     expect(logoutBtn).toBe(0);
  70  | 
  71  |     // Assert: token cleared from localStorage
  72  |     const token = await page.evaluate(() => localStorage.getItem('auth_token'));
  73  |     expect(token).toBeNull();
  74  |   });
  75  | 
  76  |   // ===== Risk 3.7: Full Login Flow with Redirect =====
  77  |   test('full login flow redirects to home after success', async ({ page }) => {
  78  |     const fullFlowEmail = `fullflow-${Date.now()}@example.com`;
  79  | 
  80  |     // Setup: create account first
  81  |     await page.goto('/signup');
  82  |     await page.getByLabel(/email/i).fill(fullFlowEmail);
  83  |     await page.getByLabel(/password/i).fill(testPassword);
  84  |     await page.getByRole('button', { name: /sign up/i }).click();
  85  |     await expect(page.getByRole('heading', { name: /account created/i })).toBeVisible();
  86  | 
  87  |     // Logout to test login flow separately
  88  |     await page.goto('/');
  89  |     await page.getByRole('button', { name: /logout/i }).click();
  90  |     await page.waitForURL('/login');
  91  | 
  92  |     // Action: perform login
  93  |     await expect(page.getByRole('heading', { name: /log in/i })).toBeVisible();
  94  |     await page.getByLabel(/email/i).fill(fullFlowEmail);
  95  |     await page.getByLabel(/password/i).fill(testPassword);
  96  |     await page.getByRole('button', { name: /log in/i }).click();
  97  | 
  98  |     // Assert: success message appears
  99  |     await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  100 |     await expect(page.getByText(/you are logged in/i)).toBeVisible();
  101 | 
  102 |     // Assert: redirect to home happens (URL and content match)
> 103 |     await page.waitForURL('/');
      |                ^ Error: page.waitForURL: Test timeout of 30000ms exceeded.
  104 |     await expect(page.getByRole('heading', { name: /recipe search/i })).toBeVisible();
  105 | 
  106 |     // Assert: user is logged in on home page (logout button visible)
  107 |     await expect(page.getByRole('button', { name: /logout/i })).toBeVisible();
  108 |   });
  109 | 
  110 |   // ===== Edge case: Auth context loading state =====
  111 |   test('loading state shown while auth context initializes', async ({ page }) => {
  112 |     // Setup: log in
  113 |     await page.goto('/signup');
  114 |     await page.getByLabel(/email/i).fill(testEmail);
  115 |     await page.getByLabel(/password/i).fill(testPassword);
  116 |     await page.getByRole('button', { name: /sign up/i }).click();
  117 |     await expect(page.getByRole('heading', { name: /account created/i })).toBeVisible();
  118 | 
  119 |     // Wait for redirect
  120 |     await page.waitForURL('/');
  121 | 
  122 |     // Action: hard reload (clears HTTP cache, forces re-fetch from server)
  123 |     // The AuthContext should show loading state briefly while hydrating from localStorage
  124 |     await page.reload({ waitUntil: 'networkidle' });
  125 | 
  126 |     // Assert: if loading state is briefly shown, the logout button appears after loading completes
  127 |     // (Loading state might be too fast to catch, but the final state should be logged in)
  128 |     await expect(page.getByRole('button', { name: /logout/i })).toBeVisible();
  129 |   });
  130 | });
  131 | 
```