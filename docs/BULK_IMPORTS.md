# Bulk Imports

This document covers the current bulk import flows for quotes, policies, and transactions.

TODO: add `ratePortfolio`

## Shared Workflow

All three import paths follow the same high-level pattern:

1. Upload a CSV into the expected Cloud Storage folder.
2. A Storage trigger parses, transforms, and validates the rows.
3. Valid rows are staged under `dataImports/{importId}/stagedDocs`.
4. A summary record is written to `dataImports/{importId}` with:
   - `targetCollection`
   - `importDocIds`
   - `docCreationErrors`
   - `invalidRows`
   - `metadata.created`
5. An admin reviews the staged records in `/admin/config/imports/:importId`.
6. The admin either:
   - approves rows, which calls `approveimport`
   - declines rows, which sets `importMeta.status = 'declined'`

Common implementation details:

- Storage handlers ignore files that are not CSVs, files outside the expected folder, files already marked `processed`, and events older than roughly one minute.
- Staged rows use `importMeta.status` to track review state. The main values used today are `new`, `declined`, and `imported`.
- Approval currently requires fewer than 500 staged records in a single `approveimport` call.
- If parsing fails before staging completes, the handler returns early and the import never reaches the review screen.

![upload transactions](/docs/import-upload.png)

![approve import](/docs/import-records.png)

## Quote Imports

Code path:

- Storage trigger: `functions/src/storageEvents/index.ts` -> `importquotes`
- Handler: `functions/src/storageEvents/importQuotes.ts`
- Upload folder: `importQuotes`

### Processing Steps

1. The CSV is downloaded from Storage to a temp file.
2. Headers are converted to camelCase.
3. Each row is transformed with `transformQuoteRow`.
4. Each transformed row is validated with `validateQuoteRow`.
5. For every valid row, the importer:
   - creates a `ratingData` document immediately
   - fetches taxes
   - calculates `quoteTotal`
   - calculates `cardFee`
   - stages the quote in `dataImports/{eventId}/stagedDocs`
6. After all rows are processed, the handler writes the import summary and sends an admin notification email.

### What Gets Staged

Each staged quote includes the final quote-shaped data plus:

- `importMeta.status = 'new'`
- `importMeta.eventId = {eventId}`
- `importMeta.targetCollection = 'quotes'`

### Approval Behavior

When an admin approves a staged quote import:

1. `approveimport` loads the staged docs listed in the summary.
2. Every staged doc still in `new` status is written into `quotes/{stagedDocId}`.
3. The staged row is updated to `importMeta.status = 'imported'` with reviewer info.

### Important Notes

- Quote documents are not created until approval.
- Rating documents are created before approval. If a staged quote is declined, its rating document is not automatically cleaned up.
- The final `quotes` document ID is the staged document ID, not a CSV-provided quote ID.

## Policy Imports

Code path:

- Storage trigger: `functions/src/storageEvents/index.ts` -> `importpolicies`
- Handler: `functions/src/storageEvents/importPolicies.ts`
- Upload folder: `importPolicies`

### Processing Steps

1. The CSV is downloaded from Storage to a temp file.
2. Headers are converted to camelCase.
3. Each row is transformed with `transformPolicyRow`.
4. Each transformed row is validated with `validatePolicyRowZod`.
5. Valid rows are grouped by `policyId`.
6. The importer builds:
   - one staged policy record per policy
   - one real location record per imported location
   - one real rating record per imported location
7. For each policy group, the importer:
   - verifies the target policy does not already exist
   - verifies each target location does not already exist
   - writes location docs to `locations`
   - writes rating docs to `ratingData`
   - writes a staged policy doc to `dataImports/{eventId}/stagedDocs/{policyId}`
8. After processing, the handler writes the import summary and sends an admin notification email.

### What Gets Staged

Each staged policy includes the policy payload plus:

- `lcnIdMap`, which maps imported internal location IDs to the CSV `externalId`
- `importMeta.status = 'new'`
- `importMeta.eventId = {eventId}`
- `importMeta.targetCollection = 'policies'`

`lcnIdMap` is important because policy approval uses it to find matching staged transaction imports.

### Approval Behavior

When an admin approves a staged policy import:

1. `approveimport` loads the staged policy docs.
2. For every imported location in the policy, it looks up:
   - staged transaction imports with `externalId` matching that location's original external ID
   - existing transaction docs already written for that location
3. If a location has neither a matching staged transaction nor an existing transaction, approval fails.
4. Each staged policy still in `new` status is written into `policies/{policyId}`.
5. `lcnIdMap` is stripped before the policy is written into the final collection.
6. Matching staged transaction imports are also written into `transactions`.
7. The policy and matched transaction staged rows are marked `imported` with reviewer info.

### Important Notes

- Policy documents are not created until approval.
- Location documents are created before approval.
- Rating documents are created before approval.
- Because locations and ratings are written during staging, declining a policy import does not automatically remove them.
- Policy approval depends on transaction linkage. The import is not just 'write policies'; it also validates that each imported location can be tied to transaction data.
- Policy IDs are preserved from the CSV because the staged policy doc ID is set to `policyId`.

## Transaction Imports

Code path:

- Storage trigger: `functions/src/storageEvents/index.ts` -> `importtransactions`
- Handler: `functions/src/storageEvents/importTransactions.ts`
- Upload folder: `importTransactions`

### Processing Steps

1. The CSV is downloaded from Storage to a temp file.
2. Headers are converted to camelCase.
3. Each row is transformed with `transformTrxRow`.
4. Each transformed row is validated with `validateTrxRow`.
5. For every valid row, the importer stages a transaction doc in `dataImports/{eventId}/stagedDocs`.
6. After processing, the handler writes the import summary and sends an admin notification email.

### What Gets Staged

Each staged transaction includes the transformed transaction payload plus:

- `eventId = {eventId}`
- `metadata.created`
- `metadata.updated`
- `importMeta.status = 'new'`
- `importMeta.eventId = {eventId}`
- `importMeta.targetCollection = 'transactions'`

The CSV includes an `externalId` field. That field is what allows policy approval to find matching staged transaction imports later.

### Approval Behavior

When an admin approves a staged transaction import directly:

1. `approveimport` loads the staged transaction docs.
2. Every staged doc still in `new` status is written into `transactions/{stagedDocId}`.
3. The staged row is updated to `importMeta.status = 'imported'` with reviewer info.

Transactions can also be imported indirectly during policy approval:

1. The policy approval flow finds staged transaction rows by matching `externalId`.
2. Each matched staged transaction is written into `transactions`.
3. The transaction's `locationId` is overwritten with the imported policy location ID before final write.
4. The staged transaction row is marked `imported`.

### Important Notes

- Transaction documents are not created until approval.
- Transactions imported through policy approval do not need to be approved separately afterward.
- If the `externalId` values do not line up between the policy CSV and transaction CSV, policy approval can fail or miss the staged transactions it expects to find.

## Review UI

Admin review happens in:

- `/admin/config/imports`
- `/admin/config/imports/:importId`

The review screen allows admins to:

- approve a single staged row
- decline a single staged row
- approve or decline batches from the grid toolbar
- inspect the staged JSON payload for a row

Client code for that workflow lives in:

- `client/src/views/admin/ImportReview.tsx`
- `client/src/hooks/useManageImports.ts`
- `client/src/api/approveImport.ts`
