# API Scaffold — Document, Enhance & Verify — Plan Brief

> Full plan: `context/changes/api-scaffold/plan.md`

## What & Why

The Spring Boot API is partially complete: recipe search endpoints work, TheMealDB client is integrated, and S-01 (guest search) is already shipped. But the API lacks standardization, monitoring, and documentation. This plan formalizes the foundation by wrapping responses in a consistent envelope, adding health monitoring, documenting endpoints via Swagger, and verifying the contract is solid enough for all downstream slices (auth, data, favorites) to build on.

## Starting Point

- ✅ Spring Boot 3.3.0 app running with REST controllers
- ✅ Two core endpoints: POST `/api/recipes/search`, GET `/api/recipes/{id}/details`
- ✅ TheMealDB API client with timeout and error handling
- ✅ JWT auth configured, database wired
- ❌ No health endpoint for monitoring/load balancers
- ❌ No API documentation (endpoints, schemas, auth requirements)
- ❌ Inconsistent response formats (success vs error)
- ❌ Validation spread across controllers (manual null checks)

## Desired End State

After this plan:
- **Unified response format**: All endpoints return `{data: {...}, error: null, status: 200}` for success, `{data: null, error: {...}, status: 4xx}` for errors
- **Health monitoring**: GET `/actuator/health` reports API, database, and TheMealDB status
- **API documentation**: Swagger UI at `/swagger-ui.html` documents every endpoint, request shape, response schema, and auth requirements
- **Input validation**: Bean Validation framework (@Valid annotations) replaces manual checks
- **Complete test coverage**: Unit + integration tests verify endpoints, error scenarios, and response contracts
- **Team clarity**: New endpoints can follow documented patterns; frontend/auth/data slices have a stable contract to build on

## Key Decisions Made

| Decision                       | Choice                          | Why (1 sentence)                                                          | Source |
|--------------------------------|---------------------------------|---------------------------------------------------------------------------|--------|
| Response standardization       | Envelope wrapper                | Consistent client parsing across success/error; matches API best practices | Plan   |
| Documentation tool             | SpringDoc OpenAPI (Swagger)     | Auto-generates from annotations, matches Spring ecosystem, self-updating  | Plan   |
| Health endpoint                | Spring Actuator (full health)   | Auto-detects dependencies (DB, TheMealDB), production-ready, low overhead | Plan   |
| Test coverage depth            | Unit + Integration              | Catches real failures without flaky external dependencies                | Plan   |
| Error response detail          | code + message + context        | Safe (no stack traces) but helpful for debugging                         | Plan   |
| Input validation approach      | Bean Validation (@Valid)        | DRY, consistent, self-documenting; removes repetitive manual checks      | Plan   |
| Documentation scope            | Endpoints + context + examples  | Developers understand full integration flow, not just isolated endpoints | Plan   |

## Scope

**In scope:**
- Wrapping all responses in consistent envelope format
- Global exception handling (@RestControllerAdvice)
- Spring Actuator health endpoint with custom TheMealDB indicator
- SpringDoc OpenAPI Swagger integration with endpoint annotations
- Bean Validation framework for input sanitization
- Unit + integration tests for API contract verification

**Out of scope:**
- Auth implementation (JWT already in place)
- Database migrations (Hibernate auto-schema)
- Frontend integration (S-01 already done)
- Performance tuning or load testing
- Admin/management endpoints

## Architecture / Approach

**Layered standardization:**
1. **Phase 1** — Wrap responses + centralize error handling (`@RestControllerAdvice`)
2. **Phase 2** — Add health monitoring (Spring Actuator) + Swagger docs (SpringDoc)
3. **Phase 3** — Validate inputs (Bean Validation) + verify contract (tests)

Each phase maintains backward compatibility; API stays functional between phases.

## Phases at a Glance

| Phase     | What it delivers                                    | Key risk                           |
|-----------|-----------------------------------------------------|------------------------------------|
| 1. Standardize | Response envelope + centralized error handling | Backward compat with S-01 frontend |
| 2. Document   | Health endpoint + Swagger UI                   | Missing @Operation annotations     |
| 3. Verify     | Validation framework + test suite               | Test maintenance overhead          |

**Prerequisites:** Spring Boot app running, Maven configured, existing RecipeController compiling  
**Estimated effort:** ~3 sessions across 3 phases; each phase is ~1-2 hours implementation + testing

## Open Risks & Assumptions

- **Backward compatibility**: Phase 1 changes response format; must coordinate with S-01 frontend or add feature flag
- **TheMealDB health pings**: Health endpoint will call TheMealDB every 10-30s (actuator poll frequency); may hit rate limits if external health checks are also running
- **Validation error messages**: Must sanitize to avoid leaking internal details (file paths, stack traces, API keys)
- **Test maintenance**: Integration tests mock TheMealDB; if real API contract changes, mocks must be updated

## Success Criteria (Summary)

- All endpoints return standardized envelope format: `{data, error, status}`
- Health check endpoint reports status of app + DB + TheMealDB
- Swagger UI at `/swagger-ui.html` documents complete API contract
- Input validation via @Valid prevents invalid requests from reaching business logic
- Unit + integration tests pass (≥80% coverage on RecipeController)

