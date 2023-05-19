import type { FirestoreEvent } from 'firebase-functions/v2/firestore';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';
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
  const snap = event.data;
  if (!snap) {
    console.log('No data associated with event');
    return;
  }
  const data = snap.data() as Invite;
  const { link, firstName, displayName = '' } = data;
  info(
    `New invite detected. Initiating invite email (${event.params.inviteId})...  ${JSON.stringify(
      data
    )}`
  );

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

  sendUserInvite(
    sendgridApiKey.value(),
    link,
    to,
    firstName ?? displayName,
    data.invitedBy?.name || '',
    {
      customArgs: {
        firebaseEventId: event.id,
      },
    }
  );
  return {};
};
