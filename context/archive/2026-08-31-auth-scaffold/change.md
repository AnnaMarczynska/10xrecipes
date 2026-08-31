---
change_id: auth-scaffold
title: Auth scaffold — Spring Security + JWT configuration + registration/login endpoints
status: archived
archived_at: 2026-08-31T16:55:43Z
created: 2026-08-31
updated: 2026-08-31
reviewed_at: 2026-08-31T18:50:00Z
reviewed_at: 2026-08-31T14:59:27Z
implemented_phase_1_start: 2026-08-31T14:59:27Z
---

## Summary

F-03 Foundation: Complete and integrate the auth system to unlock user-specific features (favorites, allergens, notes).

From `context/foundation/roadmap.md` — F-03 foundation:
- **Outcome:** Spring Security configured, JWT token provider (generate, validate, extract claims), auth middleware in place, registration and login endpoints wired
- **PRD refs:** FR-001 (register), FR-002 (login), FR-003 (logout)
- **Prerequisites:** F-01 (needs REST controller scaffold)
- **Unlocks:** S-02 (user auth), S-03/S-04/S-05 (authenticated routes)
- **Risk:** JWT secrets management; if secrets are hardcoded or leaked, entire auth system is compromised.
