import type { FirestoreEvent } from 'firebase-functions/v2/firestore';
import { info } from 'firebase-functions/logger';
import { QueryDocumentSnapshot } from 'firebase-admin/firestore';

import { sendAdminChangeRequestNotification } from '../services/sendgrid';
import { ChangeRequest, sendgridApiKey } from '../common';

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
