import { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { EventContext, logger } from 'firebase-functions/v1';

import { sendAdminChangeRequestNotification } from '../services/sendgrid';
// import { Invite } from '../common';
import { sendgridApiKey } from './index.js';

export default async (
  snap: QueryDocumentSnapshot,
  context: EventContext<{
    policyId: string;
    requestId: string;
  }>
) => {
  const data = snap.data() as any; // as Invite;
  const { field, newValue } = data;
  logger.log(
    `New policy change request detected. Initiating notification email (policyId: ${
      context.params.policyId
    })...  ${JSON.stringify(data)}`
  );

  if (!field) {
    logger.log('ERROR. INVITE EMAIL NOT SENT. Missing required params');
    return { status: 'Error. Email not sent.' };
  }
  if (newValue) {
    return { status: 'Create Org Invite. Email not sent' };
  }

  let to = ['spencer.carlson@idemandinsurance.com'];
  if (process.env.AUDIENCE !== 'DEV HUMANS' && process.env.AUDIENCE !== 'LOCAL HUMANS')
    to.push('ron.carlson@idemandinsurance.com');

  const sgKey = sendgridApiKey.value();
  if (!sgKey) throw new Error('missing SENDGRID_API_KEY env var');

  const link = `${process.env.HOSTING_BASE_URL}/policies/${context.params.policyId}`;

  // sendUserInvite(sgKey, link, to, firstName ?? displayName, data.invitedBy?.name || '');
  sendAdminChangeRequestNotification(sgKey, to, link, 'policy change', snap.id, {
    [`${field}`]: newValue,
  });
  return {};
};
