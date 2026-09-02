# Testing Against Cloud SQL Locally

For developers who want to test the production database locally using Cloud SQL Proxy.

## Setup

### 1. Install Cloud SQL Proxy

**macOS**:
```bash
curl https://dl.google.com/cloudsql/cloud_sql_proxy.mac.386 -o cloud_sql_proxy
chmod +x cloud_sql_proxy
```

**Linux**:
```bash
curl https://dl.google.com/cloudsql/cloud_sql_proxy.linux.386 -o cloud_sql_proxy
chmod +x cloud_sql_proxy
```

**Windows**: Download from [Google Cloud docs](https://cloud.google.com/sql/docs/postgres/cloud-sql-proxy)

### 2. Authenticate with GCP

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### 3. Start Cloud SQL Proxy

```bash
./cloud_sql_proxy -instances=PROJECT_ID:us-central1:recipes-db=tcp:5432
```

You should see:
```
Listening on 127.0.0.1:5432.
```

**Keep this terminal open** — the proxy must stay running while you test.

## Running the App Against Cloud SQL

In a new terminal:

```bash
# Set environment variables
export SPRING_PROFILES_ACTIVE=prod
export DATABASE_URL=jdbc:postgresql://localhost:5432/recipes
export DATABASE_USER=db-user
export DATABASE_PASSWORD=<your-db-password>
export JWT_SECRET=test-secret-key-change-in-production
export CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Start the app
mvn spring-boot:run
```

The app should connect to Cloud SQL and start normally. You'll see in logs:
```
DatabaseConfigValidator: Production configuration validated successfully
```

## Testing the Connection

### Health Check

```bash
curl http://localhost:9090/api/actuator/health
```

Should return:
```json
{
  "status": "UP",
  "components": {
    "db": {
      "status": "UP",
      "details": {
        "database": "Connected to database"
      }
    }
  }
}
```

### Sign Up Test

1. Open http://localhost:5173/signup
2. Create a test account
3. Verify success message
4. Query the database:

```bash
gcloud sql connect recipes-db --user=db-user

SELECT email FROM users ORDER BY created_at DESC LIMIT 1;
```

Should see your test email.

## Troubleshooting

### Connection Refused

**Problem**: `Connection refused` or `timeout`

**Fix**:
1. Make sure Cloud SQL Proxy is running in another terminal
2. Check Cloud SQL instance is running: `gcloud sql instances describe recipes-db`
3. Verify proxy output shows `Listening on 127.0.0.1:5432`

### Authentication Failed

**Problem**: `FATAL: password authentication failed`

**Fix**:
1. Verify DATABASE_USER and DATABASE_PASSWORD are correct
2. Reset the password in Cloud SQL:
   ```bash
   gcloud sql users set-password db-user --instance=recipes-db --password=new-password
   ```
3. Update environment variables and restart the app

### App Won't Start (STARTUP FAILURE)

**Problem**: `STARTUP FAILURE: DATABASE_URL environment variable not set`

**Fix**:
1. Verify all required env vars are set:
   ```bash
   env | grep DATABASE
   env | grep JWT_SECRET
   ```
2. Make sure `SPRING_PROFILES_ACTIVE=prod` is set
3. Restart the app with env vars

## Cleanup

When done testing:

1. Stop Cloud SQL Proxy (Ctrl+C in the proxy terminal)
2. Close the app (Ctrl+C in the app terminal)
3. Optional: revert to H2 for local development
   ```bash
   # Use default dev profile (no SPRING_PROFILES_ACTIVE needed)
   mvn spring-boot:run
   ```

## Notes

- Cloud SQL Proxy handles encryption and authentication to Cloud SQL
- Data you create locally persists in the actual Cloud SQL database
- Use different test emails to avoid unique constraint violations
- The 127.0.0.1:5432 connection is secure because it's tunneled through the proxy
