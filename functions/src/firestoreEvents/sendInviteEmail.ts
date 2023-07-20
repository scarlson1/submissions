import type { FirestoreEvent } from 'firebase-functions/v2/firestore';
import type { DocumentReference, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { error, info } from 'firebase-functions/logger';

import { sendUserInvite } from '../services/sendgrid';
import { Invite, audience, sendgridApiKey } from '../common';

export default async (
  event: FirestoreEvent<
    QueryDocumentSnapshot | undefined,
    {
      orgId: string;
      inviteId: string;
    }
  >
) => {
  const { inviteId, orgId } = event.params;
  const snap = event.data;
  const inviteRef = event.data?.ref as DocumentReference<Invite> | undefined;
  if (!snap || !inviteRef) {
    console.log('No data associated with event');
    return;
  }
  const data = snap.data() as Invite;
  const { link, firstName, displayName = '' } = data;
  const alreadySent = data.sent || false;

  let logMsg = `New invite detected. Initiating invite email (${event.params.inviteId})...`;
  if (alreadySent) logMsg = `New invite detected. Returning early - sent status: ${data.sent}`;

  info(logMsg, {
    inviteId,
    orgId,
    data,
  });
  if (alreadySent) return;

  if (!link) {
    error('ERROR. INVITE EMAIL NOT SENT. Missing required params');
    return { status: 'Error. Email not sent.' };
  }
  if (data.isCreateOrgInvite) {
    return { status: 'Create Org Invite. Email not sent' };
  }

  let to = [data.email];
  if (audience.value() === 'DEV HUMANS' || audience.value() === 'LOCAL HUMANS')
    to.push('spencer.carlson@idemandinsurance.com');

  try {
    await sendUserInvite(
      sendgridApiKey.value(),
      link,
      to,
      firstName ?? displayName,
      data.invitedBy?.name || '',
      {
        customArgs: {
          firebaseEventId: event.id,
          emailType: 'user_invite',
        },
      }
    );
    await markSent(inviteRef);
    info(`Invite for org ${data.orgId} (${data.orgName}) sent to ${JSON.stringify(to)}`, { link });
  } catch (err: any) {
    error(`Error sending invite email to ${data.email} for org ${data.orgId}`, {
      errMsg: err?.message,
    });
  }

  return;
};

function markSent(inviteRef: DocumentReference<Invite>) {
  return inviteRef.update({ sent: true });
}
