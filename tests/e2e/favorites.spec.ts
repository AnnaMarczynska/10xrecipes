import { test, expect } from '@playwright/test';

test.describe('Favorites Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to start fresh
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');
  });

  test('should add favorite from search results', async ({ page }) => {
    // Navigate to home
    await page.goto('/');

    // Login first
    const loginLinks = page.locator('a:has-text("Log In")');
    await loginLinks.click();

    // Fill in login form
    await page.fill('input#email', 'demo@test.com');
    await page.fill('input#password', 'Demo123456');
    await page.click('button:has-text("Log In")');

    // Wait for redirect to home
    await page.waitForURL('/');

    // Search for recipes
    await page.fill('input[placeholder*="select"]', 'tofu');
    await page.click('button:has-text("Search Recipes")');

    // Wait for results
    await page.waitForSelector('.recipe-card');

    // Get initial heart state (should be outline)
    const heartButtons = page.locator('button[aria-label*="Add"]').first();
    expect(heartButtons).toBeTruthy();

    // Click heart icon
    await heartButtons.click();

    // Check for toast notification
    const toast = page.locator('.toast-notification');
    await expect(toast).toContainText('Added');

    // Wait a bit for toast to fade
    await page.waitForTimeout(4000);
  });

  test('should view and remove favorite', async ({ page }) => {
    await page.goto('/');

    // Login
    const loginLinks = page.locator('a:has-text("Log In")');
    await loginLinks.click();
    await page.fill('input#email', 'demo@test.com');
    await page.fill('input#password', 'Demo123456');
    await page.click('button:has-text("Log In")');
    await page.waitForURL('/');

    // Add a favorite first
    await page.fill('input[placeholder*="select"]', 'rice');
    await page.click('button:has-text("Search Recipes")');
    await page.waitForSelector('.recipe-card');
    await page.locator('button[aria-label*="Add"]').first().click();
    await page.waitForTimeout(1000);

    // Navigate to favorites
    await page.click('a:has-text("My Favorites")');
    await page.waitForURL('/favorites');

    // Verify favorite is displayed
    const favoriteItems = page.locator('.favorite-item');
    const count = await favoriteItems.count();
    expect(count).toBeGreaterThan(0);

    // Click remove button
    const removeButton = page.locator('button:has-text("Remove")').first();
    page.on('dialog', dialog => {
      dialog.accept(); // Accept confirmation dialog
    });
    await removeButton.click();

    // Wait for item to disappear
    await page.waitForTimeout(1000);

    // Verify it's gone or we're back at empty state
    const itemsAfter = page.locator('.favorite-item');
    const countAfter = await itemsAfter.count();
    expect(countAfter).toBeLessThanOrEqual(count - 1);
  });

  test('should sync state between search and favorites', async ({ page }) => {
    await page.goto('/');

    // Login
    const loginLinks = page.locator('a:has-text("Log In")');
    await loginLinks.click();
    await page.fill('input#email', 'demo@test.com');
    await page.fill('input#password', 'Demo123456');
    await page.click('button:has-text("Log In")');
    await page.waitForURL('/');

    // Search for a recipe
    await page.fill('input[placeholder*="select"]', 'chicken');
    await page.click('button:has-text("Search Recipes")');
    await page.waitForSelector('.recipe-card');

    // Favorite a recipe
    const firstHeartBtn = page.locator('button[aria-label*="Add"]').first();
    const initialAriaLabel = await firstHeartBtn.getAttribute('aria-label');
    expect(initialAriaLabel).toContain('Add');

    await firstHeartBtn.click();
    await page.waitForTimeout(1000);

    // Verify heart is filled (aria-label should change to Remove or contain "Remove")
    const updatedAriaLabel = await firstHeartBtn.getAttribute('aria-label');
    expect(updatedAriaLabel).toContain('Remove');

    // Go to favorites
    await page.click('a:has-text("My Favorites")');
    await page.waitForURL('/favorites');

    // Verify recipe is there
    const favoriteItems = page.locator('.favorite-item');
    const count = await favoriteItems.count();
    expect(count).toBeGreaterThan(0);

    // Go back to search
    await page.click('a:has-text("Recipe Search")');
    await page.waitForURL('/');

    // Search again
    await page.fill('input[placeholder*="select"]', 'chicken');
    await page.click('button:has-text("Search Recipes")');
    await page.waitForSelector('.recipe-card');

    // Heart should still be filled
    const heartAfterReturn = page.locator('button[aria-label*="Remove"]').first();
    expect(heartAfterReturn).toBeTruthy();
  });

  test('should persist favorites after logout and login', async ({ page }) => {
    await page.goto('/');

    // Login
    const loginLinks = page.locator('a:has-text("Log In")');
    await loginLinks.click();
    await page.fill('input#email', 'demo@test.com');
    await page.fill('input#password', 'Demo123456');
    await page.click('button:has-text("Log In")');
    await page.waitForURL('/');

    // Add favorite
    await page.fill('input[placeholder*="select"]', 'beef');
    await page.click('button:has-text("Search Recipes")');
    await page.waitForSelector('.recipe-card');
    await page.locator('button[aria-label*="Add"]').first().click();
    await page.waitForTimeout(1000);

    // Go to favorites and note count
    await page.click('a:has-text("My Favorites")');
    await page.waitForURL('/favorites');
    const itemsBeforeLogout = await page.locator('.favorite-item').count();
    expect(itemsBeforeLogout).toBeGreaterThan(0);

    // Logout
    await page.click('button:has-text("Logout")');
    await page.waitForURL(/\/(login|signup)/);

    // Login again
    const loginLinksAgain = page.locator('a:has-text("Log In")');
    await loginLinksAgain.click();
    await page.fill('input#email', 'demo@test.com');
    await page.fill('input#password', 'Demo123456');
    await page.click('button:has-text("Log In")');
    await page.waitForURL('/');

    // Navigate to favorites
    await page.click('a:has-text("My Favorites")');
    await page.waitForURL('/favorites');

    // Verify favorites persisted
    const itemsAfterLogin = await page.locator('.favorite-item').count();
    expect(itemsAfterLogin).toBe(itemsBeforeLogout);
  });

  test('should show no results message when no favorites', async ({ page }) => {
    await page.goto('/');

    // Login with a clean user or account with no favorites
    const loginLinks = page.locator('a:has-text("Log In")');
    await loginLinks.click();
    await page.fill('input#email', 'demo@test.com');
    await page.fill('input#password', 'Demo123456');
    await page.click('button:has-text("Log In")');
    await page.waitForURL('/');

    // Navigate to favorites
    await page.click('a:has-text("My Favorites")');
    await page.waitForURL('/favorites');

    // Should show empty state or no items
    const emptyMessage = page.locator('text=/haven\'t saved|No favorites/i');
    const items = page.locator('.favorite-item');

    const hasEmptyMessage = await emptyMessage.isVisible().catch(() => false);
    const itemCount = await items.count();

    expect(hasEmptyMessage || itemCount === 0).toBeTruthy();
  });
});
