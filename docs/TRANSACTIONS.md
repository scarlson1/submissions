# Transactions Architecture & Flows

## Overview

The iDemand platform uses a double-entry-style transaction ledger to record all premium movements across the policy lifecycle. Every financial event — binding a new policy, endorsing coverage, cancelling a location, or reinstating a policy — produces one or more immutable transaction records in the `transactions` Firestore collection.

Transactions are never mutated after creation. Instead, offsetting transactions reverse the remaining value of a prior transaction, and a new transaction captures the replacement premium. This preserves a full audit trail and makes financial reporting straightforward.

---

## Transaction Types

### Interface Hierarchy

All transactions extend `BaseTransaction` and are discriminated by two fields:

- **`trxType`** — the business reason for the transaction
- **`trxInterfaceType`** — the structural shape (`premium`, `offset`, or `amendment`)

```
BaseTransaction
├── PremiumTransaction   (trxInterfaceType: "premium")
├── OffsetTransaction    (trxInterfaceType: "offset")
└── AmendmentTransaction (trxInterfaceType: "amendment")
```

### PremiumTransaction

Records a new premium obligation. Created for:

| `trxType`       | Trigger                                         |
| --------------- | ----------------------------------------------- |
| `new`           | Policy first bound                              |
| `renewal`       | Policy renews for another term                  |
| `endorsement`   | Coverage change mid-term (limits, deductible)   |
| `reinstatement` | Previously cancelled policy/location reinstated |

Key fields beyond `BaseTransaction`:

- `ratingPropertyData` — property characteristics used in rating
- `deductible`, `limits`, `TIV`, `RCVs` — coverage structure
- `premiumCalcData` — full actuarial breakdown (tech premium, state multipliers, secondary factors, MGA commission, etc.)
- `locationAnnualPremium`, `termPremium`, `termProratedPct`, `dailyPremium`
- `MGACommission`, `MGACommissionPct`, `netDWP`
- `surplusLinesTax`, `surplusLinesRegulatoryFee`, `MGAFee`, `inspectionFee`
- `billingEntityId`, `billingEntity`, `billingEntityTotals`

### OffsetTransaction

Reverses the remaining (unearned) portion of a prior `PremiumTransaction`. Created for:

| `trxType`      | Trigger                                                              |
| -------------- | -------------------------------------------------------------------- |
| `cancellation` | Location or policy cancelled mid-term                                |
| `flat_cancel`  | Policy cancelled from inception                                      |
| `endorsement`  | Offsets the old premium before recording the new endorsement premium |

Key fields:

- `previousPremiumTrxId` — links back to the transaction being reversed
- `termPremium` — **negative** value representing the credit/refund
- `cancelReason` — one of `sold`, `premium_pmt_failure`, `exposure_change`, `insured_choice`

### AmendmentTransaction

Records non-premium changes (additional insureds, mortgagees, named insured details, mailing address). Carries no premium value.

| `trxType`   | Trigger                                    |
| ----------- | ------------------------------------------ |
| `amendment` | Policy-level or location-level data change |

---

## Transaction ID Construction

Transactions use a deterministic ID to guarantee idempotency:

```
{policyId}-{locationId}-{eventId}
```

- `policyId` — Firestore policy document ID
- `locationId` — Firestore location document ID
- `eventId` — Cloud Function event ID (unique per pub/sub message delivery)

Before writing, every listener calls `docExists(trxRef)` and skips creation if the document already exists. This ensures at-most-once semantics even if a pub/sub message is redelivered.

Offset transactions append `-offset` to the base ID:

```
{policyId}-{locationId}-{eventId}-offset
```

---

## Transaction Creation Flows

### 1. New Policy

**Trigger:** `policy.created` pub/sub topic, published by `createPolicy` callable after the Firestore batch commit.

**Listener:** `policyCreatedListener`

**Steps:**

1. Extract `policyId` from pub/sub payload.
2. Fetch the policy document.
3. Fetch all location documents (via `getAllById`).
4. For each location, construct a deterministic `trxId` and check for existence.
5. Fetch the rating document (`ratingDocId` from location).
6. Call `formatPremiumTrx('new', policy, location, ratingData, location.effectiveDate, eventId)`.
7. Write all transactions in a Firestore batch (batches of ≤250 locations).

**Also triggers:** `publishGetPolicyImages` to generate static map images.

---

### 2. Policy Renewal

**Trigger:** `policy.renewal` pub/sub topic.

**Listener:** `policyRenewalListener`

**Steps:**

1. Fetch policy and all non-cancelled location documents.
2. For each location, construct `trxId` and check existence.
3. Fetch rating document.
4. Call `formatPremiumTrx('renewal', policy, location, ratingData, location.effectiveDate, eventId)`.
5. Write transaction.

---

### 3. Premium Endorsement (Coverage Change)

**Trigger:** `location.endorsement` pub/sub topic, published when a change request is approved and the `trxType` is `endorsement`.

**Listener:** `endorsementListener`

**Steps:**

1. Fetch policy, location, and the most recent `PremiumTransaction` for the location (types: `new`, `renewal`, `reinstatement`, `endorsement`).
2. Compute the offset transaction using `getOffsetTrx(policy, prevTrx, trxEffDate, eventId, 'endorsement')`.
3. Fetch the updated rating document (location has a new `ratingDocId` after endorsement rating calculation).
4. Call `formatPremiumTrx('endorsement', policy, location, ratingData, trxEffDate, eventId)`.
5. Write both transactions in a single batch:
   - `{trxId}-offset` — reverses the remaining premium
   - `{trxId}` — records the new premium

---

### 4. Location Cancellation

**Trigger:** `location.cancellation` pub/sub topic, published on change request approval.

**Listener:** `locationCancelListener`

**Steps:**

1. Fetch policy and the most recent premium transaction for the location.
2. Compute `getOffsetTrx(policy, prevTrx, cancelEffDate, eventId, 'cancellation', cancelReason)`.
3. Write the offset transaction. The negative `termPremium` represents the refund of unearned premium.

**Cancel Reason Values:** `sold` | `premium_pmt_failure` | `exposure_change` | `insured_choice`

---

### 5. Amendment (Non-Premium Change)

**Trigger:** `policy.amendment` pub/sub topic.

**Listener:** `amendmentListener`

**Steps:**

1. If `locationId` is provided, fetch the location and call `getLocationAmendmentTrx`.
2. Otherwise, call `getPolicyAmendmentTrx` for a policy-level amendment.
3. Write a single `AmendmentTransaction`. No premium values are set.

---

### 6. Reinstatement

**Trigger:** `policy.reinstatement` pub/sub topic.

**Listener:** `reinstatementListener`

**Steps:**

1. Fetch policy and all location IDs.
2. For each location, fetch the location document and the most recent offset transaction of type `cancellation` or `flat_cancel`.
3. Call `getReinstatementTrx(policy, location, prevOffsetTrx, trxEffDate, eventId)`.
4. Write `PremiumTransaction` with `trxType: 'reinstatement'`.

The reinstatement premium is computed from the prior offset transaction's `dailyPremium × remaining days`, avoiding a fresh Swiss Re API call.

---

## Premium Calculation

### Rating Flow

Premium is calculated in two phases:

**Phase 1 — Average Annual Loss (AAL) from Swiss Re**

`getAALs()` calls the Swiss Re RNG API with:

- Property coordinates, replacement cost, limits, deductible, number of stories
- Returns AAL values broken into three peril categories: `inland`, `surge`, `tsunami`

**Phase 2 — Premium from AALs**

`getPremium()` in `modules/rating/getPremium.ts`:

1. Compute Pure Premium (PM) = `(AAL × 1000) / TIV` for each peril
2. Look up risk score from PM arrays (`inlandPMRiskArray`, `surgePMRiskArray`, `tsunamiPMRiskArray`)
3. Apply secondary modifiers:
   - **FFE factor** (first-floor height difference) — from `firstFloorDiff` table
   - **Basement factor** — `no (0.86)`, `unfinished (1.03)`, `finished (1.29)`, `unknown (1.29)`
   - **Loss history multiplier** — based on prior loss count and risk score
4. Apply state multipliers (`multipliersByState`) for each peril
5. Compute tech premium: `AAL × secModMult × (1 + LAE)`
   - Inland LAE: 10%, Surge/Tsunami LAE: 15%
6. Compute gross premium: `techPremium × stateMult × (1 / (1 - distributionExpense))`
   - Distribution expense: 37.35%
7. Apply minimum premium (`getMinPremium`), floor by flood zone and TIV
8. Apply subproducer commission adjustment to arrive at `annualPremium`
9. Compute `MGACommission = annualPremium × totalCommRate`

### Term Premium

```typescript
termDays = differenceInCalendarDays(expirationDate, effectiveDate);
yearDays = differenceInCalendarDays(
  expirationDate,
  add(expirationDate, { years: -1 }),
);
termPremium = round((termDays / yearDays) * annualPremium, 2);
```

### Offset (Refund) Calculation

```typescript
startDate = max(requestedEffDate, originalTrxEffDate)
earnedDays = differenceInCalendarDays(startDate, originalTrxEffDate)
earnedPremium = earnedDays × dailyPremium
offsetTermPremium = -(originalTermPremium - earnedPremium)   // negative
```

---

## Booking Date

The booking date determines when a transaction is recognized for accounting purposes. It is the **latest** of:

1. The transaction effective date
2. The location effective date
3. The current timestamp (when the transaction is created)

```typescript
bookingDate = max(trxEffDateMS, locationEffDateMS, trxTimestampMS);
```

---

## Commission Model

Subproducer commission is resolved via `getComm(commSource, orgId, agentId, product)` with the following priority:

1. `commSource === 'default'` → use `DEFAULT_COMMISSION_AS_INT` env var (default 15%)
2. `commSource === 'agent'` → fetch from agent's user document `defaultCommission[product]`
3. `commSource === 'org'` (or agent fetch fails) → fetch from org document `defaultCommission[product]`
4. Fallback → default commission

The commission table (`commRates.ts`) maps subproducer commission rates (5%–20%) to:

- `subprodAdjRate` — the adjustment applied to provisional premium
- `totalCommRate` — the MGA's blended commission rate used for `MGACommission`

---

## Change Request → Transaction Flow

Change requests follow this state machine before triggering transactions:

```
draft → submitted → under_review → accepted → [transactions published]
                                 → denied
                                 → cancelled
                                 → error
```

The `policyChangeRequest` Firestore event listener (`firestoreEvents/policyChangeRequest.ts`) drives this flow:

- **`submitted`** → sends admin + submitter notifications; updates status to `under_review`
- **`accepted`** → calls `publishChangeRequestTransactions(data, policyId)`

`publishChangeRequestTransactions` dispatches the appropriate pub/sub event based on `trxType` and `scope`:

| trxType        | scope      | Pub/Sub Topic                         | Listener                 |
| -------------- | ---------- | ------------------------------------- | ------------------------ |
| `endorsement`  | `location` | `location.endorsement`                | `endorsementListener`    |
| `amendment`    | `location` | `policy.amendment`                    | `amendmentListener`      |
| `cancellation` | `location` | `location.cancellation`               | `locationCancelListener` |
| `cancellation` | `policy`   | `location.cancellation` × N locations | `locationCancelListener` |

The newer `PolicyChangeRequest` schema stores changes under `endorsementChanges` and `amendmentChanges` (keyed by `locationId`) and iterates over each, emitting one pub/sub message per location per change type.

---

## Rating Recalculation Before Approval

Before a change request is submitted, the client calls one of several "calc" Cloud Functions to compute new rating values and store them on the change request document:

| Callable                  | Use Case                                                                                  |
| ------------------------- | ----------------------------------------------------------------------------------------- |
| `calcLocationChanges`     | Endorsements and amendments — fetches new AALs from Swiss Re if limits/deductible changed |
| `calcCancelChange`        | Single-location cancellation — recalculates term premium to cancel date                   |
| `calcPolicyCancelChanges` | All-location policy cancellation                                                          |
| `calcAddLocation`         | Adding a new location — full rating + policy recalculation                                |
| `calcPolicyChanges`       | Legacy endorsement calculation path                                                       |

These functions store `locationChanges` and `policyChanges` on the change request. The approval callable (`approveChangeRequest`) calls `mergePolicyLocationChanges`, which runs a Firestore transaction to apply all changes atomically.

---

## Taxes and Fees on Transactions

Each premium transaction carries pre-calculated tax and fee values derived from the policy:

```typescript
surplusLinesTax        = sum of taxes with displayName "Premium Tax"
surplusLinesRegulatoryFee = sum of taxes with displayName "Regulatory Fee"
MGAFee                 = sum of fees with displayName "MGA Fee"
inspectionFee          = sum of fees with displayName "Inspection Fee"
```

These values come from `getTrxTaxesAndFees(policy)` and are snapshotted at transaction creation time. They do **not** automatically update if taxes change later.

Tax transactions (for Stripe-based payments) are stored separately in a `taxTransactions` collection and are created/reversed through their own pub/sub flows (`createTaxTransactionsOnChargeSucceeded`, `reverseTaxTransactionsOnRefund`).

---

## Versioning

All transaction documents are versioned via the `versionTransaction` Firestore event (`firestoreEvents/versions/versionTransaction.ts`). Whenever a monitored field changes (e.g., `termPremium`, `limits`, `billingEntity`), the previous version is archived to a `versions` subcollection and `metadata.version` is incremented.

---

## Key Source Files

| File                                                       | Purpose                                                                                                                     |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `modules/transactions/utils.ts`                            | Core helpers: `constructTrxId`, `getBookingDate`, `getDailyPremium`, `calcTerm`, `getOffsetTermPremium`, `fetchPreviousTrx` |
| `modules/transactions/formatPremiumTrx.ts`                 | Assembles a `PremiumTransaction` from policy, location, and rating data                                                     |
| `modules/transactions/getOffsetTrx.ts`                     | Assembles an `OffsetTransaction` from the prior transaction                                                                 |
| `modules/transactions/getReinstatementTrx.ts`              | Assembles a `PremiumTransaction` for reinstatements                                                                         |
| `modules/transactions/getLocationAmendmentTrx.ts`          | Assembles an `AmendmentTransaction` for location changes                                                                    |
| `modules/transactions/getPolicyAmendmentTrx.ts`            | Assembles an `AmendmentTransaction` for policy-level changes                                                                |
| `modules/transactions/publishChangeRequestTransactions.ts` | Routes approved change requests to the correct pub/sub topic                                                                |
| `modules/rating/getPremium.ts`                             | Full premium calculation orchestrator                                                                                       |
| `modules/rating/calcPremium.ts`                            | Tech premium and gross premium formulas                                                                                     |
| `modules/rating/factors.ts`                                | Secondary modifiers (FFE, basement, loss history)                                                                           |
| `modules/rating/getAALs.ts`                                | Swiss Re API integration                                                                                                    |
| `modules/rating/riskScore.ts`                              | PM-to-risk-score lookup arrays                                                                                              |
| `modules/rating/multipliersByState.ts`                     | State-level peril multipliers                                                                                               |
| `pubsub/policyCreatedListener.ts`                          | New policy transaction creation                                                                                             |
| `pubsub/policyRenewalListener.ts`                          | Renewal transaction creation                                                                                                |
| `pubsub/endorsementListener.ts`                            | Endorsement offset + new premium transactions                                                                               |
| `pubsub/locationCancelListener.ts`                         | Cancellation offset transaction                                                                                             |
| `pubsub/amendmentListener.ts`                              | Amendment transaction creation                                                                                              |
| `pubsub/reinstatementListener.ts`                          | Reinstatement transaction creation                                                                                          |
| `firestoreEvents/policyChangeRequest.ts`                   | Change request state machine                                                                                                |
| `common/types.ts`                                          | `PremiumTransaction`, `OffsetTransaction`, `AmendmentTransaction`, `BaseTransaction` type definitions                       |
