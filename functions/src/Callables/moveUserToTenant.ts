import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { info, error } from 'firebase-functions/logger';
import {
  Auth,
  UserImportOptions,
  UserImportRecord,
  getAuth,
  TenantAwareAuth,
} from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

import { CLAIMS, usersCollection, firebaseHashConfig } from '../common';

// TODO: remove customClaims ??
// TODO: include customClaims in props ?? ** yes
// redirect / prompt for custom claims after user moved ??
// TODO: batch uploads

// Source: https://cloud.google.com/identity-platform/docs/migrate-users-between-projects-tenants#migrating_users_to_a_tenant

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
    var modifiedUser = user.toJSON() as UserImportRecord;
    // Convert to bytes.
    if (user.passwordHash && user.passwordSalt) {
      modifiedUser.passwordHash = Buffer.from(user.passwordHash, 'base64');
      modifiedUser.passwordSalt = Buffer.from(user.passwordSalt, 'base64');
    }
    // Delete tenantId - will be set automatically.
    delete modifiedUser.tenantId;

    await authTo.importUsers([modifiedUser], userImportOptions);
  } catch (err) {
    console.log('ERROR IMPORTING USER: ', err);
    throw err;
  }
}

export default async ({ data, auth }: CallableRequest) => {
  const { toTenantId, userId, fromTenantId } = data;
  console.log('MOVE USER TO TENANT CALLED: ', data);

  if (!auth || !auth.token || !auth.token[CLAIMS.IDEMAND_ADMIN]) {
    throw new HttpsError('permission-denied', `iDemandAdmin permissions required`);
  }

  if (!(toTenantId || fromTenantId) || !userId) {
    throw new HttpsError(
      'failed-precondition',
      `atleast one tenantId (to/from) and userId are required`
    );
  }

  const hashConfigStr = firebaseHashConfig.value();
  if (!hashConfigStr) throw new HttpsError('internal', 'Missing required environment variables');

  let parsedHashConfig = JSON.parse(hashConfigStr);
  let { algorithm, base64_signer_key, base64_salt_separator, rounds, mem_cost } = parsedHashConfig;

  if (!(algorithm && base64_signer_key && base64_salt_separator && rounds && mem_cost)) {
    throw new HttpsError(
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
        key: Buffer.from(base64_signer_key, 'base64'),
        saltSeparator: Buffer.from(base64_salt_separator, 'base64'),
        rounds,
        memoryCost: mem_cost,
      },
    };
    await migrateUser(authFrom, authTo, userId, userImportOptions);

    info(`USER ${userId} move from ${fromTenantId} to tenant ${toTenantId}`, {
      userId,
      fromTenantId,
      toTenantId,
    });

    return {
      status: 'success',
      userId,
      fromTenantId,
      toTenantId,
    };
  } catch (err: any) {
    error(`ERROR SETTING TENANT FOR USER ${userId}: `, {
      errCode: err?.code || null,
      errMsg: err?.message || null,
    });
    throw new HttpsError('internal', 'An error occurred while attempting to import users');
  }

  try {
    // TODO: update user doc (tenantId)
    // need to update all policies, quotes, submissions etc. ??
    let userDocRef = usersCollection(firestore).doc(userId);
    await userDocRef.update({ orgId: toTenantId, tenantId: toTenantId });

    console.log(`UPDATED USER RECORD (${userId}) tenantId to (${toTenantId})`);

    return { status: 'success' };
  } catch (err) {
    throw new HttpsError(
      'internal',
      'User successfully moved to tenant, but an error occurred updating corresponding database records.'
    );
  }
};
