import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

import { sendPolicyDocDelivery } from '../services/sendgrid';
import { CLAIMS, policiesCollection, sendgridApiKey } from '../common';

// TODO: add policy docs as param
// on front end: allow user to select which documents to deliver

// const sendgridApiKey = defineSecret('SENDGRID_API_KEY');

export default async ({ data, auth }: CallableRequest) => {
  console.log('data: ', data);
  const { policyId, to } = data;
  console.log('AUTH.TOKEN: ', auth?.token);
  const token = auth?.token;

  if (!token || !token[CLAIMS.IDEMAND_ADMIN])
    throw new HttpsError('permission-denied', `Must be an admin`);

  if (!policyId || !to)
    throw new HttpsError('invalid-argument', `policyId or emails (recipients) required`);
  // TODO: email validation (array.length > 0, valid emails, etc.)

  // if (emails.every(isValidEmail))
  //   throw new HttpsError(
  //     'failed-precondition',
  //     'emails must be an array of valid email addresses'
  //   );

  const sgKey = sendgridApiKey.value();
  if (!sgKey) throw new HttpsError('failed-precondition', 'Missing Sendgrid api key');

  const db = getFirestore();
  const bucket = getStorage().bucket();
  const policyRef = policiesCollection(db).doc(policyId);

  try {
    // pathToAttachment = `${__dirname}/attachment.pdf`;
    // attachment = fs.readFileSync(pathToAttachment).toString('base64');
    let snap = await policyRef.get();
    let data = snap.data();
    if (!snap.exists || !data)
      throw new HttpsError('not-found', `No policy found with ID ${policyId}`);

    let filePath =
      data.documents && data.documents.length > 0 ? data.documents[0].storagePath : null;
    console.log('FILE PATH: ', filePath);

    if (!filePath) throw new HttpsError('failed-precondition', `Missing policy document file path`);

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

    // TODO: namedInsured
    // @ts-ignore
    let toName = data.namedInsured.firstName || undefined;

    // TODO: redo doc delivery template
    const locations = Object.values(data.locations);
    let locationStr = data.locations[0].address.addressLine1;
    if (locations.length > 1) {
      locationStr += ` and ${locations.length - 1} other locations`;
    }

    await sendPolicyDocDelivery(
      sgKey,
      to,
      attachmentObj,
      toName,
      locationStr // data.address.addressLine1
    );

    return {
      status: 'success',
      emails: to,
    };
  } catch (err) {
    console.log('ERROR SENDING POLICY DELIVERY EMAIL: ', err);
    // TODO: notify admins?
    throw new HttpsError('internal', 'Failed to deliver email.');
  }
};
