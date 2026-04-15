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

## External Data (outside Google Cloud Project)

TODO

### Github

Large, static, public data files are hosted in github:

- County GeoJSON
- State GeoJSON

TODO: counties initialized in public/fips

<!-- ## App structure

## Cloud Functions

Cloud Functions are kind of like an API or server. They serve as the backend in most cases. Some boilerplate is handled by Firebase (like including user auth token and some metadata). There are different types of Cloud Functions, categorized by how the function is triggered:

- **Callables** - triggered ("called") by the client/frontend
- **HTTPS** - very similar to callables. Can be called with URL, like a regular api
- **Storage** - triggered from a file upload or metadata change
- **Auth** - triggered when a new user is created (including anonymous user)
- **Blocking Function** - two types: **_before sign in_** and **_before create_**. Executed before their respective actions and can block the action from proceeding if the function finds a reason to block it. -->

<!-- ### Callables

- TODO: LIST CLOUD FUNCTIONS & SUMMARY OF WHAT THEY DO

- `assignQuote`
  - called when user 'claims' quote when moving the bind step and either signing into their account or creating a new one.
- `calcQuote`
  - called by idemand admin when button is clicked to recalculate quote
  - Required Claims: iDemandAdmin
- `createPolicy`
- `createTenantFromSubmission`
- `executePayment`
- `getAnnualPremium` - runs swiss re to get AALs and recalculates quote
- `getPropertyDetailsAttom` - called after address step in the new submission form. Fetch property data from Attom
- `getTenantIdFromEmail` - called when "user not found" error code is returned from sign in attempt. Searches across all users in _users_ collection (all tenants). If user is found, returns the tenantId and retries signing the user in. This would happen is user was a tenant auth user (agent) and tried to sign into the non tenant-aware login page (_`/auth/login`_ instead of _`/auth/login/:tenantId`_)
- `inviteUsers` - takes an array (list) of users (email, name, userClaims/permissions/role) and creates a new invite doc under _`organizations/:orgId/invitations`_ collection. Another Firestore triggered Cloud Function executes when a new document is created in this sub collection, which will send an email to the invited user(s)
- `resendInvite`
- `sendAgencyApprovedNotification`
- `sendContactEmail`
- `sendPolicyDoc`
- `verifyEPayToken` - calls ePay endpoint with provided token and receives a few details about the payment method, which are saved under _`users/userId/paymentMethods`_. Can later be used to execute payment
- `moveUserToTenant` - moves user from non-tenant auth or tenant-auth to a new tenant. -->

<!-- ### Storage Triggered

- `getAALPortfolio` - runs Swiss Re api call for each row in csv. Triggered by upload to _/portfolio-aal_ folder. Saves result to the same folder with "processed\_" prefixed to the file name.
- `importPolicies` - creates a new policy doc for each row in csv. Triggered by csv upload to _/importPolicies_ folder.
- `tempGetFIPS` - not sure if we're still using this. Adds county FIPS to csv file. Uses counties GeoJSON and latitude & longitude columns from csv to find which county the coordinates are located within. -->

<!-- ### HTTPS Triggered

- `authrequests` - used to verify idemand email addresses. Link in verification email calls this endpoint. Returns "example@email.com has been verified, if successful. (weird bug with blocking function prevents using the Firebase SDK email verification method) -->

<!-- ### Pub/Sub

- `checkAchStatus` - ePay doesn't have webooks to determine when ACH payment is confirmed. This function is scheduled to run at 10:35 AM Monday-Friday. It fetches all transactions where the status is 'processing,' then calls `/api/v1/transactions/${charge.id}` to check the status of the transaction. Not well tested because ePay's documentation isn't great and the development emulator doesnt support pub/sub. Need further testing in dev.
- `markpaidonpaymentcomplete` - triggered when '`payment.complete` event is published (either from ACH scheduled pubsub or from payment execution if method is a card). Updates the status on the policy doc to 'paid' and sends notification to iDemand admins, which contains a link to /admin/policy-delivery, so the policy documents can be uploaded to storage and delivered to the insured. -->

<!-- ### Firestore Triggered

- `getStaticSubmissionImg`
- `getSubmissionAAL`
- `getSubmissionFIPS`
- `mirrorCustomClaims` - monitors changes to documents located at _`organizations/:orgId/userClaims/:userId`_. When a change is detected, the function will take the properties from the doc and assign each property as a Custom Claim (role/permission) in Auth for the user with an id matching the document ID. Necessary for a couple reasons:
  - No way to view Auth Custom Claims (even in the Google Cloud Dashboard). Since this is stored in the database, and then mirrored as Custom Claims in Auth (user token), we can display the data in the Firestore database to show all claims by userId
  - Frontend can subscribe to changes to the document, and force a token refresh when a change is detected (`getIdToken(true)`). Without this, the user would have to sign out and sign back in in order to get current Custom Claims.
- `newAgencyAppNotification` - email iDemand Admins when a new agency 'partner with us' doc is created
- `newSubmissionNotification`
- `sendInviteEmail` - sends invite to create an account when a new doc is created under _`organizations/:orgId/invitations`_ -->

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

### TODO: Data Pipelines

[DATA_PIPELINES_PLAN.md](docs/DATA_PIPELINES_PLAN.md)

#### 1. Real-Time Premium Analytics Pipeline

Stream policy, transaction, and change request events into a BigQuery data warehouse.

- Firestore → Pub/Sub → Dataflow (or Cloud Functions) → BigQuery
- A streamToBigQuery trigger on policies, transactions, and changeRequests collections
- Schema normalization layer to flatten nested Firestore documents (e.g. flattening locations, taxes, fees into rows)
- A daily aggregation job computing written premium, earned premium, loss ratio, and commission by state, agency, and flood zone

#### 2. Portfolio Aggregation & Exposure Pipeline

What it is: A batch pipeline that computes aggregated flood exposure by geography for the entire book of business.
How it fits: The app has all active policy locations with coordinates, limits, and flood zones. This data currently sits unused at a portfolio level.
Components:

A scheduled Cloud Function (or Dataflow job) that reads all active, non-cancelled locations
Groups them by county FIPS, state, flood zone, and a Mapbox-derived geohash grid
Computes totalInsuredValue, termPremium, locationCount, and avgDeductible per bucket
Writes results to a portfolioExposure Firestore collection (for the UI) and BigQuery (for analysis)
A change detection layer that computes week-over-week exposure shifts and flags concentrations above a configurable threshold

Why it's interesting: Concentration risk monitoring is a real insurance concern and this would give the app a feature that currently doesn't exist at all. The geospatial bucketing piece (using geohash or H3) is a legitimately interesting data engineering problem.

#### 3. Tax Reconciliation Pipeline

What it is: A pipeline that reconciles tax transactions against expected tax calculations and flags discrepancies.
How it fits: The app has taxes (the tax config), taxCalculations, taxTransactions, and transactions collections. There's currently no automated reconciliation between them.
Components:

A daily batch job that joins taxTransactions against their parent taxCalculations
Verifies that taxAmount in each taxTransaction matches percentCaptured × taxCalc.value within a tolerance
Computes total tax liability by state and transaction type
Writes a daily reconciliation report to BigQuery and flags mismatches to a taxReconciliationErrors collection
A Firestore trigger that immediately flags any taxTransaction where the reversal amount doesn't match expected refund percentage

Why it's interesting: Financial reconciliation pipelines are a common enterprise data engineering task. This one has real regulatory implications since surplus lines taxes are reported to state regulators.

#### 4. Agent Performance & Funnel Analytics

What it is: An ETL pipeline that builds a conversion funnel from submission → quote → bind → paid for each agent and agency.
How it fits: All the source data already exists across submissions, quotes, policies, and financialTransactions.
Components:

A Firestore → BigQuery CDC (change data capture) pipeline for all four collections
A dbt or SQL transformation layer that builds:

submissions_to_quotes conversion rate by agent and agency
quotes_to_bind conversion rate
Average time-to-bind
Average premium per bound policy
Cancellation rate by agent

A summary written back to each org's Firestore document for display in the existing admin UI

Why it's interesting: This is a classic ETL + dimensional modeling problem. Building the CDC piece on top of Firestore's native versioning (which the app already has) is an elegant approach.

### BigQuery cost controls

All tables are date-partitioned. Downstream queries should always include a `WHERE _partitiondate BETWEEN ...` filter to avoid full-table scans. The deduplication views add a second scan layer, so downstream analytics should always query the `_latest` views rather than the raw tables.

### TODO: pipeline tests

- Pure transform functions (policyToRow, buildBucketId, reconciliation math) are pure functions and unit-testable without Firebase emulators.
- Scheduler functions should be tested via the existing HTTP-trigger helper pattern (pubSubHelper.ts) or the new triggerPortfolioExposure callable.
- CDC triggers are integration-tested by writing a document to the Firestore emulator and asserting the BQ streamRows mock was called with the right row shape.

### TODO: UI components

- claim status / follow up / add info
- user facing change request status
- user facing transaction history / policy history

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
