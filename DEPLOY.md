# Deployment Guide: F-05 Cloud Run Setup

This guide explains how to deploy 10xRecipes to Google Cloud Run with CI/CD via GitHub Actions.

## Architecture Overview

```
GitHub Repository (main branch)
  ↓ (push)
GitHub Actions CI/CD Pipeline
  ↓ (build)
Build Docker image (backend JAR + frontend dist)
  ↓ (push)
Google Cloud Artifact Registry
  ↓ (deploy)
Google Cloud Run
  ↓ (serve)
Users at https://10x-recipes-api.run.app
```

**Key Components:**
- **Backend:** Spring Boot 3.3.0 (Java 21)
- **Frontend:** React + Vite (static files served by Spring Boot)
- **Container:** Docker multi-stage build (Alpine base)
- **Registry:** Google Cloud Artifact Registry
- **Compute:** Google Cloud Run (serverless)
- **Database:** Cloud SQL PostgreSQL
- **Secrets:** Google Secret Manager

---

## Prerequisites

### GCP Setup (One-time)

**If not already done, complete these steps once:**

1. **Create GCP Project** (skip if `tenx-recipes` already exists)
   ```bash
   gcloud projects create tenx-recipes
   gcloud config set project tenx-recipes
   ```

2. **Enable Required APIs**
   ```bash
   gcloud services enable \
     run.googleapis.com \
     artifactregistry.googleapis.com \
     cloudsql.googleapis.com \
     secretmanager.googleapis.com \
     iap.googleapis.com
   ```

3. **Create Artifact Registry Repository**
   ```bash
   gcloud artifacts repositories create 10x-recipes \
     --repository-format=docker \
     --location=us-central1 \
     --description="Docker images for 10xRecipes"
   ```

4. **Create Cloud SQL PostgreSQL Instance** (if not already done)
   ```bash
   gcloud sql instances create recipes-db \
     --database-version=POSTGRES_18 \
     --tier=db-custom-4-16384 \
     --region=us-central1 \
     --availability-type=ZONAL
   
   # Create database and user
   gcloud sql databases create recipes_db --instance=recipes-db
   gcloud sql users create recipes_user --instance=recipes-db
   ```

5. **Store Secrets in Secret Manager**
   ```bash
   # Database password (generate and store securely)
   echo -n "YOUR_DB_PASSWORD" | gcloud secrets create db-password --data-file=-
   
   # JWT secret (generate random key)
   openssl rand -hex 32 | gcloud secrets create jwt-secret --data-file=-
   ```

### GitHub Setup (One-time)

**Set up GitHub Actions authentication to GCP:**

**Option A: Workload Identity Federation (Recommended)**

1. Create a service account in GCP:
   ```bash
   gcloud iam service-accounts create github-actions \
     --display-name="GitHub Actions CI/CD"
   ```

2. Grant necessary permissions:
   ```bash
   gcloud projects add-iam-policy-binding tenx-recipes \
     --member=serviceAccount:github-actions@tenx-recipes.iam.gserviceaccount.com \
     --role=roles/run.admin
   
   gcloud projects add-iam-policy-binding tenx-recipes \
     --member=serviceAccount:github-actions@tenx-recipes.iam.gserviceaccount.com \
     --role=roles/artifactregistry.repositoryAdmin
   
   gcloud projects add-iam-policy-binding tenx-recipes \
     --member=serviceAccount:github-actions@tenx-recipes.iam.gserviceaccount.com \
     --role=roles/secretmanager.secretAccessor
   ```

3. Set up Workload Identity Federation (see [GCP guide](https://cloud.google.com/docs/authentication/workload-identity-federation/)):
   ```bash
   # Create identity pool
   gcloud iam workload-identity-pools create "github" \
     --project="tenx-recipes" \
     --location="global" \
     --display-name="GitHub Actions"
   
   # Create identity provider
   gcloud iam workload-identity-pools providers create-oidc "github-provider" \
     --project="tenx-recipes" \
     --location="global" \
     --workload-identity-pool="github" \
     --display-name="GitHub provider" \
     --attribute-mapping="google.subject=assertion.sub,assertion.aud=assertion.aud" \
     --issuer-uri="https://token.actions.githubusercontent.com"
   
   # Grant service account access
   gcloud iam service-accounts add-iam-policy-binding \
     github-actions@tenx-recipes.iam.gserviceaccount.com \
     --project="tenx-recipes" \
     --role="roles/iam.workloadIdentityUser" \
     --member="principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github/attribute.repository/AnnaMarczynska/10xrecipes"
   ```

4. Store in GitHub Secrets:
   - `WIF_PROVIDER`: Workload Identity Provider resource name
   - `WIF_SERVICE_ACCOUNT`: `github-actions@tenx-recipes.iam.gserviceaccount.com`

**Option B: Service Account Key (Simpler, less secure)**

If Workload Identity Federation is not available:

1. Create and download service account key:
   ```bash
   gcloud iam service-accounts keys create key.json \
     --iam-account=github-actions@tenx-recipes.iam.gserviceaccount.com
   ```

2. Store in GitHub Secrets as `GCP_SA_KEY` (base64 encoded)

3. Update workflow to use `service_account_key: ${{ secrets.GCP_SA_KEY }}`

---

## Deployment Process

### Local Testing (Before pushing)

1. **Build locally**
   ```bash
   docker build -t 10x-recipes:test .
   ```

2. **Run locally**
   ```bash
   docker run -p 8080:8080 \
     -e SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:5432/recipes_db" \
     -e SPRING_DATASOURCE_USERNAME="recipes_user" \
     -e SPRING_DATASOURCE_PASSWORD="your_password" \
     -e JWT_SECRET="your_jwt_secret" \
     10x-recipes:test
   ```

3. **Test endpoint**
   ```bash
   curl http://localhost:8080/actuator/health
   curl http://localhost:8080/api/recipes/search?ingredients=chicken&timeRange=30-60
   ```

### Automated Deployment (On push to main)

**Workflow Triggered:**

1. **Build Stage**
   - Checks out code
   - Sets up Google Cloud SDK
   - Builds Docker image (multi-stage: backend JAR + frontend dist)
   - Pushes image to Artifact Registry

2. **Deploy Stage** (only on main branch)
   - Sets up Cloud SDK
   - Deploys image to Cloud Run
   - Configures environment variables
   - Injects secrets from Secret Manager
   - Auto-scales: 0 (when idle) to 100 instances (under load)

3. **Smoke Test**
   - Waits for service to stabilize
   - Tests `/actuator/health` endpoint
   - Tests `/api/recipes/search` endpoint

**Check deployment status:**
```bash
# View logs
gcloud run services describe 10x-recipes-api --region us-central1

# Stream logs
gcloud run services logs read 10x-recipes-api --region us-central1 --limit 50

# Get service URL
gcloud run services describe 10x-recipes-api \
  --region us-central1 \
  --format='value(status.url)'
```

---

## Configuration

### Cloud Run Service Settings

**Memory & CPU:**
- Default: 512Mi memory, 1 CPU
- Adjustable in `.github/workflows/deploy.yml`
- For MVP: 512Mi is sufficient; increase if load testing shows need

**Auto-scaling:**
- Min instances: 0 (cold start, save cost)
- Max instances: 100 (handle spikes)
- Concurrency: 80 requests per instance (default)

**Timeout:**
- Request timeout: 300 seconds
- Increase if long-running endpoints needed

### Environment Variables

**Set in `.github/workflows/deploy.yml`:**
- `SPRING_DATASOURCE_URL` — PostgreSQL connection string
- `SPRING_DATASOURCE_USERNAME` — DB user
- `SPRING_JPA_PROPERTIES_HIBERNATE_DIALECT` — PostgreSQL dialect
- `SPRING_PROFILES_ACTIVE` — Set to `cloud` for production config

**Secrets (from Secret Manager):**
- `SPRING_DATASOURCE_PASSWORD` — DB password
- `JWT_SECRET` — JWT signing key

---

## Rollback

**If deployment has an issue:**

1. **Identify previous good image**
   ```bash
   gcloud run services describe 10x-recipes-api --region us-central1
   # Check the "Running revisions" section
   ```

2. **Rollback to previous version**
   ```bash
   gcloud run deploy 10x-recipes-api \
     --image us-central1-docker.pkg.dev/tenx-recipes/10x-recipes:PREVIOUS_SHA \
     --region us-central1
   ```

3. **Verify rollback**
   ```bash
   curl https://10x-recipes-api-run.app/actuator/health
   ```

---

## Monitoring & Observability

### Cloud Run Logs

```bash
# View latest logs
gcloud run services logs read 10x-recipes-api --region us-central1 --limit 100

# Filter by severity
gcloud run services logs read 10x-recipes-api \
  --region us-central1 \
  --limit 50 \
  --filter 'severity >= ERROR'

# Stream logs live
gcloud run services logs read 10x-recipes-api \
  --region us-central1 \
  --follow
```

### Metrics

Available in Cloud Console:
- Request count & latency
- Error rate
- Instance count (auto-scaling behavior)
- Cost tracking

### Health Checks

- **Liveness:** `/actuator/health/liveness`
- **Readiness:** `/actuator/health/readiness`
- **Full status:** `/actuator/health`

---

## Cost Management

**Free Tier (included):**
- 2 million requests/month
- 360,000 GB-seconds/month compute

**Usage estimation for MVP:**
- 100 active users
- 10 searches/user/day
- 1,000 requests/day = 30,000 requests/month (within free tier)
- Monthly cost: **$0** (MVP scale stays within free tier)

**Cost optimization:**
- Min instances: 0 (Cloud Run scales to zero when idle)
- Set appropriate max instances (100 is reasonable)
- Monitor CPU/memory usage; adjust if overprovisioned
- Consider committed use discounts if traffic grows

---

## Troubleshooting

### Cold Starts

**Problem:** First request is slow (1-5 seconds)  
**Cause:** Cloud Run scaled to zero; container warming up  
**Solution:** Normal for serverless. Not an issue for MVP scale.

### Authentication Failures

**Problem:** GitHub Actions can't authenticate to GCP  
**Cause:** WIF provider or service account misconfigured  
**Solution:**
```bash
# Test authentication
gcloud auth application-default print-access-token

# Re-check WIF setup
gcloud iam workload-identity-pools list --location=global
```

### Database Connection Errors

**Problem:** "Cannot connect to database"  
**Cause:** Cloud SQL connection string or networking issue  
**Solution:**
```bash
# Check Cloud SQL is running
gcloud sql instances describe recipes-db

# Test connection from Cloud Run
gcloud run deploy test-connection \
  --image gcr.io/cloud-builders/docker \
  --region us-central1 \
  --set-env-vars POSTGRES_HOST=... # IP from Cloud SQL
```

### Out of Memory

**Problem:** Spring Boot crashes with OOM  
**Cause:** Memory allocation too low or memory leak  
**Solution:**
```bash
# Increase memory allocation
gcloud run deploy 10x-recipes-api \
  --memory 1Gi \
  --region us-central1

# Check memory usage in logs
```

---

## Next Steps

1. **Complete GCP Setup** — Run prerequisites above
2. **Add GitHub Secrets** — WIF_PROVIDER, WIF_SERVICE_ACCOUNT (or GCP_SA_KEY)
3. **Push to main** — GitHub Actions runs automatically
4. **Monitor logs** — `gcloud run services logs read 10x-recipes-api`
5. **Test endpoints** — Use provided curl commands
6. **Set up custom domain** (optional) — Map DNS to Cloud Run service

---

## References

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Docker Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [Spring Boot Containerization](https://spring.io/guides/topicals/spring-boot-docker)
- [GitHub Actions & GCP](https://github.com/google-github-actions)
- [Workload Identity Federation](https://cloud.google.com/docs/authentication/workload-identity-federation)
