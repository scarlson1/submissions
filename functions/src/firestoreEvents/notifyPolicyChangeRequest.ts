import type { FirestoreEvent } from 'firebase-functions/v2/firestore';
import { info } from 'firebase-functions/logger';
import { QueryDocumentSnapshot } from 'firebase-admin/firestore';

import { sendAdminChangeRequestNotification } from '../services/sendgrid/index.js';
import { ChangeRequest, sendgridApiKey } from '../common/index.js';

export default async (
  event: FirestoreEvent<
    QueryDocumentSnapshot | undefined,
    {
      policyId: string;
      requestId: string;
    }
  >
) => {
  const { policyId, requestId } = event.params;
  const snap = event.data;
  if (!snap) {
    console.log('No data associated with event');
    return;
  }
  const data = snap.data() as ChangeRequest;

  const { trxType, changes } = data;
  info(
    `New policy change request detected. Initiating notification email (policyId: ${policyId})`,
    { policyId, requestId, data }
  );

  // if (!field) {
  //   error('ERROR - POLICY CHANGE REQUEST EMAIL NOT SENT. Missing required params');
  //   // TODO: email error ? report to sentry ??
  //   return { status: 'Error. Email not sent.' };
  // }
  // if (newValue) {
  //   return { status: 'Create Org Invite. Email not sent' };
  // }

  let to = ['spencer.carlson@idemandinsurance.com'];
  if (process.env.AUDIENCE !== 'DEV HUMANS' && process.env.AUDIENCE !== 'LOCAL HUMANS')
    to.push('ron.carlson@idemandinsurance.com');

  const sgKey = sendgridApiKey.value();
  if (!sgKey) throw new Error('missing SENDGRID_API_KEY env var');

  const link = `${process.env.HOSTING_BASE_URL}/policies/${policyId}`; // TODO: update url once client change request url is set

  // sendUserInvite(sgKey, link, to, firstName ?? displayName, data.invitedBy?.name || '');
  sendAdminChangeRequestNotification(
    sgKey,
    to,
    link,
    `policy change (${trxType})`,
    snap.id,
    {
      ...(changes || {}),
    },
    {
      customArgs: {
        firebaseEventId: event.id,
        emailType: 'policy_change_request',
        trxType,
      },
    }
  );

  return;
};
