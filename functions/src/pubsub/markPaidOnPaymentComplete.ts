import type { CloudEvent } from 'firebase-functions/lib/v2/core';
import type { MessagePublishedData } from 'firebase-functions/v2/pubsub';
import { info } from 'firebase-functions/logger';
import { Timestamp, getFirestore } from 'firebase-admin/firestore';

import {
  POLICY_STATUS,
  audience,
  ePayBaseURL,
  hostingBaseURL,
  sendgridApiKey,
  policiesCollection,
} from '../common';
import { sendAdminPaidNotification } from '../services/sendgrid';

export default async (event: CloudEvent<MessagePublishedData>) => {
  info('MSG JSON: ', event.data.message.json);

  let transactionId = null;
  let policyId = null;
  try {
    transactionId = event.data.message.json?.transactionId;
    policyId = event.data.message.json?.policyId;
  } catch (e) {
    console.error('PubSub message was not JSON', e);
  }
  console.log(`PAYMENT COMPLETE - TRX ID: ${transactionId} - POLICY ID: ${policyId}`);
  if (!(transactionId && policyId)) return console.error('Missing transaction or policy id');

  const db = getFirestore();
  const policyRef = policiesCollection(db).doc(policyId);
  // const policySnap = await policiesCol.doc(policyId).get();
  // const policy = policySnap.data();
  // if (!policySnap.exists || !policy) {
  //   return console.warn(`POLICY NOT FOUND WITH ID ${policyId}`);
  // }

  // TODO: get policy to check expiration dates, etc. only need to check at payment initiation ??
  // TODO: Need to ask to get full list of required checks

  // update status to paid
  await policyRef.update({ status: POLICY_STATUS.PAID, 'metadata.updated': Timestamp.now() });
  console.log(`POLICY ${policyId} STATUS UPDATED TO PAID - TRX ID: ${transactionId}`);

  const to = ['spencer.carlson@idemandinsurance.com'];
  if (audience.value() !== 'LOCAL HUMANS') to.push('ron.carlson@idemandinsurance.com');

  const policyLink = `${hostingBaseURL.value()}/admin/policies/${policyId}/delivery`;

  const transactionLink = `${ePayBaseURL.value()}/Transactions/Index/${transactionId}`;

  await sendAdminPaidNotification(
    sendgridApiKey.value(),
    to,
    policyLink,
    policyId,
    transactionLink,
    transactionId,
    {
      customArgs: {
        firebaseEventId: event.id,
        emailType: 'payment_complete',
      },
    }
  );

  return;
};

// GEN 2

// export const hellopubsub = onMessagePublished('hello.pubsub', (event) => {
//   // WHEN PAYLOAD IS JSON
//   let name = null;
//   try {
//     name = event.data.message.json.userName;
//   } catch (e) {
//     console.error('PubSub message was not JSON', e);
//   }

//   console.log(`Hello, ${name}`);
//   return;
// });
