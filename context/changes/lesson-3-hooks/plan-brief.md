# Lesson 3: Hooks — Plan Brief

> Full plan: `context/changes/lesson-3-hooks/plan.md`  
> Related: `CLAUDE.md` (Module 3, Lesson 3), `context/foundation/test-plan.md` (Risk map R1-R6)

## What & Why

Automate the 43 passing tests from Phase 1-3 into deterministic quality gates across three layers: per-edit (agent feedback), pre-commit (catch manual edits), and pre-push (final check before remote). Implements Lesson 3 guidance: turn quality gates into automated hooks that run outside the model, so agent self-corrects without waiting for you to discover errors later.

## Starting Point

- ✅ Phase 1-3 tests complete: 43 passing (15 search, 5 error-safety, 11 service, 12 url-encoding)
- ✅ Test infrastructure in place (Maven Surefire backend, TypeScript frontend)
- ❌ No hooks configured (`.claude/settings.json` doesn't exist)
- ❌ No git hooks (Lefthook not installed)

## Desired End State

1. **Per-edit (Claude Code)**: Agent saves file → error-safety tests run in <1s → agent sees failures and self-corrects before commit
2. **Pre-commit (Lefthook)**: Staged changes → linting + type-checking + scoped tests run → commit blocked if anything fails
3. **Pre-push**: Full test suite runs → code pushed only if all 43 tests pass

Result: R5 (API safety) caught immediately per-edit; R1-R4, R6 (search, ranking, cache) caught at pre-commit; integration checked in CI only.

## Key Decisions Made

| Decision | Choice | Why | Source |
|----------|--------|-----|--------|
| **Per-edit scope** | Error-safety tests only (5 tests, R5) | Fastest feedback (<1s) on highest-risk area (API timeout/encoding/errors). Other tests defer to pre-commit. | Plan |
| **Git hook tool** | Lefthook | Language-agnostic, simple YAML, works cross-platform (Java+TypeScript project). | Plan |
| **Frontend setup** | TypeScript type-checking only (defer vitest) | MVP frontend is low-risk. Type-checking sufficient; vitest added when frontend complexity grows. | Plan |
| **Risk-file scoping** | Backend only (TheMealDBClient, RecipeController) | Only files touching external API (TheMealDB) and error responses. Changes here warrant immediate test feedback. | Plan |

## Scope

**In scope:**
- Claude Code per-edit hooks (`.claude/settings.json`): error-safety tests + tsc
- Lefthook pre-commit: lint, type-check, scoped tests on risk files
- Pre-push: full test suite (mvn test)
- Documentation: bypass instructions for hotfix

**Out of scope:**
- Vitest / frontend test runner (deferred to Phase 4)
- CI/CD (that's F-05, Module 2 Lesson 5)
- Comprehensive linting rules (expand in v1.1)
- Performance gates / load testing

## Architecture / Approach

**Three-layer hook stack:**

```
Per-Edit (Claude Code)          Pre-Commit (Lefthook)           Pre-Push
  ↓                                ↓                               ↓
agent saves file              git commit attempt            git push attempt
  ↓                                ↓                               ↓
error-safety tests (<1s)      lint + type + tests (~3-5s)  full suite (~10-15s)
  ↓                                ↓                               ↓
exit 2 if fail                 exit 1 if fail                exit 1 if fail
additionalContext to agent    commit blocked                push blocked
```

**Risk-file scoping:** Hook matcher uses glob patterns to trigger tests only on RecipeController.java and TheMealDBClient.java changes. Other edits skip scoped tests (faster commits).

## Phases at a Glance

| Phase | What it delivers | Key risk |
|-------|------------------|----------|
| 1. Per-edit hooks | `.claude/settings.json` + error-safety tests + tsc on saves | Agent needs <1s feedback loop or it gets ignored; tsc on every *.ts change may be slow if many files |
| 2. Pre-commit | Lefthook install + `.lefthook.yml` + linting + scoped tests | Developers must run `lefthook install` on clone; hooks block commits if failing (acceptable but requires discipline) |
| 3. Pre-push | Full test suite + linting + type-checking at push time | 10-15s pre-push delay is acceptable but notable; if slower, move some tests to CI |

**Prerequisites:**
- jq installed (✅ done: v1.8.2)
- 43 existing tests passing (✅ done)
- Agent has permission to run mvn test, npx tsc, git commands (✅ existing in settings.local.json)

**Estimated effort:** ~3-4 sessions across 3 phases. Phase 1 (per-edit) is quickest (~30 min). Phase 2 (Lefthook setup) is moderate (~1 hour). Phase 3 (pre-push) is lightest (~20 min, reuses Phase 2 config).

## Open Risks & Assumptions

- **Assumption: Error-safety tests stay <1s** — If test grows or machine is slow, per-edit feedback loop gets ignored. Monitor timing; move to pre-commit if exceeds 2-3s.
- **Risk: Lefthook requires team discipline** — New developers must `lefthook install` after cloning. Not automatic. Mitigate: add to onboarding docs, check in shell script.
- **Risk: TypeScript checking on every *.ts save may feel slow** — If many TypeScript files, type-checking could cascade. Mitigate: watch and move to pre-commit if >3s per-edit.
- **Assumption: Maven checkstyle works out-of-box** — Default `sun_checks.xml` may be opinionated. Adjust if linting rules are too strict for MVP.

## Success Criteria (Summary)

- ✅ Per-edit hook runs in <1s on RecipeController/TheMealDBClient changes
- ✅ Agent receives test failures and self-corrects before committing
- ✅ Pre-commit hooks block commits if tests or lint fail
- ✅ Pre-push ensures all 43 tests pass before remote push
- ✅ Non-risk files don't trigger scoped tests (fast commits for other code)
