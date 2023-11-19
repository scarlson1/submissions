# submissions

## Firestore / DB Structure

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
- public (random stuff like fips)

## File Storage

## External Data (outside Google Cloud Project)

TODO

##### Github

Large, static, public data files are hosted in github:

- County GeoJSON
- State GeoJSON

### Invites

Invites are created in two scenarios:

1. When a tenanant is created, a new invite is automatically created for the primary contact (cloud function: createTenantFromSubmission)
2. By org admin using the _add users_ dialog

Invites are created when a new document is created under _organizations/{orgId}/invitations/{userEmail}_. A cloud function is triggered "onCreate," which will deliver an email to the invited user (unless property _isCreateOrgInvite_ is set to true)

Once a user creates an account (within a tenant), the beforeCreate blocking function checks the invite collection under the org to ensure the user was invited to join the tenant (/organizations/{orgId}/invites/{userEmail}).

### Claims

Claims are set up to mirror the properties of the firebase document under _organizations/{orgId}/userClaims/{userId}_. Firestore rules restrict updating the user claims document to iDemand Admins and Org Admins. (note: idemand's orgId is 'idemand', although it is not set up as a tenant).

Claims are kept up to date in the AuthContext component. To get around the issue of stale tokens (outdated claims because token hasn't been refreshed from logout/login), `updateClaims()` is called whenever auth state changes. `updateClaims()` refreshes the token (`getIdToken(true)`) and calls `getTokenResult()` to get the current custom claims, which are then stored in AuthContext Provider. Additionally, Auth Context subscribes to the userClaims doc in order to sync custom claims without requiring the user to refresh token / logout & sign in again. Whenever a change is detected, a function is triggered to check the firestore claims document and compare `lastCommittedRef` in auth context with the \_lastCommitted property in the firestore document. If they are different, `updateClaims()` is called, which will force refresh the token (`currentUser.getIdToken(true)` -> `currentUser.getIdTokenResult()`) and update the customs claims state with the result.

[Patterns for security with Firebase: supercharged custom claims with Firestore and Cloud Functions - Doug Stevenson](https://medium.com/firebase-developers/patterns-for-security-with-firebase-supercharged-custom-claims-with-firestore-and-cloud-functions-bb8f46b24e11)

## App structure

### Routing

- `/` - Landing page displays dashboard (differs if privileged user)
- `new/:productId` - [auth] new submission / get quote
- `submissions` - [auth] submissions for currently authed user
- `quotes` - [auth] lists quotes (query differs by privilege level)
  - `:quoteId` - details for specific quote
  - `:quoteId/bind` - form to complete quote, pay, bind.
    - `success/:transactionId?` - bind complete page
- `policies` - [auth] lists policies for current user (grid if agent or idemand admin)
  - `policyId` - details for current policy
- `agency/new` - partner with us form
- `account` - user settings / account page

###### Admin routes

- `quotes/:productId/new` - create quote from scratch
- `quotes/:productId/new/:submissionId` - create new quote from data in `submissionId`
- `admin/policies/:policyId/delivery` - form to upload policy document (PDF) to storage, and optionally deliver to user via email (policy pdf attached). Eventually will be replaced when backend is ready to generate documents.
- `admin/taxes` - grid of surplus lines taxes
  - `new` - create new surplus lines tax
- `admin/moratoriums` - grid of moratoriums
  - `new` - create new moratorium
- `licenses` - grid of licenses
  - `new` - add new license
- `admin/agencies/submissions` - grid of 'partner with us' submissions
  - `:submissionId` - details of 'partner with us' submission
- `admin/disclosures` - grid of disclosures for each state
  - `new` - create a new disclosure
  - `:disclosureId/edit` - edit an existing disclosure
- `admin/agencies/new` - create a new agency from scratch (as opposed to from a 'partner with us' submission)
- `admin/orgs` - grid of organizations (agencies)
  - `:orgId` - details for an org. Tab view (quotes, policies, team, invites)

### Search

##### Algolia

Copies and indexes database. Not implemented yet.

###### Search Structure & Indicies

###### Search Keys / Permissions

Eventually, will need to generate Algolia api key on a per-user basis to limit access of searchable documents.

## Cloud Functions

Cloud Functions are kind of like an API or server. They serve as the backend in most cases. Some boilerplate is handled by Firebase (like including user auth token and some metadata). There are different types of Cloud Functions, categorized by how the function is triggered:

- **Callables** - triggered ("called") by the client/frontend
- **HTTPS** - very similar to callables. Can be called with URL, like a regular api
- **Storage** - triggered from a file upload or metadata change
- **Auth** - triggered when a new user is created (including anonymous user)
- **Blocking Function** - two types: **_before sign in_** and **_before create_**. Executed before their respective actions and can block the action from proceeding if the function finds a reason to block it.

### Callables

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
- `moveUserToTenant` - moves user from non-tenant auth or tenant-auth to a new tenant.

### Storage Triggered

- `getAALPortfolio` - runs Swiss Re api call for each row in csv. Triggered by upload to _/portfolio-aal_ folder. Saves result to the same folder with "processed\_" prefixed to the file name.
- `importPolicies` - creates a new policy doc for each row in csv. Triggered by csv upload to _/importPolicies_ folder.
- `tempGetFIPS` - not sure if we're still using this. Adds county FIPS to csv file. Uses counties GeoJSON and latitude & longitude columns from csv to find which county the coordinates are located within.

### HTTPS Triggered

- `authRequests` - used to verify idemand email addresses. Link in verification email calles this endpoint. Returns "example@email.com has been verified, if successful. (weird bug with blocking function prevents using the Firebase SDK email verification method)

### Pub/Sub

- `checkAchStatus` - ePay doesn't have webooks to determine when ACH payment is confirmed. This function is scheduled to run at 10:35 AM Monday-Friday. It fetches all transactions where the status is 'processing,' then calls `/api/v1/transactions/${charge.id}` to check the status of the transaction. Not well tested because ePay's documentation isn't great and the development emulator doesnt support pub/sub. Need further testing in dev.
  `markpaidonpaymentcomplete` - triggered when '`payment.complete` event is published (either from ACH scheduled pubsub or from payment execution if method is a card). Updates the status on the policy doc to 'paid' and sends notification to iDemand admins, which contains a link to /admin/policy-delivery, so the policy documents can be uploaded to storaged and delivered to the insured.

### Firestore Triggered

- `getStaticSubmissionImg`
- `getSubmissionAAL`
- `getSubmissionFIPS`
- `mirrorCustomClaims` - monitors changes to documents located at _`organizations/:orgId/userClaims/:userId`_. When a change is detected, the function will take the properties from the doc and assign each property as a Custom Claim (role/permission) in Auth for the user with an id matching the document ID. Necessary for a couple reasons:
  - No way to view Auth Custom Claims (even in the Google Cloud Dashboard). Since this is stored in the database, and then mirrored as Custom Claims in Auth (user token), we can display the data in the Firestore database to show all claims by userId
  - Frontend can subscribe to changes to the document, and force a token refresh when a change is detected (`getIdToken(true)`). Without this, the user would have to sign out and sign back in in order to get current Custom Claims.
- `newAgencyAppNotification` - email iDemand Admins when a new agency 'partner with us' doc is created
- `newSubmissionNotification`
- `sendInviteEmail` - sends invite to create an account when a new doc is created under _`organizations/:orgId/invitations`_

### Auth Triggered

##### Blocking Functions

###### beforeCreate

If tenant is **not** present:

- checks for invite under all organizations `organizations/{orgId**}/invitations/{email}`, just in case the user that should be under a tenant attempted to create a regular user account.

If tenant is present:

- checks `enforceDomainRestriction`
- checks to ensure an invite exists with matching email under `organizations/{orgId}/invitations/{email}`

All:

- checks to ensure a user does not already exist with matching email (wouldn't be caught if under different tenant or no tenant)
- checks if email domain ends with _@idemandinsurance.com_, and assigns _iDemandAdmin_ claims. Must be verified beforeSignIn.

###### beforeSignIn

If _@idemandinsurance.com_ and email is not verified, creates a JWT signed with EMAIL_VERIFICATION_KEY env var, expiring in 10 mins and sends email with link to `{FUNCTIONS_BASE_URL}/authRequests/verify-email/${token}`, which will verify the token and set the email as verified, allowing the iDemandAdmin email address to sign in.
