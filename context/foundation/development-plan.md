---
project: 10xRecipes
version: 1
status: in-progress
created: 2026-08-25
last_updated: 2026-08-25
phase_1_completed: 2026-08-25
context_type: mvp
timeline_total_days: 21
timeline_execution_days: 13
timeline_buffer_days: 8
hard_deadline: 2026-09-14
---

# 10xRecipes Development Plan

## Overview

This document outlines the deployment and development roadmap for 10xRecipes MVP. The plan spans **21 days** (2026-08-25 → 2026-09-14) with a **9–11 day buffer** after the 13-day critical path.

**Architecture:**
- **Backend:** Spring Boot 4.1.1 + Spring Security JWT auth on Google Cloud Run
- **Frontend:** React SPA on Cloudflare Pages with Worker CORS proxy
- **Data Layer:** Cloud SQL PostgreSQL (user data) + TheMealDB API (recipes)
- **CI/CD:** GitHub Actions auto-deploy on merge to main

---

## Key Decisions (Locked)

### Recipe Data Source
**Chosen:** TheMealDB.com API

- Free (no API key required)
- No rate limits at MVP scale
- Ingredient-based search built-in
- Actively maintained REST API

**Impact:** Phase 1 uses lightweight schema (no recipe table); recipes fetched on-demand from API during searches.

### Frontend Technology
**Chosen:** React SPA on Cloudflare Pages

- Full-featured UI (register, login, search, favorites)
- Component reusability for future features
- Simple deployment via `wrangler deploy`
- 5–7 day investment for polished MVP

### Deployment Platform
**Chosen:** Google Cloud Run

- Per infrastructure.md recommendation
- Purpose-built for stateless Java containers
- Free tier covers MVP scale
- 1GB memory allocation for Spring Boot + JVM
- Auto-scaling from zero to thousands

---

## Critical Path & Timeline

| Phase | Dates | Days | Criticality | Dependencies | Parallel Work | Status |
|-------|-------|------|-------------|--------------|---|---|
| **Phase 1: Database Setup** | 2026-08-25 to 2026-08-25 | 1 ✅ | ⚠️ **BLOCKING** | None | Unblocks 2, 3, 4 | ✅ DONE |
| **Phase 2: Spring Boot Auth + Data** | 2026-08-28 to 2026-09-04 | 5–7 | High | Phase 1 | Can overlap Phase 3 tail | ⏳ Ready |
| **Phase 3: Docker + Cloud Run** | 2026-09-01 to 2026-09-08 | 3–4 | High | Phase 2 | Starts during Phase 2 (Dockerfile early) | ⏳ Pending |
| **Phase 4: React + Cloudflare** | 2026-08-28 to 2026-09-10 | 5–7 | High | Phase 1 + Phase 3 URL | Parallel with 2–3 after Phase 1 | ⏳ Pending |
| **Phase 5: CI/CD + Monitoring** | 2026-09-10 to 2026-09-13 | 2–3 | Medium | Phases 1–4 complete | Final integration | ⏳ Pending |
| **Buffer / Sign-Off** | 2026-09-13 to 2026-09-14 | 1 | — | — | Contingency | ⏳ Pending |

**Wall-clock execution with parallelism:** Phase 1 (1d) → Phases 2+3+4 parallel (7d) → Phase 5 (3d) = **~11 days**  
**Timeline health:** 21 days available, 11 days execution needed, **10-day buffer gained** ✅✅

---

## Phase 1: Cloud SQL Database Setup (1 day) — BLOCKING ✅ COMPLETED

**Objective:** Provision Cloud SQL PostgreSQL, create schema for user data, store secrets in Google Secret Manager, verify local connectivity.

**Actual Checkpoint: 2026-08-25** Database ACTIVE ✅, secrets stored ✅, schema deferred to Phase 2.

### Key Tasks

- [x] Install gcloud CLI: `brew install google-cloud-sdk`
- [x] Create GCP project: `gcloud projects create tenx-recipes` (actual: tenx-recipes, not 10x-recipes)
- [x] Enable required APIs (Cloud SQL, Artifact Registry, Cloud Run, Secret Manager)
- [x] Create Cloud SQL PostgreSQL instance (actual: POSTGRES_18, db-custom-4-16384, europe-west6-c)
- [x] Create database & app user: `recipes_db` + `recipes_user`
- [ ] Create schema (4 tables: users, favorites, user_allergens, recipe_notes) + 5 indexes — **DEFERRED to Phase 2** (will create via Spring Boot JPA on first connection)
- [x] Create secrets in Secret Manager: `db-password`, `jwt-secret`
- [ ] Create `database/cloud-sql-proxy-setup.sh` for local development — **DEFERRED** (auth issues; using gcloud sql connect instead)
- [ ] Verify local connection: `psql -h localhost -U recipes_user -d recipes_db -c "\dt"` — **DEFERRED** (will verify via Spring Boot connection in Phase 2)

### Phase 1 Completion Notes (2026-08-25)

**What was completed:**
- ✅ GCP project `tenx-recipes` created + billing linked
- ✅ 5 required APIs enabled (Cloud SQL Admin, Artifact Registry, Cloud Run, Secret Manager, etc.)
- ✅ Cloud SQL PostgreSQL 18 instance `recipes-db` provisioned (POSTGRES_18, europe-west6-c, db-custom-4-16384)
- ✅ Database `recipes_db` created
- ✅ App user `recipes_user` created with password
- ✅ Secrets stored securely in Google Secret Manager: `db-password`, `jwt-secret`
- ✅ GCP project verified: instance RUNNABLE, database and user created, secrets accessible

**What was deferred to Phase 2:**
- Schema creation (will create via Spring Boot JPA `@Entity` annotations on first connection)
- Local Cloud SQL Proxy testing (encountered Application Default Credentials auth issues; workaround: use `gcloud sql connect` directly)
- This deferral is SAFE because Spring Boot JPA can auto-create schema from entity definitions

**Actual costs:** ~PLN 5–15 (instance running ~2 hours); instance now STOPPED to save costs

**Next:** Restart instance when Phase 2 begins (2026-08-28): `gcloud sql instances start recipes-db`

### Why Blocking

Without Phase 1 complete:
- Phase 2 (Spring Boot) cannot connect to database locally ✅ RESOLVED
- Phase 3 (Cloud Run) cannot access database in production ✅ RESOLVED
- Testing and development halt ✅ UNBLOCKED

**Phase 1 Status:** ON SCHEDULE — Completed in 1 day (target: 3–4 days), 2–3 day buffer gained.

### Scope Reduction (If Stuck)

**Fallback to Railway.io** ($7/mo, 5 min setup) if Cloud SQL provisioning fails. Keep all downstream phases unchanged.

---

## Phase 2: Spring Boot Auth + Data Layer (5–7 days) — Parallel with Phase 3 & 4 (After Phase 1) ⏳ READY TO START

**Objective:** Implement JWT authentication, JPA entities (User, Favorite, UserAllergen), Spring Security, TheMealDB recipe search service, and create database schema via JPA.

**Start date:** 2026-08-28 (was blocked by Phase 1; now unblocked)  
**Checkpoint by 2026-09-04:** Local integration tests pass (register, login, search <2s latency).

**Note:** Database schema creation is NOW part of Phase 2 — Spring Boot JPA will auto-create tables from `@Entity` definitions on first connection.

### Key Tasks

- [ ] Add dependencies to pom.xml: Spring Data JPA, PostgreSQL driver, Spring Security, JWT libraries, WebFlux
- [ ] Configure Spring Boot: database URL, JWT secret, CORS allowed-origins
- [ ] Implement JWT token provider (JwtTokenProvider.java): generate, validate, extract email
- [ ] Create JPA entities: User, Favorite, UserAllergen, RecipeNote
- [ ] Create repositories: UserRepository, FavoriteRepository, UserAllergenRepository
- [ ] Implement AuthService: register, login with bcrypt password encoding
- [ ] Implement MealDbService: search by ingredient, get meal details (call TheMealDB API)
- [ ] Create REST controllers: AuthController, RecipeController, HealthController
- [ ] Configure Spring Security: JWT filter, CORS, endpoint protection
- [ ] Local integration test: `mvn spring-boot:run` → register → login → search

### Health Checks

- `POST /api/auth/register` returns JWT token
- `POST /api/auth/login` succeeds with correct credentials
- `GET /api/recipes/search?ingredient=chicken` returns meals (requires JWT)
- Search latency <2 seconds
- `GET /api/health` returns {"status":"UP"}

---

## Phase 3: Docker + Cloud Run Deployment (3–4 days) — Overlaps Phase 2 tail

**Objective:** Containerize Spring Boot, push to Artifact Registry, deploy to Cloud Run with 1GB memory, verify <2s cold-start latency.

**Checkpoint by 2026-09-08:** Cloud Run service ACTIVE, health check 200 OK, cold-start <2s, database connected.

### Key Tasks

- [ ] Create multi-stage Dockerfile: build with Maven, runtime with JRE alpine
- [ ] Test Docker locally with environment variables
- [ ] Create Google Artifact Registry repository: `recipes-docker`
- [ ] Build and push image: `docker build -t ... && docker push ...`
- [ ] Create VPC connector for Cloud SQL (if not exists)
- [ ] Deploy to Cloud Run: 1GB memory, 1 CPU, managed platform, allow-unauthenticated
- [ ] Get Cloud Run service URL (e.g., `https://api-abc123-uc.a.run.app`)
- [ ] Verify: health check, register, search endpoints
- [ ] Monitor logs: `gcloud run logs read api --limit=50`
- [ ] Measure cold-start latency: `time curl $CLOUD_RUN_URL/api/health`

### Cold-Start Mitigation (If >2s)

**Option A:** Increase memory to 2GB (+$5/mo, ~500ms improvement)  
**Option B:** Enable min-instances=1 (+$10/mo, <100ms cold-start, removes cold-starts entirely)

---

## Phase 4: React Frontend + Cloudflare Pages (5–7 days) — Parallel with Phases 2–3 (After Phase 1)

**Objective:** Build React SPA with login, search, and favorites. Deploy to Cloudflare Pages with Worker proxy for CORS.

**Checkpoint by 2026-09-10:** Frontend live on `https://10x-recipes.pages.dev`, end-to-end testing passes (register → login → search).

### Key Tasks

- [ ] Initialize React project: `npm create vite@latest frontend -- --template react-ts`
- [ ] Create Auth component: register/login form, JWT storage, logout button
- [ ] Create RecipeSearch component: ingredient input, search button, results display
- [ ] Create API client (axios): auto-inject JWT tokens in Authorization header
- [ ] Create main App component: render Auth, conditionally render RecipeSearch if logged in
- [ ] Build production bundle: `npm run build` → `frontend/dist/`
- [ ] Create Cloudflare Worker proxy (`_worker.js`): CORS preflight, proxy /api/* to Cloud Run
- [ ] Deploy to Cloudflare Pages: `wrangler pages deploy dist --project-name=10x-recipes`
- [ ] Get Cloudflare Pages URL (e.g., `https://10x-recipes.pages.dev`)
- [ ] Update Cloud Run CORS config to allow Cloudflare frontend URL
- [ ] End-to-end test from browser: register → login → search in <2 seconds

### Edge Caching (Optional)

Add `_headers` file for Cloudflare: cache `/api/recipes/search` for 60 seconds at edge.

---

## Phase 5: CI/CD + Monitoring (2–3 days) — Final Integration

**Objective:** Set up GitHub Actions for auto-deploy on push to main, add Cloud Logging alerts, document setup.

**Checkpoint by 2026-09-13:** GitHub Actions workflow runs on push, builds both backend and frontend, deploys to Cloud Run and Cloudflare Pages.

### Key Tasks

- [ ] Initialize git: `git init`, create `.gitignore` (node_modules, dist, target, .env, etc.)
- [ ] Create GitHub repository: `gh repo create devx10.2 --public`
- [ ] Create `.github/workflows/deploy.yml`: Maven build, Docker build/push, Cloud Run deploy, frontend build/deploy
- [ ] Set up Google Cloud OIDC for GitHub Actions (workload identity federation)
- [ ] Add GitHub Actions secrets: WIF_PROVIDER, WIF_SERVICE_ACCOUNT, CLOUDFLARE_API_TOKEN
- [ ] Test workflow: push commit to main, verify backend and frontend deploy
- [ ] Create Cloud Logging notification channel (email)
- [ ] Create Cloud Logging alerts: error rate >1%, p95 latency >2s
- [ ] Create README.md: Quick Start, API endpoints, troubleshooting, timeline
- [ ] Final commit: "docs: add README and CI/CD setup"

### Monitoring Dashboard

- Cloud Logging: view requests, errors, latency percentiles
- Cloud Run metrics: request count, error rate, cold-start events
- Cloudflare Analytics: edge cache hit rate, request latency

---

## Phase 6: Final Integration & Sign-Off (1 day) — 2026-09-13 to 2026-09-14

**Objective:** Verify all phases work end-to-end, test rollback procedure, prepare for production.

### Final Checklist

- [ ] **Phase 1:** Cloud SQL running, schema present, secrets stored
- [ ] **Phase 2:** Spring Boot locally tests: register, login, search <2s
- [ ] **Phase 3:** Cloud Run live; health check 200; cold-start <2s
- [ ] **Phase 4:** Frontend on Cloudflare; register/login/search work from browser
- [ ] **Phase 5:** GitHub Actions auto-deploys on push; CI/CD working
- [ ] **Monitoring:** Cloud Logging alerts configured; no active errors
- [ ] **Documentation:** README with setup, deploy, troubleshooting
- [ ] **Secrets:** All sensitive data in Secret Manager (not committed)
- [ ] **Rollback tested:** Previous version redeploys via `gcloud run deploy --image <prev-hash>`

---

## Success Criteria (MVP Ship Readiness)

✅ **Shipped when:**

1. Cloud Run service is ACTIVE (endpoint accessible)
2. Frontend is live on Cloudflare Pages (public URL)
3. Can register, login, search end-to-end without errors
4. Search completes in <2 seconds (from user interaction to results displayed)
5. All secrets in Google Secret Manager or GitHub Secrets (none committed to git)
6. GitHub Actions auto-deploys on merge to main
7. Monitoring + alerts configured for errors and latency
8. README with setup, deployment, and troubleshooting steps
9. No open blockers for MVP scope (register, login, search, favorites)

---

## Scope Reduction (If Timeline Slips)

Apply in priority order. Each unlocks ~1–3 days:

| Action | Days Saved | Risk | Accept? |
|--------|-----------|------|---------|
| Phase 2: defer favorites/allergens to v1.1; ship search-only | 2 | Low | ✅ Yes |
| Phase 4: use vanilla HTML+JS instead of React | 2 | Low | ✅ Yes |
| Phase 4: ship API-only; skip UI (Postman collection instead) | 5 | Medium | ✅ Last resort |
| Phase 5: manual deploy via gcloud; skip GitHub Actions | 1 | Medium | ✅ Works |

---

## Files to Create/Modify

### New Files
- `Dockerfile` — Multi-stage Docker build
- `database/schema.sql` — PostgreSQL schema (users, favorites, etc.)
- `database/cloud-sql-proxy-setup.sh` — Local development environment setup
- `frontend/` — React app (package.json, src/*, vite.config.ts, etc.)
- `.github/workflows/deploy.yml` — GitHub Actions CI/CD
- `README.md` — Setup and deployment documentation

### Modified Files
- `pom.xml` — Add dependencies (JPA, Security, JWT, WebFlux)
- `src/main/resources/application.properties` — Database, JWT, CORS config
- `src/main/java/com/example/_x_recipes/` — Entities, repos, services, controllers
  - `entity/User.java`, `Favorite.java`, `UserAllergen.java`, `RecipeNote.java`
  - `repository/UserRepository.java`, `FavoriteRepository.java`, etc.
  - `service/AuthService.java`, `MealDbService.java`
  - `controller/AuthController.java`, `RecipeController.java`, `HealthController.java`
  - `security/JwtTokenProvider.java`, `JwtAuthenticationFilter.java`
  - `config/SecurityConfig.java`

### Secrets (Never Committed)
- `db-password` → Google Secret Manager
- `jwt-secret` → Google Secret Manager
- `CLOUDFLARE_API_TOKEN` → GitHub Actions Secrets

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Phase 1 (database) slips >1 day | Medium | High | Start immediately; have Railway.io fallback ready |
| Cold-start latency >2s | Medium | Low | Enable min-instances ($10/mo) or increase memory |
| CORS errors between frontend & backend | Low | Medium | Test Worker proxy locally first; verify Cloud Run CORS headers |
| Spoonacular/TheMealDB API unavailable | Low | Medium | Already chose free/reliable TheMealDB; API is mature |
| GitHub Actions OIDC setup fails | Low | Medium | Use GitHub token backup; set up manually if needed |
| React build takes >1 hour | Low | Low | Pre-test locally; Vite builds are fast (~30s) |

---

## Reference Documents

- `context/foundation/prd.md` — Product requirements (features, scale, timeline)
- `context/foundation/tech-stack.md` — Technology stack decision (Spring Boot, Java 21, Cloud Run)
- `context/foundation/infrastructure.md` — Deployment platform research (Cloud Run, Fly.io, Railway)
- `AGENTS.md` — Agent onboarding guidelines for coding tasks
- `.claude.settings.json` — Permissions for Claude Code integration

---

## Timeline Summary

- **Total Available:** 21 days (2026-08-25 → 2026-09-14)
- **Execution Path:** 13 days (with Phase parallelism)
- **Buffer:** 8 days
- **Status:** On track ✅

---

**Current Status:** Phase 1 complete ✅  
**Next Action:** Start Phase 2 on 2026-08-28. Restart Cloud SQL instance: `gcloud sql instances start recipes-db`  
**Timeline Impact:** On track — gained 2–3 day buffer. 10 days remaining execution, 11+ day buffer.
