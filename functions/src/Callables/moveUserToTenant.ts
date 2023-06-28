import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { info, error } from 'firebase-functions/logger';
import {
  Auth,
  UserImportOptions,
  UserImportRecord,
  getAuth,
  TenantAwareAuth,
} from 'firebase-admin/auth';
import { Firestore, getFirestore } from 'firebase-admin/firestore';

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

export async function migrateUser(
  authFrom: Auth | TenantAwareAuth,
  authTo: Auth | TenantAwareAuth,
  userId: string,
  userImportOptions: UserImportOptions
) {
  const user = await authFrom.getUser(userId);
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

    console.log('MODIFIED USER: ', JSON.stringify(modifiedUser, null, 2));

    await authTo.importUsers([modifiedUser], userImportOptions);
  } catch (err) {
    console.log('ERROR IMPORTING USER: ', err);
    throw err;
  }
}

// TODO: update user doc (tenantId)
// need to update all policies, quotes, submissions etc. ??
// TODO: emit event?? handle in sub/sub listener ??
export async function updateUserDoc(
  firestore: Firestore,
  userId: string,
  newTenantId: string | null
): Promise<boolean> {
  try {
    const userDocRef = usersCollection(firestore).doc(userId);
    await userDocRef.update({ orgId: newTenantId, tenantId: newTenantId });

    info(`UPDATED USER RECORD (${userId}) tenantId to (${newTenantId})`);

    return true;
  } catch (err: any) {
    error(`Error updating user doc ${userId} with new tenant info`, { err });
    return false;
  }
}

export default async ({ data, auth }: CallableRequest) => {
  const { toTenantId, userId, fromTenantId } = data;
  info('MOVE USER TO TENANT CALLED', { ...data });

  // TODO: or allow call from regular user --> joining tenant with outstanding invite
  // scenario: user creates account before creating agency

  const isIDemandAdmin = auth && auth.token && auth.token[CLAIMS.IDEMAND_ADMIN];

  if (!isIDemandAdmin) {
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

  const parsedHashConfig = JSON.parse(hashConfigStr);
  const { algorithm, base64_signer_key, base64_salt_separator, rounds, mem_cost } =
    parsedHashConfig;

  if (!(algorithm && base64_signer_key && base64_salt_separator && rounds && mem_cost)) {
    throw new HttpsError(
      'internal',
      'Missing required environment variables (password hash config)'
    );
  }

  const firestore = getFirestore();
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

    const userDocUpdated = await updateUserDoc(firestore, userId, toTenantId);

    return {
      status: 'success',
      userId,
      fromTenantId,
      toTenantId,
      userDocUpdated,
    };
  } catch (err: any) {
    error(`ERROR SETTING TENANT FOR USER ${userId}: `, {
      errCode: err?.code || null,
      errMsg: err?.message || null,
    });
    throw new HttpsError('internal', 'An error occurred while attempting to import users');
  }
};
