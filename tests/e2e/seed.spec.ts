import { test, expect } from '@playwright/test';

// Seed test: Signup flow with unique test data
// This test models every generated E2E spec in this project.
// Pattern: Setup → Action → Assert → Cleanup (implicit via unique data)

test.describe('User Signup', () => {
  // Each test gets a unique email (timestamp-based) to avoid collisions
  const testEmail = `user-${Date.now()}@example.com`;
  const testPassword = 'password123';

  test('user can sign up with email and password', async ({ page }) => {
    // Setup: navigate to signup page
    await page.goto('/signup');

    // Assert: form is visible before interaction
    await expect(page.getByRole('heading', { name: /sign up/i })).toBeVisible();

    // Action: fill form with test data
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);

    // Action: submit form
    await page.getByRole('button', { name: /sign up/i }).click();

    // Assert: success message appears (wait for state, not time)
    await expect(page.getByText(/account created|logged in/i)).toBeVisible();

    // Assert: token is stored in localStorage
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeTruthy();

    // Assert: "Go to recipes" link is present
    await expect(page.getByRole('link', { name: /go to recipes|recipes/i })).toBeVisible();
  });

  test('user sees error message on duplicate email', async ({ page }) => {
    // Setup: sign up once
    await page.goto('/signup');
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByRole('button', { name: /sign up/i }).click();
    await expect(page.getByText(/account created|logged in/i)).toBeVisible();

    // Setup: navigate back to signup for second attempt
    await page.goto('/signup');

    // Action: attempt to sign up with same email
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByRole('button', { name: /sign up/i }).click();

    // Assert: error message appears (backend rejects duplicate)
    await expect(page.getByText(/already registered|duplicate|exists/i)).toBeVisible();
  });
});
