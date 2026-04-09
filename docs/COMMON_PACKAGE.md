# @idemand/common

Shared TypeScript types, Zod schemas, Firestore collection helpers, and enums used across `api/`, `functions/`, and `client/`.

---

## Overview

`common/` is a pnpm workspace package (`@idemand/common`) that compiles to `common/dist/` and is consumed by sibling packages as a local dependency:

```json
// functions/package.json, api/package.json, client/package.json
"@idemand/common": "workspace:*"
```

Any package that imports from `@idemand/common` must build `common` first. The CI workflows handle this with:

```bash
pnpm --filter @idemand/common build
```

---

## Building

`common/` is a local workspace package published inside the monorepo as `@idemand/common`. It compiles to `common/dist/` and is consumed by sibling packages via `workspace:*` dependencies:

```json
"@idemand/common": "workspace:*"
```

TurboRepo is responsible for building common/ before dependent packages such as api/ and functions. In CI and local development, prefer running root Turbo commands over manual pnpm --filter build sequencing.

```bash
# From repo root
pnpm --filter @idemand/common build

# Or from common/
cd common
pnpm build
```

`common/` builds with tsc using common/tsconfig.json and writes output to `common/dist/`.

For local development, `common/` also exposes a watch task:

```bash
pnpm dev
# or
pnpm turbo run dev --filter=@idemand/common
```

---

## Structure

```
common/src/
├── index.ts          # Re-exports everything
├── enums.ts          # All Zod enums (State, Product, FloodZone, etc.)
├── collections.ts    # Firestore collection refs with typed converters
└── types/
    ├── common.ts     # Shared primitives (Address, Limits, ValueByRiskType, etc.)
    ├── location.ts   # ILocation, BaseLocation, PolicyLocation variants
    ├── policy.ts     # Policy, PolicyLocation, BillingEntity, NamedInsured
    ├── quote.ts      # Quote, QuoteStatus
    ├── submission.ts # Submission, FloodFormValues
    ├── ratingData.ts # RatingData, PremiumCalcData, SecondaryFactorMults
    ├── swissReRes.ts # Swiss Re API types (GetAALRequest, SRRes, SRPerilAAL)
    ├── taxes.ts      # Tax, TaxItem, TaxCalc, TaxTransaction types
    ├── fees.ts       # FeeItem
    ├── organization.ts # Organization, BillingType
    ├── user.ts       # User, UserAccess
    ├── license.ts    # License
    ├── moratorium.ts # Moratorium
    └── invite.ts     # Invite, InviteClass
```

---

## Key Exports

### Enums (`enums.ts`)

All enums are Zod enums, which means they provide both runtime validation and TypeScript types:

```typescript
import { State, FloodZone, Product, TransactionType } from '@idemand/common';

State.options; // ['AL', 'AK', ...] — full array of values
State.enum.FL; // 'FL' — type-safe access
State.parse('TX'); // validates and returns 'TX' or throws
```

Key enums:

| Enum              | Values                                                                                       |
| ----------------- | -------------------------------------------------------------------------------------------- |
| `State`           | All 50 US state abbreviations + DC                                                           |
| `FloodZone`       | `A`, `AE`, `AO`, `AH`, `AR`, `B`, `C`, `D`, `V`, `VE`, `X`                                   |
| `Product`         | `flood`, `wind`                                                                              |
| `TransactionType` | `new`, `renewal`, `endorsement`, `amendment`, `cancellation`, `flat_cancel`, `reinstatement` |
| `Basement`        | `no`, `finished`, `unfinished`, `unknown`                                                    |
| `PriorLossCount`  | `0`, `1`, `2`, `3`                                                                           |
| `CommSource`      | `agent`, `org`, `default`                                                                    |
| `PaymentStatus`   | `paid`, `processing`, `awaiting_payment`, `cancelled`, `error`, `declined`, `payment_failed` |
| `CancelReason`    | `sold`, `premium_pmt_failure`, `exposure_change`, `insured_choice`                           |
| `Collection`      | All Firestore collection names as an enum                                                    |

### Collection Helpers (`collections.ts`)

Typed Firestore collection references. Each function takes a Firestore instance and returns a `CollectionReference<T>`:

```typescript
import {
  policiesCollection,
  locationsCollection,
  taxesCollection,
} from '@idemand/common';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();
const policiesCol = policiesCollection(db); // CollectionReference<Policy>
const locationsCol = locationsCollection(db); // CollectionReference<ILocation>
```

All available collection helpers:

```typescript
taxesCollection(db);
moratoriumsCollection(db);
usersCollection(db);
orgsCollection(db);
submissionsCollection(db);
quotesCollection(db);
policiesCollection(db);
locationsCollection(db);
ratingDataCollection(db);
taxCalcCollection(db);
taxTransactionsCollection(db);
licensesCollection(db);
swissReResCollection(db);
activeStates(db);

// Sub-collections
versionsCollection(db, parentCollection, parentId);
invitesCollection(db, orgId);
getUserAccessRef(db, userId);
```

### Types

**`Address`** — Standard US mailing address with optional `countyFIPS` and `countyName`.

**`CompressedAddress`** — Abbreviated keys (`s1`, `s2`, `c`, `st`, `p`) used in `PolicyLocation` to reduce Firestore document size.

**`Limits`** — `{ limitA, limitB, limitC, limitD }` with built-in Zod validation (limitA 100k–1M, B+C+D sum ≤ 1M).

**`ValueByRiskType`** — `{ inland: number, surge: number, tsunami: number }` — used for AALs, state multipliers, risk scores, and PM values.

**`RatingPropertyData`** — All property characteristics used in premium calculation: flood zone, basement, replacement cost, stories, year built, square footage, prior loss count, FFH, CBRS designation, and distance to coast.

**`ILocation`** — The full location document stored in Firestore. Has discriminated sub-types based on `parentType`:

- `ILocationSubmission` — linked to a submission
- `ILocationQuote` — linked to a quote
- `ILocationPolicy` — linked to a policy

**`Policy`** — The policy document. Contains a summary `locations` record (keyed by location ID) using `PolicyLocation`, which is a compressed version with only the fields needed for policy-level calculations.

**`RatingData`** — Snapshot of all rating inputs and outputs for a location at the time of binding or endorsement. Includes `premiumCalcData`, `AALs`, `PM`, `riskScore`, `stateMultipliers`, and `secondaryFactorMults`.

**`PremiumCalcData`** — The full actuarial breakdown: tech premium by peril, flood category premiums, provisional premium, subproducer adjustment, annual premium, and MGA commission.

### Utility Types

```typescript
// Make all properties of T nullable
type Nullable<T> = { [K in keyof T]: T[K] | null };

// Add an `id` string field
type WithId<T> = T & { id: string };

// Make specific keys required
type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

// Deep partial
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};
```

---

## Firestore Timestamp & GeoPoint

`common` re-exports Zod schemas for Firebase types that are normally hard to use with Zod:

```typescript
// Zod instance validator for firebase-admin Timestamp
const Timestamp = z.instanceof(FirestoreTimestamp);

// Zod instance validator for firebase-admin GeoPoint
const GeoPoint = z.instanceof(FirestoreGeoPoint);
```

These are used throughout all document schemas so that Zod validation works correctly with Firestore native types.

---

## Adding or Changing Types

1. Edit the relevant file in `common/src/types/` or `common/src/enums.ts`.
2. Export from `common/src/index.ts` if it is a new export.
3. Rebuild with `pnpm turbo run build --filter=@idemand/common`, or run `pnpm dev` from the repo root if you want TurboRepo to keep `common/` and its dependents in watch mode.
4. Run `pnpm typecheck` from the repo root to verify downstream packages still compile.

If the change is a breaking type change, check all consumers before deploying:

- `functions/src/`
- `api/src/`
- `client/src/`

---

## Publishing

The package is currently consumed only as a workspace dependency and does not need to be published to npm for internal use. The `pub:do:not:use:for:reference` script in `common/package.json` shows the historical publish flow — this is no longer the right approach now that the repo is a monorepo.

If you ever need to publish (e.g. for an external consumer):

```bash
cd common
pnpm build
npm publish
```
