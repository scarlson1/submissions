import { getFirestore } from 'firebase-admin/firestore';
import { AuthEventContext, AuthUserRecord } from 'firebase-functions/lib/common/providers/identity';
// import { HttpsError } from 'firebase-functions/v1/auth';
import { HttpsError } from 'firebase-functions/v2/identity';

import { COLLECTIONS, invitesCollection, orgsCollection, usersCollection } from '../common';
// import { getFirebaseAdmin } from '../services';

// TODO: are all imports getting imported / initialized from all functions ??
// https://youtu.be/v3eG9xpzNXM

export default async (user: AuthUserRecord, context: AuthEventContext) => {
  // await getFirebaseAdmin()
  const db = getFirestore();
  console.log('USER: ', user);

  if (!user.email) {
    throw new HttpsError('failed-precondition', 'email required to create a new account');
  }

  // check to see if user attempted to create account without tenant aware auth
  // but an invite exists matching email
  const tenantId = user.tenantId;
  if (!tenantId) {
    console.log(`Checking for existing invite for email ${user.email}`);
    const inviteSnap = await db
      .collectionGroup(COLLECTIONS.INVITES)
      .where('email', '==', user.email)
      .get();

    if (!inviteSnap.empty) {
      const inviteData = inviteSnap.docs.map((snap) => snap.data());
      throw new HttpsError(
        'failed-precondition',
        `Email matched invite from ${inviteData[0].orgName} (ID: ${inviteData[0].orgId}). Add orgId to end of auth url to accept (/auth/create-account/{orgId})`,
        { matchedInviteOrgId: inviteData[0].orgId }
      );
    }
  }

  // check if org has domain restrictions enabled
  if (!!tenantId) {
    console.log(`Checking domain restriction settings for tenant ${tenantId}`);
    const tenantSnap = await orgsCollection(db).doc(tenantId).get();
    if (!tenantSnap.exists) {
      throw new HttpsError('not-found', `tenant doc not found (ID: ${tenantId})`, {
        providedTenantId: tenantId,
      });
    }
    // TODO: check if setting enabled to force domain restrictions ??
    const enforceRestriction = tenantSnap.data()?.enforceDomainRestriction;
    const tenantDomain = tenantSnap.data()?.emailDomain;

    // if (!!enforceRestriction && !tenantDomain) {
    //   throw new HttpsError(
    //     'failed-precondition',
    //     'domain restriction enabled but domain value has not been set'
    //   );
    // }

    if (
      !!enforceRestriction &&
      tenantDomain &&
      (!user.email || user.email.indexOf(tenantDomain || '') === -1)
    ) {
      throw new HttpsError('invalid-argument', `Unauthorized email "${user.email}"`, {
        providedTenantId: tenantId,
      });
    }

    console.log(`Fetching invite for ${user.email} under tenant ${tenantId}`);
    const invitesSnap = await invitesCollection(db, tenantId).doc(user.email).get();
    if (!invitesSnap.exists) {
      console.log(`INVITE NOT FOUND FOR ${user.email} (tenant ID: ${tenantId})`);
      throw new HttpsError(
        'permission-denied',
        `Invitation required. No invite found for email ${user.email} under org ID ${tenantId}`,
        {
          providedTenantId: tenantId,
        }
      );
    }
  }

  // Verify user doc does not already exist with email = user.email
  console.log(`verifying user doc does not exist with email ${user.email}`);
  const userSnap = await usersCollection(db).where('email', '==', user.email).get();
  if (!userSnap.empty) {
    console.log(`USER ALREADY EXISTS WITH EMAIL: ${user.email}`);
    throw new HttpsError('already-exists', `Account with email ${user.email} already exists`);
  }

  if (user.email && user.email?.toLowerCase().endsWith('@idemandinsurance.com')) {
    return {
      customClaims: { iDemandAdmin: true },
    };
  }

  return {};
};

// export const beforeCreate = functions
//   .runWith({ minInstances: 1, memory: '128MB' })
//   .auth.user()
//   .beforeCreate(async (user) => {
//     const db = getFirestore();

//     if (!user.email) {
//       throw new functions.auth.HttpsError(
//         'failed-precondition',
//         'email required to create a new account'
//       );
//     }

//     // check to see if user attempted to create account without tenant aware auth
//     // but an invite exists matching email
//     const tenantId = user.tenantId;
//     if (!tenantId) {
//       console.log(`Checking for existing invite for email ${user.email}`);
//       const inviteSnap = await db
//         .collectionGroup(COLLECTIONS.INVITES)
//         .where('email', '==', user.email)
//         .get();

//       if (!inviteSnap.empty) {
//         const inviteData = inviteSnap.docs.map((snap) => snap.data());
//         throw new functions.auth.HttpsError(
//           'failed-precondition',
//           `Email matched invite from ${inviteData[0].orgName} (ID: ${inviteData[0].orgId}). Add orgId to end of auth url to accept (/auth/create-account/{orgId})`,
//           { matchedInviteOrgId: inviteData[0].orgId }
//         );
//       }
//     }

//     // check if org has domain restrictions enabled
//     if (!!tenantId) {
//       console.log(`Checking domain restriction settings for tenant ${tenantId}`);
//       const tenantSnap = await orgsCollection(db).doc(tenantId).get();
//       if (!tenantSnap.exists) {
//         throw new functions.auth.HttpsError('not-found', `tenant doc not found (${tenantId})`);
//       }
//       // TODO: check if setting enabled to force domain restrictions ??
//       const enforceRestriction = tenantSnap.data()?.enforceDomainRestriction;
//       const tenantDomain = tenantSnap.data()?.emailDomain;

//       if (!!enforceRestriction && !tenantDomain) {
//         throw new functions.auth.HttpsError(
//           'failed-precondition',
//           'domain restriction enabled but domain value has not been set'
//         );
//       }

//       if (!!enforceRestriction && (!user.email || user.email.indexOf(tenantDomain || '') === -1)) {
//         throw new functions.auth.HttpsError(
//           'invalid-argument',
//           `Unauthorized email "${user.email}"`
//         );
//       }

//       console.log(`Fetching invite for ${user.email} under tenant ${tenantId}`);
//       const invitesSnap = await invitesCollection(db, tenantId).doc(user.email).get();
//       if (!invitesSnap.exists) {
//         throw new functions.auth.HttpsError(
//           'permission-denied',
//           `Invitation required. No invite found for email ${user.email} under org ID ${tenantId}`
//         );
//       }
//     }

//     // Verify user doc does not already exist with email = user.email
//     console.log(`verifying user doc does not exist with email ${user.email}`);
//     const userSnap = await usersCollection(db).where('email', '==', user.email).get();
//     if (!userSnap.empty) {
//       console.log(`USER ALREADY EXISTS WITH EMAIL: ${user.email}`);
//       throw new functions.auth.HttpsError(
//         'already-exists',
//         `Account with email ${user.email} already exists`
//       );
//     }

//     if (user.email && user.email?.toLowerCase().endsWith('@idemandinsurance.com')) {
//       return {
//         customClaims: { iDemandAdmin: true },
//       };
//     }

//     return {};
//   });
