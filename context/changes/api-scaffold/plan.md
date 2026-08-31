# API Scaffold — Document, Enhance & Verify

## Overview

F-01 completes the Spring Boot API foundation: formalizing the current structure, adding missing pieces (health endpoint, standardized responses, Swagger docs), and verifying that all downstream slices can build on a solid, well-documented contract.

The API already implements core recipe search logic. This plan consolidates, standardizes, documents, and verifies it for production readiness and team clarity.

## Current State Analysis

**What exists today:**
- Spring Boot 3.3.0 app with REST controllers (`@RestController`)
- Two core endpoints: POST `/api/recipes/search` and GET `/api/recipes/{id}/details`
- TheMealDB API client with timeout (5s), error handling, URL encoding
- Request validation (null/empty checks in controllers)
- Error responses (mixed format: success returns object, errors return {error, status})
- CORS enabled, JWT auth configured, database wired
- In-memory recipe caching (1-hour TTL)
- Cook-time extraction from recipe instructions

**What's missing:**
- Health endpoint for deployment/monitoring
- Standardized response envelope across all endpoints
- Swagger/OpenAPI documentation
- Bean Validation framework (@Valid annotations)
- Centralized error handling / exception advice
- Complete test coverage

**Key Constraints:**
- Must maintain backward compatibility with existing S-01 implementation (guest search already working)
- API is under `/api` context path (per application.properties)
- TheMealDB integration already proven in production

## Desired End State

After this plan:
- ✅ All API responses follow consistent envelope format: `{data: ..., error: null, status: 200}`
- ✅ Health check endpoint (`/actuator/health`) reports API + DB + TheMealDB status
- ✅ Swagger UI at `/swagger-ui.html` documents every endpoint, request/response shape, and auth requirements
- ✅ Request validation enforced via `@Valid` annotations (not manual checks)
- ✅ All error responses include code + message + context (safe, helpful)
- ✅ Unit + integration tests verify endpoint contracts and error scenarios
- ✅ Team can onboard new endpoints following the documented patterns
- ✅ Downstream slices (frontend, auth, data, favorites) have a stable, documented API contract to build on

### Key Discoveries:

- **Recipe Search Performance**: Current implementation fetches up to 20 candidate recipes and enriches each with full details via TheMealDB. This N+1 pattern is mitigated by the `.limit(20)` cap and 1-hour caching.
- **TheMealDB as Source of Truth**: All recipe data is fetched live from TheMealDB; no local recipe database exists. Cook times are either stored in TheMealDB or extracted from recipe instructions via regex.
- **Stateless API**: No server-side session state. Auth via JWT tokens (stored in frontend localStorage, injected in request headers).
- **Context Path**: All endpoints are under `/api` (e.g., `/api/recipes/search`), not at root.

## What We're NOT Doing

- **Database migrations**: Schema is auto-created by Hibernate (`ddl-auto=update`); no manual migration scripts in this plan.
- **Load testing or performance tuning**: Health check and tests use synthetic data, not production load.
- **Authentication implementation**: JWT provider and security filters already exist; this plan does not modify auth.
- **Frontend integration**: API contract is documented; frontend consumption is S-01 (done) and F-02 (separate slice).
- **Admin endpoints or management APIs**: Focus is on user-facing recipe + auth endpoints.

## Implementation Approach

**Three phases in sequence:**

1. **Phase 1: Standardize Responses** — Wrap all responses in envelope format, add centralized error handling via `@RestControllerAdvice`.
2. **Phase 2: Add Health & Documentation** — Spring Actuator health endpoint, SpringDoc OpenAPI Swagger integration, @Operation/@Parameter annotations.
3. **Phase 3: Validate & Verify** — Bean Validation framework, unit + integration tests, verification via CI scripts.

Each phase builds on the previous; the API remains functional between phases (backward compatible).

## Critical Implementation Details

**Backward Compatibility**: Existing clients (S-01 frontend) expect current response formats. Phase 1 wraps responses in envelopes, which may break naive clients if not coordinated. Mitigation: Implement in a feature branch; coordinate with frontend so both changes land together (or add a feature flag to toggle format).

**Error Message Safety**: When wrapping errors, ensure no stack traces, internal file paths, or TheMealDB API keys leak into response bodies. Validation errors must be sanitized (e.g., "invalid ingredients format" not "java.lang.NullPointerException at line 42").

**Health Check Dependencies**: Spring Actuator auto-discovers health indicators. Adding TheMealDB health requires a custom `HealthIndicator` component; we must define what "TheMealDB is healthy" means (successful ping? recent successful calls?).

---

## Phase 1: Standardize Responses

### Overview

Wrap all API responses in a consistent envelope format and implement centralized error handling via Spring's `@RestControllerAdvice` exception advice.

**Before:**
```
Success: {"results": [...], "total": 5}
Error: {"error": "invalid request", "status": 400}
```

**After:**
```
Success: {"data": {"results": [...], "total": 5}, "error": null, "status": 200}
Error: {"data": null, "error": {"code": "INVALID_REQUEST", "message": "Invalid request", "details": "ingredients list required"}, "status": 400}
```

### Changes Required:

#### 1. Create Response Wrapper DTO

**File**: `src/main/java/com/example/_x_recipes/model/ApiResponse.java`

**Intent**: Define the standard envelope that all endpoints will return. This is the single source of truth for response shape.

**Contract**: Generic class `ApiResponse<T>` with fields: `data: T`, `error: ErrorDetail`, `status: int`. Constructor factory methods for success and error cases. No code snippets needed — standard Java class following the envelope pattern.

#### 2. Create Error Detail DTO

**File**: `src/main/java/com/example/_x_recipes/model/ErrorDetail.java`

**Intent**: Standardize error response shape across all error types.

**Contract**: Class with fields: `code: String` (machine-readable code like "INVALID_REQUEST"), `message: String` (user-friendly message), `details: String` (optional context, sanitized to prevent leaks).

#### 3. Create Global Exception Advice

**File**: `src/main/java/com/example/_x_recipes/controller/GlobalExceptionHandler.java`

**Intent**: Centralize error handling so all exceptions (validation failures, API timeouts, unexpected errors) are caught and wrapped in the standard error format.

**Contract**: `@RestControllerAdvice` class with methods:
- `handleTheMealDBException(TheMealDBException e)` → 504 Service Unavailable
- `handleIllegalArgumentException(IllegalArgumentException e)` → 400 Bad Request
- `handleException(Exception e)` → 500 Internal Server Error

Each method returns `ResponseEntity<ApiResponse<Void>>` with appropriate status code. Error codes must sanitize: no stack traces, no file paths.

#### 4. Wrap RecipeController Responses

**File**: `src/main/java/com/example/_x_recipes/controller/RecipeController.java`

**Intent**: Update existing endpoints to return wrapped `ApiResponse<T>` instead of raw objects.

**Contract**: 
- POST `/api/recipes/search` — returns `ResponseEntity<ApiResponse<SearchResult>>` where `SearchResult` has `results: List<Recipe>`, `total: int`
- GET `/api/recipes/{id}/details` — returns `ResponseEntity<ApiResponse<RecipeDetail>>` where `RecipeDetail` has `id`, `name`, `image`, `ingredients`, `instructions`, `cookTime`, `yield`

No code snippets — implementer refactors existing return statements from `ResponseEntity.ok(object)` to `ResponseEntity.ok(ApiResponse.success(object))`.

### Success Criteria:

#### Automated Verification:

- POST `/api/recipes/search` returns 200 with `{data: {...}, error: null, status: 200}`
- POST `/api/recipes/search` with missing ingredients returns 400 with `{data: null, error: {code: "INVALID_REQUEST", ...}, status: 400}`
- GET `/api/recipes/{invalid-id}/details` returns 404 with `{data: null, error: {code: "NOT_FOUND", ...}, status: 404}`
- Linting passes: `mvn checkstyle:check`
- Unit tests for `ApiResponse` and `ErrorDetail` construction
- Type checking passes: `mvn clean compile`

#### Manual Verification:

- Manually call POST `/api/recipes/search` with curl; inspect response envelope structure
- Manually call endpoint with invalid input; verify error format matches spec
- Verify no stack traces or sensitive data in error responses

---

## Phase 2: Add Health Endpoint & Swagger Documentation

### Overview

Enable Spring Actuator for health monitoring and integrate SpringDoc OpenAPI to auto-generate Swagger documentation.

### Changes Required:

#### 1. Add Spring Actuator Dependency

**File**: `pom.xml`

**Intent**: Include Spring Boot Actuator for health checks and monitoring endpoints.

**Contract**: Add dependency:
```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

#### 2. Configure Actuator Health Endpoints

**File**: `src/main/resources/application.properties`

**Intent**: Enable health endpoint and configure what components are monitored.

**Contract**: Add properties:
```
management.endpoints.web.exposure.include=health,info
management.endpoint.health.show-details=when-authorized
management.health.probes.enabled=true
```

Result: GET `/actuator/health` returns component statuses (db, diskSpace, and custom indicators).

#### 3. Create TheMealDB Health Indicator

**File**: `src/main/java/com/example/_x_recipes/health/TheMealDBHealthIndicator.java`

**Intent**: Custom health indicator that pings TheMealDB and reports status.

**Contract**: Class extending `AbstractHealthIndicator`. Implement `doHealthCheck(Health.Builder builder)` to:
- Make a lightweight request to TheMealDB (e.g., search for "a")
- If response 200 within 5s: report UP
- If timeout or error: report DOWN with details

#### 4. Add SpringDoc OpenAPI Dependency

**File**: `pom.xml`

**Intent**: Include SpringDoc (the Spring Boot Swagger integration) for auto-generating API docs.

**Contract**: Add dependency:
```xml
<dependency>
  <groupId>org.springdoc</groupId>
  <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
  <version>2.0.2</version>
</dependency>
```

#### 5. Configure Swagger UI

**File**: `src/main/resources/application.properties`

**Intent**: Customize Swagger UI appearance and content.

**Contract**: Add properties:
```
springdoc.api-docs.path=/v3/api-docs
springdoc.swagger-ui.path=/swagger-ui.html
springdoc.swagger-ui.enabled=true
springdoc.swagger-ui.show-common-extensions=true
```

#### 6. Annotate Endpoints for Swagger

**File**: `src/main/java/com/example/_x_recipes/controller/RecipeController.java`

**Intent**: Add `@Operation`, `@Parameter`, `@ApiResponse` annotations so SpringDoc extracts endpoint metadata for Swagger docs.

**Contract**: For each endpoint:
```java
@PostMapping("/search")
@Operation(summary = "Search recipes by ingredients and time", 
           description = "Returns recipes matching user's available ingredients and cooking time constraints")
@ApiResponse(responseCode = "200", description = "Search successful")
@ApiResponse(responseCode = "400", description = "Invalid ingredients or timeRange")
@ApiResponse(responseCode = "504", description = "TheMealDB service unavailable")
public ResponseEntity<ApiResponse<SearchResult>> searchRecipes(
    @RequestBody @io.swagger.v3.oas.annotations.media.Schema(
        description = "Search request with ingredients and time range",
        example = "{\"ingredients\": [\"chicken\"], \"timeRange\": \"30\"}")
    SearchRequest request) { ... }
```

No code snippets needed — follow standard SpringDoc patterns.

#### 7. Create OpenAPI Configuration (Optional)

**File**: `src/main/java/com/example/_x_recipes/config/OpenApiConfig.java`

**Intent**: Define custom OpenAPI metadata (title, version, contact, auth requirements).

**Contract**: `@Configuration` class with `@Bean` method returning `OpenAPI` object:
```java
@Bean
public OpenAPI customOpenAPI() {
  return new OpenAPI()
    .info(new Info()
      .title("10xRecipes API")
      .version("1.0.0")
      .description("Recipe search and discovery API"));
}
```

### Success Criteria:

#### Automated Verification:

- GET `/actuator/health` returns 200 with `{status: "UP", components: {...}}`
- GET `/actuator/health` includes `db` component status
- GET `/actuator/health` includes `themealdb` component status (custom indicator)
- GET `/v3/api-docs` returns valid OpenAPI 3.0 JSON
- GET `/swagger-ui.html` loads successfully (status 200)
- Maven clean compile passes: `mvn clean compile`
- No missing `@Operation` annotations on endpoints (validate via automated check or manual inspection)

#### Manual Verification:

- Open `/swagger-ui.html` in browser; verify all endpoints are listed
- Click "Try it out" on POST `/api/recipes/search`; verify request schema is correct
- Check that error responses (400, 404, 504) are documented with examples
- Verify health endpoint is NOT exposed in Swagger (it's under `/actuator`, not `/api`)

---

## Phase 3: Validation Framework & Verification Tests

### Overview

Implement Bean Validation annotations for input sanitization and create comprehensive unit + integration tests to verify the API contract.

### Changes Required:

#### 1. Add Validation Dependencies

**File**: `pom.xml`

**Intent**: Include Spring Validation framework for declarative input validation.

**Contract**: Add dependency (usually auto-included with spring-boot-starter-web, but verify):
```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
```

#### 2. Create Validated Request DTOs

**File**: `src/main/java/com/example/_x_recipes/controller/SearchRequest.java`

**Intent**: Replace inline null/empty checks with declarative `@Valid` annotations.

**Contract**: Add Bean Validation annotations:
```java
public class SearchRequest {
  @NotNull(message = "ingredients list is required")
  @NotEmpty(message = "ingredients list cannot be empty")
  private List<String> ingredients;

  @NotNull(message = "timeRange is required")
  @NotBlank(message = "timeRange cannot be blank")
  private String timeRange;
  
  // getters/setters
}
```

#### 3. Wire Validation in Controllers

**File**: `src/main/java/com/example/_x_recipes/controller/RecipeController.java`

**Intent**: Use `@Valid` annotation on request parameters so Spring validates automatically.

**Contract**: Replace manual validation code with:
```java
@PostMapping("/search")
public ResponseEntity<ApiResponse<SearchResult>> searchRecipes(
    @Valid @RequestBody SearchRequest request) {
  // No manual null checks needed; @Valid triggers validation
  // If validation fails, GlobalExceptionHandler catches MethodArgumentNotValidException
  // and wraps in ApiResponse with 400 status
}
```

Remove the old manual checks: `if (request.getIngredients() == null || request.getIngredients().isEmpty()) { ... }`

#### 4. Handle Validation Errors in Exception Advice

**File**: `src/main/java/com/example/_x_recipes/controller/GlobalExceptionHandler.java`

**Intent**: Catch validation errors and format them in the standard error envelope.

**Contract**: Add handler method:
```java
@ExceptionHandler(MethodArgumentNotValidException.class)
public ResponseEntity<ApiResponse<Void>> handleValidationException(MethodArgumentNotValidException e) {
  String message = e.getBindingResult().getAllErrors().stream()
    .map(ObjectError::getDefaultMessage)
    .collect(Collectors.joining(", "));
  return ResponseEntity.badRequest().body(
    ApiResponse.error("VALIDATION_ERROR", message, "Check request format")
  );
}
```

#### 5. Create Unit Tests for Validation

**File**: `src/test/java/com/example/_x_recipes/controller/RecipeControllerValidationTest.java`

**Intent**: Verify that invalid inputs trigger validation errors, not crashes.

**Contract**: Test cases:
- POST `/api/recipes/search` with null ingredients → 400 with "ingredients list is required"
- POST `/api/recipes/search` with empty ingredients list → 400 with "ingredients list cannot be empty"
- POST `/api/recipes/search` with null timeRange → 400 with "timeRange is required"
- POST `/api/recipes/search` with blank timeRange → 400 with "timeRange cannot be blank"
- POST `/api/recipes/search` with valid request → 200 with search results

Use `MockMvc` to test controller layer without starting full app.

#### 6. Create Integration Tests for API Contract

**File**: `src/test/java/com/example/_x_recipes/controller/RecipeControllerIntegrationTest.java`

**Intent**: Verify endpoints work end-to-end with mocked TheMealDB, and error scenarios are handled correctly.

**Contract**: Test cases (use `@SpringBootTest` + `@MockBean` for TheMealDB):
- POST `/api/recipes/search` returns 200 with valid envelope: `{data: {results: [...], total: N}, error: null, status: 200}`
- POST `/api/recipes/search` with 50% ingredient match returns recipes
- POST `/api/recipes/search` with no matches returns 200 with `{data: {results: [], total: 0}, error: null, status: 200}`
- GET `/api/recipes/{id}/details` returns 200 with recipe envelope
- GET `/api/recipes/{invalid-id}/details` returns 404 with error envelope: `{data: null, error: {code: "NOT_FOUND", ...}, status: 404}`
- POST `/api/recipes/search` when TheMealDB times out returns 504 with error envelope

#### 7. Create Health Check Verification

**File**: `src/test/java/com/example/_x_recipes/health/HealthCheckIntegrationTest.java`

**Intent**: Verify health endpoint reports correct status for all components.

**Contract**: Test cases:
- GET `/actuator/health` returns 200
- Response includes `db` component with status UP or DOWN
- Response includes `themealdb` component with status UP or DOWN (mocked)
- Health endpoint format matches Spring Actuator contract

### Success Criteria:

#### Automated Verification:

- All validation unit tests pass: `mvn test -Dtest=RecipeControllerValidationTest`
- All integration tests pass: `mvn test -Dtest=RecipeControllerIntegrationTest`
- All health check tests pass: `mvn test -Dtest=HealthCheckIntegrationTest`
- Full test suite passes: `mvn test`
- Code coverage on RecipeController ≥ 80%: `mvn jacoco:report`
- Checkstyle passes: `mvn checkstyle:check`
- Type checking passes: `mvn clean compile`
- No manual null checks remain in controllers (grep for `!= null` should find none in controller methods)

#### Manual Verification:

- Start the app: `mvn spring-boot:run`
- Call POST `/api/recipes/search` with valid input; verify response envelope structure
- Call POST `/api/recipes/search` with invalid input (missing ingredients); verify 400 error envelope
- Call GET `/actuator/health`; verify all components are listed with correct status
- Open `/swagger-ui.html`; verify all endpoints are documented with request/response examples
- Stop TheMealDB mock and call an endpoint; verify 504 error with message "Recipe service unavailable"

---

## Testing Strategy

### Unit Tests:
- **Scope**: Controller input validation, response wrapping, error formatting
- **Mocking**: Mock TheMealDBClient, use MockMvc for request/response verification
- **Examples**: Validate that SearchRequest with null ingredients triggers error; verify ApiResponse.success() builds correct envelope

### Integration Tests:
- **Scope**: End-to-end endpoint behavior with real Spring context, mocked TheMealDB
- **Mocking**: @MockBean TheMealDBClient to return synthetic recipes
- **Examples**: Search endpoint returns 200 with results; search with no matches returns empty list; 504 when TheMealDB times out

### Manual Testing Steps:

1. **Envelope Format Check**:
   - Call `curl -X POST http://localhost:8080/api/recipes/search -H "Content-Type: application/json" -d '{"ingredients": ["chicken"], "timeRange": "30"}'`
   - Verify response is `{data: {...}, error: null, status: 200}`

2. **Error Handling Check**:
   - Call with missing ingredients: `curl -X POST ... -d '{}'`
   - Verify 400 response with `{data: null, error: {code: "VALIDATION_ERROR", message: "...", details: "..."}, status: 400}`

3. **Health Check**:
   - Call `curl http://localhost:8080/actuator/health`
   - Verify all components (db, themealdb) report status

4. **Swagger Documentation**:
   - Open `http://localhost:8080/swagger-ui.html` in browser
   - Verify all endpoints are listed with correct method, path, and request/response schemas

## Performance Considerations

- **Response Wrapping Overhead**: Adding envelope adds ~50 bytes per response. Negligible at expected scale (<100 QPS MVP).
- **Health Check Frequency**: Actuator health endpoint is called by load balancers periodically (typically every 10-30s). TheMealDB health indicator will make a request to TheMealDB every health check — add caching if this becomes a bottleneck.
- **Swagger JSON Size**: Auto-generated OpenAPI spec can be large (50-100 KB for a typical API). Cached by browsers; not a runtime concern.

## Migration Notes

**Backward Compatibility Risk**: Current clients (S-01 frontend) expect un-wrapped responses. Phase 1 changes response format, which will break naive clients. Two approaches:

1. **Coordinated Deploy**: Update frontend + backend together so response format change is transparent.
2. **Feature Flag**: Add a query parameter or header to toggle envelope format (`?format=envelope` or `X-Response-Format: envelope`). Old clients get old format, new clients get envelope. More complex but safer.

**Recommended**: Coordinated deploy since frontend is part of this same project (S-01).

## References

- Related research: (None — codebase is well-established; this is formalization)
- Similar patterns: Spring Boot REST best practices, SpringDoc OpenAPI docs, Spring Actuator health patterns
- Swagger UI once live: `http://localhost:8080/swagger-ui.html`
- Actuator docs: `http://localhost:8080/actuator` (if enabled)

---

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Standardize Responses

#### Automated

- [x] 1.1 Create ApiResponse wrapper DTO with success/error factory methods — 3c072b6
- [x] 1.2 Create ErrorDetail DTO with code/message/details fields — 3c072b6
- [x] 1.3 Create GlobalExceptionHandler @RestControllerAdvice with exception handlers — 3c072b6
- [x] 1.4 Update RecipeController endpoints to return wrapped ApiResponse — 3c072b6
- [x] 1.5 Unit tests for ApiResponse and ErrorDetail construction pass — 3c072b6
- [x] 1.6 Integration tests verify response envelope format (200 and error responses) — 3c072b6
- [x] 1.7 Checkstyle and type checking pass — 3c072b6

#### Manual

- [x] 1.8 Manual curl test: POST /api/recipes/search returns envelope with data/error/status — 3c072b6
- [x] 1.9 Manual curl test: Invalid request returns 400 with error envelope (no stack trace) — 3c072b6

### Phase 2: Add Health Endpoint & Swagger Documentation

#### Automated

- [ ] 2.1 Add spring-boot-starter-actuator dependency to pom.xml
- [ ] 2.2 Configure Actuator properties in application.properties
- [ ] 2.3 Create TheMealDBHealthIndicator component
- [ ] 2.4 Add springdoc-openapi dependency to pom.xml
- [ ] 2.5 Configure Swagger UI properties
- [ ] 2.6 Annotate all endpoints with @Operation/@Parameter/@ApiResponse
- [ ] 2.7 Create OpenApiConfig bean with metadata
- [ ] 2.8 Health endpoint tests verify db and themealdb components
- [ ] 2.9 Swagger JSON endpoint (/v3/api-docs) returns valid OpenAPI spec
- [ ] 2.10 Clean Maven build and type checking passes

#### Manual

- [ ] 2.11 Manual browser test: Open /swagger-ui.html and verify all endpoints listed with schemas
- [ ] 2.12 Manual curl test: GET /actuator/health returns component statuses
- [ ] 2.13 Manual Swagger test: "Try it out" on POST /api/recipes/search works with example request

### Phase 3: Validation Framework & Verification Tests

#### Automated

- [ ] 3.1 Add spring-boot-starter-validation dependency
- [ ] 3.2 Add @NotNull/@NotEmpty annotations to SearchRequest DTO
- [ ] 3.3 Replace manual null checks in RecipeController with @Valid
- [ ] 3.4 Add MethodArgumentNotValidException handler to GlobalExceptionHandler
- [ ] 3.5 Unit tests for validation pass: null/empty inputs trigger 400 errors
- [ ] 3.6 Integration tests for API contract pass: envelope format, error scenarios
- [ ] 3.7 Health check integration tests pass
- [ ] 3.8 Full test suite passes: mvn test
- [ ] 3.9 Code coverage on RecipeController ≥ 80%
- [ ] 3.10 Checkstyle and type checking pass

#### Manual

- [ ] 3.11 Manual curl test: POST /api/recipes/search with missing ingredients returns 400 with validation error
- [ ] 3.12 Manual curl test: POST /api/recipes/search with valid input returns 200 with results
- [ ] 3.13 Manual curl test: GET /api/recipes/{id}/details returns 200 with recipe detail envelope
- [ ] 3.14 Manual Swagger test: Error responses documented with correct status codes and examples
