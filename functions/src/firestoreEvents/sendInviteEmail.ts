import { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { EventContext, logger } from 'firebase-functions/v1';

import { sendUserInvite } from '../services/sendgrid';
import { Invite, audience, sendgridApiKey } from '../common';

export default async (
  snap: QueryDocumentSnapshot,
  context: EventContext<{
    inviteId: string;
    orgId: string;
  }>
) => {
  const data = snap.data() as Invite;
  const { link, firstName, displayName = '' } = data;
  logger.log(
    `New invite detected. Initiating invite email (${context.params.inviteId})...  ${JSON.stringify(
      data
    )}`
  );

  if (!link) {
    logger.log('ERROR. INVITE EMAIL NOT SENT. Missing required params');
    return { status: 'Error. Email not sent.' };
  }
  if (data.isCreateOrgInvite) {
    return { status: 'Create Org Invite. Email not sent' };
  }

  let to = [data.email];
  if (audience.value() === 'DEV HUMANS' || audience.value() === 'LOCAL HUMANS')
    to.push('spencer.carlson@idemandinsurance.com');

  const sgKey = sendgridApiKey.value();
  // if (!sgKey) throw new Error('missing SENDGRID_API_KEY env var');

  sendUserInvite(sgKey, link, to, firstName ?? displayName, data.invitedBy?.name || '', {
    customArgs: {
      firebaseEventId: context.eventId,
    },
  });
  return {};
};
