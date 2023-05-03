import { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { EventContext, logger } from 'firebase-functions/v1';

import { sendUserInvite } from '../services/sendgrid';
import { Invite } from '../common';
import { sendgridApiKey } from './index.js';

// const sendgridApiKey = defineSecret('SENDGRID_API_KEY');

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
  if (process.env.AUDIENCE === 'DEV HUMANS' || process.env.AUDIENCE === 'LOCAL HUMANS')
    to.push('spencercarlson@mac.com');

  const sgKey = sendgridApiKey.value();
  if (!sgKey) throw new Error('missing SENDGRID_API_KEY env var');

  sendUserInvite(sgKey, link, to, firstName ?? displayName, data.invitedBy?.name || '');
  return {};
};
