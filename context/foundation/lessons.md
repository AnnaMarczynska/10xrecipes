# Lessons Learned

> Append-only register of recurring rules and patterns. Re-read at start by /10x-frame, /10x-research, /10x-plan, /10x-plan-review, /10x-implement, /10x-impl-review.

## Code Quality Check After Each Phase

**Rule**: After implementing each phase, run a focused code quality review before committing.

**Why**: Catches issues early (security, performance, serialization) when fixes are still scoped to a single phase. Phase 2 found missing @JsonIgnoreProperties on ErrorResponse — caught and fixed in 2 minutes. Later phases would have inherited the debt.

**Applies to**: All `/10x-implement` phases. Check for:
- Security: hardcoded secrets, SQL injection risks, overly permissive CORS
- Resource handling: try-with-resources, stream cleanup, MDC thread-local safety
- Error handling: exception specificity, response formats, sensitive data exposure
- Serialization: @JsonIgnoreProperties, serialVersionUID
- Patterns: follows existing conventions (Spring, project style)

**When**: After automated verification passes, before manual testing gate. When quality issues found: fix immediately, commit with `-quality` suffix, then continue to manual testing.

## Error Handling & Test Synchronization

**Rule**: When refactoring error handling (standardizing messages, adding wrappers, or changing error formats), update test expectations to match the new messages immediately.

**Why**: Tests fail after refactoring error handling because they assert on specific error messages. If tests aren't updated, you get false negatives — the implementation is correct but tests say it's broken. Updating tests during the refactoring phase (not after) keeps the test suite green and prevents later debugging confusion.

**Applies to**: Any phase that changes error messages, error wrapping, or error-handling patterns. Examples: standardizing error messages across multiple API clients, adding context wrappers, migrating from raw errors to typed errors. After Phase 2 (frontend-scaffold): test updates were deferred but should have been immediate.
