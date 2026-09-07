# Frontend Scaffold Audit & Quality Pass — Plan Brief

> Full plan: `context/changes/frontend-scaffold/plan.md`
> Roadmap: `context/foundation/roadmap.md` (F-02)

## What & Why

The React/Vite frontend was built to support S-01 (Guest Search) and now includes auth, favorites, and search. This audit verifies it's a clean, reusable scaffold (not domain-specific search code), fixes quality issues, refactors for consistency, and documents patterns so S-04 (Allergens) and S-05 (Notes) teams can extend it without guessing.

## Starting Point

- **Codebase**: React 19 + Vite + TypeScript with components, pages, API clients, context, hooks, utils, and tests
- **Quality gaps**: No ESLint config, console.log left in production, scattered type definitions, unclear component separation, undocumented patterns, cache logic duplicated

## Desired End State

- `npm run lint` / `typecheck` / `test` / `build` all pass
- Codebase is clean: no debug output, consistent type contracts, standardized error handling
- Components reorganized: reusable scaffold vs. search-specific business logic clearly separated
- Fully documented: README explains structure, pattern guides help future teams, JSDoc on key utilities
- Future-ready: S-04 and S-05 teams can add features by following documented patterns

## Key Decisions Made

| Decision | Choice | Why | Source |
|----------|--------|-----|--------|
| Audit scope | Architecture + Patterns + Quality | Comprehensive review catches maintainability issues early | Plan |
| Cleanup approach | Assessment + Full Cleanup | Unblocks codebase; fixes all issues found now vs. deferring | Plan |
| Audience | Future implementers (S-04, S-05) | Patterns documented for reusability; downstream teams unblocked | Plan |
| Component organization | Scaffold vs. Recipe-Search folders | Clear separation prevents business logic bleeding into reusable foundation | Plan |
| Documentation | README + Pattern Guide + JSDoc | Layers of clarity: overview, examples, code-level docs | Plan |

## Scope

**In scope:**
- ESLint setup and linting passes
- Console.log cleanup
- Type contract unification (all API types in one place)
- Error handling standardization
- Cache pattern DRY'd (no repetition)
- Component reorganization (scaffold vs. business logic)
- Full documentation (README, pattern guides, JSDoc)
- Testing validation (all tests pass)

**Out of scope:**
- New features (S-04, S-05 are separate slices)
- Performance optimization (lazy loading, code splitting)
- UI/UX redesign or styling changes
- Mobile responsiveness review
- End-to-end test suite (documented but not written)

## Architecture / Approach

**Phased audit with increasing impact:**
1. **Phase 1** — Code review: read every component/API client/context, document findings
2. **Phase 2** — Quality fixes: ESLint, console.log, type consolidation, error handling, caching
3. **Phase 3** — Refactoring: reorganize components, remove mixed concerns
4. **Phase 4** — Documentation: README, pattern guides, JSDoc, S-04/S-05 prep

**Why this order**: Phase 2 (cleanup) requires Phase 1 (findings). Phase 3 (refactoring) depends on Phase 2 (clean state). Phase 4 (docs) captures Phase 3 patterns.

## Phases at a Glance

| Phase | What it delivers | Key risk |
|-------|------------------|----------|
| 1. Review | Findings matrix documenting gaps, inconsistencies, opportunities | Review accuracy (mitigated: spot-check findings) |
| 2. Cleanup | ESLint config, no console.log, unified types, standardized error handling, DRY cache | Breaking changes in refactored utilities (mitigated: tests validate) |
| 3. Refactoring | Components reorganized, concerns separated, reusability improved | Import errors or test failures (mitigated: TypeScript strict + test suite) |
| 4. Docs | README, pattern guides, JSDoc, S-04/S-05 prep guide | Documentation quality (mitigated: audience review during manual testing) |

**Prerequisites:** None — codebase is stable, S-01 (guest search) is archived, tests exist.

**Estimated effort:** ~8–10 hours across 4 phases. Phase 1: 2h (reading + findings). Phase 2: 3h (fixes + testing). Phase 3: 2–3h (refactoring + test validation). Phase 4: 2–3h (docs).

## Open Risks & Assumptions

- **SearchForm complexity** — Removing detail view logic requires router or parent refactoring; if not done carefully, may create UX regression. Mitigated: keep detail view accessible; just move navigation logic out of SearchForm.
- **Import churn** — Reorganizing components to `scaffold/` and `recipe-search/` folders changes paths; if imports missed, build fails. Mitigated: TypeScript strict mode catches all import errors.
- **Test coverage** — API clients have tests but completeness unknown. Mitigated: Phase 2 adds tests for cache, error, timeout paths.
- **Documentation quality** — Guides are only valuable if S-04/S-05 teams actually follow them. Mitigated: include concrete examples and checklists; request feedback from teams.

## Success Criteria (Summary)

- ✓ Linting, type checking, tests, build all pass
- ✓ No console.log in production code (only console.error/warn for actual errors)
- ✓ Type contracts unified; imports consistent
- ✓ Error handling standardized across all API clients
- ✓ Cache pattern DRY; no repetitive logic
- ✓ Components clearly separated: scaffold (reusable) vs. search-specific
- ✓ Frontend README + pattern guides + JSDoc explain codebase clearly
- ✓ S-04/S-05 teams have concrete starting points and examples to follow
