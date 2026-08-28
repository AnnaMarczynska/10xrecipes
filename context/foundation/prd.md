---
project: 10xRecipes
version: 1
status: draft
created: 2026-08-21
context_type: greenfield
product_type: web-app
target_scale:
  users: small
  qps: low
  data_volume: small
timeline_budget:
  mvp_weeks: 6
  hard_deadline: 2026-09-14
  after_hours_only: true
---

## Vision & Problem Statement

Finding a recipe based on available ingredients and time constraints is both effortful (tedious manual searching) and cognitively difficult (hard to map what you have onto recipe possibilities). This friction forces users to default to expensive, less healthy options (takeout, delivery) rather than cooking at home.

The insight: users already know what they have in the kitchen and how much time they have — they just need a fast, intelligent match to viable recipes. A tool that does this ranking removes the friction that blocks home cooking and reclaims meals that would otherwise go to delivery services.

## User & Persona

**Primary persona:** Busy professionals or parents juggling work and cooking responsibilities.

**The moment:** Evening meal planning when they have 20–45 minutes free, want to cook from what's in the kitchen, but don't want to spend 10+ minutes searching recipe sites.

**Current cost:** Either order expensive takeout/delivery, or cook the same 3–4 recipes on repeat because those are the only ones they remember off-hand.

## Success Criteria

### Primary
- User opens app, creates account, inputs available ingredients, selects time and meal type, searches, and gets at least one matching recipe ready to cook.

### Secondary
- User can save a recipe to favorites and add personal notes to it.

### Guardrails
- Allergens in user's list are excluded from results or clearly marked
- User favorites and settings persist after logout/login
- Application performs as designed across target browsers

## User Stories

### US-01: First-Time Search
- **Given** a new user with available ingredients [chicken, rice, garlic] and 30 minutes
- **When** they select those ingredients and time, and search for "dinner" recipes
- **Then** they see at least one matching recipe ready to prepare in that timeframe

## Functional Requirements

### Authentication & User Management
- FR-001: User can create an account with email and password. Priority: must-have
- FR-002: User can log in with email and password. Priority: must-have
- FR-003: User can log out. Priority: must-have

### Recipe Search & Discovery
- FR-004: User can select available ingredients from a list. Priority: must-have
- FR-005: User can select available cooking time. Priority: must-have
- FR-006: User can select meal type. Priority: must-have
- FR-007: User can search recipes based on ingredients, time, and meal type. Priority: must-have
  > Socratic: Counter-argument considered: "Recipe data quality is a blocker." Resolution: MVP will validate search logic with a real recipe dataset; data integrity is non-negotiable.
- FR-008: User can view recipe details (ingredients, instructions, cook time). Priority: must-have

### Favorites & Notes
- FR-009: User can add a recipe to favorites. Priority: must-have
- FR-010: User can remove a recipe from favorites. Priority: must-have
- FR-011: User can add notes to a favorite recipe. Priority: must-have
- FR-012: User can edit notes on a favorite recipe. Priority: must-have
- FR-013: User can delete notes from a favorite recipe. Priority: must-have

### Allergens
- FR-014: User can add allergens to their profile. Priority: must-have
- FR-015: User can remove allergens from their profile. Priority: must-have
- FR-016: User can view recipes with allergen warnings or exclusions. Priority: must-have
  > Socratic: Counter-argument considered: "Allergen data isn't perfect, creating liability." Resolution: Include with a prominent disclaimer that users should verify allergen info independently.

### Visual Polish
- FR-017: User can view an animation of ingredients being added to a pot for supported recipes. Priority: nice-to-have
  > Socratic: Counter-argument considered: "Time-consuming cosmetic feature distracts from core search." Resolution: Defer to v1.1; MVP focuses on finding recipes, not polish.

## Non-Functional Requirements

- **Search responsiveness:** User-perceived search results within 2 seconds. Constraint: fast enough for discovery flow; not real-time typing.
- **Allergen data accuracy:** ≥95% accuracy on allergen tags, with a prominent disclaimer that users should verify independently. Constraint: safety-critical; inaccuracy is liability.

## Business Logic

The core rule: **10xRecipes matches recipes to the user's available ingredients and cooking time, surfacing recipes ranked by how well they fit the user's constraints.**

Input: user provides available ingredients, available time, and meal-type preference. The app matches against its recipe database, scoring each recipe on ingredient overlap and cook-time fit. Output: sorted list of viable recipes. User encounters this as: enter constraints → search → see ranked results. The ranking decision is what the app does that a spreadsheet can't.

## Access Control

Users log in with email + password. Each user has a personal account. All users have the same permissions: search recipes, save favorites, add notes, manage allergens. No admin role in the MVP.

## Non-Goals

- No user-created recipes — recipe database is curated/sourced, not UGC. Avoids content moderation and copyright issues.
- No multi-day meal planning — single-meal focus. Users find one recipe to cook, not a week-long menu.
- No nutritional analysis or calorie counting. Out of scope for MVP.
- No recipe sharing between users. Favorites are personal; direct sharing deferred to v1.1.

## Open Questions

1. **What is the canonical recipe data source?** — Owner: user. Block: yes (MVP is pointless without a real recipe dataset). Socrates note: user acknowledged data quality as non-negotiable.
2. **How many recipes should ship with the MVP?** — Owner: user. Block: no (can start with a seed set and expand).
3. **What is the allergen data source and maintenance model?** — Owner: user. Block: yes (allergen accuracy is a safety-critical blocker). Associated: Socratic note about disclaimer.
4. **Should the animation (FR-017) be in the MVP, or defer to v1.1?** — Owner: user. Resolved in Socratic round: defer to v1.1; animation is nice-to-have.
5. **What browser / device support is required?** — Owner: user. Block: no (note: web-only; no mobile app in MVP scope).
6. **Hard deadline is 2026-09-14 (3.5 weeks), but estimated timeline is 4–6 weeks. How is this timeline going to be met?** — Owner: user. Block: no (user acknowledged effort and accepted ambitious deadline). Consider scope reduction or feature deferral if timeline slips.
