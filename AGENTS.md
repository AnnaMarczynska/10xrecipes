# Repository Guidelines

10xRecipes is a recipe-discovery web application built with Spring Boot 4.1.1, Java 21, and Maven. Users search recipes by available ingredients and cooking time. The backend runs as a REST API; deployment targets Google Cloud Run via GitHub Actions.

## Hard Rules

**Do not commit to the `context/archive/` directory.** Archived changes are immutable. Open a new change via `/10x-new` instead.

**Cloud Run compatibility.** Ensure all `src/` changes remain stateless and containerizable. Check `application.properties` before adding filesystem-dependent logic.

## Project Structure & Dependencies

- `src/main/java/com/example/` — Spring Boot REST API source code
- `src/main/resources/` — Configuration files (check `application.properties` for environment priors)
- `src/test/java/` — JUnit tests
- `pom.xml` — Maven build configuration; declares Spring Boot 4.1.1, Web MVC, DevTools, and Spring Test
- `context/foundation/prd.md` — Product requirements (read before architectural decisions)
- `context/foundation/tech-stack.md` — Tech stack hand-off from `/10x-tech-stack-selector`

## Build, Test, and Development

- `./mvnw clean install` — Full build and install to local Maven cache
- `./mvnw test` — Run all unit tests in `src/test/`
- `./mvnw spring-boot:run` — Start the dev server locally (port 8080 by default)
- `./mvnw clean package` — Build production JAR for containerization

## Coding Style & Naming Conventions

- **Language version:** Java 21 (see `pom.xml:30`)
- **Package naming:** `com.example.<feature>` (e.g. `com.example.recipe`, `com.example.auth`)
- **Class naming:** PascalCase; REST controllers end with `Controller` (e.g. `RecipeController`)
- **Method naming:** camelCase; REST endpoints follow `@GetMapping`, `@PostMapping` annotations
- **Indentation:** 4 spaces (Maven default)

Spring Boot DevTools is enabled for hot reload in development. Check @pom.xml for current dependencies; do not add dependencies manually — declare them in the manifest.

## Testing Guidelines

- **Framework:** Spring Boot Test + JUnit 5
- **Location:** `src/test/java/` mirrors `src/main/java/` structure
- **Naming pattern:** `<ComponentName>Test.java` (e.g. `RecipeServiceTest.java`)
- **Run single test:** `./mvnw test -Dtest=RecipeServiceTest`
- **Coverage:** No enforced threshold yet; add via Maven Surefire if needed

## Commit & Pull Request Guidelines

No prior commits exist yet. Use Conventional Commits prefixes when establishing the convention: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`. Start each commit with a present-tense action verb ("Add recipe search endpoint", not "Added").

## Deployment & Security

- **Containerization:** The Maven build (`./mvnw clean package`) produces a JAR ready for Docker. Dockerfile will be added by future CI/CD setup.
- **Configuration:** Use `application-<profile>.properties` for environment-specific settings (dev, staging, prod).
- **Secrets:** Do not hardcode credentials. Inject via environment variables or Spring Cloud Config in production.

Refer to @context/foundation/prd.md for feature scope and @context/foundation/tech-stack.md for deployment target details.
