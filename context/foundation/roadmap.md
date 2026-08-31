---
project: 10xRecipes
version: 1
status: draft
created: 2026-08-27
updated: 2026-08-31
prd_version: 1
main_goal: speed
top_blocker: time
milestone_id: first-search-to-launch
milestone_seq: 1
milestone_status: open
---

# Roadmap: 10xRecipes

> Derived from context/foundation/prd.md + auto-researched codebase baseline.
> Edit-in-place; archive when superseded.
> Slices below are listed in dependency order. The "At a glance" table is the index.

## Milestone

**M-1: MVP Launch — Guest + Authenticated Recipe Discovery** — Status: open

- **Intent:** Prove core hypothesis (recipe matching by ingredients works) with a shipped product. Users can discover recipes as guests or with their own accounts, access favorites, and manage allergens.
- **Source materials:** `context/foundation/prd.md` (v1)
- **Done when:** every F-NN and S-NN below is `done`, AND the app is live on Cloud Run with working guest search + auth + favorites
- **Scope anchors:**
  - FR-001 through FR-016 (all must-have FRs)
  - US-01 (first-time search user story)
  - Primary Success Criterion: user can search by ingredients and get results in <2 seconds

## Vision recap

Users struggle to find recipes from what they have in the kitchen. This friction drives them to expensive takeout instead of cooking at home. The insight: users already know what they have and how much time they have — they just need a fast, intelligent recipe match. A tool that surfaces viable recipes removes the friction and unlocks home cooking.

---

## North star

**S-01: Guest recipe search** — The smallest end-to-end validation that the core product hypothesis (ingredient-to-recipe matching) works. Shipped first because everything else only matters if this proves the hypothesis.

> The north star is the slice whose successful delivery would prove the core product hypothesis: users can enter ingredients and find recipes. Placed as early as Prerequisites allow (right after API and frontend scaffolds), because everything downstream depends on this working.

---

## At a glance

| ID    | Change ID              | Outcome (user can …)                                    | Prerequisites    | PRD refs       | Status   |
|-------|------------------------|---------------------------------------------------------|------------------|----------------|----------|
| F-01  | api-scaffold           | (foundation) API REST structure + TheMealDB client      | —                | FR-007, FR-008 | proposed |
| F-02  | frontend-scaffold      | (foundation) React/Vite app + API client               | —                | UI layer       | proposed |
| F-03  | auth-scaffold          | (foundation) Spring Security + JWT auth configured     | F-01             | FR-001–003     | proposed |
| F-04  | data-integration       | (foundation) JPA + PostgreSQL + Cloud SQL wired        | F-01             | user persistence | proposed |
| F-05  | deploy-scaffold        | (foundation) Dockerfile + Cloud Run + GitHub Actions   | F-01, F-02       | deployment     | proposed |
| S-01  | guest-search           | search recipes by ingredient without an account        | F-01, F-02       | US-01, FR-004–008 | done |
| S-02  | user-auth              | create account, log in with email + password           | F-01, F-02, F-03 | FR-001–003     | proposed |
| S-03  | favorites              | save recipes to favorites, view list, remove           | S-02, F-04       | FR-009, FR-010 | proposed |
| S-04  | allergens              | add allergens to profile, see recipe warnings          | S-02, F-04       | FR-014–016     | blocked  |
| S-05  | favorite-notes         | add/edit/delete notes on favorite recipes              | S-03, F-04       | FR-011–013     | proposed |

---

## Streams

Navigation aid — groups items that share a Prerequisites chain. Read across each stream top-to-bottom for a cohesive vertical path.

| Stream | Theme              | Chain                          | Note                                                      |
|--------|-------------------|--------------------------------|-----------------------------------------------------------|
| A      | Guest discovery   | `F-01` → `F-02` → `S-01`       | Proves hypothesis first; lowest dependencies; ship ASAP   |
| B      | Auth + data       | `F-01` → `F-03` → `S-02` → `S-03` / `S-04` → `S-05` | User features; auth is gateway, data enables persistence   |
| C      | Deployment        | `F-01` → `F-02` → `F-05`       | CI/CD ready after scaffolds; deploys every subsequent slice |

---

## Baseline

What's already in place in the codebase as of 2026-08-27 (auto-researched + confirmed).
Foundations below assume these are present and do NOT re-scaffold them.

- **Frontend:** Absent — no React/Vite, no components, no API client
- **Backend / API:** Partial — Spring Boot 4.1.1 scaffolded; no REST controllers or routes
- **Data:** Absent — Cloud SQL instance provisioned (recipes-db); no JPA, no schema, no connection config
- **Auth:** Absent — no Spring Security, no JWT libraries, no auth middleware
- **Deploy / infra:** Absent — no Dockerfile, no GitHub Actions; infrastructure research complete
- **Observability:** Absent — no logging, error tracking, or metrics

---

## Foundations

### F-01: API scaffolding

- **Outcome:** (foundation) Spring Boot REST structure in place; health endpoint, request/response patterns, TheMealDB API client integration ready to use
- **Change ID:** api-scaffold
- **PRD refs:** FR-007 (recipe search), FR-008 (recipe details)
- **Unlocks:** all S-NN (every user-facing slice needs the API); S-01 (search), S-02 (auth endpoints), S-03/S-04/S-05 (favorite/allergen endpoints)
- **Prerequisites:** —
- **Parallel with:** F-02, F-03, F-04, F-05 (nothing depends on F-01 internally, but everything else needs it)
- **Blockers:** —
- **Unknowns:** —
- **Risk:** API is the bottleneck; if scaffolding is slow or poorly structured, all downstream slices stack up waiting. Mitigate: start with clean REST patterns, test locally with curl.
- **Status:** proposed

### F-02: Frontend scaffolding

- **Outcome:** (foundation) React app bootstrapped with Vite, dev server working, API client boilerplate (axios or fetch + token injection), component structure ready
- **Change ID:** frontend-scaffold
- **PRD refs:** UI layer (not explicitly FR-NN, but implied by every user story)
- **Unlocks:** all S-NN with UI (S-01, S-02, S-03, S-04, S-05); browser-based interaction
- **Prerequisites:** —
- **Parallel with:** F-01, F-03, F-04, F-05
- **Blockers:** —
- **Unknowns:** —
- **Risk:** React tooling complexity (build, dev server, package versions); Vite is mature but initial setup must be clean. Mitigate: use create-vite template, lock dependencies.
- **Status:** proposed

### F-03: Auth scaffold

- **Outcome:** (foundation) Spring Security configured, JWT token provider (generate, validate, extract claims), auth middleware in place, registration and login endpoints wired
- **Change ID:** auth-scaffold
- **PRD refs:** FR-001, FR-002, FR-003 (register, login, logout)
- **Unlocks:** S-02 (user auth endpoint), S-03/S-04/S-05 (authenticated routes)
- **Prerequisites:** F-01 (needs REST controller scaffold)
- **Parallel with:** F-02, F-04, F-05 (can build while S-01 ships)
- **Blockers:** —
- **Unknowns:**
  - Should password reset ship in MVP, or defer to v1.1? — Owner: user. Block: no (not in PRD must-haves).
- **Risk:** JWT secrets management; if secrets are hardcoded or leaked, entire auth system is compromised. Mitigate: use Google Secret Manager (already wired in cloud-sql-proxy setup; apply same pattern here).
- **Status:** proposed

### F-04: Data layer integration

- **Outcome:** (foundation) Spring Data JPA configured, PostgreSQL driver included, application.properties wired to Cloud SQL connection string (pulled from Google Secret Manager), JPA auto-schema-creation on startup configured
- **Change ID:** data-integration
- **PRD refs:** Persistence of user data (favorites, allergens, notes)
- **Unlocks:** S-03 (save favorites), S-04 (allergen profiles), S-05 (favorite notes)
- **Prerequisites:** F-01 (needs application.properties config), Cloud SQL instance running (already provisioned on 2026-08-25)
- **Parallel with:** F-02, F-03, F-05 (can build while S-01 ships)
- **Blockers:** —
- **Unknowns:**
  - Should we hand-write schema.sql or use JPA auto-generation? — Owner: user. Block: no. Decision: use JPA `@Entity` annotations + `spring.jpa.hibernate.ddl-auto=create-drop` in dev, `validate` in prod.
- **Risk:** Cloud SQL connection string injection; if secrets leak, user data (email, passwords, allergens) exposed. Mitigate: use Google Secret Manager; rotate secrets post-launch.
- **Status:** proposed

### F-05: Container & deployment scaffold

- **Outcome:** (foundation) Dockerfile (multi-stage build, Alpine base, production-ready), Cloud Run service configuration, GitHub Actions workflow (build backend + frontend, push images, deploy on main merge), secrets wired to Cloud Run environment
- **Change ID:** deploy-scaffold
- **PRD refs:** Hard deadline 2026-09-14; deployment is critical path
- **Unlocks:** Continuous deployment of all S-NN (once this is ready, every subsequent slice ships automatically on merge to main)
- **Prerequisites:** F-01, F-02 (need both backend JAR and frontend dist to build)
- **Parallel with:** F-03, F-04 (can be wired in parallel with auth/data development)
- **Blockers:** —
- **Unknowns:**
  - GitHub Actions → GCP authentication: workload identity federation or service account key? — Owner: user. Block: no (both work; federation is more secure; if time-constrained, use service account key).
- **Risk:** CI/CD permissions; if GitHub Actions can't authenticate to GCP, deployment fails silently and entire MVP is stuck. Mitigate: test the CI/CD early (after F-05 scaffolding), before slices are complete.
- **Status:** proposed

---

## Slices

### S-01: Guest recipe search

- **Outcome:** User can open the app, input available ingredients (e.g., chicken, rice), select cooking time (e.g., 30 minutes), click search, and see matching recipes from TheMealDB — ALL WITHOUT creating an account.
- **Change ID:** guest-search
- **PRD refs:** US-01 (first-time search), FR-004 (select ingredients), FR-005 (select time), FR-006 (select meal type), FR-007 (search), FR-008 (view recipe details)
- **Prerequisites:** F-01 (REST API), F-02 (frontend)
- **Parallel with:** F-03, F-04, F-05 (guest search doesn't need auth or database; can ship while those are being built)
- **Blockers:** —
- **Unknowns:**
  - What if TheMealDB is slow or offline? — Owner: TBD. Block: no (can add timeout + error UI as mitigation).
  - Should the UI show "no results" or "try different ingredients" when search returns empty? — Owner: designer/UX. Block: no (ship with basic error message, iterate).
- **Risk:** TheMealDB API latency; if response takes >2 seconds, user search feels slow and defeats MVP validation. Mitigate: add request timeout, cache at frontend (localStorage), measure latency from the start.
- **Status:** done

### S-02: User registration & login

- **Outcome:** User can create a new account with email + password, receive a JWT token, log in again with those credentials, and log out. Token is stored in browser localStorage and auto-injected into authenticated API requests.
- **Change ID:** user-auth
- **PRD refs:** FR-001 (register), FR-002 (login), FR-003 (logout)
- **Prerequisites:** F-01 (REST API with /register and /login endpoints), F-02 (frontend forms), F-03 (Spring Security + JWT provider)
- **Parallel with:** S-01 (guest search ships first; auth can follow)
- **Blockers:** —
- **Unknowns:**
  - Should email verification be required, or skip for MVP? — Owner: user. Block: no (skip for MVP; add in v1.1 if needed).
  - Password reset flow? — Owner: user. Block: no (not in PRD must-haves; defer to v1.1).
- **Risk:** Auth is the unlock for all user-specific features (favorites, allergens, notes). If auth is buggy, downstream slices can't work. Mitigate: thorough local integration testing (register, login, token in request, protected route denial without token).
- **Status:** proposed → ready once F-01, F-02, F-03 complete

### S-03: Save recipes to favorites

- **Outcome:** Authenticated user can save a recipe from search results to their favorites, view a list of all saved recipes, and remove a recipe from favorites. Favorites persist across sessions.
- **Change ID:** favorites
- **PRD refs:** FR-009 (add to favorites), FR-010 (remove from favorites)
- **Prerequisites:** S-02 (user must be authenticated), F-04 (database to store favorites)
- **Parallel with:** S-04 (both depend on S-02 + F-04; neither blocks the other)
- **Blockers:** —
- **Unknowns:**
  - Should there be a favorites count limit, or unlimited? — Owner: user. Block: no (can add quota in v1.1 if needed).
  - Should favorites be sorted by save date, recipe name, or user preference? — Owner: designer. Block: no (ship with save-date sort; iterate).
- **Risk:** Database query inefficiency; if favorites query fetches each recipe from TheMealDB on every load (N+1 problem), user list view is slow. Mitigate: cache recipe metadata in the database when saved, don't re-fetch on every view.
- **Status:** proposed → ready once S-02 + F-04 complete

### S-04: Allergen management

- **Outcome:** Authenticated user can add allergens to their profile (e.g., "peanuts", "shellfish"), view their allergen list, remove allergens, and see recipe search results with allergen warnings or exclusions.
- **Change ID:** allergens
- **PRD refs:** FR-014 (add allergen), FR-015 (remove allergen), FR-016 (view recipes with warnings)
- **Prerequisites:** S-02 (user must be authenticated), F-04 (database to store user allergens)
- **Parallel with:** S-03 (both depend on S-02 + F-04)
- **Blockers:** —
- **Unknowns:**
  - What is the authoritative allergen list (peanuts, tree nuts, shellfish, dairy, eggs, soy, wheat, sesame, fish, etc.)? — Owner: user. Block: **YES** (can't implement without knowing which allergens to offer). This is PRD Open Question #3.
  - Where does allergen data for recipes come from? (TheMealDB doesn't include allergen tags, so we'd need to source/maintain this separately.) — Owner: user. Block: **YES** (gates the entire feature).
- **Risk:** Allergen accuracy is safety-critical. Incorrect allergen tags could lead to user allergic reaction and legal liability. Mitigation per PRD: include prominent disclaimer that users should verify allergen info independently. Mitigate: start with common 8 allergens (USDA list); update recipe allergen data manually or via crowdsourcing; re-verify quarterly.
- **Status:** **blocked** — unresolved Open Questions #3 (allergen list) and #5 (allergen data source) gate this slice.

### S-05: Notes on favorite recipes

- **Outcome:** User can add a text note to a favorite recipe (e.g., "my kids love this", "needs less salt next time"), edit the note, and delete it. Notes persist across sessions.
- **Change ID:** favorite-notes
- **PRD refs:** FR-011 (add notes), FR-012 (edit notes), FR-013 (delete notes)
- **Prerequisites:** S-03 (must have favorites before adding notes to them), F-04 (database)
- **Parallel with:** —
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Low-priority polish feature; if timeline slips, this is a parking candidate. Mitigate: implement last; ship MVP without notes if needed.
- **Status:** proposed → ready once S-03 complete

---

## Backlog Handoff

| Roadmap ID | Change ID              | Suggested issue title         | Ready for `/10x-plan` | Notes |
|------------|------------------------|-------------------------------|----------------------|-------|
| F-01       | api-scaffold           | "API scaffold: REST structure + TheMealDB client" | no | Needs detailed API spec (endpoints, request/response shapes) |
| F-02       | frontend-scaffold      | "Frontend scaffold: React/Vite + API client" | no | Needs component structure decision (pages vs. components dir) |
| F-03       | auth-scaffold          | "Auth scaffold: Spring Security + JWT" | no | Depends on F-01 REST structure |
| F-04       | data-integration       | "Data integration: JPA + PostgreSQL + Cloud SQL" | no | Depends on F-01 application.properties |
| F-05       | deploy-scaffold        | "Deploy scaffold: Dockerfile + Cloud Run + GitHub Actions CI/CD" | no | Depends on F-01 + F-02 build artifacts |
| S-01       | guest-search           | "MVP: Guest recipe search (no login required)" | done | Archived 2026-08-28. |
| S-02       | user-auth              | "User registration & login with JWT" | no | Depends on F-01, F-02, F-03 scaffolds |
| S-03       | favorites              | "Save recipes to favorites" | no | Depends on S-02 (auth) + F-04 (data) |
| S-04       | allergens              | "Allergen management & recipe warnings" | no | **BLOCKED** — awaiting allergen list + data source decisions |
| S-05       | favorite-notes         | "Notes on favorite recipes" | no | Depends on S-03; lowest priority (parking candidate if time-constrained) |

---

## Open Roadmap Questions

1. **What is the authoritative allergen list?** — Owner: user. Block: yes (gates S-04). Consequence: can't offer allergen feature without knowing which allergens to track. Suggest: USDA's "big 8" allergens (peanuts, tree nuts, milk, eggs, fish, shellfish, soy, wheat) as MVP minimum.

2. **Where does allergen data for recipes come from?** — Owner: user. Block: yes (gates S-04). Consequence: TheMealDB doesn't include allergen tags, so we need a separate source (manual curation, third-party API, user-submitted tags). Suggest: start with manual curation of top 50 recipes; crowdsource updates post-launch.

3. **Should password reset ship in MVP or defer to v1.1?** — Owner: user. Block: no (not in PRD must-haves). Consequence: users who forget password can't recover; may reduce trust. Suggest: defer to v1.1; add clear error message in login ("password reset coming soon").

4. **Should email verification be required before account activation?** — Owner: user. Block: no. Consequence: spam/fake emails possible, but MVP scope is focused on feature validation, not account robustness. Suggest: defer to v1.1.

5. **How many recipes should ship with MVP?** — Owner: user. Block: no. Consequence: TheMealDB has 300+ free recipes, so no seeding needed. Suggest: use live API; no recipe database copy needed.

---

## Parked

- **FR-017: Ingredient animation** — Why parked: PRD explicitly defers to v1.1 as "nice-to-have" (§User Stories Socratic note). Consequence: MVP ships without visual polish. Accept: focus on core search hypothesis, not cosmetics.

- **Favorites count limit** — Why parked: not in PRD; can add quota in v1.1 if needed. Accept: MVP allows unlimited favorites; revisit if storage becomes constraint.

- **Email verification** — Why parked: not in PRD must-haves; defer to v1.1. Accept: users can sign up with any email; add verification in next iteration.

- **Password reset flow** — Why parked: not in PRD must-haves; defer to v1.1. Accept: forgotten password = account recovery request via support (or manual reset). Communicate clearly in UI.

---

## Milestone History

(empty on first generation)

---

## Done

- **S-01: Guest recipe search** — Archived 2026-08-28 → `context/archive/2026-08-27-guest-search/`. Lesson: —.

