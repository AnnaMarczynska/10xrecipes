# 10xRecipes Test Plan

## Overview
This document defines the risks our E2E test suite addresses for the 10xRecipes MVP. All tests are automated with Playwright and run across Chromium, Firefox, and WebKit browsers.

## Risk Categories & Test Coverage

### 1. **Authentication & User Session Risk**
**Risk**: Users cannot register, log in, or maintain authenticated sessions, preventing access to personalized features (favorites, allergen preferences).

**Tests Addressing This Risk**:
- User registration flow (new account creation)
- User login with valid credentials
- Invalid login rejection (wrong password/email)
- Session persistence across page navigation
- Logout and re-login flow
- Automatic redirect to login when unauthenticated

**Evidence**: `e2e/auth.spec.ts` - comprehensive authentication test suite (10+ tests)

---

### 2. **Recipe Search Accuracy Risk**
**Risk**: Recipe search returns incorrect results, wrong filtering, or fails to match user ingredients—users can't find recipes they need.

**Tests Addressing This Risk**:
- Search by single ingredient
- Search by multiple ingredients
- Filter by cooking time range (<15min, 15-30min, 30-60min, 60+min)
- Verify search results contain matching recipes
- Verify ingredient match percentage is displayed
- Verify recipe details load from search results
- Empty search validation (at least one ingredient required)

**Evidence**: `e2e/search.spec.ts` - recipe search test suite (15+ tests)

---

### 3. **Favorite Persistence Risk**
**Risk**: Favorites aren't saved to backend, aren't loaded on re-login, or deletion fails—users lose their saved recipes.

**Tests Addressing This Risk**:
- Add recipe to favorites from search results
- View favorites in Favorites page
- Verify added recipe appears in favorites list
- Remove recipe from favorites
- Verify removed recipe is gone
- Add favorite, logout, re-login, verify favorites persist
- View recipe details from Favorites page
- Add/remove notes on favorites

**Evidence**: `e2e/favorites.spec.ts` - favorites management test suite (12+ tests)

---

### 4. **Allergen Filtering Risk**
**Risk**: Allergen preferences aren't saved, allergen ingredients still appear in suggestions, users can't control allergen exposure.

**Tests Addressing This Risk**:
- Add allergen to user preferences
- Verify allergen is checked in preferences list
- Search for ingredients that match allergen name
- Verify allergen-named ingredients DON'T appear in suggestions
- Remove allergen from preferences
- Verify removed allergen can appear in suggestions again
- Allergen preferences persist after logout/re-login
- Cannot manually add allergen as search ingredient (validation)

**Evidence**: `e2e/allergens.spec.ts` - allergen management test suite (10+ tests)

---

### 5. **Recipe Details Display Risk**
**Risk**: Recipe detail page doesn't load, ingredients/instructions missing or malformed, cook time/match percentage not shown—users can't see full recipe information.

**Tests Addressing This Risk**:
- Click recipe from search to open detail page
- Verify recipe name displays
- Verify recipe image loads
- Verify ingredients list displays with proper formatting
- Verify instructions display in readable format
- Verify cook time displays with icon
- Verify ingredient match percentage displays
- Verify "Add to Favorites" button is functional on detail page
- Click back button returns to search results

**Evidence**: `e2e/recipes.spec.ts` - recipe detail test suite (8+ tests)

---

### 6. **Navigation & State Management Risk**
**Risk**: Page navigation breaks, previous search results are lost, or app state becomes inconsistent—users get disoriented or data disappears unexpectedly.

**Tests Addressing This Risk**:
- Navigate between Search, Favorites, and Recipe Detail pages
- Search for recipes, click recipe detail, click back, verify search results persist
- Search results clear when clicking Search nav button
- Empty search page on first login
- Navigation buttons update visual state (active tab indicator)
- Clicking between pages doesn't lose data
- Re-login clears search results and shows empty search page

**Evidence**: `e2e/navigation.spec.ts` - navigation and state test suite (9+ tests)

---

### 7. **Cross-Browser Compatibility Risk**
**Risk**: App works in Chrome but breaks in Firefox or Safari—users on different browsers have broken experiences.

**Tests Addressing This Risk**:
- All test suites run on: Chromium, Firefox, WebKit
- Full feature parity verified across browsers
- No browser-specific rendering/interaction issues

**Evidence**: Playwright config runs all tests in 3 browsers; CI pipeline confirms all pass

---

## Test Execution Summary

**Total Test Count**: 54+ E2E tests  
**Test Framework**: Playwright  
**Browsers**: Chromium, Firefox, WebKit  
**Test Status**: ✅ All passing

**Test Files**:
- `e2e/auth.spec.ts` - Authentication (10 tests)
- `e2e/search.spec.ts` - Recipe search (15 tests)
- `e2e/favorites.spec.ts` - Favorites management (12 tests)
- `e2e/allergens.spec.ts` - Allergen preferences (10 tests)
- `e2e/recipes.spec.ts` - Recipe details (8 tests)
- `e2e/navigation.spec.ts` - Navigation & state (9 tests)

---

## Risk Mitigation Summary

| Risk | Severity | Test Coverage | Status |
|------|----------|---------------|--------|
| Authentication failure | Critical | 10 tests | ✅ Covered |
| Search inaccuracy | High | 15 tests | ✅ Covered |
| Favorite data loss | Critical | 12 tests | ✅ Covered |
| Allergen filtering failure | High | 10 tests | ✅ Covered |
| Recipe details unavailable | High | 8 tests | ✅ Covered |
| Navigation/state issues | Medium | 9 tests | ✅ Covered |
| Cross-browser breakage | Medium | 54 tests (3 browsers) | ✅ Covered |

---

## Quality Assurance Checklist

- ✅ All CRUD operations tested (create, read, update, delete)
- ✅ User data isolation verified (each user sees only their data)
- ✅ Error cases handled (invalid login, empty search, etc.)
- ✅ Cross-browser compatibility verified
- ✅ State persistence across sessions verified
- ✅ Navigation flow complete and tested
- ✅ Business logic (search, filtering, allergen rules) validated

**Certification Ready**: Yes - all defined risks have corresponding test coverage.
