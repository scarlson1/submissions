import type { AuthBlockingEvent } from 'firebase-functions/v2/identity';
import { HttpsError } from 'firebase-functions/v2/identity';
import { error, info, warn } from 'firebase-functions/logger';
import { getFirestore } from 'firebase-admin/firestore';

import {
  CLAIMS,
  COLLECTIONS,
  iDemandOrgId,
  invitesCollection,
  orgsCollection,
  sendgridApiKey,
  userClaimsCollection,
  usersCollection,
} from '../common';
import { inviteConverter } from '../common/converters';
import { sendUserInvite } from '../services/sendgrid';

// TODO: are all imports getting imported / initialized from all functions ??
// https://youtu.be/v3eG9xpzNXM

export default async (event: AuthBlockingEvent) => {
  // await getFirebaseAdmin()
  const db = getFirestore();
  const user = event.data;
  console.log('USER: ', user);

  if (!user.email) {
    throw new HttpsError('failed-precondition', 'email required to create a new account');
  }

  // check to see if user attempted to create account without tenant aware auth
  // but an invite exists matching email
  const tenantId = user.tenantId;
  if (!tenantId) {
    info(`Checking for existing invite for email ${user.email}`);
    const inviteSnap = await db
      .collectionGroup(COLLECTIONS.INVITES)
      .withConverter(inviteConverter)
      .where('email', '==', user.email)
      .get();

    if (!inviteSnap.empty) {
      const invite = inviteSnap.docs[0]?.data(); // .map((snap) => snap.data());
      // const invite = inviteData[0];
      if (invite && invite?.orgId !== iDemandOrgId.value()) {
        try {
          const to = invite.email;
          const sgKey = sendgridApiKey.value();
          const link = invite.getLink();
          info(`Invite found matching ${user.email}. Resending link.`, {
            ...invite,
          });
          await sendUserInvite(
            sgKey,
            link,
            to,
            invite.firstName ?? invite.displayName,
            invite.invitedBy?.name || ''
          );
        } catch (err: any) {
          warn(`Error resending invite email`, {
            errMsg: err?.message,
            email: invite.email,
            link: invite.getLink(),
          });
        }
      }
      if (invite?.orgId !== iDemandOrgId.value()) {
        throw new HttpsError(
          'failed-precondition',
          `Email matched invite from ${invite?.orgName} (ID: ${invite?.orgId}). Add orgId to end of auth url to accept (/auth/create-account/{orgId})`,
          { matchedInviteOrgId: invite?.orgId }
        );
      }
    }
  }

  // check if org has domain restrictions enabled
  if (!!tenantId) {
    info(`Checking domain restriction settings for tenant ${tenantId}`);
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

    info(`Fetching invite for ${user.email} under tenant ${tenantId}`);
    const invitesSnap = await invitesCollection(db, tenantId).doc(user.email).get();
    if (!invitesSnap.exists) {
      warn(`INVITE NOT FOUND FOR ${user.email} (tenant ID: ${tenantId})`);
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
  info(`verifying user doc does not exist with email ${user.email}`);
  const userSnap = await usersCollection(db).where('email', '==', user.email).get();
  if (!userSnap.empty) {
    warn(`USER ALREADY EXISTS WITH EMAIL: ${user.email}`);
    throw new HttpsError('already-exists', `Account with email ${user.email} already exists`);
  }

  // use invite to set permissions ??
  // TODO: delete ?? using invites & userClaims collections
  if (user.email && user.email?.toLowerCase().endsWith('@idemandinsurance.com')) {
    const claimsColRef = userClaimsCollection(db, iDemandOrgId.value());
    try {
      await claimsColRef.doc(user.uid).set({
        // [CLAIMS.IDEMAND_ADMIN]: true, // TODO: decide whether to set as admin by default
        [CLAIMS.IDEMAND_USER]: true,
      });
    } catch (err) {
      error('Error creating custom user claims doc for idemand user', {
        userId: user.uid,
      });
    }

    return {
      customClaims: { iDemandAdmin: true },
    };
  }

  return {};
};
