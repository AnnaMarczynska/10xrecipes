import { test, expect } from '@playwright/test';

// Risk 3.10: Protected route redirects to login when not authenticated
// Seed: tests/e2e/seed.spec.ts (role-based locators, state waits, unique test data)

test.describe('Protected Routes', () => {
  // ===== Risk 3.10: Protected Route Redirect =====
  test('unauthenticated user trying to access protected route is redirected to login', async ({ page }) => {
    // Setup: start with a new context (no prior auth)
    // Navigate to home first to establish origin context, then clear storage
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());

    // Action: try to access protected /favorites route directly
    await page.goto('/favorites');

    // Assert: redirected to login page (URL changed, login form visible)
    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('heading', { name: /log in/i })).toBeVisible();
  });

  test('authenticated user can access protected route', async ({ page }) => {
    const testEmail = `protected-${Date.now()}@example.com`;
    const testPassword = 'SecurePass123';

    // Setup: sign up and log in
    await page.goto('/signup');
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByRole('button', { name: /sign up/i }).click();
    await expect(page.getByRole('heading', { name: /account created/i })).toBeVisible();

    // Wait for redirect to home
    await page.waitForURL('/');

    // Action: navigate to protected /favorites route
    await page.goto('/favorites');

    // Assert: can access protected route (heading visible, not redirected)
    await expect(page).toHaveURL('/favorites');
    await expect(page.getByRole('heading', { name: /my favorites/i })).toBeVisible();
    await expect(page.getByText(/your saved recipes/i)).toBeVisible();
  });

  test('logged out user loses access to protected route', async ({ page }) => {
    const testEmail = `logoutprot-${Date.now()}@example.com`;
    const testPassword = 'SecurePass123';

    // Setup: sign up, log in, and access protected route
    await page.goto('/signup');
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByRole('button', { name: /sign up/i }).click();
    await expect(page.getByRole('heading', { name: /account created/i })).toBeVisible();

    // Wait for redirect to home
    await page.waitForURL('/');

    // Go to protected route (should work while logged in)
    await page.goto('/favorites');
    await expect(page.getByRole('heading', { name: /my favorites/i })).toBeVisible();

    // Action: logout
    await page.getByRole('button', { name: /logout/i }).click();
    await page.waitForURL('/login');

    // Action: try to navigate back to protected route
    await page.goto('/favorites');

    // Assert: redirected to login (can't access after logout)
    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('heading', { name: /log in/i })).toBeVisible();
  });
});
