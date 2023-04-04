import * as functions from 'firebase-functions';
import 'firebase-functions';
import { getFirestore } from 'firebase-admin/firestore';
import { defineSecret } from 'firebase-functions/params';

import { invitesCollection } from '../common/dbCollections';
import { inviteConverter } from '../common/converters';
import { sendUserInvite } from '../services/sendgrid';

const sendgridApiKey = defineSecret('SENDGRID_API_KEY');

export const resendInvite = functions
  .runWith({ secrets: [sendgridApiKey] })
  .https.onCall(async (data: { orgId: string; inviteId: string }, context) => {
    const { auth } = context;

    if (!auth?.uid) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be signed in.');
    }
    if (!(auth?.token.admin || auth?.token.iDemandAdmin)) {
      throw new functions.https.HttpsError('permission-denied', 'Admin permissions required');
    }

    let { orgId, inviteId } = data;
    if (!orgId || !inviteId) {
      throw new functions.https.HttpsError('failed-precondition', 'Missing orgId or inviteId');
    }

    const sgKey = process.env.SENDGRID_API_KEY;
    if (!sgKey) throw new functions.https.HttpsError('internal', `Missing Sendgrid api key`);

    const db = getFirestore();
    const inviteColRef = invitesCollection(db, orgId);

    const inviteDocSnap = await inviteColRef.withConverter(inviteConverter).doc(inviteId).get();

    const inviteData = inviteDocSnap.data();
    if (!inviteDocSnap.exists || !inviteData) {
      throw new functions.https.HttpsError('not-found', `Invite "${orgId}/${inviteId}" not found`);
    }

    let to = [inviteData?.email];
    if (process.env.AUDIENCE === 'DEV HUMANS' || process.env.AUDIENCE === 'LOCAL HUMANS')
      to.push('spencercarlson@mac.com');

    try {
      await sendUserInvite(
        sgKey,
        inviteData.getLink(),
        to,
        inviteData.firstName ?? inviteData.displayName,
        inviteData.invitedBy?.name || ''
      );

      return { status: 'sent' };
    } catch (err) {
      throw new functions.https.HttpsError('internal', `Error delivering invite`);
    }
  });
