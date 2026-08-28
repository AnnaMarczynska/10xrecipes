---
project: 10xRecipes
context_type: greenfield
checkpoint:
  current_phase: 8
  phases_completed: [1, 2, 3, 4, 5, 6, 7]
  frs_drafted: 17
  quality_check_status: accepted
created: 2026-08-21
updated: 2026-08-21

## Quality Cross-Check

All quality elements verified as present:
- ✓ Access Control clearly defined (email + password, flat roles)
- ✓ Business Logic articulated (matching algorithm with ranking)
- ✓ Timeline cost acknowledged (4–6 weeks estimated; hard deadline 2026-09-14 noted as ambitious)
- ✓ Non-Goals explicit (no UGC, no meal planning, no nutrition, no sharing)
- ✓ Project artifacts complete (shape-notes.md with valid checkpoint)
---

## Vision & Problem Statement

Finding a recipe based on available ingredients and time constraints is both effortful (tedious manual searching) and cognitively difficult (hard to map what you have onto recipe possibilities). This friction forces users to default to expensive, less healthy options (takeout, delivery) rather than cooking at home.

## User & Persona

**Primary persona:** Busy professionals or parents juggling work and cooking responsibilities.

**The moment:** Evening meal planning when they have 20–45 minutes free, want to cook from what's in the kitchen, but don't want to spend 10+ minutes searching recipe sites.

**Current cost:** Either order expensive takeout/delivery, or cook the same 3–4 recipes on repeat because those are the only ones they remember off-hand.

## Access Control

Users log in with email + password. Each user has a personal account. All users have the same permissions: search recipes, save favorites, add notes, manage allergens. No admin role in the MVP.

## Success Criteria

### Primary
User opens app, creates account, inputs available ingredients, selects time and meal type, searches, and gets at least one matching recipe ready to cook.

### Secondary
User can save a recipe to favorites and add personal notes to it.

### Guardrails
- Allergens in user's list are excluded from results or clearly marked
- User favorites and settings persist after logout/login
- Animation (if supported recipe) displays correctly

## Timeline Acknowledgment

Estimated 4–6 weeks of sustained after-hours work. Acknowledged on 2026-08-21: user explicitly accepted the effort and timeline required for the full MVP.

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

### Visual Polish
- FR-017: User can view an animation of ingredients being added to a pot for supported recipes. Priority: nice-to-have

## User Stories

### US-01: First-Time Search
```
Given a new user with available ingredients [chicken, rice, garlic] and 30 minutes,
When they select those ingredients and time, and search for "dinner" recipes,
Then they see at least one matching recipe ready to prepare in that timeframe.
```

## Socrates Notes

- **FR-007 (search):** Counter-argument considered: "Recipe data quality is a blocker." Resolution: MVP will validate search logic with a real recipe dataset; data integrity is non-negotiable.
- **FR-016 (allergens):** Counter-argument considered: "Allergen data isn't perfect, creating liability." Resolution: Include with a prominent disclaimer that users should verify allergen info independently.
- **FR-017 (animation):** Counter-argument considered: "Time-consuming cosmetic feature distracts from core search." Resolution: Defer to v1.1; MVP focuses on finding recipes, not polish.

## Business Logic

The core rule: **10xRecipes matches recipes to the user's available ingredients and cooking time, surfacing recipes ranked by how well they fit the user's constraints.**

Input: user provides available ingredients, available time, and meal-type preference. The app matches against its recipe database, scoring each recipe on ingredient overlap and cook-time fit. Output: sorted list of viable recipes. User encounters this as: enter constraints → search → see ranked results. The ranking decision is what the app does that a spreadsheet can't.

## Non-Functional Requirements

- **Search responsiveness:** User-perceived search results within 2 seconds. Constraint: fast enough for discovery flow; not real-time typing.
- **Allergen data accuracy:** ≥95% accuracy on allergen tags, with a prominent disclaimer that users should verify independently. Constraint: safety-critical; inaccuracy is liability.

## Non-Goals

- No user-created recipes — recipe database is curated/sourced, not UGC. Avoids content moderation and copyright issues.
- No multi-day meal planning — single-meal focus. Users find one recipe to cook, not a week-long menu.
- No nutritional analysis or calorie counting. Out of scope for MVP.
- No recipe sharing between users. Favorites are personal; direct sharing deferred to v1.1.

## Product Framing

- **Product type:** Web application (browser-based; web-only, not mobile)
- **Target scale:** Personal / small (just the creator and handful of friends initially)
- **Hard deadline:** 2026-09-14
- **Work context:** After-hours personal project (evenings/weekends)
- **Timeline budget:** 4–6 weeks estimated (user acknowledged sustained effort); hard deadline in 3.5 weeks (ambitious)
