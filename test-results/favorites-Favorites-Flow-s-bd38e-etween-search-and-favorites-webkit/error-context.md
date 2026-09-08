# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: favorites.spec.ts >> Favorites Flow >> should sync state between search and favorites
- Location: tests/e2e/favorites.spec.ts:91:3

# Error details

```
Error: page.evaluate: SecurityError: The operation is insecure.
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Favorites Flow', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     // Clear localStorage to start fresh
> 6   |     await page.evaluate(() => localStorage.clear());
      |                ^ Error: page.evaluate: SecurityError: The operation is insecure.
  7   |     await page.goto('/');
  8   |   });
  9   | 
  10  |   test('should add favorite from search results', async ({ page }) => {
  11  |     // Navigate to home
  12  |     await page.goto('/');
  13  | 
  14  |     // Login first
  15  |     const loginLinks = page.locator('a:has-text("Log In")');
  16  |     await loginLinks.click();
  17  | 
  18  |     // Fill in login form
  19  |     await page.fill('input#email', 'demo@test.com');
  20  |     await page.fill('input#password', 'Demo123456');
  21  |     await page.click('button:has-text("Log In")');
  22  | 
  23  |     // Wait for redirect to home
  24  |     await page.waitForURL('/');
  25  | 
  26  |     // Search for recipes
  27  |     await page.fill('input[placeholder*="select"]', 'tofu');
  28  |     await page.click('button:has-text("Search Recipes")');
  29  | 
  30  |     // Wait for results
  31  |     await page.waitForSelector('.recipe-card');
  32  | 
  33  |     // Get initial heart state (should be outline)
  34  |     const heartButtons = page.locator('button[aria-label*="Add"]').first();
  35  |     expect(heartButtons).toBeTruthy();
  36  | 
  37  |     // Click heart icon
  38  |     await heartButtons.click();
  39  | 
  40  |     // Check for toast notification
  41  |     const toast = page.locator('.toast-notification');
  42  |     await expect(toast).toContainText('Added');
  43  | 
  44  |     // Wait a bit for toast to fade
  45  |     await page.waitForTimeout(4000);
  46  |   });
  47  | 
  48  |   test('should view and remove favorite', async ({ page }) => {
  49  |     await page.goto('/');
  50  | 
  51  |     // Login
  52  |     const loginLinks = page.locator('a:has-text("Log In")');
  53  |     await loginLinks.click();
  54  |     await page.fill('input#email', 'demo@test.com');
  55  |     await page.fill('input#password', 'Demo123456');
  56  |     await page.click('button:has-text("Log In")');
  57  |     await page.waitForURL('/');
  58  | 
  59  |     // Add a favorite first
  60  |     await page.fill('input[placeholder*="select"]', 'rice');
  61  |     await page.click('button:has-text("Search Recipes")');
  62  |     await page.waitForSelector('.recipe-card');
  63  |     await page.locator('button[aria-label*="Add"]').first().click();
  64  |     await page.waitForTimeout(1000);
  65  | 
  66  |     // Navigate to favorites
  67  |     await page.click('a:has-text("My Favorites")');
  68  |     await page.waitForURL('/favorites');
  69  | 
  70  |     // Verify favorite is displayed
  71  |     const favoriteItems = page.locator('.favorite-item');
  72  |     const count = await favoriteItems.count();
  73  |     expect(count).toBeGreaterThan(0);
  74  | 
  75  |     // Click remove button
  76  |     const removeButton = page.locator('button:has-text("Remove")').first();
  77  |     page.on('dialog', dialog => {
  78  |       dialog.accept(); // Accept confirmation dialog
  79  |     });
  80  |     await removeButton.click();
  81  | 
  82  |     // Wait for item to disappear
  83  |     await page.waitForTimeout(1000);
  84  | 
  85  |     // Verify it's gone or we're back at empty state
  86  |     const itemsAfter = page.locator('.favorite-item');
  87  |     const countAfter = await itemsAfter.count();
  88  |     expect(countAfter).toBeLessThanOrEqual(count - 1);
  89  |   });
  90  | 
  91  |   test('should sync state between search and favorites', async ({ page }) => {
  92  |     await page.goto('/');
  93  | 
  94  |     // Login
  95  |     const loginLinks = page.locator('a:has-text("Log In")');
  96  |     await loginLinks.click();
  97  |     await page.fill('input#email', 'demo@test.com');
  98  |     await page.fill('input#password', 'Demo123456');
  99  |     await page.click('button:has-text("Log In")');
  100 |     await page.waitForURL('/');
  101 | 
  102 |     // Search for a recipe
  103 |     await page.fill('input[placeholder*="select"]', 'chicken');
  104 |     await page.click('button:has-text("Search Recipes")');
  105 |     await page.waitForSelector('.recipe-card');
  106 | 
```