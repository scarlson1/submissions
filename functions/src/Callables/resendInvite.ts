import { getFirestore } from 'firebase-admin/firestore';
import { CallableContext, HttpsError } from 'firebase-functions/v1/https';

import { invitesCollection } from '../common/dbCollections';
import { inviteConverter } from '../common/converters';
import { sendUserInvite } from '../services/sendgrid';
import { CLAIMS } from '../common';
import { sendgridApiKey } from './index.js';

// const sendgridApiKey = defineSecret('SENDGRID_API_KEY');

export default async (data: { orgId: string; inviteId: string }, context: CallableContext) => {
  const { auth } = context;

  if (!auth?.uid) {
    throw new HttpsError('unauthenticated', 'Must be signed in.');
  }
  if (!(auth?.token[CLAIMS.ORG_ADMIN] || auth?.token[CLAIMS.IDEMAND_ADMIN])) {
    throw new HttpsError('permission-denied', 'Admin permissions required');
  }

  let { orgId, inviteId } = data;
  if (!orgId || !inviteId) {
    throw new HttpsError('failed-precondition', 'Missing orgId or inviteId');
  }

  const sgKey = sendgridApiKey.value(); // process.env.SENDGRID_API_KEY;
  if (!sgKey) throw new HttpsError('internal', `Missing Sendgrid api key`);

  const db = getFirestore();
  const inviteColRef = invitesCollection(db, orgId);

  const inviteDocSnap = await inviteColRef.withConverter(inviteConverter).doc(inviteId).get();

  const inviteData = inviteDocSnap.data();
  if (!inviteDocSnap.exists || !inviteData) {
    throw new HttpsError('not-found', `Invite "${orgId}/${inviteId}" not found`);
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
    throw new HttpsError('internal', `Error delivering invite`);
  }
};
