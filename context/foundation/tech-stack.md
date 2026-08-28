---
starter_id: spring
package_manager: maven
project_name: 10x-recipes
hints:
  language_family: java
  team_size: solo
  deployment_target: google-cloud-run
  ci_provider: github-actions
  ci_default_flow: auto-deploy-on-merge
  bootstrapper_confidence: verified
  path_taken: standard
  quality_override: false
  self_check_answers: null
  has_auth: true
  has_payments: false
  has_realtime: false
  has_ai: false
  has_background_jobs: false
---

## Why this stack

**Spring Boot** is the mainstream Java web framework. It ships with Spring Security (auth), Spring Data JPA (database/ORM), and REST endpoint scaffolding — exactly what 10xRecipes needs. Your 6-week timeline is tight, but Spring Boot's convention-over-configuration and strong IDE support (IntelliJ, VS Code) minimize friction. Deployment to Google Cloud Run via GitHub Actions is straightforward: push to main, GitHub Actions builds a Docker image, Cloud Run deploys it. The free tier covers small traffic; scale later if needed.

**Frontend:** Spring Boot runs the REST API backend. For the UI, you'll pair it with a frontend (React, Vue, or simple Thymeleaf templates). `/10x-bootstrapper` will scaffold the backend; frontend is a separate choice after this step.

**Next step:** Run `/10x-bootstrapper` to scaffold the Spring Boot project skeleton, .gitignore, Dockerfile, GitHub Actions workflow, and Cloud Run deployment config.
