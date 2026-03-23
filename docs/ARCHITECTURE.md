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
  -> Cloud Run API (/api/*) for config-style backend endpoints
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

## Repository Shape

The repo is organized around two deployable applications:

- `client/`: Vite + React frontend
- `functions/`: Firebase Functions backend

Supporting infrastructure lives at the root:

- `firebase.json`: Hosting, rewrites, emulators, Functions runtime
- `firestore.rules` and `storage.rules`: security boundaries
- `firestore.indexes.json`: query/index support
- `docs/`: screenshots and project documentation

The code also depends on shared domain packages that are not defined in this repo:

- client imports from `common`
- backend imports from `@idemand/common`

Those packages appear to provide shared collection names, domain models, enums, and validation/types that keep the client and backend aligned.

## Frontend Architecture

### Runtime Bootstrap

The browser app starts in [`client/src/index.tsx`](/Users/spencercarlson/Documents/dev/submissions/client/src/index.tsx), which composes the main providers:

- React error boundary
- `HelmetProvider`
- Firebase app/services providers via ReactFire
- React Query provider
- React Router provider
- Sentry and React Query devtools

[`client/src/App.tsx`](/Users/spencercarlson/Documents/dev/submissions/client/src/App.tsx) adds the app-level shell:

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

This gives the UI a mostly top-down composition model:

```text
router/view
  -> elements/components
    -> hooks
      -> Firestore / Functions / Storage / HTTP APIs
```

### Routing and Surfaces

Routing is centralized in [`client/src/router.tsx`](/Users/spencercarlson/Documents/dev/submissions/client/src/router.tsx). The main route groups are:

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

### Search

Search is in a transition state.

Current code indicates:

- client state and search key generation are wired to Typesense
- backend includes Typesense schema/setup code
- Firestore sync trigger filenames still live under `functions/src/firestoreEvents/algolia`
- some older client search components still import Algolia types and naming

Architecturally, search should be treated as a separate indexing/read model built from Firestore, with naming still reflecting an earlier Algolia implementation.

## Backend Architecture

### Entry Point and Organization

[`functions/src/index.ts`](/Users/spencercarlson/Documents/dev/submissions/functions/src/index.ts) is the backend export surface. It initializes Firebase Admin and re-exports grouped trigger modules.

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

### Trigger Types

#### Auth and Blocking Events

The auth layer handles:

- pre-create validation
- pre-sign-in validation
- Firestore user document creation
- invite-driven claim assignment
- email/UID normalization

This is the first gate for tenant-aware auth and iDemand admin verification behavior.

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
- ePay for payment method verification and ACH/card execution
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

### Policy Servicing Flow

Policy changes are modeled through change requests and follow an async workflow:

1. A change request document is created.
2. Backend logic calculates endorsement, amendment, cancellation, or location-change effects.
3. Pub/Sub and transaction modules generate resulting operational and financial records.
4. Updated policy data is written back and projected into related documents/search indexes.

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

### Local Development

The repo includes emulator support for:

- auth
- functions
- firestore
- hosting
- pubsub
- storage
- eventarc

The client conditionally connects to emulators through its ReactFire setup.

## Current Architectural Seams

Several seams are worth knowing before making changes:

- Search is mid-migration: Typesense is active, but many filenames and some client types still reference Algolia.
- Routing is centralized in one very large router file, which makes navigation behavior explicit but increases change surface.
- The client uses both `RequireAuth` and `RequireAuthReactFire`, which suggests two overlapping auth guard patterns.
- The frontend mixes direct Firestore access with callable/API access. This is practical, but it means authorization and validation logic is split across rules and backend functions.
- Shared domain models come from external packages rather than a local workspace package, so schema changes may require coordinated version updates outside this repo.
- Some scripts and comments show older CRA/Algolia-era paths, which means there is active historical layering in the codebase.

## Summary

This application is best understood as a Firebase-native insurance operations platform with:

- a React SPA for customer, agency, and admin workflows
- Firestore as the primary source of truth
- Cloud Functions as the main workflow engine
- Pub/Sub and triggers for asynchronous orchestration
- external services for rating, payments, search, email, and document generation

The architecture favors event-driven backend processing, Firestore-centric data modeling, and a frontend that combines direct document reads with backend-mediated workflow mutations.
