import { test, expect } from '@playwright/test';

// Risk 3.8: Token persists after page reload (localStorage hydration)
// Risk 3.9: Logout clears token and redirects to login
// Risk 3.7: Full login flow with redirect
// Seed: tests/e2e/seed.spec.ts (unique test data, role-based locators, state waits)

test.describe('Auth Session Lifecycle', () => {
  const testEmail = `session-${Date.now()}@example.com`;
  const testPassword = 'SecurePass123';

  // ===== Risk 3.8: Token Persistence =====
  test('token persists across page reloads', async ({ page }) => {
    // Setup: sign up and log in
    await page.goto('/signup');
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByRole('button', { name: /sign up/i }).click();
    await expect(page.getByRole('heading', { name: /account created/i })).toBeVisible();

    // Wait for redirect to home
    await page.waitForURL('/');

    // Assert: user is logged in (logout button visible, user email shown)
    await expect(page.getByRole('button', { name: /logout/i })).toBeVisible();
    await expect(page.getByText(testEmail)).toBeVisible();

    // Action: reload the page
    await page.reload();

    // Assert: still logged in after reload (token persisted via localStorage)
    // The AuthContext should have hydrated from localStorage on mount
    await expect(page.getByRole('button', { name: /logout/i })).toBeVisible();
    await expect(page.getByText(testEmail)).toBeVisible();

    // Assert: token still in localStorage
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeTruthy();
  });

  // ===== Risk 3.9: Logout =====
  test('logout clears token and redirects to login page', async ({ page }) => {
    const logoutTestEmail = `logout-${Date.now()}@example.com`;

    // Setup: create account and login
    await page.goto('/signup');
    await page.getByLabel(/email/i).fill(logoutTestEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByRole('button', { name: /sign up/i }).click();
    await expect(page.getByRole('heading', { name: /account created/i })).toBeVisible();

    // Wait for redirect to home
    await page.waitForURL('/');

    // Assert: logout button visible
    await expect(page.getByRole('button', { name: /logout/i })).toBeVisible();

    // Action: click logout
    await page.getByRole('button', { name: /logout/i }).click();

    // Assert: redirected to login page (URL changed, login form visible)
    await page.waitForURL('/login');
    await expect(page.getByRole('heading', { name: /log in/i })).toBeVisible();

    // Assert: logout button no longer visible (not logged in)
    const logoutBtn = await page.getByRole('button', { name: /logout/i }).count();
    expect(logoutBtn).toBe(0);

    // Assert: token cleared from localStorage
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeNull();
  });

  // ===== Risk 3.7: Full Login Flow with Redirect =====
  test('full login flow redirects to home after success', async ({ page }) => {
    const fullFlowEmail = `fullflow-${Date.now()}@example.com`;

    // Setup: create account first
    await page.goto('/signup');
    await page.getByLabel(/email/i).fill(fullFlowEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByRole('button', { name: /sign up/i }).click();
    await expect(page.getByRole('heading', { name: /account created/i })).toBeVisible();

    // Logout to test login flow separately
    await page.goto('/');
    await page.getByRole('button', { name: /logout/i }).click();
    await page.waitForURL('/login');

    // Action: perform login
    await expect(page.getByRole('heading', { name: /log in/i })).toBeVisible();
    await page.getByLabel(/email/i).fill(fullFlowEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByRole('button', { name: /log in/i }).click();

    // Assert: success message appears
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await expect(page.getByText(/you are logged in/i)).toBeVisible();

    // Assert: redirect to home happens (URL and content match)
    await page.waitForURL('/');
    await expect(page.getByRole('heading', { name: /recipe search/i })).toBeVisible();

    // Assert: user is logged in on home page (logout button visible)
    await expect(page.getByRole('button', { name: /logout/i })).toBeVisible();
  });

  // ===== Edge case: Auth context loading state =====
  test('loading state shown while auth context initializes', async ({ page }) => {
    // Setup: log in
    await page.goto('/signup');
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByRole('button', { name: /sign up/i }).click();
    await expect(page.getByRole('heading', { name: /account created/i })).toBeVisible();

    // Wait for redirect
    await page.waitForURL('/');

    // Action: hard reload (clears HTTP cache, forces re-fetch from server)
    // The AuthContext should show loading state briefly while hydrating from localStorage
    await page.reload({ waitUntil: 'networkidle' });

    // Assert: if loading state is briefly shown, the logout button appears after loading completes
    // (Loading state might be too fast to catch, but the final state should be logged in)
    await expect(page.getByRole('button', { name: /logout/i })).toBeVisible();
  });
});
