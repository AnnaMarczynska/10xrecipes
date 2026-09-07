# Allergen Management — Plan Brief

> Full plan: `context/changes/allergens/plan.md`

## What & Why

Users can add common food allergens to their profile (USDA "big 8": peanuts, tree nuts, milk, eggs, fish, shellfish, soy, wheat). When they search for recipes, any recipe containing their allergens is automatically excluded from results. This removes a critical friction point — users no longer need to manually scan recipes to spot allergens.

## Starting Point

**Backend:** UserAllergen entity and AllergenController exist but have no connection to recipe search. Recipes come from TheMealDB API (no allergen tags). Search pipeline filters by ingredients and time but has no allergen awareness.

**Frontend:** React patterns established; no allergen UI exists. Users can't currently see or manage allergens, and recipes don't display allergen information.

**Data:** ~300 recipes available; top 100 manually tagged as MVP. Post-launch, users can crowdsource additional tags.

## Desired End State

- Users manage allergens inline in their profile (checkbox list of big 8)
- Search automatically excludes recipes with user's allergens (zero friction)
- Top 100 recipes manually tagged with allergen data for accuracy
- Frontend displays allergen info on recipe cards for transparency (though filtering is backend-driven)
- E2E: Set allergens → search → verify excluded recipes don't appear
- System uses static "big 8" list (no user custom allergens in MVP)

## Key Decisions Made

| Decision | Choice | Why | Source |
|----------|--------|-----|--------|
| User allergen management | Inline with profile settings | Simpler than separate page; familiar location | Plan |
| Recipe exclusion strategy | Exclude entirely (not warn) | Strongest safety; respects user choice; prevents accidents | Plan |
| Filtering behavior | Automatic for authenticated users | Consistent protection; doesn't require per-search opt-in | Plan |
| Recipe allergen data | Manual tagging of top ~100 recipes | Safe, controlled accuracy; crowdsource post-MVP | Plan |
| Allergen list | Static USDA "big 8" | Simple, legally defensible; no extensibility needed for MVP | Plan |
| Backend allergen storage | Add `allergens` field to Recipe entity | Normalized, queryable, aligns with existing JPA patterns | Plan |
| Guest behavior | No filtering applied | Simplest; filtering kicks in only after login | Plan |

## Scope

**In scope:**
- USDA "big 8" allergen tracking
- Automatic recipe exclusion from search (backend-driven)
- Manual tagging of top ~100 recipes
- Inline allergen management UI (profile section)
- Caching strategy for allergen data
- Full E2E unit + integration + manual testing

**Out of scope:**
- Custom allergen list (users can't add their own)
- Allergen warnings/badges on recipes (excluded, not warned)
- Admin tagging UI (manual data + seed script only)
- Cross-contamination warnings ("may contain")
- Allergen metrics/analytics
- Guest login prompts

## Architecture / Approach

**Backend:**
1. Extend Recipe model with `List<String> allergens` field
2. Create AllergenFilterService to exclude recipes matching user's allergens
3. Hook filtering into RecipeController (after enrichment, before ranking)
4. Seed recipe allergen data via manual tagging + SQL script

**Frontend:**
1. Create `allergenClient.ts` (GET/POST/DELETE /allergens) following favoriteClient pattern
2. Build AllergenProfile component (checkbox grid for big 8)
3. Add allergen section to user profile page (inline, not separate)
4. Extend RecipeDetail type to carry allergen tags
5. Display allergens on recipe cards for reference

**Data flow:**
- User sets allergens → allergenClient.add() → cache invalidated
- User searches → RecipeController fetches recipes + user allergens → AllergenFilterService filters → results exclude allergens
- Results returned to frontend with allergen tags → RecipeCard displays tags (for transparency)

## Phases at a Glance

| Phase | What it delivers | Key risk |
|-------|------------------|----------|
| 1. Backend data model | Recipe entity + filtering logic wired into search | Manual tagging must be accurate; filtering hook-in timing |
| 2. Recipe tagging | Top ~100 recipes manually tagged with allergens | Human effort (curation); scaling post-MVP requires crowdsourcing |
| 3. Frontend allergen UI | Allergen management component + API client | UI/UX consistency; cache invalidation edge cases |
| 4. Search integration | E2E filtering working; recipe display updated | Performance under load; cache efficiency |

**Prerequisites:** S-02 (user auth) ✅, F-04 (data layer) ✅. Both complete.

**Estimated effort:** ~2 weeks (4 phases), 1 developer. Phase 2 (manual tagging) is time-intensive but can be parallelized with coding.

## Open Risks & Assumptions

- **Allergen data accuracy:** Manual tagging relies on human review. Post-MVP, crowdsourcing may introduce errors — mitigation: users flag inaccurate tags, we re-review.
- **TheMealDB coverage:** Not all ~300 recipes will be tagged in MVP (only top 100). Untagged recipes treated as allergen-free — acceptable since users likely search popular recipes first.
- **Cache invalidation edge case:** If multiple devices add allergens simultaneously, cache might get stale — acceptable for MVP; post-launch: use server-side session cache.
- **Performance at scale:** Filtering 300 recipes × 8 tags is acceptable; if recipe count exceeds 1000, index needed.

## Success Criteria (Summary)

- User can set/remove allergens from profile (checkbox UI)
- Search results exclude recipes with user's allergens (zero false positives observed in manual testing)
- Performance: search returns in <1 second with filtering active
- E2E: Set allergens → search → verify excluded recipes confirmed not present in results

