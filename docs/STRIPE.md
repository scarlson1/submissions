# Stripe Integration

This document describes how Stripe is wired into this repository today, what is already production-facing, what is still experimental, and what still needs to change before Stripe can fully replace the current ePay-based bind flow.

## Executive Summary

Stripe is already used for:

- Stripe Connect account creation and onboarding for agencies
- Stripe customer creation and reuse for billing entities
- Receivable creation after policy creation
- Stripe invoice generation and delivery for receivables
- Customer-facing receivable checkout with Stripe Elements
- Webhook-driven post-payment processing for invoices, transfers, and refunds

Stripe is not yet the primary processor for the main quote bind flow.

- The production bind route is still `/quotes/:quoteId/bind`
- That route still uses ePay for payment tokenization and payment execution
- The Stripe-oriented bind flow currently lives under admin test routes such as `/admin/stripe-test/quote/bind/:quoteId`

## Core Pieces

The Stripe integration spans these main areas:

- Client app:
  - `client/src/elements/forms/StripeBindQuote/*`
  - `client/src/elements/forms/StripeReceivableCheckout/*`
  - `client/src/elements/settings/OrgStripeConnectOnboarding.tsx`
  - `client/src/hooks/useStripeConnectInstance.ts`
  - `client/src/views/ReceivableCheckout.tsx`
  - `client/src/router.tsx`
- Functions:
  - `functions/src/routes/stripe.ts`
  - `functions/src/firestoreEvents/createStripeAccount.ts`
  - `functions/src/firestoreEvents/createReceivableOnPolicyCreated.ts`
  - `functions/src/callables/addBillingEntity.ts`
  - `functions/src/callables/fetchPaymentIntentSecret.ts`
  - `functions/src/modules/payments/*`
  - `functions/src/pubsub/stripe/*`

Important records involved:

- `organizations`
  - stores `stripeAccountId`
- `quotes`
  - can store Stripe-backed `billingEntities`
  - can store `namedInsured.stripeCustomerId`
  - can store `defaultBillingEntityId`
- `policies`
  - source record that triggers receivable creation
- `receivables`
  - internal billing record tied to Stripe invoice/payment state
- `transfers`
  - mirrored Stripe transfer and reversal records
- `taxTransactions`
  - created or reversed based on Stripe payment/refund events
- `transactions`
  - insurance premium ledger created from `policy.created`; not a Stripe ledger

## Current Architecture

### 1. Agency Stripe Connect

There are two ways an org gets a Stripe Connect account:

- Automatically on organization creation via the Firestore trigger `createstripeaccount`
- Manually through `GET /stripe/account/initialize/:orgId`

The helper `createStripeConnectAccount(...)` creates a custom US account with:

- `card_payments`
- `us_bank_account_ach_payments`
- `link_payments`
- `transfers`

It also writes the resulting `stripeAccountId` back to the org document.

Agency onboarding and account management are exposed through:

- `GET /stripe/account/:orgId`
- `POST /stripe/accountLink`
- `GET /stripe/accountLink/:accountId`
- `POST /stripe/accountSession`

The current UI uses both:

- Hosted account links for onboarding and updates
- Embedded Connect components for payments and payouts views

Relevant client routes:

- `/account/org` renders `CurrentUserOrgStripeConnectOnboarding`
- `/admin/stripe-test/data/*` renders Connect embedded views

### 2. Stripe Customer / Billing Entity Setup

Stripe customer records are created or reused through the callable `addbillingentity`:

- validates the caller can act on the target quote or policy
- looks up an active Stripe customer by email
- creates a Stripe customer if none exists
- writes the billing entity back under `billingEntities.{stripeCustomerId}`

This is an important design choice:

- receivables expect billing-entity IDs to be Stripe customer IDs
- the experimental Stripe bind flow follows that model
- the main bind flow still has ePay-oriented assumptions in parts of the app

### 3. Policy Creation -> Receivables -> Stripe Invoice

Policy creation still starts from `createpolicy`.

`createpolicy`:

- validates the quote
- converts quote data into policy and location documents
- updates the quote to `bound`
- publishes `policy.created`

A separate Firestore trigger, `createreceivableonpolicycreated`, then:

- loads the policy
- determines the billing entities
- ensures an agency Stripe Connect account exists (TODO: move to prior to createPolicy ??)
- builds one receivable per billing entity
- saves those receivables
- creates and sends a Stripe invoice for each receivable

Receivable objects include:

- `stripeCustomerId`
- billing entity details
- line items
- taxes
- fees
- transfer instructions
- due date
- total/refundable amount fields

Invoice generation is handled by `generateInvoiceForReceivable(...)`, which:

- creates a Stripe invoice with `collection_method: 'send_invoice'`
- adds invoice items for premium, fees, and taxes
- stores `invoiceId` on the receivable
- sends the invoice after creation

When Stripe later finalizes the invoice, the webhook path updates the receivable with:

- `paymentIntentId`
- `hostedInvoiceUrl`
- `invoicePdfUrl`
- `invoiceNumber`

### 4. Receivable Checkout

Receivable checkout is already a user-facing route:

- `/receivables/:receivableId`

That flow works like this:

1. The page loads the receivable from Firestore.
2. The client requires `paymentIntentId` on the receivable.
3. The client calls the callable `fetchpaymentintentsecret`.
4. The page mounts Stripe Elements using `VITE_STRIPE_PUBLISHABLE_KEY`.
5. `CheckoutForm` confirms payment with Stripe.

This route is the strongest existing production-facing Stripe payment surface in the app.

## Stripe Bind Flow

There are currently two bind stories in the repo.

### Main Bind Flow Today

Route:

- `/quotes/:quoteId/bind`

Status:

- this is the main implementation in use
- it still uses ePay, not Stripe, for payment execution

High level steps:

1. Quote wizard updates quote data directly in Firestore.
2. User payment details are tokenized with ePay.
3. `createpolicy` creates the policy.
4. `executepayment` charges through ePay.
5. Stripe then participates later through receivables/invoicing, not as the bind-time processor.

### Experimental Stripe Bind Flow

Route:

- `/admin/stripe-test/quote/bind/:quoteId`

This flow is much closer to the eventual Stripe-native model.

Step-by-step:

1. `NamedInsuredStep` collects name, email, and phone.
2. The client calls `setquoteuserid` to map the named insured email back to an existing user when possible.
3. The client calls `addbillingentity` to create or reuse a Stripe customer.
4. The quote is updated with:
   - `namedInsured.stripeCustomerId`
   - `defaultBillingEntityId`
   - other named insured details
5. Additional wizard steps capture effective date and billing assignments (supports multiple locations and billing entities).
6. The final review step calls `createpolicy`.
7. Policy creation triggers receivable creation and Stripe invoice generation (detailed above).
8. The success screen surfaces receivables and links the user to payment screens.

What this flow solves:

- it creates Stripe customers before the policy is bound
- it aligns `billingEntities` with Stripe customer IDs
- it is closer to the data model that receivables and transfers already expect

## Agency Onboarding / Stripe Connect

### Server-side capabilities

`functions/src/routes/stripe.ts` exposes these Connect endpoints:

- `POST /stripe/accountSession`
  - creates embedded component sessions
- `POST /stripe/accountLink`
  - creates hosted onboarding or update links
- `GET /stripe/accountLink/:accountId`
  - refreshes expired account links
- `GET /stripe/account/:orgId`
  - retrieves Stripe account details
- `GET /stripe/account/initialize/:orgId`
  - manually creates a missing Stripe account

### Client-side surfaces

- `OrgStripeConnectOnboarding.tsx`
  - fetches account details
  - shows status and capabilities
  - opens hosted onboarding/update links
- `useStripeConnectInstance.ts`
  - initializes embedded Connect sessions using `VITE_STRIPE_PUBLISHABLE_KEY`
- `StripeConnectViewsLayout.tsx`
  - renders embedded payments and payouts views for test/admin routes

### Operational intent

The Connect account is used as the transfer destination for commission-like downstream payment splits stored on receivables.

That means Stripe Connect readiness is not optional if Stripe becomes the primary bind-time processor.

## Stripe Webhook

Hosting rewrites `/stripe` to the `stripe` HTTP function in `firebase.json`.

The webhook endpoint is:

- `POST /stripe/webhook`

Current webhook responsibilities:

- `payment_intent.created`
  - updates receivable `transferGroup` bookkeeping
- `charge.succeeded`
  - publishes a Pub/Sub message for downstream tax and transfer handlers
- `refund.created`
  - publishes a Pub/Sub message for downstream reversal handlers
- `invoice.finalized`
  - updates receivable invoice/payment intent fields
- `transfer.created`
  - mirrors the transfer into Firestore
- `transfer.updated`
  - mirrors the transfer into Firestore
- `transfer.reversed`
  - mirrors the reversal into Firestore

Webhook events that are acknowledged but not fully implemented yet include:

- `payment_intent.processing`
- `payment_intent.payment_failed`
- `payment_intent.succeeded`
- `invoice.paid`
- `invoice.payment_failed`
- several `customer.*`, `account.*`, `payout.*`, and `person.*` events

Current limitation:

- the webhook signing secret is hardcoded inside `functions/src/routes/stripe.ts`
- it is not yet parameterized through Firebase secrets or environment config

## Transactions And Event Handlers

There are two different post-bind financial/event pipelines to understand.

### 1. Insurance Transactions

These are not Stripe records.

They are created by `policycreatedlistener` when `createpolicy` publishes `policy.created`.

That listener:

- loads the policy and locations
- loads rating data
- creates one premium transaction per location in the `transactions` collection

This means:

- `transactions` is the insurance/premium ledger
- Stripe is not the source of truth for those records

### 2. Stripe Payment Event Pipeline

When Stripe confirms payment activity, the app uses webhook -> Pub/Sub -> handler fan-out.

#### `charge.succeeded`

Webhook action:

- publishes `PAYMENT_PUB_SUB_TOPICS.CHARGE_SUCCEEDED`

Subscribers:

- `createtaxtransactions`
  - finds the receivable related to the charge
  - creates tax transactions from the stored tax calculation references
- `createtransfers`
  - finds the receivable related to the charge
  - creates Stripe transfers to connected accounts using `source_transaction`

#### `refund.created`

Webhook action:

- publishes `PAYMENT_PUB_SUB_TOPICS.REFUND_CREATED`

Subscribers:

- `reversetaxtransactions`
  - creates tax reversal transactions
- `reversetransfers`
  - creates Stripe transfer reversals for prior transfers

#### `transfer.*`

Webhook action:

- calls `syncTransfer(...)`

Effect:

- mirrors transfer and reversal data into the Firestore `transfers` collection

### Receivable State Changes

Receivable updates currently come from:

- Firestore policy-created trigger
- invoice finalization webhook
- payment-intent-created webhook bookkeeping

There is not yet a completed `markPaidOnChargeSucceeded` path to mark receivables or policies as paid from Stripe charge events.

## Other Related Stripe Processes

### Invoice Download

Authenticated users can stream invoice PDFs from:

- `GET /stripe/invoice/:invoiceId/download`

This is used by the receivable UI.

### Transfer Group Bookkeeping

The code attempts to keep a `transferGroup` on receivables when Stripe creates a payment intent from an invoice.

Important note:

- Stripe does not allow updating `transfer_group` on invoice-generated payment intents in the way the team originally wanted
- current transfer creation therefore uses `source_transaction` on the successful charge instead

### Billing Entity Model Alignment

A recurring theme in this codebase is that the receivables/Stripe path expects:

- billing entity key = Stripe customer ID

The experimental Stripe bind flow follows that rule.

The legacy bind flow does not fully enforce it yet.

This is one of the main reasons the Stripe migration is not finished.

## Current Gaps And Risks

These are the main implementation gaps visible in the current code.

- The main bind route still uses ePay instead of Stripe.
- The Stripe bind experience is still under admin test routes.
<!-- - `invoice.paid` is not implemented, which matters for out-of-band or invoice-native payment scenarios. -->
- `createTransfersOnChargeSucceeded.ts` notes missing idempotency and does not persist transfer IDs back onto receivable transfer entries.
- verify partial payments and/or accounts that don't match firebase records are handled properly (transfers). Currently using (transferAmount / receivable.totalAmount) \* charge.amount_captured
- `reverseTransfersOnRefund.ts` also calls out missing idempotency and incomplete refund allocation logic (refunded tax amount needs to be added to stripe metadata ??).
- Embedded Connect components are still treated as beta/test surfaces and the code comments call out missing CSP/header work.
- Connected account health:
  - stripe connected account status
  - verify before issuing quote ??
- Stipe customer - ensure user has stripe customer account prior to binding quote
- add documentation about how tax/fee data is stored in stripe invoice/charge
- Receivables update from stripe events (paid, refunded, etc.)
- handle paidOutOfBand

## Steps To Finish A Production-Ready Switch To Stripe

### 1. Make Stripe the canonical bind-time payment path

- Replace ePay in `/quotes/:quoteId/bind`
- either migrate the existing bind wizard or promote the Stripe bind wizard out of `/admin/stripe-test`
- ensure the public bind flow always creates or reuses Stripe customers before policy creation

### 2. Standardize the billing entity model

- require billing entity IDs to be Stripe customer IDs everywhere
- backfill old quotes/policies that still use non-Stripe billing entity keys
- make `defaultBillingEntityId` always point to a Stripe customer ID

### 3. Harden webhook and payment state handling

- move the webhook signing secret into Firebase secret/config management
- implement `invoice.paid`
- implement payment failure handling
- complete paid-state updates for receivables and policies
- verify all relevant Stripe event types are subscribed in each environment

### 4. Fix correctness and idempotency gaps

- fix `getReceivablesQueryFromCharge(...)`
- fix `totalFeesAmount` calculation
- add idempotency safeguards for transfer creation and transfer reversal creation
- persist enough linkage on receivables and transfers to prevent duplicate downstream work

### 5. Finish Connect security and onboarding hardening

- require tenant/org authorization checks on `accountSession` and `accountLink`
- verify every agency that can receive transfers has a valid active `stripeAccountId`
- define failure/recovery UX for missing or incomplete Connect onboarding

### 6. Make checkout production-safe

- replace the localhost Stripe return URL with environment-aware hosted URLs
- test ACH, bank transfer, and card flows end to end
- verify receivable checkout works for unauthenticated/public users if that is an intended requirement
- reconcile public checkout with authenticated invoice PDF download behavior

### 7. Promote test/admin routes into supported user flows

- move Stripe bind and Connect management out of `/admin/stripe-test/*`
- define final production routes and permissions
- update docs, emails, and user-facing redirects to those routes

### 8. Add migration, monitoring, and operational tooling

- add a migration plan for existing quotes, policies, billing entities, and receivables
- add dashboards/alerts for webhook failures, failed transfers, and failed invoice finalization
- add replay/reconciliation tools for missed webhook events
- add end-to-end tests for policy bind -> receivable -> checkout -> transfer -> reversal paths

## Recommended Cutover Order

If the goal is to fully switch to Stripe with the least risk, the safest order is:

1. Fix the correctness and security gaps in the existing Stripe receivables/webhook pipeline.
2. Make Stripe customer IDs the required billing entity identifiers everywhere.
3. Replace the localhost/test-only pieces in receivable checkout and Connect management.
4. Promote the Stripe bind flow into a supported production route.
5. Remove ePay from the main bind path only after the Stripe bind path has full parity for card, ACH, invoice, transfer, refund, and paid-state handling.

## Bottom Line

The repo already contains most of the building blocks for a Stripe-first system:

- customer creation
- Connect onboarding
- receivables
- invoicing
- checkout
- transfer and refund fan-out

What is still missing is the final unification work:

- Stripe must become the main bind-time processor
- billing entity data must be normalized around Stripe customer IDs
- webhook/state transitions must be completed and hardened
- the remaining test-only and hardcoded configuration pieces must be removed
