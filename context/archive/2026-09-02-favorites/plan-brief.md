# Save Recipes to Favorites — Plan Brief

> Full plan: `context/changes/favorites/plan.md`

## What & Why

Users can save recipes from search results to a persistent favorites list that survives logout/login. This unlocks recipe discovery workflows (browse → save → review later) and lays groundwork for future features like recipe notes (S-05) and allergen filtering.

**Why now**: S-02 (user auth) and F-04 (data layer) are complete. The Favorite entity, repository, and backend API already exist — this plan finishes the job with frontend UI and test coverage.

## Starting Point

**Backend**: ~80% done. FavoriteController, FavoriteService, Favorite entity, FavoriteRepository are implemented but need:
- API response envelope consistency (currently returns raw Map/List)
- Error handling refinement

**Frontend**: ~10% done. FavoritesPage exists as a stub; RecipeCard has no favorite button.

**Tests**: Repository tests exist (F-04); need controller tests, component tests, E2E tests.

## Desired End State

After S-03 ships:

- Users can ❤️ recipes from search results (heart icon fills, toast confirms)
- Favorites are listed on `/favorites` page, sorted by most recent first
- Users can remove a favorite after confirming a dialog
- All endpoints return consistent ApiResponse envelopes
- Feature is fully tested (backend → frontend → E2E)
- Notes field is visible but read-only (S-05 adds edit capability)

## Key Decisions Made

| Decision | Choice | Why | Source |
|----------|--------|-----|--------|
| Add-to-favorite UX | Button on search results + recipe pages | Convenience matches expected pattern | Plan decision (your input) |
| Feedback on add | Button fills + toast "Added to favorites" | Dual feedback is more satisfying than one alone | Plan decision |
| Sorting | Most recent added first | Simple default, matches user intent | Plan decision |
| Duplicate handling | Show "Already in favorites" toast | Clear feedback prevents confusion | Plan decision |
| Remove confirmation | Confirmation dialog before deletion | Safety — prevents accidental unfavoriting | Plan decision |
| State indicator | Filled/outline heart icon | Familiar from social media, no extra space | Plan decision |
| Testing approach | Backend + frontend + E2E | Comprehensive coverage across the stack | Plan decision |
| Notes in S-03 | Visible but read-only | Keeps scope focused; S-05 adds edit | Plan constraint (S-05 dependent feature) |

## Scope

**In scope:**
- Add recipes to favorites from search results and recipe pages
- View favorites in a dedicated list (sorted by date, most recent first)
- Remove a favorite with confirmation
- Notes field displays but is not editable
- Backend API returns ApiResponse envelopes
- Full test coverage (unit/integration/E2E)
- Persist across sessions and user login/logout

**Out of scope:**
- Edit/delete notes (S-05)
- Favorite count quota (v1.1)
- Sorting/filtering UI (future)
- Bulk operations
- Share/collaborate on favorites

## Architecture / Approach

**Backend**: Controller → Service → Repository → Entity → Database. FavoriteService enforces authorization (user can only modify their own favorites). API returns ApiResponse envelope with error handling.

**Frontend**: favoriteClient (API layer) → FavoritesPage (list view) + RecipeCard (add button). AuthContext provides authentication state. Heart icon state is managed per-component initially (can refactor to context in S-05 if needed).

**State sync**: When user adds favorite from search, icon fills optimistically. If user navigates away and back, state re-syncs with API (safe approach).

```
Search Results    →    [favorite button clicks] → favoriteClient API
    ↓
FavoritesPage    ←    [getFavorites()] ← Backend (returns list)
```

## Phases at a Glance

| Phase | What it delivers | Key risk |
|-------|------------------|----------|
| 1. Backend Polish | API envelopes, error handling, consistent response format | Requires refactoring existing controller; must not break existing tests |
| 2. Frontend | FavoritesPage component, favorite button in search, API client | State sync across components; must prevent duplicate favorites |
| 3. Testing | Controller tests, component tests, E2E tests | E2E test flakiness if async operations not handled properly |

**Prerequisites**: S-02 (auth) ✅, F-04 (data layer) ✅

**Estimated effort**: ~2-3 sessions across 3 phases (backend polish: 1 session, frontend: 1+ sessions, testing: 1 session)

## Open Risks & Assumptions

- **Assumption**: FavoriteController and FavoriteService are correct as-is. **Mitigation**: Phase 1 adds tests and verification.
- **Assumption**: No significant schema changes needed. **Mitigation**: Schema is complete from F-04; this is just inserting/querying rows.
- **Risk**: State sync between search and favorites pages could get out of sync. **Mitigation**: Refetch on navigation; S-05 can add context for better sync.
- **Risk**: Confirmation dialog pattern might be unfamiliar on web (mobile standard). **Mitigation**: Undo toast is fallback if UX feedback indicates the pattern is awkward.

## Success Criteria (Summary)

✅ Users can add recipes to favorites from search (1-click, visible heart icon)

✅ Favorites list is accessible, sortable by date added (most recent first)

✅ Remove a favorite with confirmation dialog (prevents accidents)

✅ All tests pass (backend unit/integration, frontend component, E2E)

✅ API is production-ready (consistent envelopes, error handling, authentication)
