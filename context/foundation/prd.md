# 10xRecipes - Product Requirements Document

## Executive Summary

10xRecipes is a web application that helps users discover recipes based on available ingredients and dietary preferences. Users can search for recipes, save favorites, and manage allergen preferences to find safe, ingredient-matched recipes tailored to their needs.

---

## Problem Statement

**The Challenge**: 
Home cooks often struggle to decide what to cook with ingredients they have on hand. Existing recipe apps require users to search by recipe name or category, forcing them to decide what to make before checking if they have the ingredients. Additionally, users with allergies or dietary restrictions must manually verify each recipe's ingredients, creating a safety risk and friction in meal planning.

**The Impact**:
- Food waste from unused ingredients
- Decision paralysis when planning meals
- Safety concerns for users with allergies
- Time-consuming manual ingredient verification
- Frustration with irrelevant recipe suggestions

**Our Solution**:
10xRecipes flips the workflow: users input ingredients they have, and the app finds recipes they can make today. Built-in allergen preferences filter out unsafe options automatically, while ingredient-match percentages show recipe feasibility at a glance.

---

## Product Vision

Enable home cooks to quickly find safe, ingredient-matched recipes and discover meal inspiration with confidence—transforming available ingredients into a roadmap for today's dinner.

---

## Target Users

1. **Home Cooks (Primary)**
   - Ages 25-55
   - Cook 3-5 times per week
   - Want to reduce food waste
   - May have allergies or dietary restrictions

2. **Allergy-Conscious Parents (Secondary)**
   - Need to verify every recipe's ingredients
   - Manage allergen lists for household members
   - Require quick, safe meal options

3. **Meal Planners**
   - Plan meals around available ingredients
   - Track favorite recipes
   - Want personalized recommendations

---

## Key Features

### 1. Recipe Search by Ingredients
- Enter 1+ ingredients (with autocomplete suggestions)
- Filter by cooking time (<15, 15-30, 30-60, 60+ minutes)
- Returns matching recipes sorted by ingredient match %
- Ingredient match percentage shows feasibility (e.g., 85% of ingredients available)

### 2. Recipe Details
- Full recipe view with image
- Complete ingredients list
- Step-by-step instructions
- Cook time and yield information
- Ingredient match score

### 3. Favorites Management
- Save recipes to personal favorites
- Add personal notes to favorites (e.g., "family loved it", "add extra spice")
- Persistent favorites across logins
- Quick access from dedicated Favorites page

### 4. Allergen Preferences
- Select allergens to avoid (eggs, milk, nuts, shellfish, etc.)
- Allergen ingredients automatically excluded from search suggestions
- Cannot manually add allergen ingredients to search
- Preferences saved per user
- Persist across sessions

### 5. User Authentication
- Registration with email and password
- Secure login/logout
- Session persistence
- User-scoped data (favorites and allergens isolated per user)

### 6. Navigation & State Management
- Search results preserved during navigation
- Quick access to Search and Favorites
- Recipe detail view with back navigation
- Empty search page on login (clean slate)
- Seamless page transitions

---

## Success Criteria

### Functional Requirements
- ✅ Users can register and log in securely
- ✅ Users can search recipes by 1+ ingredients
- ✅ Users can filter search by cooking time
- ✅ Search results display ingredient match %
- ✅ Users can view full recipe details
- ✅ Users can add/remove recipe favorites
- ✅ Users can add notes to favorites
- ✅ Users can set and manage allergen preferences
- ✅ Allergen ingredients excluded from suggestions
- ✅ User data isolated and persistent per login

### Quality Requirements
- ✅ All core workflows tested (54+ E2E tests)
- ✅ Works across Chromium, Firefox, WebKit browsers
- ✅ Cross-browser test coverage 100%
- ✅ Authentication flow tested and secured
- ✅ Data persistence tested after logout/re-login

### User Experience Requirements
- ✅ Search results available within 2 seconds
- ✅ Recipe autocomplete suggestions appear after 2 characters
- ✅ Page transitions smooth (no data loss during navigation)
- ✅ Allergen preferences clearly visible and manageable
- ✅ Favorite recipes easily accessible

### Documentation Requirements
- ✅ Test plan documenting risks and coverage
- ✅ This PRD defining scope and vision
- ✅ Code inline comments for complex logic
- ✅ API endpoints documented in backend

---

## Scope Definition

### In Scope (MVP)
1. **User Authentication**
   - Registration, login, logout
   - JWT token-based sessions
   - Password storage (hashed)

2. **Recipe Search**
   - Ingredient-based search
   - Time range filtering
   - Match percentage calculation
   - Result display with images

3. **Recipe Details**
   - Full recipe view
   - Ingredients and instructions
   - Cook time and metadata
   - Add to Favorites action

4. **Favorites**
   - Save/remove recipes
   - Add/edit notes
   - Persistent storage per user

5. **Allergen Management**
   - Allergen selection UI
   - Ingredient filtering
   - Validation (prevent allergen addition)
   - Persistent preferences per user

### Out of Scope (Future Releases)
- Recipe ratings and reviews
- User-generated recipes
- Dietary filters (vegan, keto, etc. beyond allergens)
- Nutritional information display
- Shopping list generation
- Mobile app (native iOS/Android)
- Social sharing and collaboration
- Recipe recommendations/AI
- Meal plan generation
- Pantry inventory tracking
- Integration with grocery delivery services

---

## User Stories

### Authentication
**As a** home cook  
**I want to** create an account and log in  
**So that** my favorites and preferences are saved for my next visit

**Acceptance Criteria**:
- User can register with email and password
- User can log in with valid credentials
- User receives error message for invalid login
- User can log out and return to login page
- Logged-in user stays logged in during page navigation

---

### Recipe Search
**As a** home cook  
**I want to** search for recipes by ingredients I have  
**So that** I can find something to cook without wasting food

**Acceptance Criteria**:
- User can enter ingredients with autocomplete suggestions
- User can add multiple ingredients
- User can filter by cooking time
- Search returns recipes with highest ingredient match first
- Each recipe shows ingredient match % (e.g., 85%)
- Search requires at least one ingredient

---

### Recipe Details
**As a** home cook  
**I want to** see full recipe details before cooking  
**So that** I know what to buy if I'm missing ingredients and can follow instructions

**Acceptance Criteria**:
- Clicking a recipe opens detailed view
- Recipe shows name, image, ingredients, instructions
- Cooking time and yield display clearly
- Ingredient match % visible
- User can add recipe to favorites from detail view
- User can go back to search results

---

### Favorites
**As a** home cook  
**I want to** save favorite recipes and add notes  
**So that** I can quickly find recipes I loved and remember why I liked them

**Acceptance Criteria**:
- User can add recipe to favorites from search or detail view
- Favorite recipes appear in Favorites page
- User can remove recipes from favorites
- User can add/edit personal notes on each favorite
- Favorite recipes persist after logout and re-login

---

### Allergen Management
**As a** home cook with allergies  
**I want to** set my allergen preferences  
**So that** I don't accidentally find recipes containing my allergens

**Acceptance Criteria**:
- User can select from common allergen list (eggs, milk, nuts, etc.)
- Selected allergens appear as checked in preferences
- Search suggestions exclude allergen-named ingredients
- User cannot manually add allergen ingredients (validation error)
- Allergen preferences persist after logout and re-login

---

## Technical Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Spring Boot 3.3.0, Java 21, REST API
- **Authentication**: JWT (JSON Web Tokens)
- **Database**: (Backend-managed)
- **Testing**: Playwright (E2E), 54+ tests across 3 browsers
- **API Base**: http://localhost:9090/api

---

## Release Plan

### Version 1.0.0 (Current MVP)
All features listed above - shipping complete.

**Status**: ✅ Complete and certified

### Version 1.1.0 (Future)
- Dietary filters (vegan, keto, gluten-free)
- Recipe ratings and reviews
- Search history

### Version 2.0.0 (Future)
- AI-powered recipe recommendations
- Meal plan generation
- Shopping list export
- Mobile app

---

## Success Metrics

### Adoption
- Target: 100+ active users within 3 months
- Track: Daily active users, weekly retention

### Engagement
- Target: 50% of users save ≥5 favorites
- Track: Average favorites per user, allergen preference setup rate

### Quality
- Target: 0 critical bugs in production
- Target: 99.9% uptime (if deployed)
- Track: Error rate, page load time

### User Satisfaction
- Target: 4.5+ star rating on launch feedback
- Track: User feedback surveys, support tickets

---

## Assumptions & Constraints

### Assumptions
- Users have access to a recipe database (backend API)
- Recipes contain standardized ingredient lists
- Users have basic cooking experience
- Internet connection available for use

### Constraints
- MVP focuses on common allergens only
- No real-time collaborative features
- Backend API must be running locally/deployed
- Browser compatibility: modern browsers (Chrome, Firefox, Safari)

---

## Glossary

| Term | Definition |
|------|-----------|
| Ingredient Match % | Percentage of recipe ingredients user has available |
| Allergen | Food ingredient user cannot safely consume |
| JWT | JSON Web Token for stateless authentication |
| E2E Test | End-to-end test simulating real user workflows |
| MVP | Minimum Viable Product with core features only |

---

## Sign-Off

**Product Owner**: 10xRecipes Team  
**Date Created**: 2026-01-15  
**Last Updated**: 2026-01-15  
**Status**: Approved for MVP Release v1.0.0

