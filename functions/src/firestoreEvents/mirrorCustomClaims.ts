import type { FirestoreEvent } from 'firebase-functions/v2/firestore';
import type { Change } from 'firebase-functions';
import { DocumentData, DocumentSnapshot, Timestamp, getFirestore } from 'firebase-admin/firestore';
import { getAuth, TenantAwareAuth, Auth } from 'firebase-admin/auth';

import { CLAIMS, isJSON, orgsCollection } from '../common';

// TODO: cloud functions for updating user claims docs

export interface ClaimsDocData extends DocumentData {
  _lastCommitted?: Timestamp; // WithFieldValue<Timestamp>;
}

export default async (
  event: FirestoreEvent<
    Change<DocumentSnapshot> | undefined,
    {
      orgId: string;
      userId: string;
    }
  >
) => {
  const beforeData: ClaimsDocData = event?.data?.before.data() || {};
  const afterData: ClaimsDocData = event?.data?.after.data() || {};
  const { userId, orgId } = event.params;
  let auth: Auth | TenantAwareAuth = getAuth();

  console.log(`User claims doc change detected (uid: ${userId})`);
  console.log('afterData: ', JSON.stringify(afterData));

  try {
    // Skip if _lastComitted has changed (already completed update)
    const skipUpdate =
      beforeData._lastCommitted &&
      afterData._lastCommitted &&
      !beforeData._lastCommitted.isEqual(afterData._lastCommitted);

    if (skipUpdate) {
      console.log('No changes');
      return;
    }

    const { _lastCommitted, ...newClaims } = afterData;
    const stringifiedClaims = JSON.stringify(newClaims);
    if (stringifiedClaims.length > 1000) {
      console.error('new custom claims object string > 1000 characters', stringifiedClaims);
      return;
    }

    const isValid = isJSON(stringifiedClaims);

    if (!isValid) {
      console.log('Invalid JSON. returning early');
      await event?.data?.after.ref.set({
        ...beforeData,
      });
    }

    if (
      (Object.keys(newClaims).includes(CLAIMS.IDEMAND_ADMIN) ||
        Object.keys(newClaims).includes(CLAIMS.IDEMAND_USER)) &&
      orgId !== 'idemand'
    ) {
      console.log(
        'New custom claims contained reserved custom claim (iDemandAdmin). Removing claim.'
      );
      // delete newClaims.iDemandAdmin;
      delete newClaims[CLAIMS.IDEMAND_ADMIN];
      delete newClaims[CLAIMS.IDEMAND_USER];
      await event?.data?.after.ref.set({
        ...newClaims,
        _lastCommitted,
      });
      // await change.after.ref.set({
      //   ...newClaims,
      //   _lastCommitted,
      // });
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
        console.log(`No tenant found with ID ${orgId}`);
        return;
      }
      console.log(`Using tenant aware auth for tenant ${tenant.tenantId}`);
      auth = auth.tenantManager().authForTenant(tenant.tenantId);
    }

    console.log(`Setting custom claims for ${userId}`, newClaims);
    await auth.setCustomUserClaims(userId, { ...newClaims });

    await event?.data?.after.ref.update({
      _lastCommitted: Timestamp.now(),
      ...newClaims,
    });
  } catch (err) {
    console.log('ERROR => ', err);
    return;
  }
};
