# 10x Skill Workflow Order

Complete workflow for implementing features using the 10x CLI skills.

---

## **Full Workflow: Phase Start to Archive**

### **Phase Start (New Feature)**

1. **`/10x-new`** — Create new change folder
   - Input: feature ID + description
   - Output: `context/changes/<id>/change.md`
   - Example: `/10x-new auth-scaffold Add user registration and login`

2. **`/10x-shape` or `/10x-frame`** (optional) — Frame the problem
   - Use when: problem is complex or unclear
   - Input: problem statement
   - Output: `context/changes/<id>/frame.md`
   - Skip if: the feature is straightforward and well-defined

3. **`/10x-research`** (optional) — Research codebase impact
   - Use when: need to understand existing patterns, dependencies
   - Input: research question
   - Output: `context/changes/<id>/research.md`
   - Skip if: codebase patterns are already known

---

### **Phase Planning**

4. **`/10x-plan`** — Create implementation plan
   - Input: PRD + research
   - Output: `context/changes/<id>/plan.md`
   - Includes: phases, changes required, success criteria, progress section

5. **`/10x-plan-review`** — Review plan before implementing
   - Input: plan.md
   - Output: `context/changes/<id>/reviews/plan-review.md`
   - Checks: end-state alignment, lean execution, architectural fitness, blind spots
   - Optional: can skip if plan is simple/well-reviewed by team

---

### **Phase Execution**

6. **`/10x-implement`** — Implement all phases
   - Input: approved plan
   - Output: code changes + commits per phase
   - Includes: automated verification, manual testing, phase-end commit ritual

7. **`/10x-impl-review`** — Review implementation vs plan
   - Input: implemented code
   - Output: `context/changes/<id>/reviews/impl-review.md`
   - Checks: plan adherence, scope discipline, safety & quality, pattern consistency

8. **`/10x-lesson`** (if needed) — Record recurring patterns
   - Input: findings from review
   - Output: `context/foundation/lessons.md`
   - Use when: finding reveals a recurring project rule or pattern

---

### **Phase Complete**

9. **`/10x-archive`** — Archive completed work
   - Input: implemented + reviewed change
   - Output: moved to `context/archive/<date>-<id>/`
   - Closes: roadmap items, marks change as archived

---

## **Quick Reference by Use Case**

### **Straightforward Feature (No Research Needed)**
```
/10x-new → /10x-plan → /10x-implement → /10x-impl-review → /10x-archive
```

### **Complex Feature (Research Required)**
```
/10x-new → /10x-research → /10x-plan → /10x-plan-review → /10x-implement → /10x-impl-review → /10x-archive
```

### **Unclear Problem (Needs Framing)**
```
/10x-new → /10x-shape → /10x-plan → /10x-implement → /10x-impl-review → /10x-archive
```

### **High-Risk or Large Change (Full Review)**
```
/10x-new → /10x-research → /10x-plan → /10x-plan-review → /10x-implement → /10x-impl-review → /10x-lesson (if needed) → /10x-archive
```

---

## **Next Phase: F-03 Auth Scaffold**

**Recommended workflow:**

```bash
/10x-new auth-scaffold Add user registration and login with JWT authentication
↓
/10x-plan auth-scaffold
↓
/10x-implement auth-scaffold
↓
/10x-impl-review
↓
/10x-archive auth-scaffold
```

**Notes:**
- Skip `/10x-shape` and `/10x-research` — Spring Security patterns are well-established
- `/10x-plan-review` optional if you're confident in the plan
- Record lessons if you discover new patterns

---

## **Skill Descriptions**

| Skill | Purpose | Output | When to Use |
|-------|---------|--------|-------------|
| `/10x-new` | Bootstrap a new change | change.md folder | Every new feature |
| `/10x-shape` | Challenge & reframe problem | frame.md | Problem is unclear |
| `/10x-frame` | Formal problem framing | frame.md | Diagnosis needed |
| `/10x-research` | Explore codebase | research.md | Unknown patterns |
| `/10x-plan` | Detailed implementation plan | plan.md | Ready to implement |
| `/10x-plan-review` | Verify plan quality | plan-review.md | High-stakes changes |
| `/10x-implement` | Execute the plan | code + commits | After plan approved |
| `/10x-impl-review` | Verify implementation | impl-review.md | Before archive |
| `/10x-lesson` | Record recurring rules | lessons.md | After finding patterns |
| `/10x-archive` | Complete & archive change | archive folder | Work is done & reviewed |

---

## **Tips**

✅ **Do:**
- Start with `/10x-new` for every feature
- Review the plan before implementing (esp. for complex changes)
- Run `/10x-impl-review` to catch issues before archiving
- Record lessons for patterns that repeat

❌ **Don't:**
- Skip planning if the change is large
- Archive without review
- Assume patterns are documented — research when uncertain

---

**Last Updated:** 2026-08-28  
**Created by:** Claude Code Assistant
