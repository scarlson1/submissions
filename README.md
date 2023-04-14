# submissions

## Firestore / DB Structure

## File Storage

## External Data (outside Google Cloud Project)

TODO

##### Github

Large, static, public data files are hosted in github:

- County GeoJSON
- State GeoJSON

## Invites

Invites are created in two scenarios:

1. When a tenanant is created, a new invite is automatically created for the primary contact (cloud function: createTenantFromSubmission)
2. By org admin using the _add users_ dialog

Invites are created when a new document is created under _organizations/{orgId}/invitations/{userEmail}_. A cloud function is triggered "onCreate," which will deliver an email to the invited user (unless property _isCreateOrgInvite_ is set to true)

Once a user creates an account (within a tenant), the beforeCreate blocking function checks the invite collection under the org to ensure the user was invited to join the tenant (/organizations/{orgId}/invites/{userEmail}).

## Claims

Claims are set up to mirror the properties of the firebase document under _organizations/{orgId}/userClaims/{userId}_. Firestore rules restrict updating the user claims document to iDemand Admins and Org Admins. (note: idemand's orgId is 'idemand', although it is not set up as a tenant).

Claims are kept up to date in the AuthContext component. To get around the issue of stale tokens (outdated claims because token hasn't been refreshed from logout/login), `updateClaims()` is called whenever auth state changes. `updateClaims()` refreshes the token (`getIdToken(true)`) and calls `getTokenResult()` to get the current custom claims, which are then stored in AuthContext Provider. Additionally, Auth Context subscribes to the userClaims doc in order to sync custom claims without requiring the user to refresh token / logout & sign in again. Whenever a change is detected, a function is triggered to check the firestore claims document and compare `lastCommittedRef` in auth context with the \_lastCommitted property in the firestore document. If they are different, `updateClaims()` is called, which will force refresh the token (`currentUser.getIdToken(true)` -> `currentUser.getIdTokenResult()`) and update the customs claims state with the result.

[Patterns for security with Firebase: supercharged custom claims with Firestore and Cloud Functions - Doug Stevenson](https://medium.com/firebase-developers/patterns-for-security-with-firebase-supercharged-custom-claims-with-firestore-and-cloud-functions-bb8f46b24e11)

## Blocking Functions

#### beforeCreate

If tenant is **not** present:

- checks for invite under all organizations `organizations/{orgId**}/invitations/{email}`, just in case the user that should be under a tenant attempted to create a regular user account.

If tenant is present:

- checks `enforceDomainRestriction`
- checks to ensure an invite exists with matching email under `organizations/{orgId}/invitations/{email}`

All:

- checks to ensure a user does not already exist with matching email (wouldn't be caught if under different tenant or no tenant)
- checks if email domain ends with _@idemandinsurance.com_, and assigns _iDemandAdmin_ claims. Must be verified beforeSignIn.

#### beforeSignIn

If _@idemandinsurance.com_ and email is not verified, creates a JWT signed with EMAIL_VERIFICATION_KEY env var, expiring in 10 mins and sends email with link to `{FUNCTIONS_BASE_URL}/authRequests/verify-email/${token}`, which will verify the token and set the email as verified, allowing the iDemandAdmin email address to sign in.

## Search

Algolia

###### Search Structure & Indicies

###### Search Keys / Permissions

## App structure

### Routing
