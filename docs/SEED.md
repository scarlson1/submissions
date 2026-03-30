# iDemand Firestore Seed Script

Generates realistic fake Firestore data that satisfies all cross-collection
relationships: agencies → agents → policies → locations → transactions,
plus submissions, quotes, users, rating docs, taxes, and fees.

## Prerequisites

```bash
npm install
```

## Usage

### Against the local Firestore emulator

```bash
# Start the emulator first (from project root):
#   firebase emulators:start --only firestore --project demo-project

FIRESTORE_EMULATOR_HOST=localhost:8082 \
GCLOUD_PROJECT=demo-project \
node seed.js
```

### Against a real Firebase project

```bash
# Download a service-account key from Firebase Console > Project settings > Service accounts
GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json \
node seed.js
```

## Options

| Flag           | Default | Description                               |
| -------------- | ------- | ----------------------------------------- |
| `--count N`    | `3`     | Number of agencies to create              |
| `--policies N` | `2`     | Policies (and transactions) per agent     |
| `--dry-run`    | off     | Print counts without writing to Firestore |

```bash
# Larger dataset
FIRESTORE_EMULATOR_HOST=localhost:8082 GCLOUD_PROJECT=demo-project \
  node seed.js --count 10 --policies 5

# Preview only
node seed.js --dry-run --count 5 --policies 3
```

## What gets created

| Collection                       | Notes                                              |
| -------------------------------- | -------------------------------------------------- |
| `organizations`                  | iDemand org + N agencies, each with `tenantId`     |
| `users`                          | iDemand admin, org admins, agents, insured users   |
| `organizations/{id}/userClaims`  | `iDemandAdmin`, `orgAdmin`, `agent` claims         |
| `organizations/{id}/invitations` | Accepted invitations for each agent                |
| `submissions`                    | 1-3 per agent                                      |
| `quotes`                         | 1 per policy, with `ratingData` doc                |
| `policies`                       | With embedded `locations` map and billing entities |
| `locations`                      | Separate location doc linked to policy             |
| `ratingData`                     | AALs, premium calc breakdown, RCVs, limits         |
| `transactions`                   | `new` premium transaction per location             |

## Relationship map

```
organizations/{oid}
  └─ userClaims/{userId}
  └─ invitations/{email}

users/{userId}

submissions/{sid}
  → agent.userId → users/{aid}
  → agency.orgId → organizations/{oid}

ratingData/{rid}

quotes/{qid}
  → ratingDocId → ratingData/{rid}
  → agent.userId → users/{aid}

policies/{pid}
  → locations.{lid}.coords
  → agent.userId → users/{aid}
  → agency.orgId → organizations/{oid}
  → userId → users/{uid}

locations/{lid}
  → policyId → policies/{pid}
  → ratingDocId → ratingData/{rid}

transactions/{pid-lid-eid}
  → policyId → policies/{pid}
  → locationId → locations/{lid}
  → agent.userId → users/{aid}
```
