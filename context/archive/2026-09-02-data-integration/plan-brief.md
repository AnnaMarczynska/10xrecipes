# Data Layer Integration — Plan Brief

> Full plan: `context/changes/data-integration/plan.md`

## What & Why

Wire Spring Data JPA and PostgreSQL to provide persistent storage for user data (authentication, favorites, allergens, notes). The infrastructure is 90% complete — entities, repositories, and PostgreSQL configuration already exist in the codebase. This plan adds explicit dev/prod profile split, startup validation, health checks, integration testing, and deployment documentation to make the integration bulletproof and ops-ready.

## Starting Point

- Spring Data JPA and PostgreSQL driver already in pom.xml
- User, Favorite, UserAllergen entities fully modeled with proper relationships
- UserRepository, FavoriteRepository, UserAllergenRepository all defined
- `application-prod.properties` already configured for PostgreSQL with environment variable placeholders
- Currently using H2 in-memory database for development
- No explicit startup validation; no health checks; no integration tests

## Desired End State

After F-04:
- Application explicitly uses H2 in dev (application-dev.properties), PostgreSQL in prod (application-prod.properties)
- Startup validation ensures required environment variables are set; app refuses to start with clear errors if they're missing
- Health endpoint (`/actuator/health`) reports database connectivity status
- Error handling is production-ready: connection failures return 503, logged with correlation IDs (no sensitive data exposed)
- Integration tests validate schema creation and CRUD operations against real PostgreSQL (testcontainers)
- Deployment guide provides ops with environment variable checklist and troubleshooting guide
- Ready to unblock S-03 (Favorites), S-04 (Allergens), S-05 (Notes)

## Key Decisions Made

| Decision | Choice | Why | Source |
|----------|--------|-----|--------|
| Secrets management | Environment variables only | Simpler than Google Secret Manager, already in place in application-prod.properties | Plan |
| Profile organization | Single base + profile overrides | Cleaner than file duplication, matches Spring Boot conventions | Plan |
| Testing approach | Unit tests (H2) + integration tests (real PostgreSQL) | Fast feedback + production confidence | Plan |
| Database verification | Integration test + health endpoint | Catches issues early, ops can monitor | Plan |
| Connection failures | Fail fast with clear error | Prevents silent misconfiguration, forces ops to fix immediately | Plan |
| Schema creation | Validate in prod, create-drop in dev | Safe in production, frictionless in dev | Plan |
| Logging | Errors + correlation ID, no sensitive data | Production-ready debugging without exposing secrets | Plan |
| Done criteria | Integration tests pass + docs written | Concrete, verifiable, production-ready | Plan |

## Scope

**In scope:**
- Create explicit `application-dev.properties` (H2) to replace mixed config
- Add startup validation for missing environment variables
- Implement database health check endpoint
- Add correlation ID logging and error handling
- Create integration tests using testcontainers PostgreSQL
- Write deployment guide and Cloud SQL setup script
- Manual validation: signup → add favorite → query database

**Out of scope:**
- Google Secret Manager integration (using env vars only)
- Flyway/Liquibase migrations (using Hibernate DDL auto for MVP)
- Entity or schema redesign (existing design is solid)
- Graceful degradation without database (fail-fast approach)
- Automated production testing (manual validation only)

## Architecture / Approach

**Four sequential phases:**

1. **Configuration & Startup Validation** — Split H2/PostgreSQL configs, add validation to prevent misconfiguration
2. **Health Checks & Error Handling** — Observable database status, production-ready error handling and logging
3. **Integration Testing** — Validate schema and CRUD against real PostgreSQL (testcontainers)
4. **Documentation & Validation** — Deployment guide, manual end-to-end validation

Each phase builds on the previous; tests run at each step before moving forward.

## Phases at a Glance

| Phase | What it delivers | Key risk |
|-------|------------------|----------|
| 1. Configuration | Explicit dev/prod profiles, startup validation | Missing profiles could cause silent failures |
| 2. Health & Errors | Health endpoint, correlation ID logging, 503 handling | Error handling incomplete could expose secrets in logs |
| 3. Integration Tests | testcontainers PostgreSQL, schema/CRUD validation | testcontainers adds Docker dependency; tests add ~30s to build |
| 4. Documentation | Deployment guide, setup script, validation checklist | Incomplete docs could lead to operator errors |

**Prerequisites:** Cloud SQL instance already provisioned (done 2026-08-25), Docker available for testcontainers

**Estimated effort:** ~3-4 sessions across 4 phases

## Open Risks & Assumptions

- **testcontainers requires Docker** — If build environment doesn't have Docker, integration tests can't run. Fallback: skip Phase 3, rely on manual testing only.
- **Cloud SQL credentials must be set before deploy** — If ops forget to set DATABASE_URL or DATABASE_PASSWORD in Cloud Run, startup validation will catch it, but deploy will fail. Mitigation: deployment guide with environment variable checklist.
- **No existing data to migrate** — This is the first version, so no data loss risk. Future schema changes will need migration scripts.

## Success Criteria (Summary)

- Application starts with explicit dev/prod profiles, startup validation prevents misconfiguration
- `/actuator/health` endpoint reports database connectivity
- Integration tests pass against testcontainers PostgreSQL
- Manual validation confirms end-to-end data persistence (signup → add favorite → query database)
- Deployment guide is clear and actionable for ops
