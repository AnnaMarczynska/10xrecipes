---
project: 10xRecipes
researched_at: 2026-08-23
recommended_platform: Google Cloud Run
runner_up: Fly.io
context_type: mvp
tech_stack:
  language: Java
  framework: Spring Boot 4.1.1
  runtime: Java 21
deployment_interview:
  persistent_connections: "no"
  cost_priority: "minimize"
  team_familiarity: "none"
  geographic_reach: "single-region"
  managed_services: "undecided"
---

## Recommendation

**Deploy on Google Cloud Run.**

Cloud Run is the ideal first choice for this Spring Boot API because it's purpose-built for stateless containerized Java applications. The free tier covers small traffic (2 million requests/month), removing cost risk during MVP. The developer experience is smooth: push a Docker image, and Cloud Run auto-scales. Most importantly, Spring Boot with Dockerfile is fully native to Cloud Run — no framework contortions, no hidden incompatibilities. The hard deadline (2026-09-14) demands speed, and Cloud Run's simplicity lets you ship without ops overhead.

## Platform Comparison

| Platform | CLI-first | Serverless | Agent docs | Stable API | MCP/Integration | Cost (MVP) |
|---|---|---|---|---|---|---|
| **Google Cloud Run** | ✓ Pass | ✓ Pass | ✓ Pass | ✓ Pass | Partial (gcloud) | $0–20/mo |
| **Fly.io** | ✓ Pass | ✓ Pass | ✓ Pass | ✓ Pass | ✓ Pass | $5–30/mo |
| **Railway** | ✓ Pass | ✓ Pass | ✓ Pass | ✓ Pass | Partial | $5–50/mo |

### Scoring Notes

**Google Cloud Run (Recommended)**
- **Strengths**: Purpose-built for containerized Java. Free tier is genuinely free for small projects. Integrates natively with Docker and GitHub Actions. Auto-scales from zero to thousands. Pay-per-request model means you only pay for what you use.
- **Trade-offs**: GCP-specific mental model; no built-in managed database (external Postgres fine). Slightly steeper UI learning curve than Railway, but gcloud CLI is powerful.
- **Why it won**: Cost minimization is your constraint. Cloud Run's free tier + pay-per-request model means you ship with zero monthly overhead at MVP scale.

### Shortlisted Platforms

#### 1. Google Cloud Run (Recommended)
Google's serverless container platform. Purpose-built for stateless workloads. Excellent for Spring Boot: Docker image → Cloud Run handles the rest. Free tier: 2M requests/month + 360K GB-seconds/month compute. After free tier: ~$0.00003 per request + compute. Hard to beat on price.

#### 2. Fly.io (Runner-up)
Container PaaS with strong developer experience. Ships your Docker image to their edge network. Free tier is more limited (3 shared-cpu-1x VMs, 160GB bandwidth), but very affordable pricing after. Better for teams comfortable with containerized deployments wanting a bit more control and closer support.

#### 3. Railway (Third choice)
Full-stack PaaS designed for fast iteration. Excellent DX — preview deploys, environment variables, rollback in clicks. No free tier (pay-as-you-go, ~$5 minimum). Best for teams valuing smooth developer experience over absolute cost minimization.

## Anti-Bias Cross-Check: Google Cloud Run

### Devil's Advocate — Weaknesses

1. **Cold starts**: Serverless can have 1–5s cold-start latency when scaling from zero. For a recipe search API, this is acceptable; for real-time messaging, it would be wrong.
2. **GCP lock-in**: Migrating away later requires re-platforming. Mitigated by Cloud Run being standards-based (Docker containers); much easier to migrate than proprietary platforms.
3. **Regional availability**: Cloud Run is available in many regions but not everywhere. If you later need to serve a country with no local region, migration friction increases.
4. **Complexity for complex workloads**: If you later add background jobs, cron tasks, or persistent caches, Cloud Run's serverless model shows its edges. You'd layer Cloud Tasks + Firestore or Pub/Sub, adding operational complexity.
5. **Managed database separation**: No integrated SQL database (unlike Railway, which bundles Postgres). You'll use Cloud SQL or an external provider, adding networking and auth plumbing.

### Pre-Mortem — How This Could Fail

*The team deploys the recipe API to Cloud Run and ships. Three months in, traffic is seasonal — quiet in summer, high in autumn. Cold starts during the autumn surge frustrate users. The team decides to keep an idle instance warm (paying ~$10/month), defeating the cost advantage. Meanwhile, they need to add weekly recipe updates, requiring a background cron job. They bolt Cloud Tasks onto the deployment, increasing architectural complexity. Finally, the bundled free tier is exhausted, and monthly Cloud Run costs climb to $50/month as traffic grows. The team regrets not choosing Railway's bundled UX and switches platforms mid-lifecycle.*

**Root causes in this failure**: Underestimating cold-start impact, not budgeting for warm instances, and not anticipating async-job needs early.

### Unknown Unknowns

1. **Cloud Run's resource constraints for Java**: Spring Boot with DevTools and default logging can be memory-hungry. Cloud Run's minimum is 256MB (free tier limit); Spring Boot easily fits, but if you add an ORM layer, cache, or logging library, memory creep is easy. Plan for 512MB minimum to be safe.
2. **Google Cloud SDK tooling overhead**: The gcloud CLI is powerful but has a learning curve. You'll need gcloud set-up, authentication, and image registry (Artifact Registry) wired up before the first deploy. This is one-time friction, but it matters during a 6-week sprint.
3. **Region-specific services**: Cloud Run is available worldwide, but database offerings (Cloud SQL, Firestore) vary by region. Committing to a region now locks your data geography later.

## Operational Story

How Cloud Run actually operates day-to-day for this project.

- **Preview deploys**: Build Docker image on feature branch, push to Artifact Registry, deploy to Cloud Run with a unique URL (`<hash>-...cloudrun.app`). GitHub Actions can automate this. Preview is live immediately; no warm-up required. Publicly accessible unless you add Cloud Armor / IAM guards.
- **Secrets**: Store database connection strings, API keys, and auth tokens in Cloud Run environment variables or Secret Manager. GitHub Actions passes secrets from Actions Secrets → Cloud Run during deploy. Rotation requires re-deploying the service (no hot-swap).
- **Rollback**: `gcloud run deploy --image <prior-image-hash>` redeploys a previous image in seconds. Zero data loss (database is separate). Typical rollback time: 10-30 seconds.
- **Approval**: Production deployments via GitHub Actions require a branch protection rule + manual approval in Actions tab. Secrets are read-only; no agent can rotate them unattended. Non-production (staging) can auto-deploy on merge.
- **Logs**: `gcloud run logs read <service-name>` streams stdout/stderr. Cloud Logging UI shows traces, latency, errors. No log storage cost (first 50GB/month free). Export to BigQuery for long-term analysis later.

## Risk Register

| Risk | Source | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| Cold starts cause latency spikes | Devil's advocate | Medium | Low | Monitor p95 latency in Cloud Logging; if >2s at 10% cold-start rate, implement Cloud Run minimum instances (warm-up cost: ~$10/mo). |
| Memory pressure with ORM later | Unknown unknowns | Medium | Medium | Test with 256MB heap; if failed, allocate 512MB from day one. Document heap limits in AGENTS.md. |
| GCP lock-in limits future pivots | Devil's advocate | Low | Medium | Keep application code database-agnostic (ORM: Spring Data JPA). Migrate data, not code, if switching platforms. |
| Unexpected costs during seasonal traffic | Pre-mortem | Low | Medium | Set up billing alerts (>$50/month) in Google Cloud Console. Monitor sustained request rate; if > 500 req/s, revisit plan. |
| Async-job needs emerge | Pre-mortem | Medium | Medium | Plan to layer Cloud Tasks + Pub/Sub only after MVP ships and patterns are clear. Do not add now. |
| Database split from Cloud Run | Devil's advocate | Low | Low | Use Cloud SQL in the same region (pricing ~$7/mo for small instances). Cross-zone traffic is negligible for MVP scale. |

## Getting Started

1. **Install gcloud CLI**: `brew install google-cloud-sdk` (macOS) or [download](https://cloud.google.com/sdk/docs/install) for your OS.
2. **Create a GCP project**: `gcloud projects create 10x-recipes --name="10xRecipes"`. Set as active: `gcloud config set project 10x-recipes`.
3. **Enable Cloud Run API**: `gcloud services enable run.googleapis.com`.
4. **Build Docker image locally**: From the project root (where Dockerfile is generated by `/10x-bootstrapper`), run `gcloud builds submit --tag gcr.io/10x-recipes/api:latest`. This builds in the cloud and pushes to Artifact Registry.
5. **Deploy to Cloud Run**: `gcloud run deploy api --image gcr.io/10x-recipes/api:latest --region us-central1 --platform managed --allow-unauthenticated`. Replace `region` if you prefer a different one.
6. **Set GitHub Actions secret**: Add `GCP_PROJECT_ID` and `GCP_SERVICE_ACCOUNT_JSON` to your GitHub repo secrets. CI/CD can then auto-deploy on merge to main.

## Out of Scope

The following were not evaluated in this research:
- Docker image configuration (handled by `/10x-bootstrapper`)
- GitHub Actions CI/CD setup (future step)
- Production-scale architecture (multi-region, HA, DR)
- Database choice (Cloud SQL vs. external Postgres vs. Firestore) — that's a data-layer decision separate from platform choice
