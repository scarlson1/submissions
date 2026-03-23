# Quote Process

This document describes the quote lifecycle as it is implemented in this repository today.

## Overview

There are two ways a quote starts:

1. A customer or agent starts a flood submission at `/new/:productId`.
2. An iDemand admin creates a quote directly at `/admin/quotes/:productId/new` or from an existing submission at `/admin/quotes/:productId/new/:submissionId`.

Important distinction:

- A customer-facing "start a quote" flow creates a `submissions/{submissionId}` document first, not a `quotes/{quoteId}` document.
- A real `quotes/{quoteId}` document is created later by an admin from the quote form.

The main records touched by the quote/bind flow are:

- `submissions`
- `quotes`
- `ratingData`
- `policies`
- `locations`
- `receivables`
- `transactions`
- `users/{userId}/paymentMethods`
- `finTrx`
- `dataImports/{importId}/stagedDocs`

## Customer-Facing Start: Submission

Route:

- `/new/:productId`

What happens:

1. The submission wizard collects address, limits, deductible, property details, exclusions, prior flood losses, and quote delivery contact info.
2. On the address step, the client calls the callable `getpropertydetailsattom`.
3. `getpropertydetailsattom` enriches the address with:
   - ATTOM property data
   - fallback geocoding if coordinates are missing
   - FEMA flood zone lookup
   - elevation lookup
   - suggested limits and deductible
4. On final submit, the client writes directly to Firestore with `addDoc(submissionsCollection(...))`.

Direct write:

- `submissions/{submissionId}`

Backend side effects triggered by the new submission document:

- `getsubmissionaal`
  - Calls Swiss Re to calculate AALs.
  - Calculates the annual premium.
  - Creates a `ratingData` document.
  - Updates the submission with `AALs`, `annualPremium`, and `ratingDocId`.
- `getsubmissionfips`
  - Populates county/FIPS data.
- `getstaticsubmissionimg`
  - Creates static map imagery for the submission (pubsub).
- `newsubmissionnotifications`
  - Sends email notifications.

Emails delivered:

- Submission confirmation email to the contact on the submission.
- Admin new-submission notification email with a link to the admin submission screen.

Result:

- The system now has a rated submission, but not yet a quote.

## Admin Quote Creation

Routes:

- From scratch: `/admin/quotes/:productId/new`
- From submission: `/admin/quotes/:productId/new/:submissionId`

The quote form itself is mostly client-driven. There is no single backend `createQuote` callable. The client writes the final quote document directly to Firestore after running the supporting rating/tax APIs. Authorization is controlled by firestore rules.

### From Submission

What is prefilled:

- Address
- Coordinates
- Limits
- Deductible
- Rating property data
- AALs
- `ratingDocId`
- Agent and agency
- Submission images

Additional side effect on submit:

- The submission status is updated to `quoted`.

### Create Quote From Scratch

What the admin fills/selects:

- Address and coordinates
- Rating property data
- Limits, deductible, effective date
- Fees and taxes
- Named insured
- Agent, agency, carrier

Search/dependency lookups used in the form:

- Typesense search for users, agencies, and carriers
- Firestore read of the selected agent's org to backfill agency details

### Rating and Pricing APIs Used During Quote Creation

These happen before the final quote document is written:

- `getannualpremium`
  - Used when the form needs a full rerate.
  - Calls Swiss Re for AALs.
  - Calculates premium from those AALs.
  - Saves a new `ratingData` document.
- `calcquote`
  - Used when AALs already exist and only premium needs recalculation.
  - Recalculates annual premium from existing AALs.
  - Saves a `ratingData` document.
- `POST /api/state-tax`
  - Cloud Run API used to calculate state taxes.
- Quote total is then calculated in the client from:
  - annual premium
  - fees
  - taxes

### Final Quote Write

On submit, the client writes directly to `quotes/{quoteId}` with fields including:

- pre-generated `policyId`
- `quotePublishedDate`
- `quoteExpirationDate`
- `annualPremium`
- `fees`
- `taxes`
- `cardFee`
- `quoteTotal`
- `status = awaiting_user`
- `ratingDocId`
- `billingEntities = {}`
- `defaultBillingEntityId = 'namedInsured'`

Notable implementation detail:

- New quotes are created with a 30-day expiration window.
- Admin quote edits republish the quote and currently reset expiration to 60 days from edit time.

## Quote Delivery

Quote delivery is a separate step after the quote document exists.

Client flow:

1. After quote creation, the admin is prompted to choose recipients (agent, named insured, free form email input)
2. The client calls `sendnewquotenotifications`.

What it does:

- Requires agent, org-admin, or iDemand-admin claims.
- Builds a quote link at `/quotes/:quoteId`.
- Sends the "Here's your quote" email through Resend.

Emails delivered:

- Quote delivery email to any selected recipients, usually:
  - named insured
  - agent
  - alternate email addresses entered by the admin

Important detail:

- Quote delivery is manual. Creating a quote does not automatically email it until the recipient prompt is completed.

## Viewing and Claiming a Quote

Route:

- `/quotes/:quoteId`

User actions:

- The quote can be viewed publicly (account creation not required for submission)
- The "Continue to bind" button is enabled only when:
  - `status === awaiting_user`
  - the quote is not expired

Auth/claiming helpers:

- `assignquote`
  - Used by the auth action handler to associate a signed-in user or agent with a quote.
  - For insureds, it sets `userId`, `namedInsured.userId`, and optionally mailing address.
  - For agents, it sets agent and agency info from the authenticated user and tenant/org.
- `setquoteuserid`
  - Used by the experimental Stripe bind flow to map a named insured email back to an existing user ID.

Related background side effect:

- `updateuseraccessonquotechange`
  - Updates the insured user's access document when quote agent/agency ownership changes.

## Main Bind Flow

Route:

- `/quotes/:quoteId/bind`

This is the main bind implementation in the app today. It uses ePay for the actual payment collection.

### Step-by-Step

1. The bind wizard loads the quote from Firestore.
2. Each wizard step saves directly back to the quote document with `updateDoc(...)`.
3. The user adds a payment method.
4. The client tokenizes the payment method with ePay.
5. The client verifies the token with Firebase.
6. The final submit calls `createpolicy`.
7. If policy creation succeeds, the client immediately calls `executepayment`.

### Direct Firestore Writes During Bind

The bind wizard writes these quote fields as the user progresses:

- `namedInsured`
- `mailingAddress`
- `additionalInterests`
- `effectiveDate`
- `effectiveExceptionRequested`
- `effectiveExceptionReason`
- `billingEntities`

### Payment Method APIs Used

Client-side tokenization:

- `POST /api/v1/tokens` against ePay

Callable verification/storage:

- `verifyepaytoken`

What `verifyepaytoken` does:

- Fetches verified token details from ePay.
- Normalizes them into the app's `PaymentMethod` shape.
- Stores them under `users/{uid}/paymentMethods/{tokenId}`.

### Policy Creation API

Callable used:

- `createpolicy`

What `createpolicy` does:

- Requires an authenticated user.
- Loads the quote.
- Verifies the quote exists and is not expired.
- Checks moratoriums for the county/effective date.
- Fetches the surplus-lines license for the state.
- Converts the quote into:
  - one `policies/{policyId}` document
  - one or more `locations/{locationId}` documents
- Updates the quote:
  - `status = bound`
  - `quoteBoundDate`
  - `policyId`
- Publishes the `policy.created` Pub/Sub event.

Immediate side effects of the new policy:

- `policyCreatedListener`
  - Creates initial premium transactions in `transactions` for each policy location.
  - Publishes policy image generation.
- `createreceivableonpolicycreated`
  - Attempts to create Stripe-backed receivables and invoices for the policy.
- `updateuseraccessonpolicychange`
  - Updates insured access relationships.

### Payment Execution API

Callable used:

- `executepayment`

What `executepayment` does:

- Requires an authenticated user.
- Loads the policy.
- Requires `paymentStatus = awaiting_payment`.
- Loads the saved payment method from `users/{uid}/paymentMethods/{paymentMethodId}`.
- Sends the charge to ePay.
- Creates a payment ledger record in `finTrx/{transactionId}`.

Card vs ACH behavior:

- Card
  - Marks the financial transaction as succeeded immediately.
  - Publishes `payment.complete`.
- ACH
  - Marks the financial transaction as processing.
  - Updates the policy to `paymentStatus = processing`.
  - The scheduled job `checkachstatus` later checks ePay for settlement and publishes `payment.complete` once settled.

### Payment Complete Side Effects

Pub/Sub subscriber:

- `markpaidonpaymentcomplete`

What it does:

- Updates the policy to `paymentStatus = paid`.
- Sends an admin email with a deep link to the policy delivery screen.

Emails delivered:

- Admin payment-complete/policy-delivery notification email

## Policy Document Delivery

Route:

- `/admin/policies/:policyId/delivery`

This is an admin/manual handoff step after payment has completed.

Flow:

1. Admin opens the policy delivery screen.
2. Admin can generate a declaration PDF through the HTTP route `generatepdf/generateDecPDF`.
3. Admin uploads the final PDF into Storage under `policies/:policyId`.
4. The policy document metadata is saved back onto the policy document.
5. Admin chooses recipients and triggers document delivery.

APIs and writes used:

- `POST generatepdf/generateDecPDF`
- Storage upload to `policies/:policyId/...`
- Firestore policy update to `documents`
- `sendpolicydoc`

What `sendpolicydoc` does:

- Requires iDemand-admin claims.
- Reads the uploaded PDF from Cloud Storage.
- Attaches the PDF to the email.
- Sends the policy-delivery email through Resend.

Emails delivered:

- Policy document email to selected insured/agent/alternate recipients

## Stripe and Billing Integration

Stripe exists in this codebase, but it is not the primary payment processor for the main quote bind route.

### What Stripe Is Used For

- Creating/reusing Stripe customer records via `addbillingentity`
- Creating receivables after policy creation
- Generating Stripe invoices for receivables
- Customer-facing receivable checkout via Stripe Elements
- Stripe webhooks for:
  - invoice finalization
  - charge success
  - transfer creation/reversal
  - refunds
  - payment-intent bookkeeping
- Creating tax transactions and connected-account transfers after successful Stripe charges

### What the Main Quote Bind Uses Instead

- The main `/quotes/:quoteId/bind` flow uses ePay for tokenization and payment execution.

### Experimental Stripe Quote-Bind Flow

There is a separate Stripe-oriented bind path under:

- `/admin/stripe-test/quote/bind/:quoteId`

That experimental path does extra Stripe-specific work:

- `setquoteuserid`
- `addbillingentity`

It is closer to the data shape expected by receivables because it creates/reuses a Stripe customer and uses that customer ID as the billing-entity key.

### Receivable Checkout

Receivable checkout route:

- `/receivables/:receivableId`

Flow:

1. Policy creation creates a receivable and Stripe invoice.
2. Stripe invoice finalization updates the receivable with `invoiceUrl` and `paymentIntentId`.
3. The receivable checkout screen calls `fetchpaymentintentsecret`.
4. Stripe Elements completes payment on the receivable.

## Transactions Collection From Policy Changes

There are two different payment/transaction ledgers in this app:

- `transactions`
  - Insurance premium transactions by policy/location
- `finTrx`
  - Payment processor ledger for ePay charges

When discussing policy-change accounting, the important collection is `transactions`.

### New Policy Transactions

Source:

- `policy.created` Pub/Sub event

Handler:

- `policyCreatedListener`

Result:

- Creates one initial premium transaction per location in `transactions`.

### Policy Change Request Transactions

Source:

- A change request document under `policies/{policyId}/changeRequests/{requestId}`

Flow:

1. A submitted change request triggers admin and submitter notifications.
2. When its status becomes `accepted`, `policychangerequest` calls `publishChangeRequestTransactions(...)`.
3. That publishes one or more Pub/Sub messages based on change type.

Current supported handlers:

- `endorsementlistener`
  - Creates:
    - an offset transaction for the remaining term on the previous premium
    - a new endorsement premium transaction
- `locationcancellistener`
  - Creates an offset/cancellation transaction
- policy-level cancellation
  - fans out into location-cancellation Pub/Sub messages for each active location

Emails delivered around policy changes:

- Admin change-request notification email when submitted
- Confirmation email to the submitting user when submitted

## Bulk Uploading Quotes and Policies

Bulk imports are a two-stage workflow:

1. Upload CSV into Storage.
2. Review staged rows in `dataImports/{importId}/stagedDocs`, then approve or decline them.

### Quote Import

Upload target:

- `importQuotes`

Storage trigger:

- `importquotes`

What it does:

- Downloads and parses the CSV.
- Transforms and validates each row.
- Creates a `ratingData` doc for each valid row.
- Fetches taxes.
- Calculates `quoteTotal` and `cardFee`.
- Writes staged quote docs into `dataImports/{eventId}/stagedDocs`.
- Writes a summary record in `dataImports/{eventId}`.
- Sends an admin import-summary email.

Approval step:

- Admin reviews the staged rows in the import review screen.
- The client calls `approveimport`.
- `approveimport` copies approved staged docs into the target collection and marks staged rows as `imported`.

### Policy Import

Upload target:

- `importPolicies`

Storage trigger:

- `importpolicies`

What it does:

- Downloads and parses the CSV.
- Groups rows by policy ID.
- Builds staged:
  - policy records
  - location records
  - rating records
- Writes those staged docs under `dataImports/{eventId}/stagedDocs`.
- Writes a summary record in `dataImports/{eventId}`.
- Sends an admin import-summary email.

Approval step:

- Admin reviews the staged import.
- The client calls `approveimport`.
- `approveimport` writes approved records into the final collection.

Important related behavior:

- When approving a staged policy import, `approveimport` also looks for staged transaction imports that match the imported policy locations by external ID and imports those too.

### Transaction Import

There is also a separate bulk transaction import path:

- Storage folder: `importTransactions`
- Trigger: `importtransactions`

This is separate from quote/policy import, but it is relevant because policy imports can pull in matching staged transaction rows during approval.

## Emails Delivered Across the Quote Lifecycle

Implemented email touchpoints in or adjacent to the quote flow:

- Submission received confirmation to the submission contact
- Admin new-submission notification
- Quote delivery email
- Quote-expiring reminder email
- Admin payment-complete / policy-delivery notification
- Policy document delivery email
- Policy change-request notification to admins
- Policy change-request confirmation to the submitting user

## Other Relevant Side Effects

- `updateuseraccessonquotechange`
  - Keeps insured access metadata in sync when quote agent/agency ownership changes.
- `updateuseraccessonpolicychange`
  - Does the same once the quote becomes a policy.
- `checkquoteexpiration`
  - Intended to expire old quotes and send reminder emails one day before expiration.

## Current Implementation Notes and Caveats

These are useful to know when reading or changing the flow:

- Quote creation is client-written, not server-created.
  - Validation is split across the client, rating callables, and bind-time checks.
- The main bind flow uses ePay, not Stripe.
- The receivable/Stripe pipeline expects billing-entity IDs to be Stripe customer IDs.
  - The experimental Stripe bind flow sets that up.
  - The main bind flow currently writes `billingEntities.namedInsured`, which does not match that expectation.
- `checkquoteexpiration` appears to query `quoteExpiration`, while quote docs are written with `quoteExpirationDate`.
  - The reminder/expiration job likely needs verification before being relied on.
- `importQuotes` stages quote rows correctly, but the import summary currently writes `targetCollection = policies`.
  - That looks like a typo and is worth checking if quote-import review behaves oddly.
