// import * as functions from 'firebase-functions';
import { EventContext } from 'firebase-functions/v1';
import { info } from 'firebase-functions/logger';
import { getFirestore } from 'firebase-admin/firestore';
import { UserRecord } from 'firebase-admin/auth';

import { invitesCollection, userClaimsCollection } from '../common';

export default async (user: UserRecord, context: EventContext<Record<string, string>>) => {
  const db = getFirestore();

  if (!!user.tenantId && !!user.email) {
    info(`Fetching invite for user ${user.tenantId} / ${user.email}`);
    const inviteRef = invitesCollection(db, user.tenantId).doc(user.email);
    const inviteSnap = await inviteRef.get();
    if (!inviteSnap.exists) return;

    const inviteData = inviteSnap.data();
    const claims = inviteData?.customClaims || {};

    console.log(`updating user claims for ${user.email}: ${JSON.stringify(claims)}`);
    await userClaimsCollection(db, user.tenantId)
      .doc(user.uid)
      .set({ ...claims }, { merge: true });

    console.log(`Setting invite status to accepted ${inviteRef.id}`);
    await inviteRef.update({ status: 'accepted' });
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
