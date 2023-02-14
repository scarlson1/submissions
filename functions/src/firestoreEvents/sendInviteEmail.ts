import * as functions from 'firebase-functions';
import 'firebase-functions';
import { sendUserInvite } from '../services/sendgrid';
import { defineSecret } from 'firebase-functions/params';
import { Invite } from '../common/types';

const sendgridApiKey = defineSecret('SENDGRID_API_KEY');

export const sendInviteEmail = functions
  .runWith({ secrets: [sendgridApiKey] })
  // .firestore.document('invitations/{inviteId}')
  .firestore.document('organizations/{orgId}/invitations/{inviteId}')
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
    const to = (process.env.AUDIENCE = 'DEV HUMANS' ? 'spencercarlson@mac.com' : data.email);
    sendUserInvite(
      process.env.SENDGRID_API_KEY || '',
      link,
      to,
      firstName ?? displayName,
      data.invitedBy?.name || ''
    );
    return {};
  });
