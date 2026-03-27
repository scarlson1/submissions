import { Auth, getAuth, TenantAwareAuth } from 'firebase-admin/auth';
import {
  DocumentData,
  DocumentSnapshot,
  getFirestore,
  Timestamp,
} from 'firebase-admin/firestore';
import type { Change } from 'firebase-functions';
import { error, info } from 'firebase-functions/logger';
import type { FirestoreEvent } from 'firebase-functions/v2/firestore';

import { CLAIMS, iDemandOrgId, orgsCollection } from '../common/index.js';
import { isJSON } from '../utils/validation.js';

export interface ClaimsDocData extends DocumentData {
  _lastCommitted?: Timestamp;
}

export default async (
  event: FirestoreEvent<
    Change<DocumentSnapshot> | undefined,
    {
      orgId: string;
      userId: string;
    }
  >,
) => {
  const beforeData: ClaimsDocData = event?.data?.before.data() || {};
  const afterData: ClaimsDocData = event?.data?.after.data() || {};
  const { userId, orgId } = event.params;
  let auth: Auth | TenantAwareAuth = getAuth();

  info(`User claims doc change detected (uid: ${userId})`, {
    newClaims: afterData,
  });

  try {
    // Skip if _lastCommitted has changed (already completed update)
    const skipUpdate =
      beforeData._lastCommitted &&
      afterData._lastCommitted &&
      !beforeData._lastCommitted.isEqual(afterData._lastCommitted);

    if (skipUpdate) {
      info('No changes');
      return;
    }

    const { _lastCommitted, ...newClaims } = afterData;
    const stringifiedClaims = JSON.stringify(newClaims);
    if (stringifiedClaims.length > 1000) {
      console.error(
        'new custom claims object string > 1000 characters',
        stringifiedClaims,
      );
      return;
    }

    const isValid = isJSON(stringifiedClaims);

    if (!isValid) {
      info('Invalid JSON. returning early');
      await event?.data?.after.ref.set({
        ...beforeData,
      });
    }

    if (
      (Object.keys(newClaims).includes(CLAIMS.IDEMAND_ADMIN) ||
        Object.keys(newClaims).includes(CLAIMS.IDEMAND_USER)) &&
      orgId !== iDemandOrgId.value()
    ) {
      info(
        'New custom claims contained reserved custom claim (iDemandAdmin). Removing claim.',
      );
      delete newClaims[CLAIMS.IDEMAND_ADMIN];
      delete newClaims[CLAIMS.IDEMAND_USER];

      await event?.data?.after.ref.set({
        ...newClaims,
        _lastCommitted,
      });

      return;
    }
    // could limit the allow claims ['iDemandAdmin', 'admin', 'agent'] etc
    // for (const key in request) {
    //   if (!(key in validKeys)) {
    //     delete request[key];
    //   }
    // }

    const db = getFirestore();
    const orgSnap = await orgsCollection(db).doc(orgId).get();
    const orgData = orgSnap.data();

    if (orgData?.tenantId) {
      const tenant = await auth.tenantManager().getTenant(orgId);
      if (!tenant || !tenant.tenantId) {
        info(`No tenant found with ID ${orgId}. Exiting.`);
        return;
      }
      info(`Using tenant aware auth for tenant ${tenant.tenantId}`);
      auth = auth.tenantManager().authForTenant(tenant.tenantId);
    }

    info(`Setting custom claims for ${userId}`, { newClaims });
    await auth.setCustomUserClaims(userId, { ...newClaims });

    await event?.data?.after.ref.update({
      _lastCommitted: Timestamp.now(),
      ...newClaims,
    });
  } catch (err) {
    error('Error mirroring custom claims', { err });
    return;
  }
};
