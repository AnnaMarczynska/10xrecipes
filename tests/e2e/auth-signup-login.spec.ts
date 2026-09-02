import { test, expect } from '@playwright/test';

// Risk 2.9: Signup form submission → success message + token stored
// Risk 2.10: Login form submission → success message
// Seed: tests/e2e/seed.spec.ts (role-based locators, state waits, unique test data, no cleanup needed)

test.describe('Auth Signup & Login', () => {
  const uniqueEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'SecurePass123';

  // ===== Risk 2.9: Signup =====
  test('user can sign up with email and password', async ({ page }) => {
    // Setup
    await page.goto('/signup');

    // Assert: form is visible with expected fields
    await expect(page.getByRole('heading', { name: /sign up/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();

    // Action: fill form with unique test data
    await page.getByLabel(/email/i).fill(uniqueEmail);
    await page.getByLabel(/password/i).fill(testPassword);

    // Action: submit form
    await page.getByRole('button', { name: /sign up/i }).click();

    // Assert: success state is reached (wait for state, not time)
    // The page renders "Account Created!" heading and success message on successful signup
    await expect(page.getByRole('heading', { name: /account created/i })).toBeVisible();
    await expect(page.getByText(/you are logged in/i)).toBeVisible();

    // Assert: token is stored in localStorage (observable side effect of login)
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeTruthy();
    expect(token).not.toBe('');
  });

  // ===== Risk 2.10: Login (reuse same test account) =====
  test('user can log in with valid credentials', async ({ page }) => {
    // Setup: Pre-create account via signup (happy path preparation)
    // We reuse uniqueEmail from above to test login with the same account just created
    await page.goto('/signup');
    await page.getByLabel(/email/i).fill(uniqueEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByRole('button', { name: /sign up/i }).click();
    await expect(page.getByRole('heading', { name: /account created/i })).toBeVisible();

    // Clear localStorage to simulate fresh login (logout)
    await page.evaluate(() => localStorage.clear());

    // Action: navigate to login and log in with the same account
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /log in/i })).toBeVisible();

    // Action: fill and submit login form
    await page.getByLabel(/email/i).fill(uniqueEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByRole('button', { name: /log in/i }).click();

    // Assert: success state (wait for observable state change)
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await expect(page.getByText(/you are logged in/i)).toBeVisible();

    // Assert: token is stored in localStorage again
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeTruthy();
  });

  // Edge case: signup with duplicate email shows error
  test('signup shows error when email already registered', async ({ page }) => {
    const duplicateTestEmail = `dup-${Date.now()}@example.com`;
    const password = 'TestPass123';

    // Setup: create account
    await page.goto('/signup');
    await page.getByLabel(/email/i).fill(duplicateTestEmail);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /sign up/i }).click();
    await expect(page.getByRole('heading', { name: /account created/i })).toBeVisible();

    // Action: attempt to sign up with same email
    await page.goto('/signup');
    await page.getByLabel(/email/i).fill(duplicateTestEmail);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /sign up/i }).click();

    // Assert: error message appears (observable state, not success)
    // The page should show an error; we assert on the visible error message
    await expect(page.getByText(/already registered|duplicate|email.*already/i)).toBeVisible();

    // Assert: NO success message (verify we're not in success state)
    const successHeading = await page.getByRole('heading', { name: /account created/i }).count();
    expect(successHeading).toBe(0);
  });

  // Edge case: login with wrong password shows error
  test('login shows error when password is incorrect', async ({ page }) => {
    const testEmail = `pwdtest-${Date.now()}@example.com`;
    const correctPassword = 'CorrectPass123';
    const wrongPassword = 'WrongPassword123';

    // Setup: create account
    await page.goto('/signup');
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(correctPassword);
    await page.getByRole('button', { name: /sign up/i }).click();
    await expect(page.getByRole('heading', { name: /account created/i })).toBeVisible();

    // Clear auth for fresh login attempt
    await page.evaluate(() => localStorage.clear());

    // Action: attempt login with wrong password
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(wrongPassword);
    await page.getByRole('button', { name: /log in/i }).click();

    // Assert: error message appears (backend validates password)
    await expect(page.getByText(/wrong password|invalid.*password/i)).toBeVisible();

    // Assert: no success message
    const successHeading = await page.getByRole('heading', { name: /welcome back/i }).count();
    expect(successHeading).toBe(0);
  });
});
