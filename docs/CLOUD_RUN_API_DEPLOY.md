# Cloud Run API — Deployment & GitHub Actions

## Overview

The `api/` package is a Node.js Express server deployed to Google Cloud Run. It handles backend endpoints for taxes, moratoriums, active states, and surplus lines license lookups. It was previously a standalone repo and is now a pnpm workspace package.

The Docker build context is the **monorepo root**, not `api/` — this is required because `api/` depends on `common/` (a workspace sibling), and Docker needs both packages in context.

---

## Prerequisites

### GCP Setup

Before the workflow can deploy, you need:

1. **A Cloud Run service** created in the target project (or let the first deploy create it):

   ```bash
   gcloud config set project idemand-submissions-dev
   gcloud run deploy idemand-submissions-api \
     --region us-central1 \
     --platform managed
   ```

2. **A GCP service account** with the following roles:
   - `roles/run.admin`
   - `roles/storage.admin` (for Cloud Build artifact storage)
   - `roles/iam.serviceAccountUser`
   - `roles/artifactregistry.writer` (if using Artifact Registry instead of GCR)

3. **The service account key** stored as a GitHub Actions secret. The existing workflows already use `GCP_SA_KEY_DEV` — use the same one.

### GitHub Secrets & Variables Required

These are already used by the existing Firebase deploy workflows. Confirm they are set:

| Name                      | Type     | Description                          |
| ------------------------- | -------- | ------------------------------------ |
| `GCP_SA_KEY_DEV`          | Secret   | JSON key for the GCP service account |
| `FIREBASE_PROJECT_ID_DEV` | Variable | e.g. `idemand-submissions-dev`       |

---

## Dockerfile Notes

The `api/Dockerfile` is already written for monorepo builds. Key points:

- **Build context must be the repo root**, not `api/`. The Dockerfile uses `COPY common/ ./common/` and `COPY api/ ./api/`, so Docker needs both directories.
- It builds `common` first (`pnpm --filter @idemand/common build`), then `api`.
- The production stage strips devDependencies and copies only compiled `dist/` output.
- The `CMD` runs `node dist/index.js` from within `/app/api`.

If you need to test the Docker build locally:

```bash
# Run from the repo root — not from api/
docker build -f api/Dockerfile -t idemand-submissions-api .
```

---

## GitHub Actions Workflow

Create `.github/workflows/deploy-api.yml`:

```yaml
name: Deploy Cloud Run API

on:
  push:
    branches:
      - main
    paths:
      - 'api/**'
      - 'common/**'
      - 'api/Dockerfile'
      - '.github/workflows/deploy-api.yml'
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repo
        uses: actions/checkout@v4

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY_DEV }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Configure Docker for GCR
        run: gcloud auth configure-docker

      - name: Build and push Docker image
        run: |
          IMAGE="gcr.io/${{ vars.FIREBASE_PROJECT_ID_DEV }}/idemand-submissions-api:${{ github.sha }}"
          # Build from repo root so common/ is in Docker context
          docker build -f api/Dockerfile -t "$IMAGE" .
          docker push "$IMAGE"

      - name: Deploy to Cloud Run
        run: |
          IMAGE="gcr.io/${{ vars.FIREBASE_PROJECT_ID_DEV }}/idemand-submissions-api:${{ github.sha }}"
          gcloud run deploy idemand-submissions-api \
            --image "$IMAGE" \
            --region us-central1 \
            --platform managed \
            --project ${{ vars.FIREBASE_PROJECT_ID_DEV }} \
            --set-env-vars "GCLOUD_PROJECT=${{ vars.FIREBASE_PROJECT_ID_DEV }},GOOGLE_CLOUD_PROJECT=${{ vars.FIREBASE_PROJECT_ID_DEV }}"
```

### Triggering on `common/` changes

The workflow triggers on changes to `common/**` because `api/` compiles `common` at build time inside Docker. If the `common` types change, the API image needs to be rebuilt even if no `api/` files changed.

---

## Environment Variables at Runtime

The API reads environment variables at startup. Cloud Run injects them via `--set-env-vars` or `--env-vars-file`.

For the dev service, the relevant variables are already documented in `api/env-dev.yaml`:

```yaml
PROJECT_ID_NUMBER: '704781428847'
GCLOUD_PROJECT: 'idemand-submissions-dev'
GOOGLE_CLOUD_PROJECT: 'idemand-submissions-dev'
PROJECT_ID: 'idemand-submissions-dev'
```

Secrets (Swiss Re credentials, Stripe keys, etc.) should be stored in **GCP Secret Manager** and accessed at runtime using the `@google-cloud/secret-manager` client already present in `api/src/config/secretManager.ts`. Do not pass secrets as plain env vars in the deploy command.

To add Secret Manager secrets to a Cloud Run service:

```bash
gcloud run services update idemand-submissions-api \
  --region us-central1 \
  --update-secrets=STRIPE_SECRET_KEY=stripe-secret-key:latest
```

---

## Local Development

The API previously relied on running `gcloud` or Docker directly. Now that it's a workspace package:

```bash
# From repo root
pnpm install

# Build common first (api depends on it)
pnpm --filter @idemand/common build

# Start the API with hot reload (uses tsx watch)
pnpm --filter api dev
```

The `dev` script in `api/package.json` uses `env-cmd` to load `.env.local` and the `common,emulators,dev` env config from `.env-cmdrc`.

---

## Deployment to Production

For production, create a separate workflow or add a job that targets the prod project. The key differences from dev:

- Use a `GCP_SA_KEY_PROD` secret
- Pass `idemand-submissions` as the project ID
- The `SWISS_RE_AUTH_SCOPE` and `SWISS_RE_SUBSCRIPTION_KEY` differ for prod (see `api/.env-cmdrc`)

The existing `deploy:api:prod` npm script in the root `package.json` shows the manual equivalent:

```bash
gcloud config set project idemand-submissions && \
gcloud run deploy idemand-submissions-api --source .
```

`--source .` triggers Cloud Build server-side. The GitHub Actions approach using `docker build` + `docker push` + `gcloud run deploy --image` is preferred for CI because it gives you a reproducible image tagged to a git SHA.

---

## Firebase Hosting Rewrite

The Cloud Run service is connected to Firebase Hosting via the rewrite in `firebase.json`:

```json
{
  "source": "/api{,/**}",
  "run": {
    "serviceId": "idemand-submissions-api",
    "region": "us-central1"
  }
}
```

This means the client calls `/api/state-tax` etc., and Firebase Hosting proxies those requests to the Cloud Run service. No CORS configuration change is needed in the client — the rewrite handles it transparently.
