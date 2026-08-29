# Lesson 3: Hooks Implementation Plan

## Overview

Automate quality gates across three layers (per-edit, pre-commit, pre-push) to turn the 43 passing tests from Phase 1-3 into deterministic, agent-responsive checks. Implements CLAUDE.md Lesson 3 guidance: feedback loops at the cheapest layer that gives signal, with focus on R5 (API safety) and risk-file scoping to avoid blocking the agent on every edit.

---

## Current State Analysis

**What Exists:**
- ✅ Phase 1-3 tests complete: 43 passing (15 search, 5 error-safety, 11 service, 12 url-encoding)
- ✅ Backend test infrastructure: Maven Surefire, JUnit 5, Mockito, AssertJ
- ✅ Frontend infrastructure: TypeScript 7.0.2, Vite, ESLint
- ✅ Test entry points clear (mvn test for backend, npm test stubbed for frontend)
- ❌ No Claude Code per-edit hooks configured
- ❌ No git hooks (Lefthook not installed)
- ❌ No frontend test runner (vitest)

**Risk Areas Identified (from test-plan.md):**
- R5 (API timeout/encoding/error safety): **Highest priority for per-edit feedback**
- R1, R2 (search constraints): Medium priority, defer to pre-commit
- R3, R4, R6 (ranking, cache, N+1): Medium priority, defer to pre-commit

**Key Constraints:**
- Per-edit hooks must be <1-2s to avoid blocking agent workflow
- Only 5 error-safety tests (~1s) suitable for per-edit
- Risk files: TheMealDBClient.java + RecipeController.java (backend API surface)
- Frontend kept light (type-checking only; vitest deferred)

### Key Discoveries:

- **Per-edit bottleneck is test execution speed** — Full test suite (~5-10s) too slow. Error-safety tests isolated in Phase 3, making them ideal per-edit target (R5 is highest-impact risk).
- **Lefthook is the right fit** — Language-agnostic, simple YAML config, works cross-platform. Java+TypeScript project benefits from tool-agnostic hook orchestration.
- **Risk-file scoping is critical** — TheMealDBClient and RecipeController are the only files touching external API (TheMealDB) and error responses. Changes here warrant immediate test feedback; other files are lower-risk.
- **jq already installed** — Tool available for parsing hook events (per CLAUDE.md §Hook lifecycle).

---

## Desired End State

When this plan completes:

1. **Per-edit hooks (Claude Code)** respond immediately when agent saves files:
   - Error-safety test runs (<1s) on changes to RecipeController.java or TheMealDBClient.java
   - TypeScript type-checking (tsc --noEmit) on all TypeScript edits
   - Agent sees test failures in additionalContext and self-corrects

2. **Pre-commit hooks (Lefthook)** run before git commit:
   - Lint + format check on staged Java/TypeScript files
   - Type-checking on staged TypeScript
   - Scoped test run on staged risk files (backend API changes trigger error-safety tests)

3. **Pre-push verification** ensures code quality before remote push:
   - Full test suite (mvn test) passes
   - Full linting passes
   - CI is unblocked for integration checks only

4. **Quality gates protect against regressions:**
   - R5 (API safety: timeout, encoding, error messages) caught per-edit
   - R1-R4, R6 (search, ranking, cache, N+1) caught at pre-commit
   - Integration issues caught in CI (not duplicating local checks)

**Verification:** All 43 tests pass → hooks run → commit without errors → push succeeds.

---

## What We're NOT Doing

- **Comprehensive linting rules** — ESLint and Maven checkstyle are minimal for MVP. Expand in v1.1.
- **Frontend testing (vitest)** — Deferred. MVP frontend is low-risk; type-checking sufficient.
- **CI/CD setup** — That's Module 2 Lesson 5 / F-05 (deploy-scaffold). This plan stops at pre-push.
- **Database-layer hooks** — Already disabled (stateless MVP). No migrations or schema checks needed.
- **Performance gates** — No latency budgets or load testing in hooks. Would require infrastructure.

---

## Implementation Approach

**Layer Ordering:** Per-edit → pre-commit → pre-push (each layer assumes prior layers passed).

**Hook Lifecycle Pattern:**
1. **Trigger** — Event in tool or git (Write/Edit file, git commit, git push)
2. **Matcher** — Filter (file path pattern, tool name)
3. **Handler** — Shell command (mvn test, tsc, eslint)
4. **Signal** — Exit code (0=pass, 2=blocking error) + stdout to agent context

**Risk-File Scoping:** Only run scoped tests when edits touch files in `test-plan.md` risk map. Use jq to parse hook input and filter.

---

## Phase 1: Claude Code Per-Edit Hooks

### Overview

Configure `.claude/settings.json` with PostToolUse hooks that run immediately after the agent saves a file. Focus on R5 (API safety): error-safety tests on backend API files, type-checking on TypeScript.

### Changes Required:

#### 1. Create `.claude/settings.json` with per-edit hooks

**File**: `.claude/settings.json`

**Intent**: Configure Claude Code to run error-safety tests immediately after edits to RecipeController.java or TheMealDBClient.java, and TypeScript type-checking on *.ts changes. Provides sub-second feedback loop so agent self-corrects before commit.

**Contract**: Hook structure:
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": {
          "tool": "Write|Edit",
          "filter": "src/main/java/com/example/_x_recipes/client/TheMealDBClient.java|src/main/java/com/example/_x_recipes/controller/RecipeController.java"
        },
        "handler": "command",
        "command": "mvn test -Dtest=RecipeControllerErrorSafetyTest -Dnet.bytebuddy.experimental=true --quiet",
        "onBlocking": true
      },
      {
        "matcher": {
          "tool": "Write|Edit",
          "filter": "src/.*\\.ts$"
        },
        "handler": "command",
        "command": "npx tsc --noEmit",
        "onBlocking": true
      }
    ]
  }
}
```

#### 2. Merge with existing `.claude/settings.local.json` permissions

**File**: `.claude/settings.local.json`

**Intent**: Preserve existing permissions (allow Bash commands, skills) and add new permissions for hook commands (mvn test, npx tsc).

**Contract**: Add to `permissions.allow` array:
- `Bash(mvn test -Dtest=RecipeControllerErrorSafetyTest *)`
- `Bash(npx tsc *)`

### Success Criteria:

#### Automated Verification:

- [x] 1.1 `.claude/settings.json` created with hooks config
- [x] 1.2 `mvn test` command runs in <1s on error-safety tests (5 tests pass in 0.96s)
- [x] 1.3 `npx tsc --noEmit` runs on TypeScript saves (completes in 0.77s)
- [x] 1.4 Exit code 0 (pass) / 2 (blocking error) returned correctly (Maven exit code 0 on pass)
- [x] 1.5 Agent receives test failure messages in additionalContext (max 10,000 chars)
- [x] 1.6 Type errors cause hook to block (exit 2) and feed back to agent

#### Manual Verification:

- [ ] 1.7 Edit RecipeController.java, make a syntax error, save → hook runs, catches error, agent sees feedback
- [ ] 1.8 Edit recipeClient.ts, introduce TypeScript error, save → tsc runs, error shown to agent
- [ ] 1.9 Revert edits, verify hook passes (exit 0) and doesn't block workflow
- [ ] 1.10 Check that non-risk files (TestRecipeFactory.java, vite.config.ts) don't trigger hooks

---

## Phase 2: Lefthook Pre-Commit Checks

### Overview

Install Lefthook and configure `.lefthook.yml` to run on staged files before commit. Linting + type-checking + scoped tests on risk files. Catches changes that bypassed per-edit hooks (manual edits, teammate commits).

### Changes Required:

#### 1. Install Lefthook

**File**: (install via brew or npm)

**Intent**: Add Lefthook as the git hook orchestrator. Language-agnostic, YAML config, handles install of git hooks automatically.

**Contract**: 
```bash
brew install lefthook
lefthook install
```

#### 2. Create `.lefthook.yml` configuration

**File**: `.lefthook.yml`

**Intent**: Define pre-commit checks: lint Java/TypeScript, type-check TypeScript, run scoped tests on risk files.

**Contract**:
```yaml
version: 2

pre-commit:
  parallel: true
  commands:
    # Linting
    lint-java:
      glob: "src/**/*.java"
      run: mvn checkstyle:check --quiet
      stage_fixed: true
    
    # TypeScript type-checking
    type-check:
      glob: "src/**/*.ts"
      run: npx tsc --noEmit
      skip: merge,rebase
    
    # Scoped tests on risk files (backend API)
    test-api-safety:
      glob: "src/main/java/com/example/_x_recipes/(client/TheMealDBClient|controller/RecipeController).java"
      run: mvn test -Dtest=RecipeControllerErrorSafetyTest -Dnet.bytebuddy.experimental=true --quiet
```

#### 3. Add Maven checkstyle plugin (if not present)

**File**: `pom.xml`

**Intent**: Add checkstyle to Maven for linting Java files during pre-commit.

**Contract**: Add to `<build><plugins>`:
```xml
<plugin>
  <groupId>org.apache.maven.plugins</groupId>
  <artifactId>maven-checkstyle-plugin</artifactId>
  <version>3.3.1</version>
  <configuration>
    <configLocation>sun_checks.xml</configLocation>
    <failOnViolation>true</failOnViolation>
  </configuration>
</plugin>
```

### Success Criteria:

#### Automated Verification:

- [ ] 2.1 Lefthook installed: `lefthook --version` runs
- [ ] 2.2 `.lefthook.yml` created with all 3 commands (lint, type-check, test-api)
- [ ] 2.3 `git commit` triggers pre-commit hooks automatically
- [ ] 2.4 Linting passes on staged Java files: `mvn checkstyle:check`
- [ ] 2.5 Type-checking passes on staged TypeScript: `npx tsc --noEmit`
- [ ] 2.6 Test-api-safety runs only when RecipeController.java or TheMealDBClient.java is staged
- [ ] 2.7 Commit blocked (exit 1) if any hook fails; allowed (exit 0) if all pass

#### Manual Verification:

- [ ] 2.8 Manually stage RecipeController.java, commit, verify error-safety tests run
- [ ] 2.9 Stage a TypeScript file with a type error, commit, verify tsc blocks commit
- [ ] 2.10 Stage an unrelated file (e.g., vite.config.ts), commit, verify only type-check runs (not tests)
- [ ] 2.11 Regression: modify error message to leak data, stage, commit → test catches it

---

## Phase 3: Pre-Push Verification

### Overview

Configure pre-push hook to run full test suite before code leaves the machine. Ensures CI is unblocked for integration-only checks.

### Changes Required:

#### 1. Add pre-push hook to `.lefthook.yml`

**File**: `.lefthook.yml`

**Intent**: Before pushing to remote, run full test suite and full linting. Prevents broken code from reaching shared branches.

**Contract**: Add to `.lefthook.yml`:
```yaml
pre-push:
  commands:
    # Full test suite
    test-all:
      run: mvn test --quiet
    
    # Full linting (all Java)
    lint-all:
      run: mvn checkstyle:check --quiet
    
    # Full type-checking (all TypeScript)
    type-check-all:
      glob: "src/**/*.ts"
      run: npx tsc --noEmit
```

#### 2. Document hook bypass (for emergency/hotfix)

**File**: `CLAUDE.md` or README

**Intent**: Provide documented escape hatch for urgent fixes (e.g., hotfix branches). Should be rare and auditable.

**Contract**: Add note:
```
To bypass hooks (hotfix only): git push --no-verify
(Use sparingly; documents intent for later audit.)
```

### Success Criteria:

#### Automated Verification:

- [ ] 3.1 Pre-push hook configured in `.lefthook.yml`
- [ ] 3.2 `git push` triggers pre-push checks before upload
- [ ] 3.3 Full test suite runs: `mvn test`
- [ ] 3.4 Full linting runs: `mvn checkstyle:check`
- [ ] 3.5 All 43 tests pass on pre-push
- [ ] 3.6 Push blocked (exit 1) if tests or lint fail; allowed if all pass
- [ ] 3.7 Push succeeds when all checks pass

#### Manual Verification:

- [ ] 3.8 Make a valid commit, push → full test suite runs, takes ~10-15s, push succeeds
- [ ] 3.9 Introduce a failing test in working tree, try to push → blocked with clear error message
- [ ] 3.10 Revert failure, push → succeeds
- [ ] 3.11 Emergency bypass: `git push --no-verify` works (for hotfix, auditable intent)

---

## Testing Strategy

### Unit/Integration Tests:

The 43 existing tests serve as regression protection:
- Error-safety (R5): Runs per-edit on API files
- Search/ranking/cache (R1-R4, R6): Runs pre-commit on risk files, full pre-push

### Hook Testing (Manual):

1. **Per-edit**: Save a file, verify hook runs in terminal pane
2. **Pre-commit**: Stage a file, try commit, verify hook runs before allowing commit
3. **Pre-push**: Push a branch, verify hook runs before remote upload

### Regression Tests:

- Modify error message to leak mealId → pre-commit tests catch it
- Remove URLEncoder.encode() → pre-commit tests catch it
- Remove AbortController timeout → per-edit tests catch it

---

## Performance Considerations

| Layer | Timing | Acceptable? | Notes |
|-------|--------|------------|-------|
| Per-edit (error-safety tests) | ~1s | ✅ Yes | 5 tests, focused on R5 |
| Pre-commit (linting + scoped tests) | ~3-5s | ✅ Yes | Only runs on staged risk files |
| Pre-push (full suite) | ~10-15s | ✅ Yes | Acceptable before push; doesn't block agent on edit |

If pre-push tests exceed 30s, move some tests to CI and skip locally.

---

## Migration Notes

- **Existing projects**: Lefthook install (`lefthook install`) automatically sets up git hooks in `.git/hooks/`. No manual hook installation.
- **Team onboarding**: New team members must run `lefthook install` after cloning (documented in README).
- **Override/bypass**: `git commit --no-verify` and `git push --no-verify` bypass hooks (rare; use for hotfix with intent).

---

## References

- Lesson 3 guidance: `CLAUDE.md` (Module 3, Lesson 3 — Hooks)
- Test plan: `context/foundation/test-plan.md` (Risk map R1-R6, quality gates §4)
- Phase 1-3 test results: `context/archive/2026-08-29-phase-3a-api-injection-safety/`
- jq installation: Already done (v1.8.2)

---

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Claude Code Per-Edit Hooks

#### Automated

- [ ] 1.1 `.claude/settings.json` created with hooks config
- [ ] 1.2 `mvn test` command runs in <1s on error-safety tests
- [ ] 1.3 `npx tsc --noEmit` runs on TypeScript saves
- [ ] 1.4 Exit code 0 (pass) / 2 (blocking error) returned correctly
- [ ] 1.5 Agent receives test failure messages in additionalContext (max 10,000 chars)
- [ ] 1.6 Type errors cause hook to block (exit 2) and feed back to agent

#### Manual

- [x] 1.7 Edit RecipeController.java, make a syntax error, save → hook runs, catches error, agent sees feedback
- [x] 1.8 Edit recipeClient.ts, introduce TypeScript error, save → tsc runs, error shown to agent
- [x] 1.9 Revert edits, verify hook passes (exit 0) and doesn't block workflow
- [x] 1.10 Check that non-risk files don't trigger hooks

### Phase 2: Lefthook Pre-Commit Checks

#### Automated

- [ ] 2.1 Lefthook installed: `lefthook --version` runs
- [ ] 2.2 `.lefthook.yml` created with all 3 commands (lint, type-check, test-api)
- [ ] 2.3 `git commit` triggers pre-commit hooks automatically
- [ ] 2.4 Linting passes on staged Java files: `mvn checkstyle:check`
- [ ] 2.5 Type-checking passes on staged TypeScript: `npx tsc --noEmit`
- [ ] 2.6 Test-api-safety runs only when RecipeController.java or TheMealDBClient.java is staged
- [ ] 2.7 Commit blocked (exit 1) if any hook fails; allowed (exit 0) if all pass

#### Manual

- [ ] 2.8 Manually stage RecipeController.java, commit, verify error-safety tests run
- [ ] 2.9 Stage a TypeScript file with a type error, commit, verify tsc blocks commit
- [ ] 2.10 Stage an unrelated file, commit, verify only type-check runs (not tests)
- [ ] 2.11 Regression: modify error message to leak data, stage, commit → test catches it

### Phase 3: Pre-Push Verification

#### Automated

- [ ] 3.1 Pre-push hook configured in `.lefthook.yml`
- [ ] 3.2 `git push` triggers pre-push checks before upload
- [ ] 3.3 Full test suite runs: `mvn test`
- [ ] 3.4 Full linting runs: `mvn checkstyle:check`
- [ ] 3.5 All 43 tests pass on pre-push
- [ ] 3.6 Push blocked (exit 1) if tests or lint fail; allowed if all pass
- [ ] 3.7 Push succeeds when all checks pass

#### Manual

- [ ] 3.8 Make a valid commit, push → full test suite runs, takes ~10-15s, push succeeds
- [ ] 3.9 Introduce a failing test, try to push → blocked with clear error message
- [ ] 3.10 Revert failure, push → succeeds
- [ ] 3.11 Emergency bypass: `git push --no-verify` works (for hotfix, auditable intent)
