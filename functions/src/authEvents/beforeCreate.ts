import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { error, info, warn } from 'firebase-functions/logger';
import type { AuthBlockingEvent } from 'firebase-functions/v2/identity';
import { HttpsError } from 'firebase-functions/v2/identity';
import jwt from 'jsonwebtoken';

import {
  CLAIMS,
  COLLECTIONS,
  emailVerificationKey,
  functionsBaseURL,
  iDemandOrgId,
  invitesCollection,
  orgsCollection,
  sendgridApiKey,
  userClaimsCollection,
  usersCollection,
} from '../common';
import { inviteConverter } from '../common/converters/index.js';
import { MoveTenantJwtPayload } from '../routes/authRequests.js';
import {
  ExtraSendGridArgs,
  moveTenantVerification,
  sendUserInvite,
} from '../services/sendgrid/index.js';

export default async (event: AuthBlockingEvent) => {
  // await getFirebaseAdmin()
  const db = getFirestore();
  const user = event.data;
  info(`CREATE USER (UID: ${user.uid} | TENANT ID: ${user.tenantId})`, user);

  if (!user.email) {
    throw new HttpsError('failed-precondition', 'email required to create a new account');
  }

  // check if user attempted to create account without tenant aware auth
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
  info(`verifying user doc does not exist with email ${user.email}...`);
  const userSnap = await usersCollection(db).where('email', '==', user.email).get();
  if (!userSnap.empty) {
    warn(`USER ALREADY EXISTS WITH EMAIL: ${user.email}`);

    // TODO: if user created regular user account and tries to join tenant --> send email confirmation ?? link account
    // if invite exists --> send email with link to action handler --> sign in, action handler url --> trigger moving to regular user to tenant
    // cloud function --> attempts to move user to tenant

    let errMsg = `Account with email ${user.email} already exists`;
    if (tenantId) {
      // send email with link to sign in and link account
      let u = await getAuth().getUserByEmail(user.email);
      if (!u || !u.email) throw new Error(`No user found with email ${user.email}`);
      try {
        await sendMoveToTenantEmail(
          emailVerificationKey.value(),
          sendgridApiKey.value(),
          u.uid, // user.uid,// BUG --> need to use userId from user that already exists
          user.email,
          tenantId,
          null,
          user.displayName,
          {
            customArgs: {
              firebaseEventId: event.eventId,
              emailType: 'move_to_tenant_verification',
            },
          }
        );
        errMsg += `. click link in email to move account to new org.`;
      } catch (err: any) {
        error('Error sending move user to tenant email', { err });
      }
    }

    throw new HttpsError('already-exists', errMsg);
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

async function sendMoveToTenantEmail(
  verificationKey: string,
  sgKey: string,
  uid: string,
  email: string | undefined,
  // toTenantId: string | null | undefined,
  toTenantId: string | null,
  fromTenantId: string | null,
  displayName?: string,
  sgArgs?: ExtraSendGridArgs
) {
  if (!email) throw new HttpsError('failed-precondition', 'missing email');

  const payload: MoveTenantJwtPayload = { uid, toTenantId, fromTenantId, email };

  const token = jwt.sign(
    {
      data: payload,
    },
    verificationKey,
    { expiresIn: '10m' }
  );

  // TODO: use hosting rewrites so v2 functions can be used
  // ie: const link = `${hostingBaseURL.value}/auth-api/confirm-move-tenant/${token}`
  const link = `${functionsBaseURL.value()}/authRequests/confirm-move-tenant/${token}`;

  info(`move tenant verification link: ${link}`);

  await moveTenantVerification(sgKey, email, link, displayName || '', undefined, sgArgs);

  info(`move user to tenant confirmation email sent to ${email}`);
}
