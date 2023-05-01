import * as functions from 'firebase-functions';
import {
  Auth,
  // ListUsersResult,
  UserImportOptions,
  UserImportRecord,
  getAuth,
  TenantAwareAuth,
} from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { defineSecret } from 'firebase-functions/params';
import { CLAIMS, usersCollection } from '../common';

const firebaseHashConfig = defineSecret('FIREBASE_AUTH_HASH_CONFIG');

// Source: https://cloud.google.com/identity-platform/docs/migrate-users-between-projects-tenants#migrating_users_to_a_tenant

// /**
//  * Import all users from one tenant to another tenantv or from one project to another project (depending on authFrom and authTo)
//  * @param {Auth} authFrom - Auth instance from which to import user
//  * @param {Auth} authTo - Destination Auth instance
//  * @param {UserImportOptions} userImportOptions  - password hashing config/options
//  * @param {string | undefined} nextPageToken - cursor (1000 users at a time)
//  * @return {void}
//  */

// function migrateUsers(
//   authFrom: Auth | TenantAwareAuth,
//   authTo: Auth | TenantAwareAuth,
//   userImportOptions: UserImportOptions,
//   nextPageToken: ListUsersResult['pageToken']
// ) {
//   var pageToken: string | undefined;
//   authFrom
//     .listUsers(1000, nextPageToken)
//     .then(function (listUsersResult) {
//       var users: UserImportRecord[] = [];
//       listUsersResult.users.forEach(function (user) {
//         var modifiedUser = user.toJSON() as UserImportRecord; //  as UserRecord
//         // Convert to bytes.
//         if (user.passwordHash && user.passwordSalt) {
//           modifiedUser.passwordHash = Buffer.from(user.passwordHash, 'base64');
//           modifiedUser.passwordSalt = Buffer.from(user.passwordSalt, 'base64');
//         }
//         // Delete tenant ID if available. This will be set automatically.
//         delete modifiedUser.tenantId;
//         users.push(modifiedUser);
//       });
//       // Save next page token.
//       pageToken = listUsersResult.pageToken;
//       // Upload current chunk.
//       return authTo.importUsers(users, userImportOptions);
//     })
//     .then(function (results) {
//       results.errors.forEach(function (indexedError) {
//         console.log('Error importing user ' + indexedError.index);
//       });
//       // Continue if there is another page.
//       if (pageToken) {
//         migrateUsers(authFrom, authTo, userImportOptions, pageToken);
//       }
//     })
//     .catch(function (error) {
//       console.log('Error importing users:', error);
//     });
// }

/**
 * Import a single user from one tenant to another tenant or from one project to another project (depending on authFrom and authTo)
 * @param {Auth} authFrom - Auth instance from which to import user
 * @param {Auth} authTo - Destination Auth instance
 * @param {UserImportOptions} userImportOptions  - password hashing config/options
 * @return {void}
 */

async function migrateUser(
  authFrom: Auth | TenantAwareAuth,
  authTo: Auth | TenantAwareAuth,
  userId: string,
  userImportOptions: UserImportOptions
) {
  let user = await authFrom.getUser(userId);
  if (!user) throw new Error(`User not found with ID ${userId}`);

  try {
    var modifiedUser = user.toJSON() as UserImportRecord; //  as UserRecord
    // Convert to bytes.
    if (user.passwordHash && user.passwordSalt) {
      modifiedUser.passwordHash = Buffer.from(user.passwordHash, 'base64');
      modifiedUser.passwordSalt = Buffer.from(user.passwordSalt, 'base64');
    }
    // Delete tenant ID if available. This will be set automatically.
    delete modifiedUser.tenantId;

    console.log(`Migrating user ${modifiedUser.uid}`);

    // Upload current chunk.
    await authTo.importUsers([modifiedUser], userImportOptions);
  } catch (err) {
    console.log('ERROR IMPORTING USER: ', err);
    throw err;
  }
}

export const moveUserToTenant = functions
  .runWith({ secrets: [firebaseHashConfig] })
  .https.onCall(async (data, context) => {
    const { toTenantId, userId, fromTenantId } = data;
    console.log('MOVE USER TO TENANT CALLED: ', data);

    const authCtx = context.auth;
    if (!authCtx || !authCtx.token || !authCtx.token[CLAIMS.IDEMAND_ADMIN]) {
      throw new functions.https.HttpsError(
        'permission-denied',
        `iDemandAdmin permissions required`
      );
    }

    if (!(toTenantId || fromTenantId) || !userId) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        `tenantId and userId are required`
      );
    }

    const hashConfigStr = firebaseHashConfig.value();
    if (!hashConfigStr)
      throw new functions.https.HttpsError('internal', 'Missing required environment variables');
    let parsedHashConfig = JSON.parse(hashConfigStr);
    let { algorithm, base64_signer_key, base64_salt_separator, rounds, mem_cost } =
      parsedHashConfig;
    if (!(algorithm && base64_signer_key && base64_salt_separator && rounds && mem_cost)) {
      throw new functions.https.HttpsError(
        'internal',
        'Missing required environment variables (password hash config)'
      );
    }

    let firestore = getFirestore();
    let authFrom: Auth | TenantAwareAuth = getAuth();
    let authTo: Auth | TenantAwareAuth = getAuth();

    if (fromTenantId) {
      authFrom = authFrom.tenantManager().authForTenant(fromTenantId);
    }
    if (toTenantId) {
      authTo = authTo.tenantManager().authForTenant(toTenantId);
    }

    try {
      const userImportOptions = {
        hash: {
          algorithm,
          key: base64_signer_key,
          saltSeparator: base64_salt_separator,
          rounds,
          memoryCost: mem_cost,
        },
      };
      await migrateUser(authFrom, authTo, userId, userImportOptions);

      console.log(`USER ${userId} move to tenant ${toTenantId}`);
    } catch (err) {
      console.log('ERROR IMPORTING USER: ', err);
      throw new functions.https.HttpsError(
        'internal',
        'An error occurred while attempting to import users'
      );
    }

    try {
      // TODO: update user doc (tenantId)
      // need to update all policies, quotes, submissions etc. ??
      let userDocRef = usersCollection(firestore).doc(userId);
      await userDocRef.update({ orgId: toTenantId, tenantId: toTenantId });

      console.log(`UPDATED USER RECORD (${userId}) tenantId to (${toTenantId})`);

      return { status: 'success' };
    } catch (err) {
      throw new functions.https.HttpsError(
        'internal',
        'User successfully moved to tenant, but an error occurred updating corresponding database records.'
      );
    }
  });
