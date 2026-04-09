# Application Architecture

This document describes the current architecture of the `submissions` application as implemented in this repository.

## Overview

The system is a Firebase-centered insurance workflow platform with a React frontend and an event-driven backend. Its primary responsibilities are:

- collecting submissions and quote inputs
- rating and presenting flood insurance quotes
- binding quotes into policies and taking payment
- supporting agency onboarding, account management, and policy servicing
- powering admin operations such as imports, taxes, moratoriums, disclosures, licenses, and receivables

At a high level:

```text
Browser (React + Vite)
  -> Firebase Auth / Firestore / Storage / Functions
  -> Cloud Run API (/api/*) for backend endpoints (taxes, moratorium, licenses)
  -> Search provider (Typesense, with legacy Algolia naming still present)

Firebase Hosting
  -> serves SPA
  -> rewrites /api/* to Cloud Run
  -> rewrites selected paths to HTTP Functions

Cloud Functions for Firebase
  -> callable APIs for user/admin workflows
  -> auth blocking hooks
  -> Firestore triggers
  -> Storage triggers
  -> Pub/Sub listeners
  -> scheduled jobs
  -> HTTP endpoints/webhook-style integrations
```

[Cloud run api repo](https://github.com/scarlson1/iDemand-Submissions-API) :link:

TODO: cloud run api documentation

## Repository Shape

The repo is a `pnpm` workspace monorepo orchestrated with TurboRepo.

Primary workspace packages:

- `client/`: Vite + React frontend
- `functions/`: Firebase Functions backend
- `api/`: Cloud Run API
- `common/`: shared domain models, enums, schemas, and Firestore helpers published internally as `@idemand/common`

Supporting infrastructure lives at the root:

- `turbo.json`: TurboRepo task graph for `build`, `dev`, `typecheck`, and `lint`
- `pnpm-workspace.yaml`: workspace package definitions
- `firebase.json`: Hosting, rewrites, emulators, Functions runtime
- `firestore.rules` and `storage.rules`: security boundaries
- `firestore.indexes.json`: query/index support
- `docs/`: screenshots and project documentation

Workspace dependencies are linked with `workspace:*`, and TurboRepo ensures upstream packages such as `common/` are built before dependent packages such as `api/` and `functions/`.

## Frontend Architecture

### Runtime Bootstrap

The browser app starts in [`client/src/index.tsx`](/client/src/index.tsx), which composes the main providers:

- React error boundary
- `HelmetProvider`
- Firebase app/services providers via ReactFire
- React Query provider
- React Router provider
- Sentry and React Query devtools

[`client/src/App.tsx`](/client/src/App.tsx) adds the app-level shell:

- MUI date localization
- confirmation and dialog providers
- auth provider
- theme/CSS variable provider
- page metadata
- global toast notifications
- page view analytics logging

### Client Layers

The frontend is organized into a few consistent layers:

- `views/`: route-level screens such as quote, policy, submission, auth, and admin pages
- `elements/`: larger domain UI building blocks, especially multi-step forms, grids, maps, settings pages, and dialogs
- `components/`: reusable generic UI components, layouts, search components, shared form inputs, and boundaries
- `hooks/`: domain and integration hooks for Firestore reads, mutations, auth, uploads, analytics, search, and business workflows
- `api/`: wrappers around callable Functions, HTTP Functions, and Cloud Run APIs
- `context/`: cross-cutting state and providers for auth, dialogs, theme, wizard state, and Firebase service setup
- `modules/`: lower-level utilities for Firestore helpers, rating helpers, MUI grid support, Rx helpers, and shared utility functions

### Routing and Surfaces

Routing is centralized in [`client/src/router.tsx`](/client/src/router.tsx). The main route groups are:

- public routes: home, contact, agency submission, quote viewing, auth flows
- authenticated user/agency routes: submissions, quotes, bind flow, policies, account/settings
- admin routes: quote creation/editing, organization management, imports, taxes, disclosures, moratoriums, licenses, transactions, receivables, delivery workflows

The route tree is large and mostly declared in one file. It uses:

- nested layouts for the main app shell, settings pages, and admin config sections
- `RequireAuth` and `RequireAuthReactFire` wrappers for access control
- route metadata and breadcrumb handles
- a shared `createPath()` helper to keep route generation type-aware

### State and Data Access

The client uses several data access styles side-by-side:

- ReactFire for Firebase app/auth/firestore/functions/storage integration
- direct Firestore reads for document and collection-driven screens
- React Query for request-oriented async state
- Zustand for lightweight client state such as search API keys
- local React context for auth, dialogs, confirmation flows, and view state

Notable patterns:

- `ReactFireContext` configures Firebase services, App Check, Analytics, Performance, and emulator connections
- `AuthContext` builds on top of Firebase Auth and a Firestore-backed claims subscription
- auth claims are refreshed when the mirrored Firestore claims document changes, reducing stale-token issues
- some workflows fetch Firestore data directly while others call callable Functions for privileged operations

### Authentication and Authorization in the Client

The app supports multiple auth modes:

- anonymous auth for early quote/submission steps
- standard user auth
- tenant-aware auth for organization users
- role-based access using custom claims like `iDemandAdmin`, `orgAdmin`, and `agent`

The auth model is intentionally hybrid:

- Firebase Auth establishes identity
- Firestore stores mirrored claim documents under organization scope
- custom claims in the auth token drive route guards and rules
- route wrappers decide whether a screen requires authentication, anonymous auth, or elevated claims

### Agent Invitation Flow

The agent and org-user onboarding flow is invite-first and tenant-aware.

The normal path is:

1. An `orgAdmin` or `iDemandAdmin` opens the org team/invite UI.
2. The client submits invite data through [`AddUsersDialog`](/client/src/elements/forms/AddUsersDialog.tsx), which calls the `inviteusers` callable via [`useInviteUsers`](/client/src/hooks/useInviteUsers.ts).
3. [`functions/src/callables/inviteUsers.ts`](/functions/src/callables/inviteUsers.ts) validates that the caller is an org admin or iDemand admin, determines the target org/tenant, and writes one invite document per email to `organizations/{orgId}/invitations/{email}`.
4. Each invite stores `customClaims`, inviter metadata, org metadata, and a generated invite link.
5. [`functions/src/firestoreEvents/sendInviteEmail.ts`](/functions/src/firestoreEvents/sendInviteEmail.ts) reacts to the new invite document and sends the email unless the invite is marked as an org-creation invite.
6. The invited user signs up through the tenant-aware auth route.
7. [`functions/src/authEvents/beforeCreate.ts`](/functions/src/authEvents/beforeCreate.ts) blocks account creation if the invite is missing, the wrong tenant is used, or the org's domain restrictions reject the email.
8. After the auth user is created, [`functions/src/authEvents/setClaimsFromInvite.ts`](/functions/src/authEvents/setClaimsFromInvite.ts) copies the invite's `customClaims` into `organizations/{orgId}/userClaims/{userId}` and marks the invite as accepted.

There are two admin-facing UI entry points for this flow:

- org self-service team management in [`client/src/elements/settings/OrgUsers.tsx`](/client/src/elements/settings/OrgUsers.tsx)
- iDemand admin org management in the Team and Invites tabs of [`client/src/views/admin/Organization.tsx`](/client/src/views/admin/Organization.tsx)

Pending and historical invites can be viewed and resent in [`InvitesGrid`](/client/src/elements/grids/InvitesGrid.tsx).

Once a user creates an account (within a tenant), the beforeCreate blocking function checks the invite collection under the org to ensure the user was invited to join the tenant (`/organizations/{orgId}/invites/{userEmail}`).

### Claims Model and Token Mirroring

Claims are managed through a Firestore-backed source of truth and then mirrored into Firebase Auth custom claims.

<!-- Claims are set up to mirror the properties of the firebase document under _organizations/{orgId}/userClaims/{userId}_. Firestore rules restrict updating the user claims document to `iDemandAdmin` and `OrgAdmin`. (note: idemand's orgId is 'idemand', although it is not set up as a tenant). -->

The current claim enum in the backend includes:

- `iDemandAdmin`
- `iDemandUser`
- `orgAdmin`
- `agent`

The lifecycle works like this:

1. A claim assignment is created either from an invite or by editing the claim document directly.
2. The Firestore source of truth lives at `organizations/{orgId}/userClaims/{userId}`.
3. [`functions/src/firestoreEvents/mirrorCustomClaims.ts`](/functions/src/firestoreEvents/mirrorCustomClaims.ts) watches that document.
4. The function validates the payload, prevents reserved iDemand claims from being set outside the special `idemand` org, and resolves tenant-aware auth when needed.
5. It calls `setCustomUserClaims()` on Firebase Auth.
6. It writes `_lastCommitted` back to the Firestore document after the token claims are successfully updated.

`_lastCommitted` is the sync marker that prevents infinite write loops and tells the client when token refresh is needed.

### How Claims Reach the Browser

The browser does not rely only on the user’s cached token.

Instead:

- [`useUserClaims`](/client/src/hooks/useUserClaims.ts) subscribes to the org-scoped Firestore claims document `organizations/{ORG_ID}/userClaims/{USER_ID}`
- when `_lastCommitted` changes, it forces `getIdTokenResult(true)` to fetch a fresh token
- [`AuthContext`](/client/src/context/AuthContext.tsx) exposes the refreshed claim state to the rest of the app
- route guards such as [`RequireAuthReactFire`](/client/src/components/RequireAuthReactFire.tsx) and [`useClaims`](/client/src/hooks/useClaims.ts) consume those claims for authorization decisions

This gives the app a useful split:

- Firestore is the editable/admin-visible claim store
- Firebase Auth tokens are the enforcement/runtime claim store

### How to View and Edit Claims

Claims are intentionally visible and editable from the app UI rather than being hidden in Firebase Auth.

The main operational screens are:

- [`UserClaimsGrid`](/client/src/elements/grids/UserClaimsGrid.tsx), which joins org users with `organizations/{orgId}/userClaims`
- the Team tab in [`Organization`](/client/src/views/admin/Organization.tsx)
- the org settings team view in [`OrgUsers`](/client/src/elements/settings/OrgUsers.tsx)

Editing works like this:

1. An admin edits the `userClaims` cell in `UserClaimsGrid`.
2. [`useUpdateClaims`](/client/src/hooks/useUpdateClaims.ts) writes the updated payload to `organizations/{orgId}/userClaims/{userId}`.
3. The Firestore trigger `mirrorcustomclaims` mirrors that document into the user’s Firebase token.
4. The signed-in client eventually refreshes the token when the mirrored document’s `_lastCommitted` changes.

Role editing is also scoped in the UI:

- org admins can manage org-level roles like `agent` and `orgAdmin`
- iDemand admins can additionally assign iDemand-specific roles

[Patterns for security with Firebase: supercharged custom claims with Firestore and Cloud Functions - Doug Stevenson](https://medium.com/firebase-developers/patterns-for-security-with-firebase-supercharged-custom-claims-with-firestore-and-cloud-functions-bb8f46b24e11)

### Applicable Auth Functions

The most important Functions in the auth/claims pipeline are:

- `beforecreate`: invite enforcement, tenant/domain validation, duplicate-user checks, and special iDemand bootstrapping
- `beforesignin`: iDemand email verification gate and session claim injection
- `createFirestoreUser`: creates the Firestore user record
- `setClaimsFromInvite`: copies accepted invite claims into the Firestore claims doc
- `mirrorcustomclaims`: mirrors the Firestore claims doc into Firebase Auth custom claims

### Search

Search is in a transition state.

Current code indicates:

- client state and search key generation are wired to Typesense
- backend includes Typesense schema/setup code
- Firestore sync trigger filenames still live under `functions/src/firestoreEvents/algolia`
- some older client search components still import Algolia types and naming

Architecturally, search should be treated as a separate indexing/read model built from Firestore, with naming still reflecting an earlier Algolia implementation.

### Typesense `visibleBy` Model and Scoped Key Generation

Search authorization is implemented as a document-visibility model rather than by exposing the whole index to every authenticated user.

Each indexed record can carry a `visibleBy` array. The helper in [`functions/src/utils/searchPermissions.ts`](/functions/src/utils/searchPermissions.ts) builds values such as:

- `group/all`
- `group/authed`
- `group/anon`
- `{userId}`
- `{agentUserId}`
- `group/{orgId}`
- `group/admin/{orgId}`

This lets a document be visible to combinations of:

- everyone
- anonymous users
- all authenticated users
- one specific insured/user
- one specific agent
- all users in an org
- org admins for an org

At query time, [`functions/src/callables/generateSearchKey.ts`](/functions/src/callables/generateSearchKey.ts) inspects the caller’s auth token and builds the set of allowed visibility groups:

- all users always get `group/all`
- an anonymous signed-in user also gets `group/anon`
- a signed-in non-anonymous user gets their own `userId` and `group/authed`
- tenant users get `group/{tenantId}`
- tenant agents get their agent user id
- tenant org admins get `group/admin/{tenantId}`
- iDemand admins bypass the scoped-key flow and receive a broader admin search key

The callable then generates a Typesense scoped API key with:

- `filter_by: visibleBy:=[...]`
- `exclude_fields` for sensitive attributes such as Stripe IDs and commission-related fields

That means the browser never receives an unrestricted search key for normal users; authorization is embedded into the key itself.

### Where `visibleBy` Comes From

The `visibleBy` field is populated during indexing and projection flows.

For business records such as quotes, policies, locations, and submissions, sync handlers derive visibility from the record’s insured, agent, and org relationships.

For user records specifically, visibility is maintained from the user access document:

- [`functions/src/firestoreEvents/updateUserAccessOnQuoteChange.ts`](/functions/src/firestoreEvents/updateUserAccessOnQuoteChange.ts) and [`functions/src/firestoreEvents/updateUserAccessOnPolicyChange.ts`](/functions/src/firestoreEvents/updateUserAccessOnPolicyChange.ts) maintain `/users/{userId}/permissions/private`
- [`functions/src/firestoreEvents/algolia/syncUsersVisibleBy.ts`](/functions/src/firestoreEvents/algolia/syncUsersVisibleBy.ts) converts that access document into the Typesense `visibleBy` array for the indexed user record

This creates a separate read-optimized authorization layer for search that mirrors, but does not replace, Firestore security rules.

## Backend Architecture

### Entry Point and Organization

[`functions/src/index.ts`](/functions/src/index.ts) is the backend export surface. It initializes Firebase Admin and re-exports grouped trigger modules.

The backend is organized primarily by trigger type:

- `authEvents/`
- `callables/`
- `firestoreEvents/`
- `storageEvents/`
- `pubsub/`
- `scheduler/`
- `routes/`

Business logic is further extracted into reusable layers:

- `modules/`: domain logic for rating, DB helpers, payments, taxes, storage, and transactions
- `services/`: integrations and cross-cutting services such as Typesense, PDF generation, pubsub, email, and Sentry
- `utils/` and `common/`: helpers, constants, environment parameters, collection metadata, and shared internal utilities

### Cold starts

The following pattern is used to lazy load each function and isolate each function (avoid loading all code for every function). This approach only loads the imports in `exampleFunction.ts`.

```typescript
// functions/src/callables/exampleFunction.ts
const exampleFunction = async ({
  data,
  auth,
}: CallableRequest<SomeRequestPayload>) => {
  return { status: 'ok' };
};

export default exampleFunction;
```

```typescript
// functions/src/callables/index.ts
export const examplefunction = onCall(async (request) => {
  return (await import('./exampleFunction.js')).default(request);
});
```

### Trigger Types

#### Auth and Blocking Events

The auth layer handles:

- pre-create validation
- pre-sign-in validation
- Firestore user document creation
- invite-driven claim assignment
- email/UID normalization

This is the first gate for tenant-aware auth and iDemand admin verification behavior.

**beforeCreate**

If tenant is **not** present:

- checks for invite under all organizations `organizations/{orgId**}/invitations/{email}`, just in case the user that should be under a tenant attempted to create a regular user account.

If tenant is present:

- checks `enforceDomainRestriction`
- checks to ensure an invite exists with matching email under `organizations/{orgId}/invitations/{email}`

All:

- checks to ensure a user does not already exist with matching email (wouldn't be caught if under different tenant or no tenant)
- checks if email domain ends with _@idemandinsurance.com_, and assigns _iDemandAdmin_ claims. Must be verified beforeSignIn.

**beforeSignIn**

If _@idemandinsurance.com_ and email is not verified, creates a JWT signed with EMAIL_VERIFICATION_KEY env var, expiring in 10 mins and sends email with link to `{FUNCTIONS_BASE_URL}/authrequests/verify-email/${token}`, which will verify the token and set the email as verified, allowing the iDemandAdmin email address to sign in.

#### Callable Functions

Callable Functions act as the main application API for privileged browser workflows. Examples include:

- quote rating and recalculation
- policy creation
- payment intent and payment execution
- claim submission
- invite management
- tenant creation
- property detail lookup
- search key generation
- change request approval and calculation workflows

These are the main write-oriented backend endpoints used by the React app.

#### Firestore Event Handlers

Firestore triggers react to document lifecycle changes to perform side effects and denormalization, including:

- mirroring custom claims
- sending notifications and invite emails
- creating Stripe-connected resources
- updating related documents when orgs, users, quotes, or policies change
- creating receivables when policies are created
- versioning documents into `versions` subcollections
- syncing searchable data into the search system

This is a core architectural pattern in the codebase: user writes and admin writes often fan out into additional consistency and notification work asynchronously.

#### Storage Event Handlers

Storage triggers process uploaded files for operational workflows such as:

- importing policies
- importing quotes
- importing transactions
- rating portfolio uploads
- FIPS enrichment

This supports admin/import workloads that are too heavy or too async for the client.

#### Pub/Sub Handlers

Pub/Sub listeners handle asynchronous workflows such as:

- payment completion
- policy creation and renewal processing
- endorsements and amendments
- location cancellations
- static map/image generation
- Stripe-related downstream financial processing

These listeners decouple long-running or evented business processes from synchronous user actions.

see [QUOTES_AND_POLICIES.md](docs/QUOTES_AND_POLICIES.md) for quote and policy details.

#### Scheduled Jobs

Scheduled work currently includes ACH status checking, filling a webhook gap in the payment provider workflow.

#### HTTP Routes

HTTP routes in `functions/src/routes` are used for:

- auth verification flows
- Stripe/webhook-style integrations
- PDF generation
- QuickBooks integration
- email/webhook handling
- private operational setup endpoints such as Typesense schema setup

### Domain Modules

The most important reusable backend modules are:

- `modules/rating`: premium/risk calculation, AAL retrieval, state multipliers, validation, carrier logic
- `modules/transactions`: policy transaction construction for amendments, endorsements, cancellations, reinstatements, and offsets
- `modules/taxes`: tax calculation helpers and tax transaction creation/reversal
- `modules/db`: Firestore-oriented helpers such as rating doc creation, tax fetches, license fetches, and policy/location merge logic
- `modules/payments`: payment and receivable support

This is where most durable business logic should live; triggers and routes mostly provide transport and orchestration.

## Data Architecture

### Primary Data Stores

The app uses Google Cloud/Firebase as its system of record:

- Firestore for application documents
- Cloud Storage for uploaded files, generated images, policy docs, import CSVs, and user/org assets
- Firebase Auth for users, tenants, and custom claims
- Pub/Sub for async eventing

From the current code and README, core Firestore collections include:

- `submissions`
- `portfolioSubmissions`
- `quotes`
- `policies`
- `locations`
- `transactions`
- `financialTransactions`
- `receivables`
- `users`
- `organizations`
- `licenses`
- `taxes`
- `moratoriums`
- `disclosures`
- `notifications`
- various subcollections such as `versions`, `changeRequests`, `paymentMethods`, `invitations`, `userClaims`, and `permissions`

### Security Model

Security is enforced in layers:

- client-side route guards for UX and coarse access control
- Firebase custom claims for role enforcement
- Firestore and Storage rules for real authorization
- auth blocking functions for invite checks, tenant constraints, and email verification flows

Important patterns in the rules:

- reads and writes often depend on user identity, agent relationship, org tenancy, or admin claims
- policy, quote, location, and user access are authorization-sensitive
- storage paths are segmented by use case, with stricter write rules on policy and operational buckets

### Search Read Model

Search is not the source of truth. It is a projection of Firestore documents into an external index with user-scoped API keys.

That projection is maintained by Firestore triggers and keyed by visibility markers such as:

- all users
- anonymous users
- authenticated users
- specific users
- org users/admins
- agents

## Integration Architecture

The backend integrates with several external systems:

- Stripe for payment intents, connected accounts, transfers, and receivables-related workflows
- Swiss Re for flood/risk and AAL-related rating inputs
- ATTOM and elevation/geospatial services for property enrichment
- Typesense for search
- Resend for email delivery
- QuickBooks via dedicated HTTP routes
- Mapbox/static map-related services for visual assets

The frontend also uses a separate Cloud Run API, exposed through Hosting rewrites under `/api/*`, for config-style endpoints such as:

- state tax lookup
- active-state lookup
- moratorium lookup
- surplus lines license lookup

That suggests a deliberate split:

- Firebase Functions handle app workflows tightly coupled to Firebase auth/data
- Cloud Run handles API-style domain services that fit better behind a conventional HTTP service boundary

## Key Business Flows

### Quote Flow

The quote lifecycle spans multiple subsystems:

1. A user starts a new submission, with anonymous auth allowed in early steps.
2. Property data and rating inputs are enriched through backend integrations.
3. Submission and quote data are written to Firestore.
4. Quote views read directly from Firestore.
5. Binding calls backend functions to create a policy and execute payment.
6. Firestore and Pub/Sub triggers create receivables, notifications, search projections, version history, and downstream financial records.

see [QUOTES_AND_POLICIES.md](docs/QUOTES_AND_POLICIES.md).

### Policy Servicing Flow

Policy changes are modeled through change requests and follow an async workflow:

1. A change request document is created.
2. Backend logic calculates endorsement, amendment, cancellation, or location-change effects.
3. Pub/Sub and transaction modules generate resulting operational and financial records.
4. Updated policy data is written back and projected into related documents/search indexes.

see [QUOTES_AND_POLICIES.md](docs/QUOTES_AND_POLICIES.md)

### Agency and Tenant Management

Organization setup is invite- and claims-driven:

1. Admins or automated workflows create orgs and invitation documents.
2. Firestore triggers send invite emails.
3. Auth blocking functions verify invite eligibility at account creation time.
4. User claim docs are mirrored into Firebase custom claims.
5. The frontend subscribes to the claim docs and refreshes tokens when permissions change.

### Admin Import Flow

Operational CSV imports use Cloud Storage as the ingestion point:

1. An admin uploads a CSV to a known storage path.
2. A storage trigger validates and transforms rows.
3. Firestore documents are created or updated.
4. Notifications, search sync, versioning, and downstream automation happen through the normal event system.

## Deployment and Runtime Infrastructure

### Hosting and Rewrites

Firebase Hosting serves the SPA build output from `client/build` and rewrites:

- `/api/**` to Cloud Run service `idemand-submissions-api`
- selected paths such as `/auth-api/**`, `/pdf-api/**`, and `/stripe` to HTTP Functions
- all other paths to `index.html` for SPA routing

### Functions Runtime

The Functions project is configured for:

- Node.js 22 runtime
- TypeScript build output in `functions/dist`
- second-generation Functions for most modern triggers
- Firebase parameterized config and Secret Manager for runtime settings

## Deployment

### Functions deployment

```bash
cd functions

# set target project in firebase cli
pnpm use:dev # or use:prod or firebase use [alias]

# build (rm -rf ./dist/ && tsc)
pnpm build

# deploy (firebase deploy --only functions)
pnpm deploy:dev
```

### Hosting deployment (client)

```bash
cd client

# set target project in firebase cli
pnpm use:dev # or use:prod or firebase use [alias]

# build  - vite "mode" flag determines env file to include
pnpm build:dev # or build:prod or vite build --mode [MODE]

pnpm deploy:dev # or deploy:prod or deploy:channel:dev or deploy:channel:prod
# if deploying to channel, may need to update restricted api keys to generated url (maps, etc.)
```

### Local Development

The repo includes emulator support for:

- auth
- functions
- firestore
- hosting
- pubsub
- storage
- eventarc

TurboRepo manages package-level development processes, but it does not start the Firebase emulators by itself.

```bash
# Start all workspace dev processes
pnpm dev

# Start Firebase emulators in a separate terminal
pnpm emulators:dev

# Or run individual packages only:
pnpm dev:client
pnpm dev:api
pnpm dev:functions

# start local typesense instance in docker
pnpm typesense:dev

# start ngrok or tailscale to accept webhooks (must configure webhook urls in resend/stripe)
pnpm ngrok # need to update ngrok url in package.json
# or (tailscale funnel 5001)
pnpm tailscale
```

TODO: additional setup steps (stripe webhook, secret manager, etc.)

Test stripe webhook events locally using CLI:

```bash
stripe login

# forward existing webhook event subscriptions to local host
stripe listen --load-from-webhooks-api --forward-to localhost:5001/<PROJECT_ID>/us-central1/stripe/webhook
# cli will output signing secret --> update variable in functions/src/routes/stripe.ts

# to manually test:
stripe trigger payment_intent.succeeded
```

## Current Architectural Seams

Several seams are worth knowing before making changes:

- Shared domain models now live in the local `common/` workspace package (`@idemand/common`), so schema changes can be made in-repo and propagated through TurboRepo task dependencies.
- Search is mid-migration: Typesense is active, but many filenames and some client types still reference Algolia.
- Routing is centralized in one very large router file, which makes navigation behavior explicit but increases change surface.
- The client uses both `RequireAuth` and `RequireAuthReactFire`, which suggests two overlapping auth guard patterns.
- Shared domain models come from external packages rather than a local workspace package, so schema changes may require coordinated version updates outside this repo. (TODO: move @idemand/common into monorepo & manage with pnpm workspaces)
- Some scripts and comments show older CRA/Algolia-era paths, which means there is active historical layering in the codebase.

## Summary

This application is best understood as a Firebase-native insurance operations platform with:

- a React SPA for customer, agency, and admin workflows
- Firestore as the primary source of truth
- Cloud Functions as the main workflow engine
- Pub/Sub and triggers for asynchronous orchestration
- external services for rating, payments, search, email, and document generation

The architecture favors event-driven backend processing, Firestore-centric data modeling, and a frontend that combines direct document reads with backend-mediated workflow mutations.
