# Guest Recipe Search — Plan Brief

> Full plan: `context/changes/guest-search/plan.md`
> Roadmap: `context/foundation/roadmap.md` (S-01)
> PRD: `context/foundation/prd.md` (US-01, FR-004–008)

## What & Why

Users enter available ingredients, choose a cooking time, search, and see ranked recipe matches—**all without creating an account**. This is the north-star slice that proves the MVP hypothesis: intelligent ingredient-to-recipe matching removes friction and enables home cooking instead of takeout.

## Starting Point

- **Backend:** Spring Boot 4.1.1 scaffolded, no REST controllers or business logic.
- **Frontend:** Absent; will be React/Vite (from F-02 scaffold).
- **Recipe data:** TheMealDB API (free, 300+ meals with ingredients, cook times, instructions).
- **Guest flow:** No auth, no database writes—pure frontend→backend→TheMealDB chain.

## Desired End State

User opens app → types ingredients (e.g., "chicken", "rice", "garlic") → selects time range (e.g., 30–60 min) → clicks search → sees 1–5 recipe cards ranked by ingredient fit + cook-time match → can click to view full recipe details.

**Verification:** Search completes in <5 seconds. Results are ranked correctly: highest ingredient overlap + best cook-time fit first. Empty searches show helpful guidance ("Try removing an ingredient..."). If TheMealDB is offline, user sees "Search failed. Try again in a moment."

## Key Decisions Made

| Decision | Choice | Why | Source |
|----------|--------|-----|--------|
| Ingredient selection | Free-form autocomplete | Flexible, no ingredient-list limits | Plan |
| Cooking time | Time range tabs (<15, 15–30, 30–60, 60+) | Fast UI, matches user's natural thinking | Plan |
| Result display | Cards with image + key info | Visually engaging, modern recipe UX | Plan |
| Error/loading UX | Contextual message + skeleton | Guides recovery, improves perceived performance | Plan |
| Ranking formula | Ingredient % (60%) + cook time fit (40%) | Balances both constraints equally | Plan |
| Match threshold | ≥50% of user's ingredients | Realistic for real-world cooking (users can substitute) | Plan |
| Caching strategy | Client-side localStorage (1-day TTL) | Fast repeats, reduces API load, simple to implement | Plan |
| API response | Pre-ranked compact summaries | Thin payload, backend owns ranking (single source of truth) | Plan |
| API timeout | 5 seconds | Reliable (fewer timeouts), still feels interactive | Plan |
| Testing | Unit (filtering/ranking) + Manual (QA) | Covers logic + real-world behavior | Plan |

## Scope

**In scope:**
- Recipe search by ingredients + cooking time
- Ingredient autocomplete (free-form typing)
- Time range selector (predefined bands)
- Result cards with images, cook times, ingredient match info
- Recipe detail view (full recipe with ingredients + instructions)
- Client-side caching (localStorage, 1-day TTL)
- Error handling (slow/offline API, no results)
- Loading skeleton screens

**Out of scope:**
- Allergen filtering (S-04, blocked pending allergen-list decision)
- Favorites or user persistence (S-03, requires auth + database)
- Recipe animations (FR-017, deferred to v1.1)
- Custom ingredient entry beyond autocomplete
- Recipe pagination (MVP guest searches return ≤10 results)
- Ingredient animation (visual polish, deferred)

## Architecture / Approach

**Data flow:**
1. User selects ingredients via autocomplete → time range via tabs → clicks search
2. Frontend POST to `/api/recipes/search` with ingredients + time range
3. Backend fetches all recipes from TheMealDB (~1 second)
4. Backend filters by ≥50% ingredient overlap (~0.5 second)
5. Backend ranks by ingredient % (60%) + cook-time fit (40%)
6. Backend returns compact summaries (id, name, image, cook time, match %)
7. Frontend caches in localStorage (1-day TTL), displays as cards
8. User clicks recipe → Frontend GETs `/api/recipes/{id}/details` → displays full recipe

**Key insight:** Backend owns filtering + ranking (deterministic, consistent across users). Frontend focuses on UX (autocomplete, form, cards, caching). No auth, no database writes—pure API orchestration.

## Phases at a Glance

| Phase | What it delivers | Key risk |
|-------|------------------|----------|
| 1. Backend API | `/api/recipes/search` endpoint, filtering logic, ranking algorithm, ingredient master list | TheMealDB timeout or slow response (mitigated: 5s timeout, error handling) |
| 2. Frontend UI | Autocomplete, time range selector, result cards, detail view, error/loading states | Frontend build complexity or React component state management (mitigated: modern hooks, clear contracts) |
| 3. Integration | Wiring frontend to backend, caching, end-to-end tests, performance tuning | Latency >6s perceived (mitigated: skeleton screens, caching for repeats) |

**Prerequisites:** F-01 (REST API scaffold) and F-02 (React/Vite frontend scaffold) must be in place.

**Estimated effort:** ~2–3 sessions across 3 phases. Phase 1 (backend): 4–6 hours. Phase 2 (frontend): 6–8 hours. Phase 3 (integration + testing): 4–6 hours.

## Open Risks & Assumptions

- **TheMealDB availability:** API can be slow (2–5 seconds) or down. Mitigation: 5-second timeout, graceful error handling.
- **Recipe matching quality:** Ingredient overlap alone doesn't guarantee good recipes. Mitigation: ranking formula weights cook-time fit equally (40%), and manual QA testing with real ingredients.
- **Frontend complexity:** React state management for autocomplete + search + caching could be tricky. Mitigation: use modern hooks (useState, useCallback), write unit tests for each component.
- **Image loading:** TheMealDB images can be slow or fail. Mitigation: defer image loading with skeleton screens; no custom optimization needed for MVP.

## Success Criteria (Summary)

- ✓ Guest can search recipes by ingredients + cooking time without login
- ✓ Search returns ranked results in <5 seconds
- ✓ Results are ranked correctly: highest ingredient overlap + best cook-time fit first
- ✓ Empty searches show helpful guidance, not blank screens
- ✓ Repeat searches with same ingredients load from cache in <100ms
- ✓ Full recipe detail view accessible (ingredients + instructions)
- ✓ No errors when TheMealDB is slow or offline (graceful timeout + error message)
