# F-04 Deployment Guide: Data Layer Integration

This guide covers deploying the data layer integration (PostgreSQL + JPA) to Cloud Run with Cloud SQL.

## Prerequisites

Before deploying, ensure:
- ✅ Cloud SQL PostgreSQL instance provisioned (recipes-db)
- ✅ Cloud Run service created and connected to Cloud SQL
- ✅ Docker image built and pushed to Artifact Registry
- ✅ IAM permissions: Cloud Run service account has Cloud SQL Client role

## Environment Variables (Cloud Run)

Set these environment variables in your Cloud Run service configuration:

### Required for Production

```
SPRING_PROFILES_ACTIVE=prod
DATABASE_URL=jdbc:postgresql://<CLOUD_SQL_IP>:5432/recipes
DATABASE_USER=<db-username>
DATABASE_PASSWORD=<db-password>
JWT_SECRET=<random-32-byte-secret>
CORS_ALLOWED_ORIGINS=https://<frontend-domain>
```

### Optional

```
SERVER_PORT=8080
logging.level.root=INFO
```

## Deployment Steps

### 1. Provision Cloud SQL Database and User

```bash
# Create the recipes database
gcloud sql databases create recipes \
  --instance=recipes-db \
  --charset=UTF8

# Create a database user (if not already created)
gcloud sql users create db-user \
  --instance=recipes-db \
  --password=<secure-password>
```

### 2. Deploy to Cloud Run

```bash
# Build and push Docker image
gcloud builds submit --tag gcr.io/PROJECT_ID/10x-recipes

# Deploy to Cloud Run
gcloud run deploy 10x-recipes \
  --image gcr.io/PROJECT_ID/10x-recipes \
  --platform managed \
  --region us-central1 \
  --add-cloudsql-instances PROJECT_ID:us-central1:recipes-db \
  --set-env-vars SPRING_PROFILES_ACTIVE=prod,DATABASE_URL=jdbc:postgresql://127.0.0.1:5432/recipes,DATABASE_USER=db-user,DATABASE_PASSWORD=<password>,JWT_SECRET=<secret>,CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

### 3. Verify Deployment

Check that the service is running:

```bash
# Get the service URL
gcloud run services describe 10x-recipes --region us-central1

# Test health endpoint
curl https://<SERVICE_URL>/api/actuator/health
```

Response should include:
```json
{
  "status": "UP",
  "database": "Connected to database"
}
```

## Troubleshooting

### Database Connection Timeout

**Symptom**: App logs show `Connection refused` or `timeout`

**Fix**:
1. Verify Cloud SQL instance is running: `gcloud sql instances describe recipes-db`
2. Check IAM: Cloud Run service account must have `cloudsql.client` role
3. Verify DATABASE_URL format: `jdbc:postgresql://127.0.0.1:5432/recipes` (use 127.0.0.1 with Cloud SQL proxy)

### Missing Credentials

**Symptom**: App crashes on startup with `STARTUP FAILURE: DATABASE_URL environment variable not set`

**Fix**:
1. Re-check environment variables are set in Cloud Run console
2. Restart the Cloud Run service to pick up new env vars
3. Check logs: `gcloud run logs read 10x-recipes --region us-central1`

### Health Endpoint Returns DOWN

**Symptom**: `/actuator/health` shows `"database": "DOWN"`

**Fix**:
1. Verify Cloud SQL instance is running and accepting connections
2. Check database credentials (DATABASE_USER, DATABASE_PASSWORD)
3. Verify network connectivity: Cloud Run → Cloud SQL via Cloud SQL proxy

## Rollback

If deployment fails:

```bash
# Rollback to previous revision
gcloud run deploy 10x-recipes \
  --image gcr.io/PROJECT_ID/10x-recipes:previous-tag \
  --region us-central1
```

Database schema is unchanged, so no data loss on rollback.

## Notes

- Startup validation ensures all credentials are set before the app starts accepting requests
- Schema validation in production (`ddl-auto=validate`) prevents accidental schema modifications
- Health checks are available at `/actuator/health` for readiness probes
- Logs include correlation IDs for tracing requests end-to-end
