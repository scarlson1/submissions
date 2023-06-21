import { EventContext } from 'firebase-functions/v1';
import { error, info } from 'firebase-functions/logger';
import { getFirestore } from 'firebase-admin/firestore';
import { UserRecord } from 'firebase-admin/auth';

import { iDemandOrgId, invitesCollection, userClaimsCollection } from '../common';

export default async (user: UserRecord, context: EventContext<Record<string, string>>) => {
  const db = getFirestore();

  if (!!user.tenantId && !!user.email) {
    try {
      info(`Fetching invite for user ${user.tenantId} / ${user.email}`);
      const inviteRef = invitesCollection(db, user.tenantId).doc(user.email);
      const inviteSnap = await inviteRef.get();
      if (!inviteSnap.exists) return;

      const inviteData = inviteSnap.data();
      const claims = inviteData?.customClaims || {};

      info(`updating user claims for ${user.email}: ${JSON.stringify(claims)}`);
      await userClaimsCollection(db, user.tenantId)
        .doc(user.uid)
        .set({ ...claims }, { merge: true });

      info(`Setting invite status to accepted ${inviteRef.id}`);
      await inviteRef.update({ status: 'accepted' });
    } catch (err) {
      error(`Error setting claims for user ${user.email}`, { err });
    }
  }

  if (user.email?.endsWith('@idemandinsurance.com')) {
    try {
      info(`Fetching invite for user idemand user: ${user.email}`);
      const inviteRef = invitesCollection(db, iDemandOrgId.value()).doc(user.email);
      const inviteSnap = await inviteRef.get();
      if (!inviteSnap.exists) return;

      const inviteData = inviteSnap.data();
      const claims = inviteData?.customClaims || {};

      info(`updating user claims for ${user.email}: ${JSON.stringify(claims)}`);
      await userClaimsCollection(db, iDemandOrgId.value())
        .doc(user.uid)
        .set({ ...claims }, { merge: true });

      info(`Setting invite status to accepted ${inviteRef.id}`);
      await inviteRef.update({ status: 'accepted' });
    } catch (err) {}
  }

  return;
};

// export const setClaimsFromInvite = functions.auth.user().onCreate(async (user) => {
//   const db = getFirestore();

//   if (!!user.tenantId && !!user.email) {
//     console.log(`Fetching invite for user ${user.tenantId} / ${user.email}`);
//     const inviteRef = invitesCollection(db, user.tenantId).doc(user.email);
//     const inviteSnap = await inviteRef.get();
//     if (!inviteSnap.exists) return;

//     const inviteData = inviteSnap.data();
//     const claims = inviteData?.customClaims || {};

//     console.log(`updating user claims for ${user.email}: ${JSON.stringify(claims)}`);
//     await userClaimsCollection(db, user.tenantId)
//       .doc(user.uid)
//       .set({ ...claims }, { merge: true });

//     console.log(`Setting invite status to accepted ${inviteRef.id}`);
//     await inviteRef.update({ status: 'accepted' });
//   }

//   // TODO: create invite in beforeCreate for @idemandinsurance.com ??
//   // what if want to set claims other than iDemandAdmin ?? would have to check if invite exists

//   return;
// });
