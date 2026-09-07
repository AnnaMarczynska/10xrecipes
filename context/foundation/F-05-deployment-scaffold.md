# F-05: Deployment Scaffold — Cloud Run + GitHub Actions CI/CD

**Status:** ✅ Complete & Ready for Setup  
**Deadline:** 2026-09-14  
**Prerequisites:** F-01 (API scaffold), F-02 (Frontend scaffold)

---

## Overview

F-05 creates a production-ready deployment pipeline from code push to live Cloud Run service. Every merge to `main` automatically builds a Docker image, pushes it to Google Cloud Artifact Registry, and deploys it to Cloud Run with secrets from Google Secret Manager.

**Result:** Zero-downtime deployments, automatic rollback capability, and a monitoring/observability foundation.

---

## Architecture

```
Developer pushes to main
  ↓
GitHub Actions triggered (.github/workflows/deploy.yml)
  ↓
Build Stage:
  1. Clone repo
  2. Build backend JAR (mvn clean package)
  3. Build frontend dist (npm run build)
  4. Build Docker image (multi-stage: backend + frontend)
  5. Push to Artifact Registry
  ↓
Deploy Stage (main branch only):
  1. Deploy image to Cloud Run
  2. Inject env vars (SPRING_DATASOURCE_URL, etc.)
  3. Pull secrets from Secret Manager (DB password, JWT key)
  4. Auto-scale: 0 (idle) → 100 (peak)
  ↓
Smoke Test Stage:
  1. Wait 10s for service to stabilize
  2. Test /actuator/health endpoint
  3. Test /api/recipes/search endpoint
  ↓
Deployed at: https://10x-recipes-api.run.app
```

---

## Files Created

### 1. Dockerfile (Multi-stage Build)
**Path:** `/Dockerfile`

**What it does:**
- **Stage 1 (backend-builder):** Builds Spring Boot JAR with Maven
- **Stage 2 (frontend-builder):** Builds React/Vite frontend
- **Stage 3 (runtime):** Alpine-based Java image with both JAR and frontend static files

**Key features:**
- Multi-stage to keep final image small (~300MB)
- Alpine base for minimal attack surface
- Non-root user (`appuser`) for security
- Health check via Spring Boot actuator
- JVM tuning for containers (`-XX:+UseContainerSupport`, RAM percentage limits)

### 2. .dockerignore
**Path:** `/.dockerignore`

Excludes unnecessary files from Docker build context:
- Git, IDE, environment files
- Node modules, Maven cache
- CI/CD configs, documentation

**Result:** Faster builds (~2-3 min), smaller context size

### 3. GitHub Actions CI/CD Workflow
**Path:** `/.github/workflows/deploy.yml`

**Triggers:**
- On push to `main` (automatic deploy)
- On pull request to `main` (build only, no deploy)

**Jobs:**
1. **build** — Build Docker image & push to Artifact Registry
2. **deploy** — Deploy to Cloud Run (only on main)
3. **smoke-test** — Verify deployment succeeded

**Secrets used:**
- `WIF_PROVIDER` — Workload Identity Federation provider (recommended)
- `WIF_SERVICE_ACCOUNT` — Service account email
- OR `GCP_SA_KEY` — Service account key JSON (fallback)

### 4. Spring Boot Cloud Profile
**Path:** `/src/main/resources/application-cloud.yml`

**Configuration for Cloud Run:**
- PostgreSQL connection pooling (5 max connections, tuned for serverless)
- Structured logging for Cloud Logging
- Actuator endpoints (health, metrics, info)
- CORS settings for frontend domain
- JPA validation mode (`ddl-auto: validate`, no schema changes at runtime)

**Activated by:** `SPRING_PROFILES_ACTIVE=cloud` (set in workflow)

### 5. Deployment Guide
**Path:** `/DEPLOY.md`

Comprehensive guide covering:
- Architecture overview
- GCP prerequisites (one-time setup)
- GitHub Actions secrets setup
- Local testing before deploy
- Automated deployment workflow
- Rollback procedures
- Monitoring & logging
- Cost management
- Troubleshooting

---

## Setup Checklist

### Phase 1: GCP Infrastructure (One-time)

- [ ] Create GCP project `tenx-recipes` (or verify exists)
- [ ] Enable required APIs: Cloud Run, Artifact Registry, Cloud SQL, Secret Manager
- [ ] Create Artifact Registry repo `10x-recipes` in us-central1
- [ ] Create Cloud SQL PostgreSQL instance `recipes-db` (if not done in F-04)
- [ ] Create database `recipes_db` and user `recipes_user`
- [ ] Store secrets in Secret Manager:
  - [ ] `db-password` — Database user password
  - [ ] `jwt-secret` — Random JWT signing key (e.g., `openssl rand -hex 32`)

### Phase 2: GitHub Actions Authentication (One-time)

Choose **one** of:

**Recommended: Workload Identity Federation**
- [ ] Create service account `github-actions`
- [ ] Grant IAM roles (run.admin, artifactregistry.repositoryAdmin, secretmanager.secretAccessor)
- [ ] Set up Workload Identity Federation (see DEPLOY.md for detailed steps)
- [ ] Store GitHub Secrets:
  - [ ] `WIF_PROVIDER` — WIF provider resource name
  - [ ] `WIF_SERVICE_ACCOUNT` — `github-actions@tenx-recipes.iam.gserviceaccount.com`

**Fallback: Service Account Key**
- [ ] Create service account key
- [ ] Store as GitHub Secret: `GCP_SA_KEY` (base64 encoded)
- [ ] Update workflow: uncomment `service_account_key` line

### Phase 3: Verify Setup (Before pushing)

- [ ] Run `docker build -t 10x-recipes:test .` locally
- [ ] Verify build completes (~5 min, includes backend + frontend)
- [ ] Test locally: `docker run -p 8080:8080 10x-recipes:test`
- [ ] Verify `/actuator/health` returns 200 OK
- [ ] Verify `/api/recipes/search` endpoint works

### Phase 4: First Deployment

- [ ] Push to main branch
- [ ] Watch GitHub Actions tab for workflow execution
- [ ] Check build logs if any step fails
- [ ] Wait for smoke tests to pass
- [ ] Verify service at: `gcloud run services describe 10x-recipes-api --region us-central1`

---

## Key Features

### Continuous Deployment
- Every commit to main automatically deploys
- No manual `gcloud` commands needed
- GitHub Actions handles authentication via Workload Identity Federation

### Zero Downtime
- Cloud Run maintains old revision while deploying new one
- Traffic switches when new revision is ready
- Instant rollback possible if issues detected

### Cost Optimized
- Scales to zero when idle (no running instances, no charges)
- Pay-per-request model ($0.00003/request)
- Free tier: 2M requests/month + 360K GB-seconds/month
- MVP stays within free tier (< 30K requests/month expected)

### Secure
- Service account with minimal permissions (least privilege)
- Secrets stored in Google Secret Manager (not in code/env)
- Container runs as non-root user
- HTTPS enforced by Cloud Run
- Optional: Cloud Armor for DDoS protection

### Monitorable
- Structured logs in Cloud Logging
- Metrics: requests, latency, error rate, instances
- Health endpoints: `/actuator/health` (liveness), `/actuator/readiness`
- Automatic scaling based on traffic

---

## Production Readiness Checklist

Before shipping to users:

- [ ] GCP project and artifacts created
- [ ] GitHub Actions workflow tested with dummy push
- [ ] First deployment succeeded (check logs)
- [ ] Smoke tests passed (health check + API endpoint)
- [ ] Database connection works end-to-end
- [ ] Secrets properly stored (no hardcoded credentials)
- [ ] Logs visible in Cloud Logging (verify structured format)
- [ ] Auto-scaling limits set (100 max instances)
- [ ] Custom domain configured (if needed)
- [ ] Monitoring dashboards created (optional)
- [ ] Runbook documented (rollback procedures)

---

## Common Deployment Scenarios

### Normal Deployment (main branch push)

```
1. Developer commits and pushes to main
2. GitHub Actions automatically triggered
3. Backend built, frontend built, Docker image created
4. Image pushed to Artifact Registry
5. Cloud Run updated with new image
6. Smoke tests verify deployment
7. Service ready at https://10x-recipes-api.run.app
```

**Typical time:** 5-10 minutes (first build slower due to caching)

### Pull Request (preview, no deploy)

```
1. Developer opens PR to main
2. GitHub Actions builds Docker image
3. Build logs available in Actions tab
4. Image NOT pushed (no deploy)
5. Reviewers can see if build succeeds
```

**Typical time:** 3-5 minutes

### Rollback (if deployment has issues)

```
1. Identify previous working image hash
2. Run: gcloud run deploy 10x-recipes-api \
     --image us-central1-docker.pkg.dev/tenx-recipes/10x-recipes:PREVIOUS_SHA
3. Service immediately switches to old image
4. Smoke tests verify health
```

**Typical time:** 30 seconds

### Manual Deploy (if needed)

```
gcloud run deploy 10x-recipes-api \
  --image us-central1-docker.pkg.dev/tenx-recipes/10x-recipes:latest \
  --region us-central1 \
  --allow-unauthenticated
```

---

## Monitoring & Observability

### View Logs
```bash
gcloud run services logs read 10x-recipes-api --region us-central1 --limit 50
```

### Check Service Status
```bash
gcloud run services describe 10x-recipes-api --region us-central1
```

### View Metrics
- Cloud Console → Cloud Run → Select service → Metrics tab
- Shows: requests/sec, latency p50/p95/p99, error rate, instance count

### Health Endpoints
- `/actuator/health` — Overall service health
- `/actuator/health/liveness` — Is service alive? (restart if fail)
- `/actuator/health/readiness` — Ready to receive traffic? (start routing if success)

---

## Cost Projection

**MVP Scale (100 active users, 10 searches/user/day):**
- ~1,000 requests/day = 30,000 requests/month
- **Free tier:** 2M requests/month included
- **Monthly cost:** $0 (well within free tier)

**Growth Scenario (10K users, 20 searches/day):**
- ~200K requests/day = 6M requests/month
- **Free tier:** 2M included
- **Overage:** 4M requests × $0.00003 = $120/month
- **Monthly cost:** ~$120

**Cost mitigation:**
- Monitor traffic trends
- Set auto-scaling max limits
- Consider committed use discounts if stable high traffic
- Evaluate alternative platforms if costs exceed budget

---

## Rollout Plan

**Week 1 (Sep 7-11):**
- [ ] Complete GCP infrastructure setup
- [ ] Configure GitHub Actions secrets
- [ ] Local Docker build & test
- [ ] First push to main

**Week 2 (Sep 12-14):**
- [ ] Monitor logs & metrics
- [ ] Test rollback procedure
- [ ] Verify smoke tests reliably pass
- [ ] Document any issues found
- [ ] **Ship MVP**

---

## References

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Dockerfile Best Practices](https://docs.docker.com/develop/dev-best-practices/dockerfile_best-practices/)
- [Spring Boot Containerization Guide](https://spring.io/guides/topicals/spring-boot-docker/)
- [GitHub Actions & GCP](https://github.com/google-github-actions)
- [Google Secret Manager](https://cloud.google.com/secret-manager/docs)
- [Cloud SQL Connection from Cloud Run](https://cloud.google.com/sql/docs/postgres/connect-run)

---

## Next Steps

1. **Read DEPLOY.md** — Detailed setup guide
2. **Complete GCP prerequisites** — Follow checklist above
3. **Test locally** — `docker build` and `docker run`
4. **Push to main** — Trigger first automated deployment
5. **Verify logs** — Check Cloud Logging for successful deployment
6. **Document runbook** — Capture team's deployment procedures

**F-05 status: ✅ Ready for GCP setup and first deployment**
