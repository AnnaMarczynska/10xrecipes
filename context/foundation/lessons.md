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
