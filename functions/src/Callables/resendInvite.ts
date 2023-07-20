import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';

import { invitesCollection } from '../common/dbCollections';
import { inviteConverter } from '../common/converters';
import { CLAIMS, audience, sendgridApiKey } from '../common';
import { sendUserInvite } from '../services/sendgrid';
import { onCallWrapper } from '../services/sentry';

interface ResendInviteProps {
  orgId: string;
  inviteId: string;
}

const resendInvite = async ({ data, auth }: CallableRequest<ResendInviteProps>) => {
  const token = auth?.token;
  if (!auth?.uid || !token) {
    throw new HttpsError('unauthenticated', 'Must be signed in.');
  }
  if (!(token[CLAIMS.ORG_ADMIN] || token[CLAIMS.IDEMAND_ADMIN])) {
    throw new HttpsError('permission-denied', 'Admin permissions required');
  }

  let { orgId, inviteId } = data;
  if (!orgId || !inviteId) {
    throw new HttpsError('failed-precondition', 'Missing orgId or inviteId');
  }

  const sgKey = sendgridApiKey.value();
  if (!sgKey) throw new HttpsError('internal', `Missing Sendgrid api key`);

  const db = getFirestore();
  const inviteColRef = invitesCollection(db, orgId);

  const inviteDocSnap = await inviteColRef.withConverter(inviteConverter).doc(inviteId).get();

  const inviteData = inviteDocSnap.data();
  if (!inviteDocSnap.exists || !inviteData) {
    throw new HttpsError('not-found', `Invite "${orgId}/${inviteId}" not found`);
  }

  let to = [inviteData?.email];
  if (audience.value() === 'DEV HUMANS' || audience.value() === 'LOCAL HUMANS')
    to.push('spencercarlson@mac.com');

  try {
    await sendUserInvite(
      sgKey,
      inviteData.getLink(),
      to,
      inviteData.firstName ?? inviteData.displayName,
      inviteData.invitedBy?.name || '',
      undefined,
      {
        customArgs: {
          emailType: 'resend_invite',
        },
      }
    );

    return { status: 'sent' };
  } catch (err) {
    throw new HttpsError('internal', `Error delivering invite`);
  }
};

export default onCallWrapper<ResendInviteProps>('resendinvite', resendInvite);
