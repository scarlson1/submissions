# submissions

### Detailed documentation

- [ARCHITECTURE.md](docs/ARCHITECTURE.md)

- [QUOTES_AND_POLICIES.md](docs/QUOTES_AND_POLICIES.md)

- [STRIPE.md](docs/STRIPE.md)

- [TRANSACTIONS.md](docs/TRANSACTIONS.md)

- [BULK_IMPORTS.md](docs/BULK_IMPORTS.md)

## Development

```bash
git clone git@github.com:scarlson1/submissions.git

pnpm install
cd client && pnpm install
cd functions && pnpm install
```

TODO: env files, service account permissions, etc.

Add the following secrets in GCP secret manager (or `functions/.secret.local` for local development).

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

Sign into firebase/gcloud cli (download service account and update path in package.json)

### Run services locally

```bash
# to start react, functions and emulator with concurrently
pnpm dev

# to start individually in separate terminal tabs:
pnpm emulators:dev   # terminal 1
pnpm client:dev      # terminal 2
pnpm functions:build # terminal 3

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

[firebase-tools-with-isolate](https://github.com/0x80/firebase-tools-with-isolate) is used to support pnpm (firebase only supports pnpm for client/hosting). It's added as a dev dependency at the project root.

### Functions deployment

```bash
npx firebase login

cd functions

# set target project in firebase cli
pnpm use:dev # or use:prod or firebase use [alias]

# build (rm -rf ./dist/ && tsc)
pnpm build

# deploy (firebase deploy --only functions)
# pnpm deploy:dev [old command]
npx firebase deploy --only functions:[FUNCTION_NAME]
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

- `authRequests` - used to verify idemand email addresses. Link in verification email calls this endpoint. Returns "example@email.com has been verified, if successful. (weird bug with blocking function prevents using the Firebase SDK email verification method) -->

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

- include types module & switch to pnpm workspace (cloud run api, @idemand/common types, client, functions, etc.)
  - configure [firebase-tools-with-isolate](https://github.com/0x80/firebase-tools-with-isolate)
  - group functions into codebases [monorepo](https://firebase.google.com/docs/functions/organize-functions#managing_multiple_source_packages_monorepo_2) / [group functions](https://firebase.google.com/docs/functions/organize-functions#group_functions) (grouped function will result in prefix before function name)
    - codebases approach skips unchanged functions, grouped does not
- deploy via github workflow (& validate secrets, variables, etc.). Only deploy functions with changes
- documentation
  - agency management (onboarding, permissions)
  - admin - moratorium, active states, licenses, etc.
  - quote flow
  - environment variables
- Fix update Quote / create account in bind quote form
- /user/{userId} route queries (query by agent/org depending on claims)
- update firestore rules
- quote form agent / agency search - filter by org if agent selected
