import * as functions from 'firebase-functions';
import 'firebase-functions';
import { defineSecret } from 'firebase-functions/params';

import { sendUserInvite } from '../services/sendgrid';
import { COLLECTIONS, Invite } from '../common';

const sendgridApiKey = defineSecret('SENDGRID_API_KEY');

export const sendInviteEmail = functions
  .runWith({ secrets: [sendgridApiKey] })
  .firestore.document(`${COLLECTIONS.ORGANIZATIONS}/{orgId}/${COLLECTIONS.INVITES}/{inviteId}`)
  .onCreate((snap, context) => {
    const data = snap.data() as Invite;
    const { link, firstName, displayName = '' } = data;
    functions.logger.log(
      `New invite detected. Initiating invite email (${
        context.params.inviteId
      })...  ${JSON.stringify(data)}`
    );

    if (!link) {
      functions.logger.log('ERROR. INVITE EMAIL NOT SENT. Missing required params');
      return { status: 'Error. Email not sent.' };
    }
    if (data.isCreateOrgInvite) {
      return { status: 'Create Org Invite. Email not sent' };
    }

    let to = [data.email];
    if (process.env.AUDIENCE === 'DEV HUMANS' || process.env.AUDIENCE === 'LOCAL HUMANS')
      to.push('spencercarlson@mac.com');

    sendUserInvite(
      process.env.SENDGRID_API_KEY || '',
      link,
      to,
      firstName ?? displayName,
      data.invitedBy?.name || ''
    );
    return {};
  });
