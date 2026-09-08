# 10xRecipes Test Plan

## Project Overview

10xRecipes is a recipe search API that helps users find recipes based on available ingredients and cooking time, with automatic filtering for allergens. Core features include user authentication, recipe search with ranking, favorite management, and allergen-based filtering.

---

## Testing Scope

### In Scope (MVP-Critical)
- Recipe search accuracy and ranking
- Allergen filtering (safety-critical)
- Favorite CRUD operations (data persistence)
- User authentication and authorization
- Cook time extraction from recipe instructions

### Out of Scope
- UI/animation (frontend concern)
- TheMealDB API integration (external service)
- Performance/load testing
- Deployment infrastructure

---

## Key Risks & Testing Strategy

### Risk 1: Allergen Filtering Failure (Safety-Critical)
**Impact:** Users with allergies see unsafe recipes → allergic reaction risk  
**Severity:** CRITICAL

**What could go wrong:**
- User allergen list not loaded correctly
- Recipes not properly filtered against allergen list
- Partial matches miss allergens (e.g., "peanut" vs "peanuts")
- Empty allergen list bypasses filtering
- Authenticated user's allergens not applied to search results

**Test Coverage:**
- ✅ Allergen filtering blocks recipes with matching ingredients
- ✅ Recipes without allergens pass through
- ✅ Case-insensitive allergen matching (e.g., "Peanut" matches "peanut")
- ✅ Partial matches work (e.g., "peanut" matches "peanuts")
- ✅ Multiple user allergens all respected
- ✅ Non-authenticated users bypass allergen filtering
- ✅ Favorite recipes also respect allergen filtering

---

### Risk 2: Recipe Search Accuracy (Functional)
**Impact:** Users can't find suitable recipes → poor UX  
**Severity:** HIGH

**What could go wrong:**
- Ingredient matching too strict (no results)
- Ingredient matching too loose (wrong recipes)
- Cook time filtering excludes valid recipes
- Recipe caching returns stale data
- Empty ingredient list causes crash

**Test Coverage:**
- ✅ Search with exact ingredient matches returns recipes
- ✅ Search with partial ingredient matches (50% threshold)
- ✅ Cook time range filtering (e.g., 20-60 min)
- ✅ Cache returns consistent results within 1 hour
- ✅ Empty ingredient list is rejected
- ✅ Results ranked by ingredient match percentage
- ✅ Results limited to top candidates (performance)

---

### Risk 3: Favorite Management (Data Integrity)
**Impact:** User data lost or corrupted → loss of trust  
**Severity:** HIGH

**What could go wrong:**
- Favorite not persisted to database
- Wrong user's favorite is returned
- Notes are lost or truncated
- Duplicate favorites allowed
- Deletion affects other users' data

**Test Coverage:**
- ✅ Add favorite persists to database
- ✅ Get favorites returns only current user's favorites
- ✅ Update notes saves changes
- ✅ Delete removes favorite from database
- ✅ Duplicate favorite is rejected
- ✅ Notes are limited to 500 characters
- ✅ Cross-user isolation (user A can't see/modify user B's favorites)

---

### Risk 4: Authentication & Authorization (Security)
**Impact:** Unauthorized access to user data  
**Severity:** HIGH

**What could go wrong:**
- Missing JWT token allows access
- Invalid token is accepted
- User A can access/modify user B's data
- Authentication filter not applied to endpoints

**Test Coverage:**
- ✅ Missing JWT token returns 401
- ✅ Invalid JWT token returns 401
- ✅ Expired JWT token returns 401
- ✅ Valid JWT token grants access
- ✅ User A cannot access user B's favorites
- ✅ User A cannot modify user B's allergens

---

## Test Implementation Plan

### Framework & Tools
- **Unit Tests:** JUnit 5, Mockito
- **Integration Tests:** Spring Boot Test + TestContainers (PostgreSQL)
- **API Tests:** MockMvc

### Test Organization

```
src/test/java/com/example/_x_recipes/
├── service/
│   ├── AllergenFilterServiceTest.java
│   ├── RecipeSearchServiceTest.java
│   └── FavoriteServiceTest.java
├── controller/
│   ├── FavoriteControllerTest.java
│   ├── RecipeControllerTest.java
│   └── AuthControllerTest.java
└── integration/
    └── E2ERecipeSearchTest.java
```

### Test Execution
- **Local:** `mvn test` (embedded H2 database)
- **CI/CD:** GitHub Actions runs on every push
- **Coverage Target:** >70% for critical paths

---

## Test Cases by Feature

### Feature: Recipe Search
**Risk Addressed:** Recipe Search Accuracy

| Test Case | Input | Expected Output | Risk |
|-----------|-------|-----------------|------|
| Search with matching ingredients | `ingredients: ["chicken"], timeRange: "20-60"` | Returns recipes with chicken | Basic functionality |
| Search with 50% ingredient match | `ingredients: ["chicken", "rice"], timeRange: "30-45"` | Returns recipes with at least chicken | Accuracy |
| Search with cooking time filter | `ingredients: ["pasta"], timeRange: "10-20"` | Only recipes 10-20 min | Accuracy |
| Search with empty ingredients | `ingredients: []` | 400 Bad Request | Invalid input |
| Search with invalid time range | `ingredients: ["chicken"], timeRange: ""` | 400 Bad Request | Invalid input |

---

### Feature: Allergen Filtering
**Risk Addressed:** Allergen Filtering Failure (Safety)

| Test Case | Input | Expected Output | Risk |
|-----------|-------|-----------------|------|
| Filter recipe with user allergen | Recipe contains "peanut"; User allergen: "peanut" | Recipe excluded from results | Safety |
| Keep recipe without allergen | Recipe contains "chicken"; User allergen: "peanut" | Recipe included | Accuracy |
| Case-insensitive match | Recipe contains "Peanut"; User allergen: "peanut" | Recipe excluded | Safety |
| Partial ingredient match | Recipe contains "peanuts"; User allergen: "peanut" | Recipe excluded | Safety |
| Multiple allergens | Recipe contains ["nuts", "dairy"]; User allergens: ["nuts", "gluten"] | Recipe excluded (nuts match) | Safety |
| Non-authenticated user | No JWT token; Recipe has allergens | No filtering applied | Intended behavior |

---

### Feature: Favorite Management
**Risk Addressed:** Favorite Management (Data Integrity)

| Test Case | Input | Expected Output | Risk |
|-----------|-------|-----------------|------|
| Add favorite | POST with recipeId, recipeName | Favorite persisted, returned 201 | Persistence |
| Get user's favorites | GET /favorites | Only current user's favorites | Data isolation |
| Duplicate favorite | POST same recipe twice | 409 Conflict | Data integrity |
| Update notes | PUT /favorites/{id}/notes with new text | Notes updated in DB | Persistence |
| Delete favorite | DELETE /favorites/{id} | Favorite removed from DB | Persistence |
| Notes length limit | PUT with 501+ character notes | 400 Bad Request | Validation |
| Cross-user access | User A tries to access User B's favorite | 403 Forbidden | Security |

---

### Feature: Authentication
**Risk Addressed:** Authentication & Authorization (Security)

| Test Case | Input | Expected Output | Risk |
|-----------|-------|-----------------|------|
| Login with valid credentials | POST /auth/login with email, password | JWT token returned | Basic auth |
| Login with invalid credentials | POST /auth/login with wrong password | 401 Unauthorized | Security |
| Access protected endpoint without token | GET /favorites (no Authorization header) | 401 Unauthorized | Security |
| Access with invalid token | GET /favorites with invalid JWT | 401 Unauthorized | Security |
| Access with expired token | GET /favorites with expired JWT | 401 Unauthorized | Security |
| Access with another user's token | User A uses User B's token | 401 or error | Security |

---

## Success Criteria

MVP testing is complete when:
1. ✅ All allergen filtering tests pass (CRITICAL)
2. ✅ All recipe search accuracy tests pass
3. ✅ All favorite CRUD tests pass
4. ✅ All authentication tests pass
5. ✅ Code coverage >70% for critical paths
6. ✅ All tests pass in CI/CD pipeline
