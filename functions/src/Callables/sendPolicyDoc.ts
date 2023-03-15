import * as functions from 'firebase-functions';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { defineSecret } from 'firebase-functions/params';

import { sendPolicyDocDelivery } from '../services/sendgrid';
import { policiesCollection } from '../common';

const sendgridApiKey = defineSecret('SENDGRID_API_KEY');

export const sendPolicyDoc = functions
  .runWith({
    secrets: [sendgridApiKey],
    minInstances: 1,
    memory: '128MB',
  })
  .https.onCall(async (data, ctx) => {
    console.log('data: ', data);
    const { policyId, emails } = data;
    console.log('AUTH.TOKEN: ', ctx.auth?.token);

    if (!ctx.auth?.token.iDemandAdmin)
      throw new functions.https.HttpsError('permission-denied', `Must be an admin`);

    if (!policyId || !emails)
      throw new functions.https.HttpsError(
        'invalid-argument',
        `policyId or emails (recipients) required`
      );
    // TODO: email validation (array.length > 0, valid emails, etc.)

    // if (emails.every(isValidEmail))
    //   throw new functions.https.HttpsError(
    //     'failed-precondition',
    //     'emails must be an array of valid email addresses'
    //   );

    const sgKey = process.env.SENDGRID_API_KEY;
    if (!sgKey)
      throw new functions.https.HttpsError('failed-precondition', 'Missing Sendgrid api key');

    const db = getFirestore();
    const bucket = getStorage().bucket();
    const policyRef = policiesCollection(db).doc(policyId);

    try {
      // pathToAttachment = `${__dirname}/attachment.pdf`;
      // attachment = fs.readFileSync(pathToAttachment).toString('base64');
      let snap = await policyRef.get();
      let data = snap.data();
      if (!snap.exists || !data)
        throw new functions.https.HttpsError('not-found', `No policy found with ID ${policyId}`);

      let filePath =
        data.documents && data.documents.length > 0 ? data.documents[0].storagePath : null;
      console.log('FILE PATH: ', filePath);

      if (!filePath)
        throw new functions.https.HttpsError(
          'failed-precondition',
          `Missing policy document file path`
        );

      // Downloads the file into a buffer in memory.
      const attachmentBuff = await bucket.file(filePath).download();

      if (!attachmentBuff) throw new Error('missing attachment');

      let attachmentObj = [
        {
          content: attachmentBuff[0].toString('base64'),
          filename: `iDemand Flood Policy ${policyId}`,
          type: 'application/pdf',
          disposition: 'attachment',
        },
      ];

      // const link = `${process.env.HOSTING_BASE_URL}/policies/${policyId}`;
      await sendPolicyDocDelivery(
        sgKey,
        emails,
        attachmentObj,
        data.namedInsured.firstName,
        data.address.addressLine1
      );

      return {
        status: 'success',
        emails,
      };
    } catch (err) {
      console.log('ERROR SENDING POLICY DELIVERY EMAIL: ', err);
      // TODO: notify admins?
      throw new functions.https.HttpsError('internal', 'Failed to deliver email.');
    }
  });
