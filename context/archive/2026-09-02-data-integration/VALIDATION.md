# F-04 Validation Checklist

Manual validation steps to confirm end-to-end data persistence after deployment.

## Pre-Deployment

- [ ] App builds without errors: `mvn clean package`
- [ ] All tests pass: `mvn test`
- [ ] Integration tests pass: `mvn verify`
- [ ] Docker image builds: `docker build -t 10x-recipes:latest .`

## Post-Deployment Validation

### 1. Health Endpoint

**Action**: Check database connectivity status

```bash
curl https://<app-url>/api/actuator/health
```

**Expected Response**:
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

- [ ] Health endpoint returns 200
- [ ] "database" status is UP

### 2. User Signup → Database Persistence

**Action**: Create a new user account

1. Open app at `https://<app-url>`
2. Go to Signup
3. Enter test email: `test-<timestamp>@example.com` (e.g., `test-1725365400@example.com`)
4. Enter password: `SecurePass123`
5. Click "Sign Up"
6. Verify success message appears

**Database Check**: Query the users table in Cloud SQL

```sql
gcloud sql connect recipes-db --user=db-user

SELECT id, email, created_at FROM users 
WHERE email = 'test-<timestamp>@example.com';
```

- [ ] User account created in database
- [ ] Email matches what was entered
- [ ] created_at timestamp is recent

### 3. Login and Token Persistence

**Action**: Log in with the test account

1. Open app
2. Go to Login
3. Enter test email and password from Step 2
4. Click "Log In"
5. Verify success message appears

**Expected Behavior**:
- [ ] Login succeeds (success message visible)
- [ ] JWT token generated
- [ ] User email displayed on home page
- [ ] Logout button visible

### 4. Add Favorite → Database Persistence

**Action**: Save a recipe to favorites while logged in

1. Logged in from Step 3
2. Search for a recipe (e.g., "chicken")
3. Find a recipe and add to favorites
4. Verify confirmation message

**Database Check**: Query favorites table

```sql
SELECT u.id, u.email, f.recipe_id, f.recipe_name, f.added_at 
FROM users u 
JOIN favorites f ON u.id = f.user_id 
WHERE u.email = 'test-<timestamp>@example.com';
```

- [ ] Favorite record created in database
- [ ] recipe_id matches what was saved
- [ ] added_at timestamp is recent
- [ ] User relationship is correct

### 5. Logout and Access Denial

**Action**: Verify protected routes after logout

1. Click "Logout"
2. Attempt to navigate to protected route (`/favorites`)
3. Should be redirected to login

**Database Check**: Verify token was cleared

```bash
# Check browser DevTools > Application > Local Storage
# Should NOT have auth_token
```

- [ ] Logged out successfully
- [ ] Redirected to login
- [ ] Cannot access protected routes
- [ ] auth_token cleared from localStorage

### 6. Error Handling

**Action**: Verify error handling when database is unavailable (optional)

1. Stop Cloud SQL instance (or disconnect network)
2. Attempt any operation that requires database access
3. App should return 503 Service Unavailable

- [ ] Error response includes helpful message
- [ ] HTTP status is 503
- [ ] Correlation ID is present in response header

## Correlation ID Tracing (Optional)

**Action**: Verify correlation IDs are working for debugging

1. Make a request with a custom correlation ID:
   ```bash
   curl -H "X-Correlation-ID: test-12345" https://<app-url>/api/actuator/health
   ```

2. Check response header:
   ```bash
   X-Correlation-ID: test-12345
   ```

3. Check app logs for the same ID in entries from that request

- [ ] Response includes X-Correlation-ID header
- [ ] Header value matches request or is UUID if not provided
- [ ] Logs include correlation ID in entries

## Sign-Off

- [ ] All health checks pass
- [ ] User signup persists to database
- [ ] Login generates token
- [ ] Favorites persist to database
- [ ] Logout clears session
- [ ] Protected routes work correctly
- [ ] Error handling returns proper status codes

**Validation Date**: ________
**Validator**: ________
**Notes**: ________________________________________________________________________

---

## Rollback Plan

If validation fails:
1. Verify error messages in Cloud Run logs: `gcloud run logs read 10x-recipes`
2. Check database connectivity: `gcloud sql connect recipes-db --user=db-user`
3. Rollback to previous image version if critical issue found
4. Re-test after fix

See DEPLOYMENT.md for troubleshooting steps.
