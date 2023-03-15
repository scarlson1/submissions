import * as functions from 'firebase-functions';
// import { onMessagePublished } from 'firebase-functions/v2/pubsub';
import { getFirestore } from 'firebase-admin/firestore';
import { defineSecret } from 'firebase-functions/params';

import { policiesCollection, POLICY_STATUS } from '../common';
import { sendAdminPaidNotification } from '../services/sendgrid';

const sendgridApiKey = defineSecret('SENDGRID_API_KEY');

// TODO: failureRetry policy

// GEN 2

// export const markpaidonpaymentcomplete = onMessagePublished('payment.complete', async (event) => {
export const markpaidonpaymentcomplete = functions
  .runWith({ secrets: [sendgridApiKey] })
  .pubsub.topic('payment.complete')
  .onPublish(async (message) => {
    console.log('MSG JSON: ', message.json);

    let transactionId = null;
    let policyId = null;
    try {
      transactionId = message.json?.transactionId;
      policyId = message.json?.policyId;
    } catch (e) {
      console.error('PubSub message was not JSON', e);
    }
    console.log(`PAYMENT COMPLETE - TRX ID: ${transactionId} - POLICY ID: ${policyId}`);
    if (!(transactionId && policyId)) return console.error('Missing transaction or policy id');

    const sgKey = process.env.SENDGRID_API_KEY;
    if (!sgKey) return console.error('MISSING SENDGRID API KEY');

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
    await policyRef.update({ status: POLICY_STATUS.PAID });
    console.log(`POLICY ${policyId} STATUS UPDATED TO PAID - TRX ID: ${transactionId}`);

    const to = ['spencer.carlson@idemandinsurance.com'];
    if (process.env.AUDIENCE !== 'LOCAL HUMANS') to.push('ron.carlson@idemandinsurance.com');
    const policyLink = `${process.env.HOSTING_BASE_URL}/admin/policies/${policyId}/delivery`;
    const transactionLink = `${process.env.EPAY_HOSTING_BASE_URL}/Transactions/Index/${transactionId}`;

    await sendAdminPaidNotification(
      sgKey,
      to,
      policyLink,
      policyId,
      transactionLink,
      transactionId
    );

    return;
  });

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
