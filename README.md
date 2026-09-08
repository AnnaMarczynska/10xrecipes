# 10xRecipes API

A Spring Boot REST API that helps users find recipes based on available ingredients and cooking time, with automatic allergen filtering for safety.

## Overview

**Problem:** Manual recipe searching based on changing criteria (ingredients, time) is frustrating and can lead to unhealthy food choices or allergic reactions.

**Solution:** 10xRecipes provides intelligent recipe discovery with:
- Search by available ingredients + cooking time
- Automatic allergen filtering for safety
- Save favorite recipes with personal notes
- User authentication with JWT tokens

## Features (MVP)

### Core Features
- 🔍 **Recipe Search** — Find recipes by ingredients & cooking time (with 50% ingredient match threshold)
- ⏱️ **Time Filtering** — Search by time ranges: <15min, 15-30min, 30-60min, 60+min
- ❌ **Allergen Safety** — Recipes containing user allergens are automatically excluded
- ⭐ **Favorites** — Save recipes with personal notes (up to 500 characters)
- 👤 **User Auth** — JWT-based authentication with per-user resource isolation
- 🍽️ **Recipe Details** — View full recipe with ingredients, instructions, cook time

### Out of Scope (Future)
- Meal planning (full day/week)
- Shopping list generation
- Calorie calculations
- Recipe sharing

## Tech Stack

- **Backend:** Spring Boot 3.3.0, Java 21
- **Database:** PostgreSQL (Cloud SQL on GCP)
- **Authentication:** JWT (io.jsonwebtoken)
- **API Documentation:** Swagger/OpenAPI
- **Testing:** JUnit 5, Mockito (45+ unit tests)
- **External:** TheMealDB API for recipe data

## Quick Start

### Prerequisites
- Java 21+
- Maven (or use bundled `./mvnw`)
- PostgreSQL 16+ (local) or Docker

### Local Development

**Option 1: With Docker Compose**
```bash
docker-compose up
# App runs on http://localhost:9090/api
# Database on localhost:5432
```

**Option 2: With H2 In-Memory Database**
```bash
./mvnw spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=dev"
# App runs on http://localhost:9090/api
# No database setup needed
```

### API Endpoints

#### Authentication
```bash
POST /auth/register          # Register new user
POST /auth/login             # Login, returns JWT token
```

#### Recipe Search
```bash
POST /recipes/search         # Search recipes
# Body: {
#   "ingredients": ["chicken", "pasta"],
#   "timeRange": "30-60"
# }

GET /recipes/{id}/details    # Get recipe details
```

#### Favorites
```bash
POST /favorites                     # Add favorite
GET /favorites                      # Get user's favorites
PUT /favorites/{id}/notes           # Update notes
DELETE /favorites/{id}              # Remove favorite
```

#### Allergens
```bash
POST /allergens                     # Add user allergen
GET /allergens                      # Get user's allergens
DELETE /allergens/{id}              # Remove allergen
```

### Environment Variables

**Development:**
- `SPRING_DATASOURCE_URL` — PostgreSQL connection (default: localhost:5432)
- `SPRING_DATASOURCE_USERNAME` — DB user (default: recipes_user)
- `SPRING_DATASOURCE_PASSWORD` — DB password (default: changeme)
- `JWT_SECRET` — JWT signing key (default: dev-secret-key-change-in-production)

**Production:**
- Set `SPRING_PROFILES_ACTIVE=cloud` for Cloud Run deployment
- Use Google Secret Manager for `JWT_SECRET` and `SPRING_DATASOURCE_PASSWORD`

## Testing

### Run Tests
```bash
./mvnw test

# Coverage report
./mvnw jacoco:report
# View at: target/site/jacoco/index.html
```

### Test Coverage
- **45 unit tests** covering critical paths
- Allergen filtering safety (12 tests) — CRITICAL
- Favorite CRUD & data isolation (15 tests)
- Recipe search accuracy & ranking (18 tests)

See [context/foundation/test-plan.md](context/foundation/test-plan.md) for detailed test risk mapping.

## API Documentation

- **Swagger UI:** http://localhost:9090/api/swagger-ui.html
- **OpenAPI Spec:** http://localhost:9090/api/v3/api-docs

## Architecture

### Key Components

**Services:**
- `RecipeSearchService` — Ranks recipes by ingredient match % and cook time
- `AllergenFilterService` — Filters unsafe recipes (safety-critical)
- `FavoriteService` — CRUD for user favorites with authorization
- `AuthService` — User authentication and token management

**Security:**
- `JwtTokenProvider` — Creates/validates JWT tokens
- `JwtAuthenticationFilter` — Intercepts requests, validates tokens
- Per-user resource scoping — Users can only access their own data

**Integration:**
- `TheMealDBClient` — Fetches recipes from external TheMealDB API
- 1-hour recipe cache to reduce API calls

## Key Decisions

1. **Substring matching for allergens** — "peanut" matches "peanuts" for safety
2. **50% ingredient threshold** — Balances result quality vs. quantity
3. **Cook time estimation** — Extracted from instructions when not provided
4. **JWT over OAuth** — Simpler for MVP, can upgrade later
5. **Per-user isolation** — Users cannot access/modify others' data

## Success Criteria (MVP)

✅ User can find recipes matching ingredients, prep time, and allergens  
✅ Recipes with user allergens are excluded or clearly marked  
✅ User can add/remove/edit favorite recipes  
✅ Favorites persist after logout/login  
✅ Users can create account, login, logout  
✅ User data is protected (cross-user isolation)  

## Known Limitations

- Single-user interface (no sharing yet)
- TheMealDB API rate limits apply
- Recipe data limited to TheMealDB catalog
- No mobile app (web only)
- No calorie/nutritional data

## Deployment

Deployed to **Google Cloud Run** with:
- CI/CD via GitHub Actions
- Cloud SQL PostgreSQL backend
- Secrets via Google Secret Manager
- Auto-scaling 0-100 instances
- Cold start ~1-5s (serverless)

See [DEPLOY.md](DEPLOY.md) for setup instructions.

## Contributing

1. Follow existing code style (no `@Autowired` fields, constructor injection)
2. Add unit tests for new features (target >70% coverage)
3. Update API docs in Swagger annotations
4. Reference test plan in [context/foundation/test-plan.md](context/foundation/test-plan.md)

## License

MIT

## Support

- **Issues:** Check [GitHub issues](https://github.com/AnnaMarczynska/10xrecipes/issues)
- **Swagger UI:** http://localhost:9090/api/swagger-ui.html
- **Health Check:** http://localhost:9090/api/actuator/health
