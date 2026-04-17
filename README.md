# submissions

### Detailed documentation

- [ARCHITECTURE.md](docs/ARCHITECTURE.md)

- [QUOTES_AND_POLICIES.md](docs/QUOTES_AND_POLICIES.md)

- [STRIPE.md](docs/STRIPE.md)

- [TRANSACTIONS.md](docs/TRANSACTIONS.md)

- [BULK_IMPORTS.md](docs/BULK_IMPORTS.md)

- [CLOUD_RUN_API_DEPLOY.md](docs/CLOUD_RUN_API_DEPLOY.md)

- [COMMON_PACKAGE.md](docs/COMMON_PACKAGE.md)

- [DATA_PIPELINE.md](docs/DATA_PIPELINE.md)

## Development

```bash
git clone git@github.com:scarlson1/submissions.git
cd submissions

pnpm install
```

This repo uses pnpm workspaces plus TurboRepo. Install dependencies once at the repo root.

TODO: env files, service account permissions, etc.

Add the following secrets in GCP secret manager (or functions/.secret.local for local development).

```env
EMAIL_VERIFICATION_KEY=
RESEND_API_KEY=
RESEND_SECRET=
RENTCAST_KEY=
MAPBOX_PUBLIC_TOKEN=
TYPESENSE_ADMIN_KEY=
TYPESENSE_IDEMAND_ADMIN_SEARCH_KEY=
TYPESENSE_USER_SEARCH_KEY=
```

Update Values in `.env.dev` and `.env.prod`.

Sign into the Firebase and gcloud CLIs, and download the required service account credentials referenced by local scripts.

### Run services locally

```bash
# Start all workspace dev processes managed by TurboRepo.
# This runs the package-level dev scripts for client, api, functions, and common.
pnpm dev

# When working against the Firebase emulators, run them in a separate terminal:
pnpm emulators:dev

# to start individually in separate terminal tabs:
pnpm dev:client
pnpm dev:functions
pnpm dev:api

# start local typesense instance in docker
pnpm typesense:dev

# start ngrok or tailscale to accept webhooks (must configure webhook urls in resend/stripe)
pnpm ngrok # need to update ngrok url in package.json
# or (tailscale funnel 5001)
pnpm tailscale
```

Test stripe webhook events locally using CLI:

```bash
stripe login

stripe listen --forward-to localhost:4242/webhook

stripe trigger payment_intent.succeeded
```

```bash
# forward existing webhook event subscriptions to local host
stripe listen --load-from-webhooks-api --forward-to localhost:5001/<PROJECT_ID>/us-central1/stripe/webhook
# cli will output signing secret --> update variable in functions/src/routes/stripe.ts
```

## Deployment

[firebase-tools-with-isolate](https://github.com/0x80/firebase-tools-with-isolate) is added as a dev dependency at the project root to support pnpm (firebase only supports pnpm for client/hosting).

### Github Actions

- [deploy-functions.yml](.github/workflows//deploy-functions.yml) - deploys function groups if there was a change to any `*.ts` file in their directory
- [deploy-hosting-dev.yml](.github/workflows//deploy-hosting-dev.yml) - deploys to firebase hosting when pull request is merged into `main`
- [deploy-hosting-preview.yml](.github/workflows//deploy-hosting-preview.yml) - deploys to firebase hosting preview for open pull requests to `main`

### Manual Deployment

### Functions deployment

```bash
npx firebase login

cd functions

# set target project in firebase cli
pnpm exec firebase use dev --non-interactive
# or:
pnpm exec firebase use prod --non-interactive

# build functions and any workspace dependencies
pnpm functions:build


# deploy a specific function group
pnpm exec firebase deploy --only functions:[FUNCTION_NAME]
```

### Hosting deployment (client)

```bash
# set target project in firebase cli
pnpm exec firebase use dev --non-interactive
# or:
pnpm exec firebase use prod --non-interactive

# build the client from the repo root
pnpm build:client:dev
# or:
pnpm build:client:prod
pnpm build:client:channel:dev # build  - vite "mode" flag determines env file to include

# deploy from client/
cd client
pnpm deploy:dev
# or:
pnpm deploy:prod
pnpm deploy:channel:dev
pnpm deploy:channel:prod
# if deploying to channel, may need to update restricted api keys to generated url (maps, etc.)
```

### Firestore & storage rules

Storage and Firestore rules are deployed in the functions github action.
To manually deploy:

```bash
pnpm deploy:rules:firestore # firebase deploy --only firestore:rules

pnpm deploy:rules:storage # firebase deploy --only storage
```

<!-- ## Firestore / DB Structure

- submissions
- quotes
- policies
  - history
- users
  - paymentMethods
  - transactions
- agencySubmissions (partner applications)
- organizations
  - invites
  - userClaims
- licenses
- notifications
- taxes
- states (active states by product)
- moratoriums
- disclosures
- public (random stuff like fips) -->

## File Storage

TODO: bucket/folder structure and rules

## External Data (outside Google Cloud Project)

TODO

### Github

Large, static, public data files are hosted in github:

- County GeoJSON
- State GeoJSON

TODO: counties initialized in public/fips

---

## Screenshots

![quote address](docs/quote-address.png)

![quote limits](docs/quote-limits.png)

![quote review](docs/quote-review.png)

![stripe invoice](docs/stripe-invoice.png)

![submissions cards](docs/submissions-cards.png)

![submissions grid](docs/submissions-grid.png)

![quote presented](docs/quote-delivery.png)

![policy details](docs/policy-details.png)

![home](docs/home.png)

![home authed](docs/home-authed.png)

![taxes](docs/taxes.png)

![disclosures](docs/disclosures.png)

![admin quote](docs/admin-quote.png)

![active states](docs/active-states.png)

![licenses](docs/licenses.png)

![add license](docs/add-license.png)

![moratorium](docs/moratorium.png)

![stripe connect](docs/account-stripe.png)

![transactions](docs/transactions.png)

![receivables](docs/receivables.png)

![import documents](docs/import-records.png)

---

### TODOs

- fix tenant auth redirect (email/user found --> redirect to auth/:tenantId or attempt signin with tenant auth - not working)
- Org onboarding - check requirements & add onboarding flow -> stripe, etc.
- documentation
  - agency management (onboarding, permissions)
  - admin - moratorium, active states, licenses, etc.
  - quote flow
  - environment variables
  - gh actions
- Fix update Quote / create account in bind quote form
  - userId / agent userId passing along from submission -> quote (allow override in stripe bind if account created ??)
  - don't set userId on quote if created from admin or anonymous submission ??
- /user/{userId} route queries (query by agent/org depending on claims)
- update firestore rules
- quote form agent / agency search - filter by org if agent selected
- submission annual premium not being set/updated. Check for errors in logs (firestore trigger)
- replace mocked data in `<Home />`
- move epay & algolia
- fix/standardize layout - currently using different layout for policies/ route to avoid constrained maxWidth of `<Container />`
- policy locations grid - filter to lcnIds in `policy.locations`
- tests
- finish moving types to `common/`
- integrate search into grid ?? might be better to keep separate b/c grid data is from Firestore. Add search dialog with collection filter ??

### BigQuery cost controls

All tables are date-partitioned. Downstream queries should always include a `WHERE _partitiondate BETWEEN ...` filter to avoid full-table scans. The deduplication views add a second scan layer, so downstream analytics should always query the `_latest` views rather than the raw tables.

### TODO: pipeline tests

- Pure transform functions (policyToRow, buildBucketId, reconciliation math) are pure functions and unit-testable without Firebase emulators.
- Scheduler functions should be tested via the existing HTTP-trigger helper pattern (pubSubHelper.ts) or the new triggerPortfolioExposure callable.
- CDC triggers are integration-tested by writing a document to the Firestore emulator and asserting the BQ streamRows mock was called with the right row shape.

### TODO: UI components

- app wide search
- claim status / follow up / add info
- user facing change request status
- user facing transaction history / policy history
- docs: data lineage graph
- need to set stripe customer ID on user ?? needed for seed ??

Agents

- agent book of business dashboard
- admin claims management ?? currently in account/org
- commission statements

UI improvements

- Authenticated Home - should land on dashboard with contextual cards, open change requests, upcoming renewals, recent activity
- status timeline / audit trail on detail views (submissions / change requests, etc.). Add vertical timeline component to SubmissionView and policy detail
- before/after diff on endorsements. similar to change request
- coverage & premium breakdown visualizations
- upcoming expirations widget
- surface notes property on quotes doc
- moratorium / ineligibility feedback - when submission is marked as ineligible, explanation is not tied to moratorium rules or flood zone constraints.
- search prominence
- Empty State Design - Lists like Submissions.tsx, Quotes.tsx, Policies.tsx likely have no special treatment for new users with no data. Onboarding-style empty states with a clear CTA ("Start your first submission") improve conversion for new agents.
- Receivable Line Item Transparency - the Receivable type has lineItems, taxes, and fees in detail, but the checkout flow may not fully explain what the user is paying. An itemized receipt before and after payment would reduce disputes.
