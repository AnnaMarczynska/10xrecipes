# Data Layer Integration Implementation Plan

## Overview

Wire Spring Data JPA, PostgreSQL, and Cloud SQL to provide persistent storage for user data (authentication, favorites, allergens, notes). The infrastructure is 90% complete — entities, repositories, and production configuration all exist. This plan adds explicit dev/prod profile split, startup validation, health checks, integration testing, and deployment documentation to complete the integration.

## Current State Analysis

### What's Already in Place

- **Spring Data JPA + PostgreSQL driver**: Both dependencies in `pom.xml:43` and `pom.xml:52-55`
- **Entities fully modeled**: User, Favorite, UserAllergen with proper JPA annotations (jakarta.persistence), relationships, and cascade behavior
- **Repositories with custom finders**: UserRepository, FavoriteRepository, UserAllergenRepository all extend JpaRepository
- **Application profiles**: `application.properties` (H2 dev config), `application-prod.properties` (PostgreSQL with env vars)
- **DDL strategy**: `create-drop` in dev, `validate` in prod — appropriate for each environment
- **Environment variable placeholders**: DATABASE_URL, DATABASE_USER, DATABASE_PASSWORD, JWT_SECRET all supported in application-prod.properties

### What's Missing

1. **Explicit dev profile file**: H2 config is mixed in application.properties; should be isolated to application-dev.properties for clarity
2. **Startup validation**: No check if required env vars (DATABASE_URL, JWT_SECRET) are set; could fail cryptically at runtime
3. **Database health check**: No `/actuator/health` integration for database connectivity
4. **Error handling**: No explicit handling for connection failures, no correlation ID logging
5. **Integration tests**: No automated tests against real PostgreSQL; relying on manual testing
6. **Test profile**: No application-test.properties for test environment (testcontainers or Cloud SQL test instance)
7. **Deployment documentation**: No guide for ops on how to set environment variables in Cloud Run

### Key Discoveries

- **Spring Boot 3.3.0 + Java 21**: Modern stack, Jakarta Persistence API (not javax.*), uses IDENTITY generation strategy for all IDs
- **Lazy loading configured**: Relationships use `FetchType.LAZY` to avoid N+1 query problems
- **Unique constraints in place**: email unique on User, (user_id, recipe_id) composite on Favorite, (user_id, allergen) composite on UserAllergen
- **Lifecycle hooks**: User entity has `@PreUpdate` to auto-update `updatedAt` timestamp
- **No migrations yet**: Using Hibernate DDL auto, not Flyway/Liquibase (acceptable for MVP; can add migrations in v1.1)
- **Actuator already enabled**: Management endpoints exposed for health checks; we extend this for database health

## Desired End State

After F-04 is complete:

1. **Application starts with explicit profile**: `application-dev.properties` (H2) for local dev, `application-prod.properties` (PostgreSQL) for production. Both are clear, standalone, and maintainable.

2. **Startup validation prevents misconfiguration**: If DATABASE_URL or JWT_SECRET are missing, the app logs a clear error and refuses to start (rather than failing cryptically at first operation).

3. **Database health is observable**: GET `/actuator/health` returns database connectivity status; ops can quickly diagnose connection issues without checking logs.

4. **Error handling is production-ready**: Connection failures are caught, logged with correlation IDs (no sensitive data), and reported to the user with clear 503 messages.

5. **Integration tests provide confidence**: Integration tests run against a real PostgreSQL instance (Cloud SQL test instance or testcontainers), validating that schema creation, CRUD operations, and relationships work as expected.

6. **Deployment is documented**: Clear checklist for ops: how to provision Cloud SQL, what environment variables to set, what to expect during startup, how to validate the database is working.

7. **Ready to unblock S-03, S-04, S-05**: Favorites, allergens, and notes features can now proceed with persistent data layer fully integrated and tested.

### Verification Criteria

- Application starts with explicit `application-dev.properties` and `application-prod.properties` visible in code review
- Integration tests execute against PostgreSQL and validate schema, CRUD, and relationships
- Database health endpoint (`/actuator/health`) returns UP when database is connected
- Deployment documentation includes environment variable checklist and troubleshooting guide
- Manual validation: signup → login → add favorite → query Cloud SQL directly and confirm data is persisted

## What We're NOT Doing

- **Google Secret Manager integration**: User decided to use environment variables only (simpler, already in place)
- **Flyway/Liquibase migrations**: Using Hibernate DDL auto for MVP (sufficient for our schema complexity; can upgrade in v1.1)
- **Schema redesign or entity refactoring**: Entities and relationships are well-designed; we're not changing them
- **Graceful degradation without database**: Fail-fast approach — if DB is down, the app refuses to start (cleaner than partial functionality)
- **Automated production testing**: Using manual validation (signup → add favorite → query DB) to keep scope tight

## Implementation Approach

**Four sequential phases building upward:**

1. **Configuration clarity** — Split H2/PostgreSQL configs, add startup validation
2. **Observability** — Health checks, error handling, correlation ID logging
3. **Confidence** — Integration tests with real PostgreSQL
4. **Documentation** — Deployment guide, runbook, ready for ops

Each phase builds on the previous; we test at each step before moving forward.

## Critical Implementation Details

**Correlation ID for error logging**: When logging database errors, use a request-scoped correlation ID to help ops trace user-reported issues back to logs. Spring Cloud Sleuth can inject this automatically; alternatively, a simple servlet filter can generate and pass a UUID through MDC. Either approach adds <10 lines of code; the value is significant for production debugging.

**Startup validation ordering**: Validate environment variables *after* Spring creates the DataSource but *before* the app starts accepting requests. This ensures clear error messages on misconfiguration, not cryptic NPEs at first login attempt.

---

## Phase 1: Configuration & Startup Validation

### Overview

Isolate development (H2) and production (PostgreSQL) configurations into explicit profile files. Add startup validation to ensure required environment variables are set before the app starts serving requests.

### Changes Required

#### 1. Create `application-dev.properties`

**File**: `src/main/resources/application-dev.properties`

**Intent**: Make H2 configuration explicit and separate from the base properties file. Currently H2 config is mixed into application.properties; moving it to a profile-specific file makes the intent clearer and easier to maintain.

**Contract**: This file contains all H2-specific settings (datasource URL, driver, Hibernate dialect, DDL strategy). The base `application.properties` will contain common settings (JWT, CORS, server port, logging). When `spring.profiles.active=dev` is set, this file is loaded and H2 is used.

```properties
# H2 In-Memory Database (Development)
spring.datasource.url=jdbc:h2:mem:testdb
spring.datasource.driverClassName=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=
spring.jpa.database-platform=org.hibernate.dialect.H2Dialect
spring.jpa.hibernate.ddl-auto=create-drop
spring.h2.console.enabled=true
```

#### 2. Update `application.properties` (base)

**File**: `src/main/resources/application.properties`

**Intent**: Move H2-specific config to application-dev.properties; keep only common, profile-agnostic settings. This creates a clear separation: base = common, dev = H2, prod = PostgreSQL.

**Contract**: Remove H2 datasource configuration (lines 4-11 in current file). Keep JWT, CORS, server, actuator, Swagger settings. The result is a smaller, cleaner base file.

Current state (problematic):
```properties
spring.application.name=10x-recipes
spring.profiles.active=dev

# H2 in-memory database configuration
spring.datasource.url=jdbc:h2:mem:testdb
...
```

Desired state:
```properties
spring.application.name=10x-recipes

# JWT Configuration
jwt.secret=${JWT_SECRET:dev-secret-key-change-in-production}
jwt.expiration=86400000

# CORS Configuration
cors.allowed-origins=${CORS_ALLOWED_ORIGINS:http://localhost:3000,http://localhost:5173}

# Server Configuration
server.port=9090
server.servlet.context-path=/api

# Actuator Health Endpoint
management.endpoints.web.exposure.include=health
management.endpoint.health.show-details=when-authorized
management.health.livenessState.enabled=true
management.health.readinessState.enabled=true

# Swagger/OpenAPI Documentation
springdoc.api-docs.path=/v3/api-docs
springdoc.swagger-ui.path=/swagger-ui.html
...
```

#### 3. Create `DatabaseConfigValidator` startup validation class

**File**: `src/main/java/com/example/_x_recipes/config/DatabaseConfigValidator.java`

**Intent**: Validate that required environment variables (DATABASE_URL, DATABASE_USER, DATABASE_PASSWORD for prod; JWT_SECRET for all profiles) are set *before* the application accepts requests. This prevents cryptic NPEs and connection failures at runtime.

**Contract**: This is a `@Component` that implements `ApplicationRunner` or uses `@EventListener(ApplicationReadyEvent.class)`. On startup, it checks that:
- If `spring.profiles.active` contains "prod": DATABASE_URL, DATABASE_USER, DATABASE_PASSWORD are non-empty
- If running locally (dev profile): no check needed (defaults work)
- Always: JWT_SECRET is non-empty in production; in dev, a default is fine

If validation fails, log an error and throw an exception. Example check:

```java
if (isProdProfile && isEmpty(databaseUrl)) {
  logger.error("STARTUP FAILURE: DATABASE_URL environment variable not set");
  throw new IllegalStateException("DATABASE_URL must be set in production");
}
```

#### 4. Update `src/main/java/com/example/_x_recipes/Application.java` to set default profile

**File**: `src/main/java/com/example/_x_recipes/Application.java`

**Intent**: Set a default profile if none is active. This ensures the app always has a profile (not just "default"), making behavior explicit.

**Contract**: In the `main()` method, before `SpringApplication.run()`, set the default profile to "dev" if no profile is already active:

```java
public static void main(String[] args) {
  String profiles = System.getenv("SPRING_PROFILES_ACTIVE");
  if (profiles == null || profiles.isBlank()) {
    System.setProperty("spring.profiles.active", "dev");
  }
  SpringApplication.run(Application.class, args);
}
```

This ensures:
- Local dev uses H2 by default
- Cloud Run can override via `SPRING_PROFILES_ACTIVE=prod` env var
- No ambiguity about which profile is active

### Success Criteria

#### Automated Verification

- [ ] Type check passes: `mvn clean compile`
- [ ] Lint passes: `mvn checkstyle:check`
- [ ] Application starts with `mvn spring-boot:run` (dev profile, H2 database)
- [ ] `application-dev.properties` is readable and contains all H2 config
- [ ] Base `application.properties` contains only common settings (no database-specific config)
- [ ] `application-prod.properties` is unchanged and ready for Cloud SQL

#### Manual Verification

- [ ] Start app locally: `mvn spring-boot:run` → app starts with H2, /health endpoint returns UP
- [ ] Verify profile is active: Check logs for "The following profiles are active: dev"
- [ ] Attempt to start with missing JWT_SECRET in prod profile (simulate): Confirm clear error message, app refuses to start

---

## Phase 2: Health Checks & Error Handling

### Overview

Add database health checks observable via `/actuator/health`, implement error handling for connection failures, and configure logging to exclude sensitive data while including correlation IDs for debugging.

### Changes Required

#### 1. Extend Actuator Health with Database Status

**File**: `src/main/java/com/example/_x_recipes/config/DatabaseHealthIndicator.java`

**Intent**: Add database connectivity status to the `/actuator/health` endpoint. Ops can poll this endpoint to quickly determine if the app can reach the database.

**Contract**: Implement Spring's `HealthIndicator` interface. On each poll, execute a simple query (e.g., `SELECT 1`). If it succeeds, return Status.UP; if it times out or throws an exception, return Status.DOWN with the error message.

```java
@Component
public class DatabaseHealthIndicator extends AbstractHealthIndicator {
  @Autowired
  private DataSource dataSource;
  
  @Override
  protected void doHealthCheck(Health.Builder builder) throws Exception {
    try (Connection conn = dataSource.getConnection();
         Statement stmt = conn.createStatement()) {
      stmt.executeQuery("SELECT 1");
      builder.up().withDetail("database", "Connected to PostgreSQL");
    } catch (Exception e) {
      builder.down().withDetail("error", e.getMessage());
    }
  }
}
```

#### 2. Configure Error Handling for Database Operations

**File**: `src/main/java/com/example/_x_recipes/config/GlobalExceptionHandler.java`

**Intent**: Catch database-related exceptions (DataAccessException, SQLException) and return a user-friendly 503 Service Unavailable response instead of a stack trace. Log the error with a correlation ID for ops debugging.

**Contract**: Use `@ControllerAdvice` to define a global exception handler. For `DataAccessException`, log the error with context and return 503. Include a correlation ID (from request context or generated on the spot) in logs so ops can trace a user-reported issue.

Example handler:

```java
@ExceptionHandler(DataAccessException.class)
public ResponseEntity<ErrorResponse> handleDatabaseError(
    DataAccessException ex, 
    HttpServletRequest request) {
  String correlationId = request.getAttribute("correlationId").toString();
  logger.error("Database error [correlationId:{}]: {}", correlationId, ex.getMessage());
  return ResponseEntity.status(503).body(
    new ErrorResponse("Database unavailable, please try again later", correlationId)
  );
}
```

#### 3. Add Correlation ID Filter

**File**: `src/main/java/com/example/_x_recipes/config/CorrelationIdFilter.java`

**Intent**: Inject a unique request ID into each request context so database errors can be traced back to logs. This is critical for production debugging.

**Contract**: Implement a Servlet Filter that:
- Generates a UUID for each request (or reads X-Correlation-ID header if provided)
- Stores it in MDC (Mapped Diagnostic Context) so all logs in that request include it
- Adds it to the response as X-Correlation-ID header

```java
@Component
public class CorrelationIdFilter extends OncePerRequestFilter {
  @Override
  protected void doFilterInternal(HttpServletRequest request, 
                                  HttpServletResponse response, 
                                  FilterChain chain) throws IOException, ServletException {
    String correlationId = request.getHeader("X-Correlation-ID");
    if (correlationId == null || correlationId.isBlank()) {
      correlationId = UUID.randomUUID().toString();
    }
    MDC.put("correlationId", correlationId);
    response.setHeader("X-Correlation-ID", correlationId);
    try {
      chain.doFilter(request, response);
    } finally {
      MDC.remove("correlationId");
    }
  }
}
```

#### 4. Configure Logging Format to Include Correlation ID

**File**: `src/main/resources/logback-spring.xml` (create if absent)

**Intent**: Ensure all logs include the correlation ID, making it easy to trace a single user's requests through logs.

**Contract**: Add a Logback pattern that includes `%X{correlationId}` in the log format. Example:

```xml
<pattern>%d{ISO8601} [%thread] [%X{correlationId}] %-5level %logger{36} - %msg%n</pattern>
```

#### 5. Suppress Sensitive Data in Logs

**File**: `src/main/resources/application.properties` (update)

**Intent**: Prevent passwords, tokens, and emails from appearing in logs.

**Contract**: Add these properties to suppress SQL parameter logging (which might include user emails):

```properties
# Suppress sensitive SQL parameters in logs
spring.jpa.properties.hibernate.use_sql_comments=false
logging.level.org.hibernate.SQL=WARN
logging.level.org.hibernate.type.descriptor.sql.BasicBinder=WARN
```

### Success Criteria

#### Automated Verification

- [ ] Type check and lint pass: `mvn clean compile && mvn checkstyle:check`
- [ ] Application starts: `mvn spring-boot:run`
- [ ] Health endpoint returns database status: `curl http://localhost:9090/api/actuator/health` returns `{"database":"UP"}`
- [ ] Exception handler test: Unit test confirms DataAccessException returns 503
- [ ] Correlation ID filter test: Unit test confirms UUID is injected into request context

#### Manual Verification

- [ ] Check logs: Start app, access any endpoint, confirm logs include correlation ID (pattern: `[<uuid>]`)
- [ ] Health endpoint: `curl http://localhost:9090/api/actuator/health` returns database status
- [ ] Simulate database down: Stop database, confirm health endpoint returns DOWN
- [ ] Verify logs don't expose passwords/tokens: Grep logs for "password" or "token", confirm none found

---

## Phase 3: Integration Testing

### Overview

Create integration tests using testcontainers (or Cloud SQL test instance) to validate that schema creation, CRUD operations, and relationships work against a real PostgreSQL database.

### Changes Required

#### 1. Add testcontainers Dependency

**File**: `pom.xml`

**Intent**: Add testcontainers library to run PostgreSQL in a Docker container during integration tests. This allows tests to run isolated schema creation and queries without mocking.

**Contract**: Add this dependency to pom.xml (test scope):

```xml
<dependency>
  <groupId>org.testcontainers</groupId>
  <artifactId>testcontainers</artifactId>
  <version>1.19.0</version>
  <scope>test</scope>
</dependency>
<dependency>
  <groupId>org.testcontainers</groupId>
  <artifactId>postgresql</artifactId>
  <version>1.19.0</version>
  <scope>test</scope>
</dependency>
```

#### 2. Create `application-test.properties`

**File**: `src/main/resources/application-test.properties`

**Intent**: Configure Spring to use testcontainers PostgreSQL during integration tests. This profile is activated by the test class, not globally.

**Contract**: Similar to application-prod.properties but with testcontainers connection string:

```properties
spring.datasource.url=jdbc:tc:postgresql:latest:///test
spring.datasource.username=test
spring.datasource.password=test
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.hibernate.ddl-auto=create-drop
spring.jpa.show-sql=false
```

#### 3. Create Base Integration Test Class

**File**: `src/test/java/com/example/_x_recipes/integration/IntegrationTest.java`

**Intent**: Provide a base class for all integration tests that sets up testcontainers PostgreSQL and Spring context.

**Contract**: Use `@SpringBootTest` with `@ActiveProfiles("test")` to activate the test profile. Use a static PostgreSQL container:

```java
@SpringBootTest
@ActiveProfiles("test")
public abstract class IntegrationTest {
  @Autowired
  protected UserRepository userRepository;
  @Autowired
  protected FavoriteRepository favoriteRepository;
  @Autowired
  protected UserAllergenRepository allergenRepository;
  
  // Container setup via testcontainers
}
```

#### 4. Create Repository Integration Tests

**File**: `src/test/java/com/example/_x_recipes/integration/UserRepositoryIntegrationTest.java`

**Intent**: Test User entity CRUD and relationships against real PostgreSQL.

**Contract**: Test scenarios:
- `testCreateAndFetchUser()` — create a user, fetch by ID, verify fields
- `testFindByEmail()` — create a user, fetch by email, verify Optional is populated
- `testUserFavoritesRelationship()` — create user, add favorites, fetch user, verify favorites are loaded
- `testUserAllergensCascade()` — create user with allergens, verify cascade delete works

#### 5. Create Favorite Repository Integration Tests

**File**: `src/test/java/com/example/_x_recipes/integration/FavoriteRepositoryIntegrationTest.java`

**Intent**: Test Favorite entity CRUD and unique constraint against real PostgreSQL.

**Contract**: Test scenarios:
- `testCreateFavorite()` — create a favorite for a user, verify it's persisted
- `testDuplicateFavoriteUniqueConstraint()` — attempt to add the same recipe twice for a user, verify constraint violation
- `testFavoritesPerUser()` — create user with multiple favorites, fetch all, verify count
- `testDeleteFavorite()` — delete a favorite, verify it's gone and user still exists

#### 6. Create UserAllergen Integration Tests

**File**: `src/test/java/com/example/_x_recipes/integration/UserAllergenRepositoryIntegrationTest.java`

**Intent**: Test UserAllergen entity CRUD and constraints.

**Contract**: Test scenarios:
- `testCreateAllergen()` — create an allergen for a user, verify it's persisted
- `testDuplicateAllergenConstraint()` — attempt to add the same allergen twice, verify constraint violation
- `testAllergenDeletion()` — delete an allergen, verify user still exists

### Success Criteria

#### Automated Verification

- [ ] Dependency added: `mvn dependency:tree | grep testcontainers` shows versions
- [ ] Application-test.properties is readable: `cat src/main/resources/application-test.properties`
- [ ] Integration tests compile: `mvn test-compile`
- [ ] Integration tests pass: `mvn verify` (or `mvn failsafe:integration-test`) runs all integration tests and they pass
- [ ] Schema is created: Test logs show successful schema creation (Hibernate DDL output)
- [ ] All repository operations work: CRUD tests pass, relationships tested

#### Manual Verification

- [ ] Run integration tests locally: `mvn verify` → all tests pass (takes ~30s due to container startup)
- [ ] Inspect test database: During test run, connect to testcontainers PostgreSQL and verify tables exist
- [ ] Verify constraint enforcement: Test that duplicate favorite/allergen insert fails with ConstraintViolationException

---

## Phase 4: Documentation & Validation

### Overview

Document Cloud SQL setup, environment variables, and deployment checklist. Perform manual validation (signup → add favorite → query database) to ensure end-to-end data persistence works.

### Changes Required

#### 1. Create Deployment Guide

**File**: `context/changes/data-integration/DEPLOYMENT.md`

**Intent**: Provide ops with a clear checklist for deploying F-04 to Cloud Run with Cloud SQL.

**Contract**: Guide covers:
- Prerequisites: Cloud SQL instance provisioned, Cloud Run service created
- Environment variables to set in Cloud Run:
  - `SPRING_PROFILES_ACTIVE=prod`
  - `DATABASE_URL=jdbc:postgresql://<cloud-sql-ip>:5432/recipes`
  - `DATABASE_USER=<username>`
  - `DATABASE_PASSWORD=<password>`
  - `JWT_SECRET=<random-32-byte-secret>`
  - `CORS_ALLOWED_ORIGINS=https://<frontend-domain>`
- Deployment steps: deploy image, set environment variables, cold start validation
- Troubleshooting: health endpoint, logs, common issues (missing credentials, connection timeout)

#### 2. Create Database Setup Script

**File**: `scripts/setup-cloud-sql.sh`

**Intent**: Automate Cloud SQL database and user creation for ops.

**Contract**: Script that:
- Creates the `recipes` database in Cloud SQL (if absent)
- Creates the database user (if absent)
- Sets permissions

```bash
#!/bin/bash
# Usage: ./setup-cloud-sql.sh <cloud-sql-instance> <db-name> <db-user> <db-password>
gcloud sql databases create recipes \
  --instance=$1 \
  --charset=UTF8 \
  || echo "Database likely already exists"
```

#### 3. Create Validation Checklist

**File**: `context/changes/data-integration/VALIDATION.md`

**Intent**: Document the manual validation steps to confirm end-to-end data persistence works after deployment.

**Contract**: Checklist:
- [ ] App is running: Health endpoint returns 200
- [ ] Database is connected: Health endpoint shows database=UP
- [ ] Signup flow persists user: Signup new user, query `users` table in Cloud SQL, confirm row exists
- [ ] Login retrieves user: Log in with the user, token is returned (auth layer works)
- [ ] Add favorite persists: While logged in, add a recipe to favorites, query `favorites` table, confirm row exists with user_id and recipe_id
- [ ] Favorite is linked to user: Query `SELECT u.id, u.email, f.recipe_id FROM users u JOIN favorites f ON u.id = f.user_id`, confirm data is correct

#### 4. Create a Local Cloud SQL Proxy Setup Guide

**File**: `context/changes/data-integration/LOCAL_CLOUD_SQL.md`

**Intent**: Document how developers can test against a real Cloud SQL instance locally (if desired).

**Contract**: Guide covers:
- Installing Cloud SQL Proxy
- Connecting: `cloud_sql_proxy -instances=<project>:<region>:<instance-name>=tcp:5432`
- Setting environment variables locally: `DATABASE_URL=jdbc:postgresql://localhost:5432/recipes`
- Running app: `SPRING_PROFILES_ACTIVE=prod mvn spring-boot:run`

### Success Criteria

#### Automated Verification

- [ ] Documentation files exist and are readable
- [ ] Deployment guide is complete: covers prerequisites, environment variables, deployment steps, troubleshooting
- [ ] Setup script is executable: `chmod +x scripts/setup-cloud-sql.sh && scripts/setup-cloud-sql.sh --help`

#### Manual Verification

- [ ] **Full signup → favorite → query flow**: 
  - Open app, sign up with new email
  - Log in
  - Add a recipe to favorites
  - Query Cloud SQL directly (via gcloud or Cloud SQL Proxy):
    ```sql
    SELECT u.id, u.email, f.recipe_id FROM users u 
    JOIN favorites f ON u.id = f.user_id 
    WHERE u.email = 'test@example.com';
    ```
  - Confirm the row exists and matches what was entered
- [ ] **Health endpoint works**: `curl https://<app-url>/api/actuator/health` returns database status
- [ ] **Error handling works**: Stop database, attempt login, confirm 503 response with helpful message
- [ ] **Documentation is clear**: Have someone unfamiliar with the project read the deployment guide and confirm they could deploy it

---

## Testing Strategy

### Unit Tests (Existing)

The project already has unit tests for:
- AuthClient signup/login API calls (src/test/typescript/api/authClient.test.ts)
- Validation logic for email/password (src/test/typescript/utils/validation.test.ts)

These continue to pass and test the JPA layer indirectly (via AuthService).

### Integration Tests (New — Phase 3)

Integration tests validate:
- **Schema creation**: Hibernate DDL creates tables without errors
- **CRUD operations**: User, Favorite, UserAllergen can be created, read, updated, deleted
- **Relationships**: User.favorites and User.allergens are populated correctly
- **Constraints**: Unique constraints (email, user+recipe, user+allergen) are enforced
- **Cascade behavior**: Deleting a user deletes its favorites and allergens

All integration tests run against testcontainers PostgreSQL (isolated, reproducible, no external dependencies).

### Manual Testing (Phase 4)

Manual testing validates:
- **End-to-end flow**: Sign up → log in → add favorite → verify in database
- **Health checks**: `/actuator/health` shows database status correctly
- **Error handling**: Database errors return 503, include correlation ID in logs
- **Production deployment**: App connects to Cloud SQL, persists data, survives restarts

---

## Performance Considerations

**Schema creation time**: On first startup with `ddl-auto=create-drop`, Hibernate may take 1-2 seconds to create tables. This is acceptable for dev; in prod with `ddl-auto=validate`, startup is sub-second (just validation).

**Query performance**: No performance bottlenecks expected for MVP scale:
- User lookup by email: Single B-tree index, <1ms
- Favorites per user: Foreign key join, <10ms even with 1000s of favorites
- Allergens per user: Same, <10ms

If S-03 or S-04 shows slow queries later, add indexes or caching. For now, the RDBMS defaults are sufficient.

**Connection pooling**: HikariCP (default in Spring Boot) is configured with 10 default connections, sufficient for MVP. Monitor if concurrent users exceed 50; then increase pool size.

---

## Migration Notes

**No data to migrate**: This is the first version; there is no existing production data to preserve. If a future version needs to migrate (e.g., add a new column), Flyway migrations can be added then.

**Schema validation in production**: Using `ddl-auto=validate` in prod ensures the schema is exactly as expected. If a developer deploys code with a new `@Column` without updating the database schema first, the app will refuse to start (fail-fast). This is intentional.

**Rollback strategy**: If a deploy is bad, roll back the Docker image to the previous version. The database schema is unchanged, so no data loss. Flyway migrations (if added later) would need explicit rollback scripts, but for MVP, this is not needed.

---

## References

- **Related research**: None (no prior research doc for this change)
- **Similar implementation**: S-02 user authentication uses the same UserRepository and JWT configuration
- **Framework docs**: [Spring Data JPA docs](https://spring.io/projects/spring-data-jpa), [Testcontainers docs](https://www.testcontainers.org/)
- **Cloud SQL docs**: [Google Cloud SQL for PostgreSQL](https://cloud.google.com/sql/docs/postgres)

---

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Configuration & Startup Validation

#### Automated

- [x] 1.1 Type check and lint pass — d9ccacf
- [x] 1.2 Application starts with dev profile (H2 database) — d9ccacf
- [x] 1.3 Application-dev.properties is readable and separate from base — d9ccacf
- [x] 1.4 Application-prod.properties is unchanged — d9ccacf
- [x] 1.5 Startup validation prevents missing credentials — d9ccacf

#### Manual

- [ ] 1.6 App starts locally with H2, /health returns UP
- [ ] 1.7 Verify logs show correct active profile

### Phase 2: Health Checks & Error Handling

#### Automated

- [x] 2.1 Type check and lint pass — 5c2dc49
- [x] 2.2 Health endpoint returns database status (UP/DOWN) — 5c2dc49
- [x] 2.3 Exception handler returns 503 for database errors — 5c2dc49
- [x] 2.4 Correlation ID filter injects UUID into requests — 5c2dc49
- [x] 2.5 Logging includes correlation ID in all logs — 5c2dc49

#### Manual

- [ ] 2.6 Check logs: correlation ID appears in each request's logs
- [ ] 2.7 Simulate database down, confirm health endpoint returns DOWN
- [ ] 2.8 Verify logs don't expose passwords/tokens

### Phase 3: Integration Testing

#### Automated

- [x] 3.1 Testcontainers dependencies added to pom.xml — 3b5cbb8
- [x] 3.2 Application-test.properties is readable — 3b5cbb8
- [x] 3.3 Integration tests compile without errors — 3b5cbb8
- [x] 3.4 All repository integration tests pass (schema creation, CRUD, constraints) — 3b5cbb8
- [x] 3.5 Integration tests run against PostgreSQL testcontainer — 3b5cbb8

#### Manual

- [ ] 3.6 Run `mvn verify`, all integration tests pass locally
- [ ] 3.7 Inspect testcontainers PostgreSQL during test run

### Phase 4: Documentation & Validation

#### Automated

- [x] 4.1 DEPLOYMENT.md is complete and readable
- [x] 4.2 Setup script exists and is executable
- [x] 4.3 VALIDATION.md checklist is complete

#### Manual

- [x] 4.4 Full signup → add favorite → query database flow works end-to-end
- [x] 4.5 Health endpoint shows database is connected
- [x] 4.6 Error handling: database down → 503 response
- [x] 4.7 Documentation is clear and actionable for ops
